// Low-poly object factory — every Shadowline object built from three.js
// primitives, no external models. Each group is ~2 units tall, centred at
// the origin, so it reads clearly as a silhouette from any angle.
// One shared flat-shaded material keeps the scene cheap (one draw style,
// low triangle counts for the Reddit webview).

import * as THREE from 'three';

const MAT = new THREE.MeshStandardMaterial({
  // Warm cream-amber so objects read bright against the ink-navy studio
  // (one shared palette for every object — never recoloured per object).
  color: 0xf2e2b8,
  roughness: 0.8,
  metalness: 0.05,
  flatShading: true,
});

const DARK = new THREE.MeshStandardMaterial({
  color: 0x2a2118,
  roughness: 0.9,
  metalness: 0.0,
  flatShading: true,
});

function mesh(
  geo: THREE.BufferGeometry,
  x = 0,
  y = 0,
  z = 0,
  rx = 0,
  ry = 0,
  rz = 0,
  mat = MAT
): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// .scale.set() returns the Vector3, not the mesh — scale via this helper
// so the mesh itself stays the group child.
function scaled(m: THREE.Mesh, sx: number, sy: number, sz: number): THREE.Mesh {
  m.scale.set(sx, sy, sz);
  return m;
}

function group(...children: THREE.Object3D[]): THREE.Group {
  const g = new THREE.Group();
  for (const c of children) g.add(c);
  return g;
}

// A tube that exactly connects point A to point B, so frame parts meet
// joint-to-joint with no gaps or floating ends (the old bicycle was built
// from free-placed rotated cylinders and its parts never met).
type Vec3 = [number, number, number];

function strut(a: Vec3, b: Vec3, r: number, mat = MAT): THREE.Mesh {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  const dir = vb.clone().sub(va);
  const len = dir.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), mat);
  m.position.copy(va).add(vb).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

