import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { Minus, Plus, RotateCcw } from "@deemlol/next-icons";
import {
  VISUALIZER_STAGES,
  type VisualizerStageId,
} from "./visualizerData";

interface ProfileVisualizerSceneProps {
  activeStageId: VisualizerStageId;
  completedStageIds: readonly VisualizerStageId[];
  onStageSelect?: (stageId: VisualizerStageId) => void;
}

interface SceneNode {
  group: THREE.Group;
  materials: THREE.MeshStandardMaterial[];
  basePosition: THREE.Vector3;
}

const NODE_POSITIONS: Record<VisualizerStageId, [number, number, number]> = {
  question: [-2.45, 1.6, 0],
  cleaning: [-1.88, 0.35, 0.25],
  retrieval: [-1.16, -0.8, 0],
  budgeting: [-0.45, -0.1, -0.2],
  worker: [0.15, 1.15, 0],
  runtime: [0.8, 0.45, 0],
  encoder: [1.32, -0.2, -0.15],
  lora: [1.82, -0.85, 0.25],
  decoder: [2.48, 0.25, -0.1],
};

const IDLE_COLOR = new THREE.Color(0x3f3f46);
const COMPLETE_COLOR = new THREE.Color(0x71717a);
const ACTIVE_COLOR = new THREE.Color(0xe5e7eb);
const ACCENT_COLOR = new THREE.Color(0x93c5fd);
const GLASS_COLOR = new THREE.Color(0x1f2937);
const CAMERA_DISTANCE = 5.85;
const DEFAULT_ZOOM = 1;
const MIN_ZOOM = 0.72;
const MAX_ZOOM = 1.84;
const ZOOM_STEP = 0.14;
const ICON_CANVAS_SIZE = 256;
const FALLBACK_GLYPH_SIZE = 72;
const STAGE_SPRITE_SIZE = 1;
const NODE_POSITION_VALUES = Object.values(NODE_POSITIONS);
const NODE_BOUNDS = NODE_POSITION_VALUES.reduce(
  (bounds, [x, y]) => ({
    minX: Math.min(bounds.minX, x),
    maxX: Math.max(bounds.maxX, x),
    minY: Math.min(bounds.minY, y),
    maxY: Math.max(bounds.maxY, y),
  }),
  {
    minX: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  }
);
const SCENE_CENTER = new THREE.Vector3(
  (NODE_BOUNDS.minX + NODE_BOUNDS.maxX) / 2,
  (NODE_BOUNDS.minY + NODE_BOUNDS.maxY) / 2 - 0.18,
  0
);

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

function drawRoundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function strokeLine(
  context: CanvasRenderingContext2D,
  points: readonly [number, number][]
): void {
  context.beginPath();
  points.forEach(([x, y], index) => {
    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });
  context.stroke();
}

function strokeRoundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  drawRoundRect(context, x, y, width, height, radius);
  context.stroke();
}

function fillCircle(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color = "#93c5fd"
): void {
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fillStyle = color;
  context.fill();
}

function drawIconShell(context: CanvasRenderingContext2D): void {
  const gradient = context.createLinearGradient(54, 48, 202, 208);
  gradient.addColorStop(0, "#111113");
  gradient.addColorStop(1, "#09090b");
  drawRoundRect(context, 48, 48, 160, 160, 32);
  context.fillStyle = gradient;
  context.fill();
  context.strokeStyle = "#27272a";
  context.lineWidth = 4;
  context.stroke();

  drawRoundRect(context, 60, 60, 136, 136, 24);
  context.strokeStyle = "rgba(255,255,255,0.06)";
  context.lineWidth = 1.5;
  context.stroke();
}

function prepareIconStroke(
  context: CanvasRenderingContext2D,
  color = "#e5e7eb",
  width = 8
): void {
  context.strokeStyle = color;
  context.lineWidth = width;
  context.lineCap = "round";
  context.lineJoin = "round";
}

