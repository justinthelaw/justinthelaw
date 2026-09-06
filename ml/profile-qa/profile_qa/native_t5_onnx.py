"""Native T5 graphs with the Transformers.js encoder/merged-decoder interface."""

from __future__ import annotations

import hashlib
import tempfile
from pathlib import Path
from typing import Literal

import onnx
import torch
from onnx import TensorProto, compose, helper
from torch import Tensor, nn
from transformers import (
    AutoConfig,
    AutoTokenizer,
    DynamicCache,
    EncoderDecoderCache,
    T5Config,
    T5ForConditionalGeneration,
)


def _attention_mask(mask: Tensor, dtype: torch.dtype) -> Tensor:
    """Supply the supported 4-D mask interface without tracing mask dispatch."""
    return (1 - mask[:, None, None, :].to(dtype)) * torch.finfo(dtype).min


class _Encoder(nn.Module):
    def __init__(self, model: T5ForConditionalGeneration) -> None:
        super().__init__()
        self.encoder = model.encoder

    def forward(self, input_ids: Tensor, attention_mask: Tensor) -> Tensor:
        return self.encoder(
            input_ids=input_ids,
            attention_mask=_attention_mask(attention_mask, self.encoder.dtype),
        ).last_hidden_state


class _Decoder(nn.Module):
    def __init__(self, model: T5ForConditionalGeneration) -> None:
        super().__init__()
        self.model = model

    def forward(
        self,
        input_ids: Tensor,
        encoder_hidden_states: Tensor,
        encoder_attention_mask: Tensor,
        *past: Tensor,
    ) -> tuple[Tensor, ...]:
        cache = (
            EncoderDecoderCache(tuple(past[i:i + 4] for i in range(0, len(past), 4)))
            if past
            else EncoderDecoderCache(DynamicCache(), DynamicCache())
        )
        query_length = input_ids.shape[1]
        past_length = past[0].shape[2] if past else 0
        keys = torch.arange(query_length + past_length, device=input_ids.device)
        queries = torch.arange(query_length, device=input_ids.device) + past_length
        causal_mask = (keys[None, :] > queries[:, None]).to(encoder_hidden_states.dtype)
        causal_mask = (
            causal_mask[None, None, :, :]
            * torch.finfo(encoder_hidden_states.dtype).min
        )
        result = self.model(
            encoder_outputs=(encoder_hidden_states,),
            attention_mask=_attention_mask(encoder_attention_mask, encoder_hidden_states.dtype),
            decoder_input_ids=input_ids,
            decoder_attention_mask=causal_mask,
            past_key_values=cache,
            use_cache=True,
        )
        present = tuple(
            tensor
            for self_layer, cross_layer in zip(
                cache.self_attention_cache.layers, cache.cross_attention_cache.layers
            )
            for tensor in (
                self_layer.keys, self_layer.values, cross_layer.keys, cross_layer.values
            )
        )
        return (result.logits, *present)


def _cache_axes(
    layers: int, prefix: Literal["past_key_values", "present"],
) -> dict[str, dict[int, str]]:
    """One source for ordered cache names and their dynamic axes."""
    return {
        f"{prefix}.{layer}.{attention}.{kind}": {
            0: "batch_size",
            2: (
                "encoder_sequence_length" if attention == "encoder"
                else "past_decoder_sequence_length" if prefix == "past_key_values"
                else "present_decoder_sequence_length"
            ),
        }
        for layer in range(layers)
        for attention in ("decoder", "encoder")
        for kind in ("key", "value")
    }


def _export_graph(
    module: nn.Module,
    inputs: tuple[Tensor, ...],
    path: Path,
    input_axes: dict[str, dict[int, str]],
    output_axes: dict[str, dict[int, str]],
) -> onnx.ModelProto:
    # The supported TorchScript ONNX path needs no additional compiler packages.
    # Shapes remain dynamic; Python cache decisions are isolated into two graphs.
    torch.onnx.export(
        module.eval(),
        inputs,
        str(path),
        dynamo=False,
        opset_version=17,
        input_names=list(input_axes),
        output_names=list(output_axes),
        dynamic_axes={**input_axes, **output_axes},
        external_data=False,
    )
    graph = onnx.load(path, load_external_data=False)
    onnx.checker.check_model(graph)
    return graph