const builders: Record<string, () => THREE.Group> = {
  teapot: () =>
    group(
      scaled(mesh(new THREE.SphereGeometry(0.55, 12, 10), 0, 0, 0, 0, 0, 0), 1, 0.8, 1),
      mesh(new THREE.CylinderGeometry(0.08, 0.16, 0.5, 8), 0.62, 0.25, 0, 0, 0, -0.7),
      mesh(new THREE.TorusGeometry(0.28, 0.07, 8, 12, Math.PI), -0.58, 0.1, 0, 0, 0, Math.PI / 2),
      mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.12, 10), 0, 0.5, 0),
      mesh(new THREE.SphereGeometry(0.09, 8, 8), 0, 0.62, 0)
    ),
  boot: () =>
    group(
      mesh(new THREE.BoxGeometry(0.55, 0.45, 0.9), 0, -0.55, 0.15),
      mesh(new THREE.BoxGeometry(0.5, 1.1, 0.5), 0, 0.15, -0.15),
      mesh(new THREE.BoxGeometry(0.56, 0.12, 0.95), 0, -0.8, 0.15),
      mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.1, 10), 0, 0.72, -0.15)
    ),
  mug: () =>
    group(
      mesh(new THREE.CylinderGeometry(0.42, 0.38, 0.85, 14), 0, 0, 0),
      mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.1, 14), 0, 0.44, 0, 0, 0, 0, DARK),
      mesh(new THREE.TorusGeometry(0.26, 0.06, 8, 14, Math.PI), 0.48, 0, 0, 0, 0, -Math.PI / 2)
    ),
  lamp: () =>
    group(
      mesh(new THREE.ConeGeometry(0.55, 0.55, 12, 1, true), 0, 0.55, 0),
      mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.7, 8), 0, -0.05, 0),
      mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.12, 12), 0, -0.45, 0),
      mesh(new THREE.SphereGeometry(0.12, 8, 8), 0, 0.28, 0, 0, 0, 0, DARK)
    ),
  key: () =>
    group(
      mesh(new THREE.TorusGeometry(0.32, 0.1, 8, 14), -0.55, 0.35, 0),
      mesh(new THREE.BoxGeometry(1.5, 0.16, 0.12), 0.25, 0.35, 0),
      mesh(new THREE.BoxGeometry(0.12, 0.28, 0.12), 0.75, 0.18, 0),
      mesh(new THREE.BoxGeometry(0.12, 0.2, 0.12), 0.95, 0.22, 0)
    ),
  scissors: () =>
    group(
      mesh(new THREE.TorusGeometry(0.16, 0.05, 8, 12), -0.6, 0.45, 0),
      mesh(new THREE.TorusGeometry(0.16, 0.05, 8, 12), -0.6, -0.45, 0),
      mesh(new THREE.BoxGeometry(1.3, 0.14, 0.06), 0.1, 0.18, 0, 0, 0, 0.35),
      mesh(new THREE.BoxGeometry(1.3, 0.14, 0.06), 0.1, -0.18, 0, 0, 0, -0.35)
    ),
  pine: () =>
    group(
      mesh(new THREE.ConeGeometry(0.55, 0.6, 8), 0, -0.05, 0),
      mesh(new THREE.ConeGeometry(0.45, 0.55, 8), 0, 0.35, 0),
      mesh(new THREE.ConeGeometry(0.32, 0.5, 8), 0, 0.7, 0),
      mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.35, 8), 0, -0.55, 0)
    ),
  fish: () =>
    group(
      scaled(mesh(new THREE.SphereGeometry(0.5, 12, 10), 0, 0, 0), 1.4, 0.7, 0.4),
      mesh(new THREE.ConeGeometry(0.35, 0.5, 4), -0.85, 0, 0, 0, 0, Math.PI / 2),
      mesh(new THREE.ConeGeometry(0.25, 0.35, 4), 0.1, 0.35, 0, 0, 0, 0),
      mesh(new THREE.SphereGeometry(0.08, 8, 8), 0.55, 0.12, 0.18, 0, 0, 0, DARK)
    ),
  snail: () =>
    group(
      scaled(mesh(new THREE.SphereGeometry(0.5, 12, 10), -0.1, 0.25, 0), 1, 1, 0.55),
      mesh(new THREE.SphereGeometry(0.3, 10, 8), -0.1, 0.25, 0.2, 0, 0, 0, DARK),
      mesh(new THREE.BoxGeometry(1.2, 0.3, 0.4), 0.1, -0.25, 0),
      mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.35, 6), 0.55, 0.1, 0, 0, 0, 0.3),
      mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.35, 6), 0.55, 0.1, 0, 0, 0, -0.3)
    ),
  mushroom: () =>
    group(
      mesh(new THREE.SphereGeometry(0.6, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0, 0.1, 0),
      mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.6, 10), 0, -0.3, 0),
      mesh(new THREE.SphereGeometry(0.1, 8, 8), -0.3, 0.35, 0.35, 0, 0, 0, DARK),
      mesh(new THREE.SphereGeometry(0.08, 8, 8), 0.25, 0.45, 0.3, 0, 0, 0, DARK)
    ),
  // Real diamond frame: every tube runs joint-to-joint (rear hub, front
  // hub, bottom bracket, seat top, head tube) so the bike reads as ONE
  // object from any angle, matching the clean splash silhouette.
  bicycle: () => {
    const rear: Vec3 = [-0.55, -0.35, 0];
    const front: Vec3 = [0.55, -0.35, 0];
    const bb: Vec3 = [-0.05, -0.3, 0];
    const seatTop: Vec3 = [-0.38, 0.42, 0];
    const headTop: Vec3 = [0.38, 0.38, 0];
    const headBottom: Vec3 = [0.3, 0.08, 0];
    const spokes: THREE.Mesh[] = [];
    for (const hub of [rear, front]) {
      for (let k = 0; k < 3; k++) {
        const a = (k * Math.PI) / 3;
        const dx = 0.38 * Math.cos(a);
        const dy = 0.38 * Math.sin(a);
        spokes.push(
          strut([hub[0] - dx, hub[1] - dy, 0], [hub[0] + dx, hub[1] + dy, 0], 0.012)
        );
      }
    }
    return group(
      // Wheels: tyre rings + hubs + spokes.
      mesh(new THREE.TorusGeometry(0.42, 0.05, 8, 20), rear[0], rear[1], 0),
      mesh(new THREE.TorusGeometry(0.42, 0.05, 8, 20), front[0], front[1], 0),
      mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 8), rear[0], rear[1], 0, Math.PI / 2, 0, 0),
      mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 8), front[0], front[1], 0, Math.PI / 2, 0, 0),
      ...spokes,
      // Diamond frame, joint to joint.
      strut(bb, seatTop, 0.045),
      strut(seatTop, headTop, 0.045),
      strut(bb, headBottom, 0.045),
      strut(headTop, headBottom, 0.055),
      // Fork, chainstay, seatstay.
      strut(headBottom, front, 0.032),
      strut(bb, rear, 0.028),
      strut(seatTop, rear, 0.028),
      // Seat post + saddle.
      strut(seatTop, [-0.44, 0.56, 0], 0.03),
      mesh(new THREE.BoxGeometry(0.34, 0.06, 0.08), -0.46, 0.58, 0),
      // Stem + handlebar (bar runs across, along z) with grips.
      strut(headTop, [0.46, 0.52, 0], 0.035),
      mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.34, 8), 0.46, 0.52, 0, Math.PI / 2, 0, 0),
      mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.08, 8), 0.46, 0.52, 0.15, Math.PI / 2, 0, 0, DARK),
      mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.08, 8), 0.46, 0.52, -0.15, Math.PI / 2, 0, 0, DARK),
      // Crank: chainring + two arms + pedals.
      mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 12), bb[0], bb[1], 0, Math.PI / 2, 0, 0, DARK),
      strut(bb, [0.11, -0.46, 0.06], 0.025),
      mesh(new THREE.BoxGeometry(0.14, 0.04, 0.06), 0.13, -0.48, 0.06),
      strut(bb, [-0.21, -0.14, -0.06], 0.025),
      mesh(new THREE.BoxGeometry(0.14, 0.04, 0.06), -0.23, -0.12, -0.06)
    );
  },
  anchor: () =>
    group(
      mesh(new THREE.TorusGeometry(0.16, 0.05, 8, 14), 0, 0.75, 0),
      mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.3, 8), 0, 0.1, 0),
      mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 8), 0, 0.35, 0, 0, 0, Math.PI / 2),
      mesh(new THREE.ConeGeometry(0.28, 0.5, 4), -0.55, -0.55, 0, 0, 0, 0.9),
      mesh(new THREE.ConeGeometry(0.28, 0.5, 4), 0.55, -0.55, 0, 0, 0, -0.9)
    ),
  guitar: () =>
    group(
      mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.18, 16), -0.35, -0.25, 0, Math.PI / 2, 0, 0),
      mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.18, 16), -0.35, 0.35, 0, Math.PI / 2, 0, 0),
      mesh(new THREE.BoxGeometry(0.18, 1.1, 0.12), 0.15, 0.45, 0, 0, 0, -0.35),
      mesh(new THREE.BoxGeometry(0.22, 0.35, 0.12), 0.55, 0.85, 0, 0, 0, -0.35),
      mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 12), -0.35, 0.05, 0.12, Math.PI / 2, 0, 0, DARK)
    ),
  lighthouse: () =>
    group(
      mesh(new THREE.CylinderGeometry(0.3, 0.42, 1.3, 10), 0, -0.1, 0),
      mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.18, 10), 0, 0.62, 0, 0, 0, 0, DARK),
      mesh(new THREE.ConeGeometry(0.4, 0.3, 10), 0, 0.85, 0),
      mesh(new THREE.BoxGeometry(0.2, 0.16, 0.05), 0, 0.25, 0.4, 0, 0, 0, DARK),
      mesh(new THREE.BoxGeometry(0.2, 0.16, 0.05), 0, -0.25, 0.4, 0, 0, 0, DARK)
    ),
  windmill: () =>
    group(
      mesh(new THREE.CylinderGeometry(0.3, 0.45, 1.4, 4), 0, -0.15, 0, 0, Math.PI / 4, 0),
      mesh(new THREE.ConeGeometry(0.42, 0.3, 4), 0, 0.7, 0, 0, Math.PI / 4, 0),
      mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.12, 8), 0, 0.45, 0.42, Math.PI / 2, 0, 0),
      mesh(new THREE.BoxGeometry(0.14, 0.9, 0.04), 0, 0.45, 0.48),
      mesh(new THREE.BoxGeometry(0.9, 0.14, 0.04), 0, 0.45, 0.48)
    ),
  crown: () =>
    group(
      mesh(new THREE.CylinderGeometry(0.5, 0.45, 0.5, 12, 1, true), 0, -0.15, 0),
      mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 12), 0, -0.42, 0),
      mesh(new THREE.ConeGeometry(0.14, 0.45, 6), -0.35, 0.3, 0.25),
      mesh(new THREE.ConeGeometry(0.14, 0.45, 6), 0.35, 0.3, 0.25),
      mesh(new THREE.ConeGeometry(0.14, 0.5, 6), 0, 0.35, -0.3),
      mesh(new THREE.SphereGeometry(0.07, 8, 8), -0.35, 0.55, 0.25),
      mesh(new THREE.SphereGeometry(0.07, 8, 8), 0.35, 0.55, 0.25),
      mesh(new THREE.SphereGeometry(0.07, 8, 8), 0, 0.62, -0.3)
    ),
  chair: () =>
    group(
      mesh(new THREE.BoxGeometry(0.9, 0.1, 0.85), 0, -0.1, 0),
      mesh(new THREE.BoxGeometry(0.85, 0.95, 0.1), 0, 0.45, -0.4),
      mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8), -0.38, -0.55, 0.35),
      mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8), 0.38, -0.55, 0.35),
      mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8), -0.38, -0.55, -0.35),
      mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8), 0.38, -0.55, -0.35)
    ),
  kettle: () =>
    group(
      scaled(mesh(new THREE.SphereGeometry(0.5, 14, 10), 0, -0.05, 0), 1, 0.95, 1),
      mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.65, 8), -0.6, 0.3, 0, 0, 0, 0.8),
      mesh(new THREE.TorusGeometry(0.26, 0.06, 8, 12, Math.PI), 0.55, 0.05, 0, 0, 0, -Math.PI / 2),
      mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.12, 10), 0, 0.45, 0),
      mesh(new THREE.SphereGeometry(0.08, 8, 8), 0, 0.56, 0)
    ),
  headphones: () =>
    group(
      mesh(new THREE.TorusGeometry(0.55, 0.07, 8, 16, Math.PI), 0, 0.05, 0),
      mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.28, 12), -0.58, -0.15, 0, 0, 0, Math.PI / 2),
      mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.28, 12), 0.58, -0.15, 0, 0, 0, Math.PI / 2),
      mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 12), -0.72, -0.15, 0, 0, 0, Math.PI / 2, DARK),
      mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 12), 0.72, -0.15, 0, 0, 0, Math.PI / 2, DARK)
    ),
  turtle: () =>
    group(
      scaled(mesh(new THREE.SphereGeometry(0.6, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0, 0.1, 0), 1.15, 0.75, 1),
      mesh(new THREE.SphereGeometry(0.22, 10, 8), 0.75, 0.05, 0),
      mesh(new THREE.SphereGeometry(0.05, 8, 8), 0.9, 0.15, 0.12, 0, 0, 0, DARK),
      mesh(new THREE.SphereGeometry(0.05, 8, 8), 0.9, 0.15, -0.12, 0, 0, 0, DARK),
      mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.3, 8), -0.45, -0.35, 0.3),
      mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.3, 8), -0.45, -0.35, -0.3),
      mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.3, 8), 0.4, -0.35, 0.3),
      mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.3, 8), 0.4, -0.35, -0.3),
      mesh(new THREE.ConeGeometry(0.12, 0.3, 8), -0.78, 0, 0, 0, 0, Math.PI / 2)
    ),
  'watering-can': () =>
    group(
      mesh(new THREE.CylinderGeometry(0.42, 0.38, 0.8, 12), 0, 0, 0),
      mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.9, 8), -0.7, 0.35, 0, 0, 0, 0.9),
      mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.22, 10), -1.05, 0.68, 0, 0, 0, 0.9),
      mesh(new THREE.TorusGeometry(0.26, 0.06, 8, 12, Math.PI), 0.5, 0.25, 0, 0, 0, -Math.PI / 2),
      mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.1, 10), 0, 0.44, 0)
    ),
  camera: () =>
    group(
      mesh(new THREE.BoxGeometry(1.15, 0.72, 0.45), 0, 0, 0),
      mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.3, 14), 0, -0.05, 0.32, Math.PI / 2, 0, 0),
      mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 14), 0, -0.05, 0.48, Math.PI / 2, 0, 0, DARK),
      mesh(new THREE.BoxGeometry(0.4, 0.18, 0.3), 0, 0.44, 0),
      mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 8), 0.45, 0.4, 0),
      mesh(new THREE.BoxGeometry(0.18, 0.12, 0.05), -0.42, 0.28, 0.24, 0, 0, 0, DARK)
    ),
  sailboat: () =>
    group(
      mesh(new THREE.BoxGeometry(1.3, 0.3, 0.45), 0, -0.55, 0),
      mesh(new THREE.ConeGeometry(0.32, 0.6, 4), 0.85, -0.55, 0, 0, 0, -Math.PI / 2),
      mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.5, 8), 0.05, 0.25, 0),
      scaled(mesh(new THREE.CylinderGeometry(0, 0.55, 0.95, 3, 1), 0.32, 0.45, 0), 1, 1, 0.08),
      scaled(mesh(new THREE.CylinderGeometry(0, 0.4, 0.8, 3, 1), -0.28, 0.35, 0), 1, 1, 0.08),
      mesh(new THREE.BoxGeometry(0.18, 0.12, 0.04), 0.05, 1.02, 0, 0, 0, 0.4)
    ),
  robot: () =>
    group(
      mesh(new THREE.BoxGeometry(0.75, 0.8, 0.5), 0, -0.15, 0),
      mesh(new THREE.BoxGeometry(0.55, 0.42, 0.45), 0, 0.5, 0),
      mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 6), 0, 0.85, 0),
      mesh(new THREE.SphereGeometry(0.07, 8, 8), 0, 1.02, 0),
      mesh(new THREE.SphereGeometry(0.06, 8, 8), -0.14, 0.55, 0.24, 0, 0, 0, DARK),
      mesh(new THREE.SphereGeometry(0.06, 8, 8), 0.14, 0.55, 0.24, 0, 0, 0, DARK),
      mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.6, 8), -0.48, -0.15, 0),
      mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.6, 8), 0.48, -0.15, 0),
      mesh(new THREE.BoxGeometry(0.22, 0.35, 0.22), -0.18, -0.72, 0),
      mesh(new THREE.BoxGeometry(0.22, 0.35, 0.22), 0.18, -0.72, 0)
    ),
  castle: () =>
    group(
      mesh(new THREE.BoxGeometry(1.35, 0.75, 1.0), 0, -0.45, 0),
      mesh(new THREE.CylinderGeometry(0.28, 0.32, 1.35, 10), -0.55, 0.05, 0.4),
      mesh(new THREE.CylinderGeometry(0.28, 0.32, 1.35, 10), 0.55, 0.05, 0.4),
      mesh(new THREE.ConeGeometry(0.34, 0.4, 10), -0.55, 0.92, 0.4),
      mesh(new THREE.ConeGeometry(0.34, 0.4, 10), 0.55, 0.92, 0.4),
      mesh(new THREE.BoxGeometry(0.5, 0.9, 0.6), 0, 0.1, -0.15),
      mesh(new THREE.BoxGeometry(0.24, 0.4, 0.06), 0, -0.55, 0.38, 0, 0, 0, DARK),
      mesh(new THREE.BoxGeometry(0.16, 0.16, 0.06), -0.35, -0.2, 0.51, 0, 0, 0, DARK),
      mesh(new THREE.BoxGeometry(0.16, 0.16, 0.06), 0.35, -0.2, 0.51, 0, 0, 0, DARK)
    ),
  hammer: () =>
    group(
      mesh(new THREE.BoxGeometry(0.72, 0.26, 0.26), 0, 0.72, 0),
      mesh(new THREE.ConeGeometry(0.16, 0.35, 4), -0.5, 0.72, 0, 0, 0, Math.PI / 2),
      mesh(new THREE.CylinderGeometry(0.07, 0.08, 1.35, 8), 0, 0, 0),
      mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.1, 8), 0, -0.7, 0, 0, 0, 0, DARK)
    ),
  dragonfly: () =>
    group(
      mesh(new THREE.CylinderGeometry(0.07, 0.05, 1.3, 8), 0, 0, 0, 0, 0, Math.PI / 2),
      mesh(new THREE.SphereGeometry(0.16, 10, 8), 0.72, 0, 0),
      mesh(new THREE.SphereGeometry(0.05, 8, 8), 0.82, 0.08, 0.1, 0, 0, 0, DARK),
      mesh(new THREE.SphereGeometry(0.05, 8, 8), 0.82, 0.08, -0.1, 0, 0, 0, DARK),
      mesh(new THREE.BoxGeometry(0.85, 0.02, 0.28), -0.15, 0.12, 0.42, 0, 0.35, 0),
      mesh(new THREE.BoxGeometry(0.85, 0.02, 0.28), -0.15, 0.12, -0.42, 0, -0.35, 0),
      mesh(new THREE.BoxGeometry(0.7, 0.02, 0.24), -0.25, -0.1, 0.38, 0, -0.3, 0),
      mesh(new THREE.BoxGeometry(0.7, 0.02, 0.24), -0.25, -0.1, -0.38, 0, 0.3, 0)
    ),
  crane: () =>
    group(
      mesh(new THREE.BoxGeometry(0.9, 0.22, 0.7), 0, -0.85, 0),
      mesh(new THREE.BoxGeometry(0.18, 1.5, 0.18), -0.25, 0, 0),
      mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), -0.25, 0.3, 0),
      mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), -0.25, -0.3, 0),
      mesh(new THREE.BoxGeometry(1.7, 0.14, 0.14), 0.35, 0.78, 0),
      mesh(new THREE.BoxGeometry(0.5, 0.14, 0.14), -0.75, 0.78, 0),
      mesh(new THREE.BoxGeometry(0.3, 0.3, 0.2), -0.95, 0.6, 0),
      mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.55, 6), 0.95, 0.45, 0),
      mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), 0.95, 0.1, 0)
    ),
  rocket: () =>
    group(
      mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.0, 12), 0, 0, 0),
      mesh(new THREE.ConeGeometry(0.32, 0.55, 12), 0, 0.77, 0),
      mesh(new THREE.BoxGeometry(0.06, 0.5, 0.4), -0.32, -0.45, 0),
      mesh(new THREE.BoxGeometry(0.06, 0.5, 0.4), 0.32, -0.45, 0),
      mesh(new THREE.BoxGeometry(0.4, 0.5, 0.06), 0, -0.45, -0.32),
      mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.08, 12), 0, 0.15, 0.3, Math.PI / 2, 0, 0, DARK),
      mesh(new THREE.ConeGeometry(0.2, 0.45, 8), 0, -0.72, 0, Math.PI, 0, 0)
    ),
  violin: () =>
    group(
      mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.16, 16), -0.1, -0.4, 0, Math.PI / 2, 0, 0),
      mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.16, 16), -0.1, 0.2, 0, Math.PI / 2, 0, 0),
      mesh(new THREE.BoxGeometry(0.16, 1.15, 0.1), 0.28, 0.55, 0, 0, 0, -0.42),
      mesh(new THREE.BoxGeometry(0.2, 0.3, 0.1), 0.62, 1.0, 0, 0, 0, -0.42),
      mesh(new THREE.SphereGeometry(0.09, 8, 8), 0.68, 1.16, 0),
      mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 12), -0.1, -0.2, 0.1, Math.PI / 2, 0, 0, DARK),
      mesh(new THREE.BoxGeometry(0.3, 0.05, 0.05), -0.1, -0.05, 0.1)
    ),
};

export function buildObject(objectId: string): THREE.Group {
  const builder = builders[objectId];
  if (!builder) throw new Error(`Unknown Shadowline object: ${objectId}`);
  const g = builder();
  // Normalise: centre the group on the origin and scale to ~2.2 units tall
  // so the object fills the stage (was 1.9 — read too small on mobile).
  const box = new THREE.Box3().setFromObject(g);
  const size = new THREE.Vector3();
  box.getSize(size);
  const centre = new THREE.Vector3();
  box.getCenter(centre);
  g.position.sub(centre);
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  g.scale.setScalar(2.2 / maxDim);
  return g;
}