function drawStageGlyph(
  context: CanvasRenderingContext2D,
  stageId: VisualizerStageId,
  centerX: number,
  centerY: number,
  size: number
): void {
  context.save();
  context.translate(centerX - size / 2, centerY - size / 2);
  context.scale(size / ICON_CANVAS_SIZE, size / ICON_CANVAS_SIZE);
  context.lineCap = "round";
  context.lineJoin = "round";
  drawIconShell(context);
  prepareIconStroke(context);

  switch (stageId) {
    case "question": {
      strokeRoundRect(context, 76, 82, 104, 66, 18);
      strokeLine(context, [
        [102, 148],
        [116, 168],
        [134, 148],
      ]);
      prepareIconStroke(context, "#a1a1aa", 7);
      strokeLine(context, [
        [102, 108],
        [154, 108],
      ]);
      strokeLine(context, [
        [102, 128],
        [140, 128],
      ]);
      break;
    }
    case "cleaning": {
      strokeLine(context, [
        [74, 80],
        [182, 80],
        [142, 126],
        [142, 166],
        [114, 182],
        [114, 126],
        [74, 80],
      ]);
      prepareIconStroke(context, "#93c5fd", 6);
      strokeLine(context, [
        [176, 150],
        [176, 174],
      ]);
      strokeLine(context, [
        [164, 162],
        [188, 162],
      ]);
      break;
    }
    case "retrieval": {
      prepareIconStroke(context, "#a1a1aa", 7);
      strokeRoundRect(context, 78, 76, 64, 86, 12);
      prepareIconStroke(context);
      strokeRoundRect(context, 100, 66, 70, 88, 12);
      prepareIconStroke(context, "#93c5fd", 8);
      context.beginPath();
      context.arc(148, 150, 22, 0, Math.PI * 2);
      context.stroke();
      strokeLine(context, [
        [164, 166],
        [186, 188],
      ]);
      break;
    }
    case "budgeting": {
      prepareIconStroke(context);
      context.beginPath();
      context.arc(128, 150, 54, Math.PI, Math.PI * 2);
      context.stroke();
      prepareIconStroke(context, "#a1a1aa", 6);
      [82, 104, 152, 174].forEach((x) => {
        strokeLine(context, [
          [x, 150],
          [x + (x < 128 ? 8 : -8), 132],
        ]);
      });
      prepareIconStroke(context, "#93c5fd", 8);
      strokeLine(context, [
        [128, 150],
        [158, 116],
      ]);
      fillCircle(context, 128, 150, 7, "#f4f4f5");
      break;
    }
    case "worker": {
      prepareIconStroke(context);
      strokeRoundRect(context, 88, 78, 80, 100, 16);
      prepareIconStroke(context, "#a1a1aa", 6);
      strokeRoundRect(context, 108, 102, 40, 52, 10);
      [72, 184].forEach((x) => {
        strokeLine(context, [
          [x, 100],
          [x === 72 ? 88 : 168, 100],
        ]);
        strokeLine(context, [
          [x, 156],
          [x === 72 ? 88 : 168, 156],
        ]);
      });
      break;
    }
    case "runtime": {
      prepareIconStroke(context);
      strokeRoundRect(context, 68, 78, 120, 92, 16);
      prepareIconStroke(context, "#a1a1aa", 6);
      strokeLine(context, [
        [68, 104],
        [188, 104],
      ]);
      [88, 106, 124].forEach((x, index) =>
        fillCircle(context, x, 91, 4, index === 0 ? "#93c5fd" : "#71717a")
      );
      prepareIconStroke(context, "#93c5fd", 7);
      strokeRoundRect(context, 108, 124, 40, 28, 8);
      break;
    }
    case "encoder": {
      prepareIconStroke(context);
      [
        [76, 86, 72],
        [108, 118, 72],
        [76, 150, 72],
      ].forEach(([x, y, width]) => {
        strokeRoundRect(context, x, y, width, 20, 8);
      });
      prepareIconStroke(context, "#93c5fd", 7);
      strokeLine(context, [
        [158, 96],
        [184, 128],
        [158, 160],
      ]);
      break;
    }
    case "lora": {
      prepareIconStroke(context);
      context.beginPath();
      context.ellipse(108, 128, 42, 58, 0.35, 0, Math.PI * 2);
      context.stroke();
      prepareIconStroke(context, "#a1a1aa", 8);
      context.beginPath();
      context.ellipse(148, 128, 42, 58, -0.35, 0, Math.PI * 2);
      context.stroke();
      prepareIconStroke(context, "#93c5fd", 7);
      context.beginPath();
      context.arc(128, 128, 13, 0, Math.PI * 2);
      context.stroke();
      strokeLine(context, [
        [128, 106],
        [128, 150],
      ]);
      strokeLine(context, [
        [106, 128],
        [150, 128],
      ]);
      break;
    }
    case "decoder": {
      prepareIconStroke(context);
      strokeRoundRect(context, 76, 78, 104, 100, 16);
      prepareIconStroke(context, "#a1a1aa", 7);
      strokeLine(context, [
        [98, 108],
        [158, 108],
      ]);
      strokeLine(context, [
        [98, 132],
        [144, 132],
      ]);
      prepareIconStroke(context, "#93c5fd", 7);
      strokeLine(context, [
        [158, 132],
        [158, 154],
      ]);
      break;
    }
  }

  context.restore();
}