def _merge_decoders(
    initial: onnx.ModelProto,
    cached: onnx.ModelProto,
) -> onnx.ModelProto:
    """Select initial/cached execution with ONNX If and share identical weights."""
    weights: dict[bytes, onnx.TensorProto] = {}
    branches: list[onnx.GraphProto] = []
    for prefix, model in (("initial_", initial), ("cached_", cached)):
        graph = compose.add_prefix_graph(model.graph, prefix, rename_inputs=False)
        replacements: dict[str, str] = {}
        for weight in graph.initializer:
            name = weight.name
            weight.name = ""
            digest = hashlib.sha256(weight.SerializeToString()).digest()
            weight.name = name
            canonical = weights.setdefault(digest, weight)
            replacements[name] = canonical.name
        for node in graph.node:
            for index, name in enumerate(node.input):
                node.input[index] = replacements.get(name, name)
        del graph.initializer[:]
        del graph.input[:]
        branches.append(graph)
    inputs = {
        value.name: value for model in (initial, cached) for value in model.graph.input
    }
    inputs["use_cache_branch"] = helper.make_tensor_value_info(
        "use_cache_branch", TensorProto.BOOL, [1]
    )
    graph = helper.make_graph(
        [helper.make_node(
            "If", ["use_cache_branch"], [value.name for value in initial.graph.output],
            then_branch=branches[1], else_branch=branches[0],
        )],
        "t5_merged_decoder", list(inputs.values()), list(initial.graph.output),
        initializer=list(weights.values()),
    )
    merged = helper.make_model(
        graph, opset_imports=list(initial.opset_import), ir_version=initial.ir_version,
    )
    onnx.checker.check_model(merged, full_check=True)
    return merged


def export_t5(model_dir: Path, output_dir: Path) -> None:
    """Export a local merged T5 without fetching weights or executing remote code."""
    config = AutoConfig.from_pretrained(model_dir, local_files_only=True)
    if not isinstance(config, T5Config):
        raise ValueError("Native browser export requires a T5 model")
    model = T5ForConditionalGeneration.from_pretrained(
        model_dir,
        config=config,
        local_files_only=True,
        attn_implementation="eager",
        dtype=torch.float32,
    ).eval()
    encoder_axes = {
        "input_ids": {0: "batch_size", 1: "encoder_sequence_length"},
        "attention_mask": {0: "batch_size", 1: "encoder_sequence_length"},
    }
    decoder_axes = {
        "input_ids": {0: "batch_size", 1: "decoder_sequence_length"},
        "encoder_hidden_states": {0: "batch_size", 1: "encoder_sequence_length"},
        "encoder_attention_mask": {0: "batch_size", 1: "encoder_sequence_length"},
    }
    cache_axes = _cache_axes(config.num_decoder_layers, "past_key_values")
    output_axes = {
        "logits": {0: "batch_size", 1: "decoder_sequence_length"},
        **_cache_axes(config.num_decoder_layers, "present"),
    }
    ids = torch.zeros((2, 3), dtype=torch.long)
    mask = torch.ones_like(ids)
    decoder_ids = torch.zeros((2, 2), dtype=torch.long)
    with torch.no_grad(), tempfile.TemporaryDirectory(dir=output_dir) as temporary:
        encoder = _Encoder(model)
        _export_graph(
            encoder, (ids, mask), output_dir / "encoder_model.onnx", encoder_axes,
            {"last_hidden_state": {0: "batch_size", 1: "encoder_sequence_length"}},
        )
        hidden = encoder(ids, mask)
        decoder = _Decoder(model)
        inputs = (decoder_ids, hidden, mask)
        initial = _export_graph(
            decoder, inputs, Path(temporary) / "initial.onnx", decoder_axes, output_axes
        )
        past = decoder(*inputs)[1:]
        cached = _export_graph(
            decoder, (*inputs, *past), Path(temporary) / "cached.onnx",
            {**decoder_axes, **cache_axes}, output_axes,
        )
        onnx.save_model(
            _merge_decoders(initial, cached), output_dir / "decoder_model_merged.onnx"
        )
    model.config.save_pretrained(output_dir)
    model.generation_config.save_pretrained(output_dir)
    AutoTokenizer.from_pretrained(model_dir, local_files_only=True).save_pretrained(output_dir)
