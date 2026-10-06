import * as THREE from 'three';
/** Original deterministic texture pixels; no image downloads or copied surfaces. */
function stoneTexture() {
  const side = 128, data = new Uint8Array(side * side * 4);
  let seed = 812731;
  for (let y = 0; y < side; y++) for (let x = 0; x < side; x++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const distances = [];
    for (let row = -1; row < 5; row++) for (let col = -1; col < 5; col++) {
      const px = col * 32 + 10 + ((row + 4) * 17 + (col + 4) * 7) % 13;
      const py = row * 32 + 10 + ((col + 4) * 19 + (row + 4) * 3) % 13;
      distances.push(Math.hypot(x - px, y - py));
    }
    distances.sort((a, b) => a - b);
    const seam = (distances[1] ?? 0) - (distances[0] ?? 0) < 1.1;
    const fleck = (seed >>> 24) / 255;
    const value = seam ? 20 : 78 + fleck * 24 + Math.sin(x * .25 + y * .14) * 9;
    const i = (y * side + x) * 4;
    data[i] = value; data[i + 1] = value * .89; data[i + 2] = value * .88; data[i + 3] = 255;
  }
  const texture = new THREE.DataTexture(data, side, side);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.NearestFilter; texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true; texture.repeat.set(4, 6); texture.needsUpdate = true;
  return texture;
}
/** @param {THREE.Scene} scene */
export function createEnvironment(scene) {
  const texture = stoneTexture();
  const basalt = new THREE.MeshStandardMaterial({ map: texture, color: '#e0c1a0', roughness: .96 });
  const rock = new THREE.MeshStandardMaterial({ map: texture, color: '#a68e88', roughness: .95 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 33), basalt);
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, -.025, -4); floor.receiveShadow = true; scene.add(floor);
  const lava = new THREE.MeshBasicMaterial({ color: '#f58c3f' });
  for (const sign of [-1, 1]) {
    const channel = new THREE.Mesh(new THREE.PlaneGeometry(3, 36), lava);
    channel.rotation.x = -Math.PI / 2; channel.position.set(sign * 9.5, -.16, -5); scene.add(channel);
    for (let i = 0; i < 14; i++) {
      const height = 2.7 + (i * 7 % 9) * .5;
      const column = new THREE.Mesh(new THREE.CylinderGeometry(.85, 1.15, height, 5, 2), rock);
      column.position.set(sign * (10.8 + i % 3 * .45), height / 2 - .3, 9 - i * 2.1);
      column.rotation.y = i * 1.31; column.rotation.z = sign * .04; column.castShadow = true; column.receiveShadow = true; scene.add(column);
      const rubble = new THREE.Mesh(new THREE.IcosahedronGeometry(.65 + i % 3 * .2, 0), basalt);
      rubble.position.set(sign * (7.8 + i % 2 * .35), .1, 8 - i * 2); rubble.rotation.set(i, .3 * i, i * .4); rubble.receiveShadow = true; scene.add(rubble);
    }
    const light = new THREE.PointLight('#ff9b56', 65, 22, 2); light.position.set(sign * 8, 2, -4); scene.add(light);
  }
  for (let i = 0; i < 7; i++) {
    const boulder = new THREE.Mesh(new THREE.IcosahedronGeometry(3, 1), rock);
    boulder.scale.set(1, 1.6 + i % 2, .8); boulder.position.set(-10 + i * 3.5, 2, -19); boulder.rotation.y = i; boulder.castShadow = true; scene.add(boulder);
  }
  scene.add(new THREE.HemisphereLight('#bdc9d8', '#a77353', 2.8));
  const key = new THREE.DirectionalLight('#ffe3bc', 3.0); key.position.set(-5, 12, 6); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -18; key.shadow.camera.right = 18; key.shadow.camera.top = 18; key.shadow.camera.bottom = -18; scene.add(key);
}