function drawFallback(
  canvas: HTMLCanvasElement,
  zoomLevelRef: RefObject<number>
): () => void {
  const context = canvas.getContext("2d");
  let animationFrame = 0;

  const render = (): void => {
    const parent = canvas.parentElement;
    const width = Math.max(320, parent?.clientWidth ?? canvas.clientWidth);
    const height = Math.max(260, parent?.clientHeight ?? canvas.clientHeight);
    canvas.width = width;
    canvas.height = height;

    if (!context) {
      return;
    }

    context.fillStyle = "#050505";
    context.fillRect(0, 0, width, height);
    context.save();
    context.translate(width / 2, height / 2);
    context.scale(zoomLevelRef.current, zoomLevelRef.current);
    context.translate(-width / 2, -height / 2);
    context.strokeStyle = "#71717a";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(40, height * 0.5);
    context.bezierCurveTo(width * 0.25, 40, width * 0.7, height - 40, width - 40, height * 0.5);
    context.stroke();

    VISUALIZER_STAGES.forEach((stage, index) => {
      const ratio = index / (VISUALIZER_STAGES.length - 1);
      const x = 64 + ratio * (width - 128);
      const y = height * 0.5 + Math.sin(ratio * Math.PI * 2) * 52;
      drawStageGlyph(context, stage.id, x, y - 16, FALLBACK_GLYPH_SIZE);
      context.fillStyle = "#f4f4f5";
      context.font = "600 11px Arial";
      context.textAlign = "center";
      context.fillText(stage.shortLabel, x, y + 52);
    });
    context.restore();
    animationFrame = window.requestAnimationFrame(render);
  };

  render();

  return () => {
    window.cancelAnimationFrame(animationFrame);
  };
}

function createLabel(text: string): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "rgba(10, 10, 10, 0.88)";
    context.beginPath();
    context.roundRect(16, 8, canvas.width - 32, canvas.height - 16, 12);
    context.fill();
    context.strokeStyle = "rgba(113, 113, 122, 0.72)";
    context.lineWidth = 2;
    context.stroke();
    context.fillStyle = "#f4f4f5";
    context.font = "600 22px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, canvas.width / 2, canvas.height / 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.02, 0.26, 1);
  return sprite;
}

function createMaterial(
  color: THREE.Color = IDLE_COLOR,
  metalness: number = 0.18
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: new THREE.Color(0x000000),
    roughness: 0.42,
    metalness,
    flatShading: true,
  });
}

