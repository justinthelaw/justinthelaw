"""Offline, numerical coverage of the browser's native T5 export contract."""

from __future__ import annotations

import json
from collections.abc import Iterator
from pathlib import Path

import pytest

np = pytest.importorskip("numpy")
torch = pytest.importorskip("torch")
onnx = pytest.importorskip("onnx")
ort = pytest.importorskip("onnxruntime")
transformers = pytest.importorskip("transformers")

from google.protobuf.message import Message
from tokenizers import Tokenizer
from tokenizers.models import WordLevel
from transformers import (
    EncoderDecoderCache,
    PreTrainedTokenizerFast,
    T5Config,
    T5ForConditionalGeneration,
)

from profile_qa.config import PRIMARY_BASE_MODEL_ID, PRIMARY_BASE_MODEL_REVISION
from profile_qa.export_onnx import (
    assemble_browser_artifact,
    export_onnx,
    quantize_onnx,
    reject_external_data_files,
)
from profile_qa.provenance import (
    BROWSER_PARENT_ARTIFACT_STAGES,
    LINEAGE_FILENAME,
    directory_sha256,
    validate_artifact_lineage,
)


@pytest.fixture(params=[False, True], ids=["two-layer-tied", "one-layer-untied"])
def tiny_model(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, request: pytest.FixtureRequest,
) -> Iterator[tuple[T5ForConditionalGeneration, Path]]:
    monkeypatch.setenv("HF_HUB_OFFLINE", "1")
    monkeypatch.setenv("TRANSFORMERS_OFFLINE", "1")
    previous_threads = torch.get_num_threads()
    torch.set_num_threads(1)
    torch.manual_seed(17)
    model = T5ForConditionalGeneration(
        T5Config(
            vocab_size=32,
            d_model=12 if request.param else 16,
            d_kv=3 if request.param else 4,
            d_ff=23,
            num_layers=1,
            num_decoder_layers=1 if request.param else 2,
            num_heads=3 if request.param else 2,
            tie_word_embeddings=not request.param,
            feed_forward_proj="gated-gelu" if request.param else "relu",
            dropout_rate=0.0,
            decoder_start_token_id=0,
            pad_token_id=0,
            eos_token_id=1,
        )
    ).eval()
    model.set_attn_implementation("eager")
    model_dir = tmp_path / "merged"
    model.save_pretrained(model_dir)
    tokenizer = PreTrainedTokenizerFast(
        tokenizer_object=Tokenizer(WordLevel({"<pad>": 0, "</s>": 1, "<unk>": 2})),
        pad_token="<pad>",
        eos_token="</s>",
        unk_token="<unk>",
    )
    tokenizer.save_pretrained(model_dir)
    # Synthetic local merge provenance, bound to the real tiny model's bytes.
    (model_dir / LINEAGE_FILENAME).write_text(
        json.dumps({
            "schema_version": 1,
            "adapter_checkpoint": "checkpoint-1",
            "adapter_model_sha256": "a" * 64,
            "base_model": PRIMARY_BASE_MODEL_ID,
            "base_model_revision": PRIMARY_BASE_MODEL_REVISION,
            "pipeline": "profile-qa-teapot-lora",
            "merged_model_sha256": directory_sha256(model_dir),
        }),
        encoding="utf-8",
    )
    yield model, model_dir
    torch.set_num_threads(previous_threads)


def _session(path: Path) -> ort.InferenceSession:
    options = ort.SessionOptions()
    options.intra_op_num_threads = 1
    options.inter_op_num_threads = 1
    return ort.InferenceSession(str(path), options, providers=["CPUExecutionProvider"])


def _cache_arrays(cache: EncoderDecoderCache) -> list[np.ndarray]:
    return [
        tensor.detach().numpy()
        for self_layer, cross_layer in zip(
            cache.self_attention_cache.layers, cache.cross_attention_cache.layers
        )
        for tensor in (
            self_layer.keys, self_layer.values, cross_layer.keys, cross_layer.values
        )
    ]


