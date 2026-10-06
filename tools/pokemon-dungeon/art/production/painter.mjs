// Original volume-aware pixel authoring. Shared primitives, independently authored anatomy.
import { Raster } from '../pixel/raster.mjs';
export const ink = '#302d3b';
export const palettes = {
  green: ['#347968', '#63b698', '#a0d8aa'], lime: ['#739346', '#b7d879', '#dceda0'],
  orange: ['#b85b39', '#eb9451', '#ffc579'], blue: ['#397d9f', '#71bed3', '#b1e4e8'],
  yellow: ['#c09039', '#f1ce52', '#ffe795'], cream: ['#bc9465', '#edcd96', '#fff0c6'],
  brown: ['#755344', '#b78a62', '#d9b282'], pink: ['#b25c7d', '#e995b1', '#ffd0d6'],
  gray: ['#596e79', '#8fa9af', '#c3d4d0'], teal: ['#244f5e', '#387986', '#67a7a6'],
  leaf: ['#2d6546', '#4e9b57', '#8ac76f'], red: ['#983e40', '#d76b59', '#f8a072'],
  skull: ['#a6a08a', '#dedbc0', '#fff4d5'], purple: ['#6d4a73', '#a87399', '#d6a7bd'],
};
export function painter(direction, pose) {
  const r = new Raster(), parts = [], theta = direction * Math.PI / 4;
  function transform(v, group = 'body') {
    let [x, y, z] = v;
    const collapse = pose.collapse;
    if (group === 'body') { y = Math.max(7, y - collapse * .65); z += pose.lean * .6; }
    if (group === 'head') { y = Math.max(13, y + pose.head - collapse * .65); z += pose.lean + (pose.sleep ? 7 : 0); const a = pose.turn; [x, z] = [x * Math.cos(a) + z * Math.sin(a), z * Math.cos(a) - x * Math.sin(a)]; }
    if (group === 'tail') { x += pose.tail; y = Math.max(10, y - collapse * .4); z += pose.lean * .4 + pose.curl; }
    y += pose.lift;
    return [x, y, z];
  }
  function project(v) { const [x, y, z] = v, depth = z * Math.cos(theta) - x * Math.sin(theta); return [48 + .9 * (x * Math.cos(theta) + z * Math.sin(theta)), 90 - y * .9 - depth * .144, depth + y * .06]; }
  function ellipse(center, radii, color, group = 'body', options = {}) {
    const [rx, ry, rz] = radii;
    const squish = ['body', 'head'].includes(group) ? 1 - Math.min(.35, pose.collapse * .012) : 1;
    const transformed = transform(center, group);
    if (group !== 'limb') transformed[1] = Math.max(ry * squish + 4, transformed[1]);
    const point = project(transformed);
    const sx = .9 * Math.sqrt((rx * Math.cos(theta)) ** 2 + (rz * Math.sin(theta)) ** 2);
    const sy = Math.max(1, ry * squish * .9);
    parts.push({ depth: point[2] + (options.depth ?? 0), draw() {
      const [x, y] = point;
      const ramp = Array.isArray(color) ? color : [color, color, color];
      if (options.outline !== false) r.ellipse(x, y, sx + 1, sy + 1, ink);
      r.ellipse(x, y, sx, sy, ramp[0]);
      r.ellipse(x - sx * .13, y - sy * .12, sx * .86, sy * .86, ramp[1]);
      if (!options.flat) r.ellipse(x - sx * .24, y - sy * .36, Math.max(1, sx * .44), Math.max(1, sy * .24), ramp[2]);
    } });
  }
  function polygon(vertices, color, group = 'body', options = {}) {
    const points = vertices.map(v => project(transform(v, group)));
    parts.push({ depth: points.reduce((sum, p) => sum + p[2], 0) / points.length + (options.depth ?? 0), draw() {
      r.polygon(points, color);
      if (options.outline !== false) for (let i = 0; i < points.length; i++) r.line(points[i][0], points[i][1], points[(i + 1) % points.length][0], points[(i + 1) % points.length][1], ink, 1.5);
    } });
  }
  function line(a, b, color = ink, width = 1, group = 'body', depth = 0) {
    const p = project(transform(a, group)), q = project(transform(b, group));
    parts.push({ depth: (p[2] + q[2]) / 2 + depth, draw() { r.line(p[0], p[1], q[0], q[1], color, width); } });
  }
  // Facial features live on actual front/side surfaces and are culled by normal.
  function face({ y, z, width = 10, depth = 10, eyes = '#352f3d', closed = false, muzzle = false }) {
    const c = Math.cos(theta), s = Math.sin(theta);
    for (const side of [-1, 1]) {
      const visibility = c * .7 - side * s * .65;
      if (visibility < .02) continue;
      const x = side * width;
      const ez = z + depth * (.22 + .46 * Math.abs(c));
      const ey = y + 1;
      const screen = project(transform([x, ey, ez], 'head'));
      parts.push({ depth: screen[2] + 15, draw() {
        const [px, py] = screen;
        if (closed || pose.eye !== 'open') { r.line(px - 2, py + (pose.eye === 'hurt' ? -1 : 0), px, py + 1, ink, 1.5); r.line(px, py + 1, px + 2, py, ink, 1.5); }
        else { r.ellipse(px, py, visibility > .45 ? 2.5 : 2, 4, ink); r.ellipse(px, py + 1, 1.5, 2.5, eyes); r.pixel(px - 1, py - 2, '#fff8df'); }
      } });
    }
    if (c > .15) {
      const p = project(transform([0, y - 7, z + depth + (muzzle ? 3 : 0)], 'head'));
      parts.push({ depth: p[2] + 15, draw() { if (pose.mouth) { r.ellipse(p[0], p[1], 3, pose.mouth === 2 ? 4 : 2.5, ink); r.ellipse(p[0], p[1] + 1, 2, 1, '#e5978d'); } else { r.line(p[0] - 3, p[1], p[0], p[1] + 1, ink); r.line(p[0], p[1] + 1, p[0] + 3, p[1], ink); } } });
    }
  }
  function eyePatches({ y, z, width, depth, color, rx = 5, ry = 6, closedColor }) {
    const c = Math.cos(theta), s = Math.sin(theta);
    for (const side of [-1, 1]) {
      if (c * .7 - side * s * .65 < .02) continue;
      const fill = pose.eye === 'open' || !closedColor ? color : closedColor;
      ellipse([side * width, y + 1, z + depth * (.22 + .46 * Math.abs(c))], [rx, ry, rx], fill, 'head', { depth: 14, flat: true, outline: false });
    }
  }
  function limb(root, tip, radius, color, group = 'limb') {
    const joint = group === 'limb' ? [tip[0], tip[1] + radius * .45, tip[2]] : tip;
    line(root, joint, ink, radius * 2 + 2, group);
    line(root, joint, color[1], radius * 2, group, .2);
    ellipse(tip, [radius + 1, radius * .65 + 1, radius + 2], color, group, { depth: .3, outline: false });
  }
  function feet({ x = 9, z = 2, y = 5, color, quadruped = false, spread = 0, claws = false, radius = 5 }) {
    const positions = quadruped ? [[-x, z], [x, z], [-x, -z], [x, -z]] : [[-x, z], [x, z]];
    positions.forEach(([sx, sz], index) => {
      const phase = index === 0 || index === 3 ? 1 : -1;
      const stride = pose.gait * phase;
      const fore = quadruped && index < 2;
      const lift = Math.max(0, stride) * 3 + (fore && index === 1 ? pose.spread * .6 : 0);
      const tip = [sx + Math.sign(sx) * spread, y + lift, sz + stride * (quadruped ? 4 : 5) + (fore ? pose.reach * .55 : 0) + (pose.sleep && fore ? 3 : 0)];
      const root = [sx * .7, quadruped ? 17 - Math.min(pose.collapse * .3, 6) : 17 - Math.min(pose.collapse * .35, 7), sz];
      limb(root, tip, radius, color);
      if (claws) for (const offset of [-2, 1]) ellipse([tip[0] + offset, tip[1] - 1, tip[2] + radius + 1], [1, 1.5, 2], palettes.skull, 'limb', { depth: 1, outline: false });
    });
  }
  function arms({ x = 13, y = 26, z = 3, color, radius = 3, wing = false }) {
    for (const sign of [-1, 1]) {
      const waving = pose.spread * (sign === 1 ? 1 : .8);
      const tip = [sign * (x + 2 + waving), Math.max(7, y - 8 + waving - pose.collapse * .45), z + pose.reach - pose.gait * sign * 3];
      if (wing) polygon([[sign * x, y + 4, z], [tip[0], tip[1] + 2, tip[2]], [tip[0] - sign * 3, tip[1] - 3, tip[2] + 1], [sign * (x - 2), y - 4, z]], color[1], 'body');
      else limb([sign * x * .8, y + 2 - pose.collapse * .45, z], tip, radius, color);
    }
  }
  return { ellipse, polygon, line, face, eyePatches, feet, arms, limb, pose, front: Math.cos(theta) > .12, back: Math.cos(theta) < -.12, finish() { parts.sort((a, b) => a.depth - b.depth); for (const part of parts) part.draw(); return r; } };
}