function addMesh(
  group: THREE.Group,
  geometry: THREE.BufferGeometry,
  materials: THREE.MeshStandardMaterial[],
  configure?: (mesh: THREE.Mesh) => void,
  color: THREE.Color = IDLE_COLOR,
  metalness: number = 0.18
): THREE.Mesh {
  const material = createMaterial(color, metalness);
  const mesh = new THREE.Mesh(geometry, material);
  configure?.(mesh);
  group.add(mesh);
  materials.push(material);
  return mesh;
}

function addNodeBase(
  group: THREE.Group,
  materials: THREE.MeshStandardMaterial[]
): void {
  addMesh(
    group,
    new THREE.CylinderGeometry(0.42, 0.46, 0.035, 40),
    materials,
    (mesh) => {
      mesh.position.set(0, -0.34, -0.08);
    },
    GLASS_COLOR,
    0.18
  );
  addMesh(
    group,
    new THREE.TorusGeometry(0.47, 0.012, 8, 56),
    materials,
    (mesh) => {
      mesh.position.set(0, -0.32, -0.06);
      mesh.rotation.x = Math.PI / 2;
    },
    ACCENT_COLOR,
    0.08
  );
}

function createStageIconTexture(stageId: VisualizerStageId): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = ICON_CANVAS_SIZE;
  canvas.height = ICON_CANVAS_SIZE;
  const context = canvas.getContext("2d");
  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawStageGlyph(
      context,
      stageId,
      ICON_CANVAS_SIZE / 2,
      ICON_CANVAS_SIZE / 2,
      ICON_CANVAS_SIZE
    );
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function createStageSprite(stageId: VisualizerStageId): THREE.Sprite {
  const texture = createStageIconTexture(stageId);

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.position.set(0, 0.12, 0.18);
  sprite.scale.set(STAGE_SPRITE_SIZE, STAGE_SPRITE_SIZE, 1);
  return sprite;
}

function createStageVisual(stageId: VisualizerStageId): {
  group: THREE.Group;
  materials: THREE.MeshStandardMaterial[];
} {
  const group = new THREE.Group();
  const materials: THREE.MeshStandardMaterial[] = [];
  addNodeBase(group, materials);
  group.add(createStageSprite(stageId));
  return { group, materials };
}

function disposeMaterial(material: THREE.Material): void {
  const maybeMappedMaterial = material as THREE.Material & {
    map?: THREE.Texture | null;
  };
  maybeMappedMaterial.map?.dispose();
  material.dispose();
}