def _assert_self_contained_model(path: Path) -> None:
    def inspect(message: Message) -> None:
        if isinstance(message, onnx.TensorProto):
            assert (
                message.data_location != onnx.TensorProto.EXTERNAL
                and not message.external_data
            ), "external tensor data is not browser-safe"
        for field, value in message.ListFields():
            if field.message_type is not None:
                for child in value if field.is_repeated else (value,):
                    inspect(child)

    inspect(onnx.load(path, load_external_data=False))


@pytest.mark.parametrize("storage", ["initializer", "constant"])
def test_self_contained_check_rejects_nonstandard_sidecar(
    tmp_path: Path, storage: str,
) -> None:
    """Catch external-data loading erasing the metadata before inspection."""
    weight = onnx.numpy_helper.from_array(np.arange(4, dtype=np.float32), name="weight")
    output = onnx.helper.make_tensor_value_info("output", onnx.TensorProto.FLOAT, [4])
    graph = onnx.helper.make_graph(
        [
            onnx.helper.make_node("Identity", ["weight"], ["output"])
            if storage == "initializer"
            else onnx.helper.make_node("Constant", [], ["output"], value=weight)
        ],
        "external_fixture", [], [output],
        initializer=[weight] if storage == "initializer" else [],
    )
    path = tmp_path / "external.onnx"
    onnx.save_model(
        onnx.helper.make_model(graph), path, save_as_external_data=True,
        all_tensors_to_one_file=True, location="weights.bin", size_threshold=0,
        convert_attribute=True,
    )
    assert (tmp_path / "weights.bin").is_file()
    assert not list(tmp_path.glob("*.onnx.data"))
    with pytest.raises(AssertionError, match="external tensor"):
        _assert_self_contained_model(path)


