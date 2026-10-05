import * as THREE from 'three';

/** Original staged art composition, not a dungeon map or terrain rule. */
export function buildMagmaCavern(detail = 0) {
  const root = new THREE.Group();
  root.name = 'asset-root';
  const stone = new THREE.MeshStandardMaterial({ color: '#302839', roughness: 1, metalness: 0, vertexColors: true, flatShading: true });
  stone.name = 'basalt-violet';
  const lava = new THREE.MeshStandardMaterial({ color: '#ff5014', emissive: '#e73707', roughness: 1, metalness: 0, vertexColors: true });
  lava.name = 'lava-amber';
  const pale = new THREE.MeshStandardMaterial({ color: '#ffb02f', emissive: '#f4a526', roughness: 1, metalness: 0, vertexColors: true });
  pale.name = 'lava-ridges';
  const stoneGeometry = new THREE.CylinderGeometry(0.85, 1, 1, detail === 2 ? 5 : 7, 1);
  const blockGeometry = new THREE.BoxGeometry(1, 1, 1);
  const lavaGeometry = new THREE.PlaneGeometry(1, 1);
  for (const geometry of [stoneGeometry, blockGeometry, lavaGeometry]) {
    const positions = geometry.getAttribute('position');
    const colors = [];
    for (let i = 0; i < positions.count; i += 1) {
      const brightness = .65 + .35 * (positions.getY(i) + .5);
      colors.push(brightness, brightness, brightness);
    }
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  }
  let serial = 0;
  function mesh(label, geometry, material, xyz, scale, rotateY = 0) {
    const node = new THREE.Mesh(geometry, material);
    node.name = `${label}-${String(serial++).padStart(3, '0')}`;
    node.position.fromArray(xyz);
    node.scale.fromArray(scale);
    node.rotation.y = rotateY;
    root.add(node);
    return node;
  }
  const variation = index => (Math.sin(index * 73.173 + 13.7) * 15731.743) % 1;
  const slabs = Array.from({ length: 5 }, (_, shape) => {
    const top = [
      [-.97, .98], [.56 + shape * .035, 1], [.99, .67], [.98, -.65 - shape * .025],
      [.65, -.99], [-.68 - shape * .02, -.98], [-.99, -.63], [-1, .68],
    ];
    const positions = [];
    const colors = [];
    function vertex(point, brightness) {
      positions.push(...point);
      colors.push(brightness, brightness, brightness);
    }
    for (let i = 0; i < top.length; i += 1) {
      const a = top[i];
      const b = top[(i + 1) % top.length];
      const shade = .78 + Math.abs(variation(i + shape * 7)) * .22;
      vertex([0, .015, 0], shade); vertex([a[0], 0, a[1]], shade); vertex([b[0], 0, b[1]], shade);
      vertex([a[0], 0, a[1]], .5); vertex([a[0] * .94, -1.1, a[1] * .94], .45); vertex([b[0], 0, b[1]], .5);
      vertex([b[0], 0, b[1]], .5); vertex([a[0] * .94, -1.1, a[1] * .94], .45); vertex([b[0] * .94, -1.1, b[1] * .94], .45);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    return geometry;
  });
  // Ground tops align at Y=0. Separate dark slabs keep the art's path legible.
  for (let z = -22; z < 13; z += 2) {
    const width = z < -12 ? 5 : z < 0 ? 4 : 5;
    for (let x = -width; x <= width; x += 2) {
      mesh('ground-slab', slabs[Math.abs(x + z) % slabs.length], stone, [x, 0, z], [1, 1, 1]);
      if (detail < 2 && Math.abs(variation(x + z * 17)) > .35) {
        const chip = mesh('slab-edge', stoneGeometry, stone, [x + .8, -.12, z + .75], [.27, .24, .38], x + z);
        chip.rotation.z = .07;
      }
    }
  }
  const sea = mesh('lava-lake', lavaGeometry, lava, [0, -1.05, -7], [48, 65, 1]);
  sea.rotation.x = -Math.PI / 2;
  // Parallel molten ridges are geometry, with no downloaded texture or shader.
  for (let i = 0; i < (detail === 2 ? 12 : 24); i += 1) {
    const side = i % 2 ? -1 : 1;
    const ridge = mesh('molten-ridge', lavaGeometry, detail === 2 ? lava : pale,
      [side * (6.4 + Math.abs(variation(i)) * 12), -1.02, 10 - i * 1.7],
      [2.5 + Math.abs(variation(i + 9)) * 4, .09 + Math.abs(variation(i)) * .11, 1]);
    ridge.rotation.x = -Math.PI / 2;
    ridge.rotation.z = side * .21;
  }
  // Layered basalt side walls leave the camera corridor and ground uncluttered.
  for (const side of [-1, 1]) {
    for (let i = 0; i < (detail === 2 ? 17 : 29); i += 1) {
      const z = 11 - i * 1.65;
      const height = 3 + Math.abs(variation(i + side * 81)) * 11;
      const x = side * (10 + Math.abs(variation(i + 10)) * 4);
      mesh('basalt-column', stoneGeometry, stone, [x, height / 2 - 1.1, z],
        [1.4 + Math.abs(variation(i + 3)), height, 1.9], i * .44);
      if (i % 5 === 1) {
        const fall = mesh('lava-fall', lavaGeometry, lava, [side * 8.1, height / 2 - 1.05, z + 1], [1.1, height, 1], side * .4);
        fall.rotation.z = side * .04;
        mesh('fall-core', lavaGeometry, detail === 2 ? lava : pale,
          [side * 8.07, height / 2 - 1.05, z + 1.04], [.24, height, 1], side * .4);
      }
    }
  }
  for (const [level, z] of [-23, -36].entries()) {
    const segments = detail === 2 ? 13 : 19;
    for (let i = 0; i < segments; i += 1) {
      const angle = i / (segments - 1) * Math.PI;
      const arch = mesh('distant-arch', stoneGeometry, stone,
        [Math.cos(angle) * (12 + level * 3), Math.sin(angle) * (13 + level * 2) - .5, z],
        [2.4, 3.7, 2.8], angle * .4);
      arch.rotation.z = angle;
    }
  }
  for (let i = 0; i < (detail === 2 ? 10 : 24); i += 1) {
    const x = (i % 2 ? -1 : 1) * (6 + Math.abs(variation(i + 7)) * 2);
    const height = .55 + Math.abs(variation(i + 14)) * 1.8;
    mesh('obsidian-outcrop', stoneGeometry, stone, [x, height / 2 - .5, 8 - i * 1.55], [.5, height, .65], i * .75);
  }
  const center = new THREE.Box3().setFromObject(root).getCenter(new THREE.Vector3());
  for (const node of root.children) {
    node.position.x -= center.x;
    node.position.z -= center.z;
  }
  return {
    root,
    clips: [],
    notes: [
      'Original procedural basalt, lava lake, falls, layered arches and obsidian composition.',
      'This staging environment defines no dungeon layout, legal terrain, hazards or campaign floor.',
      'All geometry and colors authored in this generator; no extracted artwork, textures or external resources.',
      'Lighting, cel shading and atmospheric effects belong to the disposable P06 preview harness.',
    ],
  };
}