export function ProfileVisualizerScene({
  activeStageId,
  completedStageIds,
  onStageSelect,
}: ProfileVisualizerSceneProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeStageRef = useRef(activeStageId);
  const completedStageIdsRef = useRef(new Set(completedStageIds));
  const onStageSelectRef = useRef(onStageSelect);
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM);
  const zoomLevelRef = useRef(DEFAULT_ZOOM);
  const zoomPercent = Math.round(zoomLevel * 100);
  const isDefaultZoom = Math.abs(zoomLevel - DEFAULT_ZOOM) < 0.001;
  const updateZoom = useCallback((nextZoom: number): void => {
    setZoomLevel(clampZoom(nextZoom));
  }, []);
  const zoomOut = useCallback((): void => {
    setZoomLevel((currentZoom) => clampZoom(currentZoom - ZOOM_STEP));
  }, []);
  const zoomIn = useCallback((): void => {
    setZoomLevel((currentZoom) => clampZoom(currentZoom + ZOOM_STEP));
  }, []);
  const resetZoom = useCallback((): void => {
    updateZoom(DEFAULT_ZOOM);
  }, [updateZoom]);

  useEffect(() => {
    activeStageRef.current = activeStageId;
  }, [activeStageId]);

  useEffect(() => {
    completedStageIdsRef.current = new Set(completedStageIds);
  }, [completedStageIds]);

  useEffect(() => {
    onStageSelectRef.current = onStageSelect;
  }, [onStageSelect]);

  useEffect(() => {
    zoomLevelRef.current = zoomLevel;
  }, [zoomLevel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        preserveDrawingBuffer: true,
      });
    } catch {
      return drawFallback(canvas, zoomLevelRef);
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(SCENE_CENTER.x, SCENE_CENTER.y, CAMERA_DISTANCE);
    camera.lookAt(SCENE_CENTER);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
    const keyLight = new THREE.PointLight(0x93c5fd, 2.7, 14);
    keyLight.position.set(-3, 4, 5);
    const rimLight = new THREE.PointLight(0xffffff, 1.4, 12);
    rimLight.position.set(4, -2, 4);
    scene.add(ambientLight, keyLight, rimLight);

    const root = new THREE.Group();
    scene.add(root);

    const nodeMap = new Map<VisualizerStageId, SceneNode>();
    const pathPoints: THREE.Vector3[] = [];

    VISUALIZER_STAGES.forEach((stage) => {
      const group = new THREE.Group();
      const [x, y, z] = NODE_POSITIONS[stage.id];
      group.position.set(x, y, z);
      const visual = createStageVisual(stage.id);
      group.add(visual.group);

      const label = createLabel(stage.shortLabel);
      label.position.set(0, -0.78, 0);
      group.add(label);
      group.traverse((object) => {
        object.userData.stageId = stage.id;
      });

      root.add(group);
      pathPoints.push(group.position.clone());
      nodeMap.set(stage.id, {
        group,
        materials: visual.materials,
        basePosition: group.position.clone(),
      });
    });

    const pathGeometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
    const pathMaterial = new THREE.LineBasicMaterial({
      color: 0x71717a,
      transparent: true,
      opacity: 0.72,
    });
    const pathLine = new THREE.Line(pathGeometry, pathMaterial);
    root.add(pathLine);

    const packet = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.13, 1),
      new THREE.MeshStandardMaterial({
        color: ACCENT_COLOR,
        emissive: new THREE.Color(0x2563eb),
        emissiveIntensity: 0.8,
        roughness: 0.18,
        metalness: 0.2,
      })
    );
    packet.position.copy(pathPoints[0]);
    root.add(packet);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const handlePointerDown = (event: PointerEvent): void => {
      if (!onStageSelectRef.current) {
        return;
      }

      const bounds = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = -(((event.clientY - bounds.top) / bounds.height) * 2 - 1);
      raycaster.setFromCamera(pointer, camera);

      const selectedStageId = raycaster
        .intersectObjects(root.children, true)
        .map((intersection) => intersection.object.userData.stageId)
        .find((stageId): stageId is VisualizerStageId =>
          VISUALIZER_STAGES.some((stage) => stage.id === stageId)
        );

      if (selectedStageId) {
        onStageSelectRef.current(selectedStageId);
      }
    };
    canvas.addEventListener("pointerdown", handlePointerDown);

    const resize = (): void => {
      const parent = canvas.parentElement;
      const width = Math.max(320, parent?.clientWidth ?? canvas.clientWidth);
      const height = Math.max(260, parent?.clientHeight ?? canvas.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );
    let shouldReduceMotion = reducedMotionQuery.matches;
    const handleReducedMotionChange = (event: MediaQueryListEvent): void => {
      shouldReduceMotion = event.matches;
    };
    reducedMotionQuery.addEventListener("change", handleReducedMotionChange);

    let animationFrame = 0;
    const startedAt = performance.now();
    const animate = (): void => {
      const elapsed = (performance.now() - startedAt) / 1000;
      const activeId = activeStageRef.current;
      const completedIds = completedStageIdsRef.current;

      if (shouldReduceMotion) {
        root.rotation.set(0, 0, 0);
      } else {
        root.rotation.y = Math.sin(elapsed * 0.18) * 0.08;
        root.rotation.x = Math.sin(elapsed * 0.12) * 0.035;
      }
      camera.position.z +=
        (CAMERA_DISTANCE / zoomLevelRef.current - camera.position.z) * 0.12;
      camera.position.x += (SCENE_CENTER.x - camera.position.x) * 0.12;
      camera.position.y += (SCENE_CENTER.y - camera.position.y) * 0.12;
      camera.lookAt(SCENE_CENTER);

      nodeMap.forEach((node, stageId) => {
        const isActive = stageId === activeId;
        const isComplete = completedIds.has(stageId);
        const color = isActive
          ? ACTIVE_COLOR
          : isComplete
            ? COMPLETE_COLOR
            : IDLE_COLOR;
        node.materials.forEach((material) => {
          material.color.lerp(color, 0.14);
          material.emissive.lerp(
            isActive ? ACCENT_COLOR : new THREE.Color(0x000000),
            0.12
          );
          material.emissiveIntensity = isActive ? 0.7 : 0.18;
        });
        const pulse =
          isActive && !shouldReduceMotion
            ? 1 + Math.sin(elapsed * 5.5) * 0.08
            : 1;
        node.group.scale.lerp(new THREE.Vector3(pulse, pulse, pulse), 0.16);
        node.group.position.y =
          node.basePosition.y +
          (isActive && !shouldReduceMotion ? Math.sin(elapsed * 4) * 0.05 : 0);
      });

      const activeNode = nodeMap.get(activeId);
      if (activeNode) {
        packet.position.lerp(activeNode.group.position, 0.08);
      }
      if (!shouldReduceMotion) {
        packet.rotation.x += 0.035;
        packet.rotation.y += 0.05;
      }

      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener("resize", resize);
    animate();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", handlePointerDown);
      reducedMotionQuery.removeEventListener("change", handleReducedMotionChange);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach(disposeMaterial);
        }
        if (object instanceof THREE.Sprite) {
          disposeMaterial(object.material);
        }
      });
      pathGeometry.dispose();
      pathMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative h-full min-h-[260px] w-full bg-black">
      <canvas
        ref={canvasRef}
        className="h-full min-h-[260px] w-full cursor-pointer bg-black"
        data-testid="profile-visualizer-canvas"
        aria-label="Three-dimensional LLM architecture visualizer"
      />
      <div
        className="absolute right-3 top-3 flex items-center gap-1 rounded-md border border-gray-800 bg-black/80 p-1 shadow-lg backdrop-blur"
        aria-label="Visualizer zoom controls"
      >
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md text-gray-300 transition-colors hover:bg-gray-900 hover:text-white disabled:cursor-not-allowed disabled:text-gray-700 disabled:hover:bg-transparent"
          aria-label="Zoom out visualizer"
          title="Zoom out"
          onClick={zoomOut}
          disabled={zoomLevel <= MIN_ZOOM}
          data-testid="profile-visualizer-zoom-out"
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <span
          className="min-w-12 text-center text-xs font-medium text-gray-400"
          data-testid="profile-visualizer-zoom-value"
        >
          {zoomPercent}%
        </span>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md text-gray-300 transition-colors hover:bg-gray-900 hover:text-white disabled:cursor-not-allowed disabled:text-gray-700 disabled:hover:bg-transparent"
          aria-label="Zoom in visualizer"
          title="Zoom in"
          onClick={zoomIn}
          disabled={zoomLevel >= MAX_ZOOM}
          data-testid="profile-visualizer-zoom-in"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md text-gray-300 transition-colors hover:bg-gray-900 hover:text-white disabled:cursor-not-allowed disabled:text-gray-700 disabled:hover:bg-transparent"
          aria-label="Reset visualizer zoom"
          title="Reset zoom"
          onClick={resetZoom}
          disabled={isDefaultZoom}
          data-testid="profile-visualizer-zoom-reset"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