def test_native_export_runs_initial_and_cached_decoder_offline(
    tiny_model: tuple[T5ForConditionalGeneration, Path], tmp_path: Path,
) -> None:
    """Catch an Optimum boundary, wrong cache branch/names, or frozen trace shapes."""
    model, model_dir = tiny_model
    output_dir = tmp_path / "onnx"
    output_dir.mkdir()
    (output_dir / "stale.json").write_text("stale", encoding="utf-8")
    try:
        lineage = export_onnx(str(model_dir), output_dir)
    except (FileNotFoundError, ImportError) as exc:
        pytest.fail(f"Native export must run without an Optimum installation: {exc}")

    assert not (output_dir / "stale.json").exists()
    assert (output_dir / "tokenizer.json").is_file()
    assert (output_dir / "generation_config.json").is_file()
    saved_config = json.loads((output_dir / "config.json").read_text())
    assert saved_config["num_decoder_layers"] == model.config.num_decoder_layers
    validate_artifact_lineage(output_dir, source_lineage=lineage.data, stage="onnx-fp")
    assert not list(output_dir.rglob("*.onnx.data"))
    for path in output_dir.glob("*.onnx"):
        onnx.checker.check_model(str(path), full_check=True)
        _assert_self_contained_model(path)

    encoder = _session(output_dir / "encoder_model.onnx")
    decoder = _session(output_dir / "decoder_model_merged.onnx")
    cache_names = [
        "past_key_values.0.decoder.key", "past_key_values.0.decoder.value",
        "past_key_values.0.encoder.key", "past_key_values.0.encoder.value",
        "past_key_values.1.decoder.key", "past_key_values.1.decoder.value",
        "past_key_values.1.encoder.key", "past_key_values.1.encoder.value",
    ]
    if model.config.num_decoder_layers == 1:
        cache_names = cache_names[:4]
    assert {item.name for item in encoder.get_inputs()} == {"input_ids", "attention_mask"}
    assert [item.name for item in encoder.get_outputs()] == ["last_hidden_state"]
    assert {item.name for item in decoder.get_inputs()} == {
        "input_ids", "encoder_hidden_states", "encoder_attention_mask",
        "use_cache_branch", *cache_names,
    }
    assert [item.name for item in decoder.get_outputs()] == [
        "logits", *[name.replace("past_key_values", "present") for name in cache_names]
    ]
    for session in (encoder, decoder):
        for item in session.get_inputs() + session.get_outputs():
            if item.name == "use_cache_branch":
                assert item.type == "tensor(bool)"
                assert item.shape == [1]
                continue
            assert isinstance(item.shape[0], str), item
            sequence_axis = 2 if item.name.startswith(("past_key_values", "present")) else 1
            assert isinstance(item.shape[sequence_axis], str), item

    for batch, source_length, prefix_length in [(1, 3, 1), (2, 5, 3)]:
        ids = torch.arange(batch * source_length).reshape(batch, source_length) % 29 + 2
        mask = torch.ones_like(ids)
        mask[:, -1] = 0
        prefix = torch.arange(batch * prefix_length).reshape(batch, prefix_length) % 29
        with torch.no_grad():
            encoded = model.encoder(input_ids=ids, attention_mask=mask).last_hidden_state
            initial = model(
                attention_mask=mask, encoder_outputs=(encoded,),
                decoder_input_ids=prefix, use_cache=True,
            )
        actual_encoded = encoder.run(
            None, {"input_ids": ids.numpy(), "attention_mask": mask.numpy()}
        )[0]
        np.testing.assert_allclose(actual_encoded, encoded.numpy(), rtol=2e-4, atol=2e-5)
        feed = {
            "input_ids": prefix.numpy(), "encoder_hidden_states": actual_encoded,
            "encoder_attention_mask": mask.numpy(), "use_cache_branch": np.array([False]),
            **{
                name: np.zeros(
                    (batch, model.config.num_heads, 0, model.config.d_kv), dtype=np.float32
                )
                for name in cache_names
            },
        }
        actual_initial = decoder.run(None, feed)
        for actual, expected in zip(
            actual_initial,
            [initial.logits.numpy(), *_cache_arrays(initial.past_key_values)],
            strict=True,
        ):
            np.testing.assert_allclose(actual, expected, rtol=2e-4, atol=2e-5)

        # False must ignore populated caches, not merely work for empty inputs.
        feed.update(zip(cache_names, actual_initial[1:], strict=True))
        for actual, expected in zip(decoder.run(None, feed), actual_initial, strict=True):
            np.testing.assert_allclose(actual, expected, rtol=2e-4, atol=2e-5)
        for step_length in (1, 2):
            next_ids = torch.full((batch, step_length), 7, dtype=torch.long)
            with torch.no_grad():
                cached = model(
                    attention_mask=mask, encoder_outputs=(encoded,),
                    decoder_input_ids=next_ids,
                    past_key_values=initial.past_key_values, use_cache=True,
                )
            feed.update({"input_ids": next_ids.numpy(), "use_cache_branch": np.array([True])})
            actual_cached = decoder.run(None, feed)
            for actual, expected in zip(
                actual_cached,
                [cached.logits.numpy(), *_cache_arrays(cached.past_key_values)],
                strict=True,
            ):
                np.testing.assert_allclose(actual, expected, rtol=2e-4, atol=2e-5)
            feed.update(zip(cache_names, actual_cached[1:], strict=True))
            initial = cached

    quantized_dirs = {dtype: tmp_path / dtype for dtype in ("int8", "uint8")}
    for dtype, directory in quantized_dirs.items():
        quantize_onnx(output_dir, directory, dtype, lineage)
        quantized_output = _session(directory / "decoder_model_merged.onnx").run(None, feed)
        assert np.isfinite(quantized_output[0]).all()
        assert quantized_output[0].shape == actual_cached[0].shape
    browser_dir = tmp_path / "browser"
    assemble_browser_artifact(output_dir, quantized_dirs, browser_dir, lineage)
    assert {path.name for path in (browser_dir / "onnx").iterdir()} == {
        "encoder_model_int8.onnx", "decoder_model_merged_int8.onnx",
        "encoder_model_uint8.onnx", "decoder_model_merged_uint8.onnx",
    }
    validate_artifact_lineage(
        browser_dir, source_lineage=lineage.data, stage="browser",
        required_parent_stages=BROWSER_PARENT_ARTIFACT_STAGES,
    )
    assert (browser_dir / "tokenizer.json").read_bytes() == (
        output_dir / "tokenizer.json"
    ).read_bytes()
    (browser_dir / "onnx" / "encoder_model.onnx.data").write_bytes(b"not browser-safe")
    with pytest.raises(RuntimeError, match="external data"):
        reject_external_data_files(browser_dir)
