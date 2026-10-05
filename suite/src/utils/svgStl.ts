/**
 * SVG -> STL for NinjaSVG (the svg2stl converter from SVG Tweak, rebuilt on
 * three.js's SVGLoader). This module is only ever loaded with a dynamic
 * import(), so three.js is downloaded the first time someone builds a model.
 */
import {
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  DirectionalLight,
  ExtrudeGeometry,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface StlOptions {
  /** Height of the raised shapes, mm. */
  depth: number;
  /** Base plate thickness under everything, mm (0 = no plate). */
  base: number;
  /** Final model width, mm. */
  width: number;
  /** Segments per curve: higher is smoother and heavier. */
  curve: number;
  /** Ignore fills and build only from strokes (outlines). */
  outlinesOnly: boolean;
}

export const DEFAULT_STL: StlOptions = {
  depth: 3,
  base: 1,
  width: 60,
  curve: 12,
  outlinesOnly: false,
};

export interface StlModel {
  /** 9 floats per triangle (x,y,z for three corners), counter-clockwise. */
  triangles: Float32Array;
  size: { x: number; y: number; z: number };
  count: number;
}

type Tri = number[];

function trianglesOf(geometry: BufferGeometry): Tri {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  const pos = g.getAttribute('position');
  const out: Tri = [];
  for (let i = 0; i < pos.count; i++) out.push(pos.getX(i), pos.getY(i), pos.getZ(i));
  if (g !== geometry) g.dispose();
  return out;
}

/** Extrude a flat (z = 0) triangle mesh into a solid from z = 0 to z = 1. */
function extrudeFlat(geometry: BufferGeometry): Tri {
  const flat = trianglesOf(geometry);
  const out: Tri = [];
  const edges = new Map<string, { a: [number, number]; b: [number, number]; n: number }>();
  const key = (x: number, y: number) => `${x.toFixed(4)},${y.toFixed(4)}`;
  for (let i = 0; i < flat.length; i += 9) {
    let a: [number, number] = [flat[i], flat[i + 1]];
    let b: [number, number] = [flat[i + 3], flat[i + 4]];
    const c: [number, number] = [flat[i + 6], flat[i + 7]];
    const area = (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);
    if (Math.abs(area) < 1e-9) continue;
    if (area < 0) [a, b] = [b, a];
    out.push(a[0], a[1], 1, b[0], b[1], 1, c[0], c[1], 1);
    out.push(a[0], a[1], 0, c[0], c[1], 0, b[0], b[1], 0);
    for (const [p, q] of [
      [a, b],
      [b, c],
      [c, a],
    ] as const) {
      const fwd = `${key(...p)}>${key(...q)}`;
      const back = `${key(...q)}>${key(...p)}`;
      const twin = edges.get(back);
      if (twin) twin.n++;
      else edges.set(fwd, { a: p, b: q, n: (edges.get(fwd)?.n ?? 0) });
    }
  }
  for (const { a, b, n } of edges.values()) {
    if (n) continue;
    out.push(a[0], a[1], 0, b[0], b[1], 0, b[0], b[1], 1);
    out.push(a[0], a[1], 0, b[0], b[1], 1, a[0], a[1], 1);
  }
  return out;
}

function box(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): Tri {
  const v = (x: number, y: number, z: number) => [x, y, z];
  const p = [
    v(x0, y0, z0), v(x1, y0, z0), v(x1, y1, z0), v(x0, y1, z0),
    v(x0, y0, z1), v(x1, y0, z1), v(x1, y1, z1), v(x0, y1, z1),
  ];
  const faces = [
    [0, 2, 1], [0, 3, 2], // bottom
    [4, 5, 6], [4, 6, 7], // top
    [0, 1, 5], [0, 5, 4], // front
    [1, 2, 6], [1, 6, 5], // right
    [2, 3, 7], [2, 7, 6], // back
    [3, 0, 4], [3, 4, 7], // left
  ];
  return faces.flatMap((f) => f.flatMap((i) => p[i]));
}

const visible = (paint: unknown) =>
  typeof paint === 'string' && paint !== 'none' && paint !== 'transparent';

/** Build a printable mesh from SVG markup. Throws when nothing can be built. */
export function buildModel(code: string, options: StlOptions): StlModel {
  const data = new SVGLoader().parse(code);
  const parts: Tri[] = [];
  for (const path of data.paths) {
    const style = (path.userData?.style ?? {}) as Record<string, unknown>;
    if (!options.outlinesOnly && visible(style.fill)) {
      for (const shape of path.toShapes()) {
        const g = new ExtrudeGeometry(shape, {
          depth: 1,
          bevelEnabled: false,
          curveSegments: Math.max(2, Math.round(options.curve)),
        });
        parts.push(trianglesOf(g));
        g.dispose();
      }
    }
    if (visible(style.stroke) && Number(style.strokeWidth ?? 1) > 0) {
      for (const sub of path.subPaths) {
        const points = sub.getPoints(Math.max(2, Math.round(options.curve)));
        const g = SVGLoader.pointsToStroke(points, style as never);
        if (g) {
          parts.push(extrudeFlat(g));
          g.dispose();
        }
      }
    }
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const t of parts)
    for (let i = 0; i < t.length; i += 3) {
      minX = Math.min(minX, t[i]);
      maxX = Math.max(maxX, t[i]);
      minY = Math.min(minY, t[i + 1]);
      maxY = Math.max(maxY, t[i + 1]);
    }
  if (!parts.length || !Number.isFinite(minX) || maxX - minX <= 0)
    throw new Error('Nothing in this drawing can be made 3D. Fills and outlines are used; text and embedded images are not.');
  const s = options.width / (maxX - minX);
  const depth = Math.max(0.01, options.depth);
  const base = Math.max(0, options.base);
  const out: number[] = [];
  for (const t of parts) {
    for (let i = 0; i < t.length; i += 9) {
      // SVG's y axis points down; flipping it mirrors the winding, so swap two corners.
      const corner = (j: number) => [
        (t[i + j] - minX) * s,
        (maxY - t[i + j + 1]) * s,
        base + t[i + j + 2] * depth,
      ];
      out.push(...corner(0), ...corner(6), ...corner(3));
    }
  }
  const w = (maxX - minX) * s;
  const h = (maxY - minY) * s;
  if (base > 0) {
    const m = Math.max(1, Math.min(w, h) * 0.04);
    out.push(...box(-m, -m, 0, w + m, h + m, base + 0.01));
  }
  const triangles = new Float32Array(out);
  return {
    triangles,
    count: triangles.length / 9,
    size: { x: w, y: h, z: base + depth },
  };
}

/** Binary STL: 80-byte header, triangle count, then 50 bytes per triangle. */
export function stlBlob(model: StlModel) {
  const t = model.triangles;
  const buffer = new ArrayBuffer(84 + model.count * 50);
  const view = new DataView(buffer);
  const header = 'NinjaSVG binary STL';
  for (let i = 0; i < header.length; i++) view.setUint8(i, header.charCodeAt(i));
  view.setUint32(80, model.count, true);
  let o = 84;
  for (let i = 0; i < t.length; i += 9) {
    const ux = t[i + 3] - t[i], uy = t[i + 4] - t[i + 1], uz = t[i + 5] - t[i + 2];
    const vx = t[i + 6] - t[i], vy = t[i + 7] - t[i + 1], vz = t[i + 8] - t[i + 2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len; ny /= len; nz /= len;
    for (const n of [nx, ny, nz]) { view.setFloat32(o, n, true); o += 4; }
    for (let j = 0; j < 9; j++) { view.setFloat32(o, t[i + j], true); o += 4; }
    view.setUint16(o, 0, true);
    o += 2;
  }
  return new Blob([buffer], { type: 'model/stl' });
}

/** Show the model with orbit controls. Returns a cleanup function. */
export function mountViewer(container: HTMLElement, model: StlModel, color: string) {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  const width = () => Math.max(1, container.clientWidth);
  const height = () => Math.max(1, container.clientHeight);
  renderer.setSize(width(), height());
  renderer.domElement.setAttribute('aria-label', '3D model preview. Drag to rotate, scroll or pinch to zoom.');
  container.appendChild(renderer.domElement);

  const scene = new Scene();
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(model.triangles, 3));
  geometry.computeVertexNormals();
  geometry.translate(-model.size.x / 2, -model.size.y / 2, -model.size.z / 2);
  const material = new MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05, flatShading: true });
  const mesh = new Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 3;
  scene.add(mesh);
  scene.add(new AmbientLight(0xffffff, 0.9));
  const key = new DirectionalLight(0xffffff, 1.6);
  key.position.set(1, 2, 3);
  scene.add(key);
  const fill = new DirectionalLight(0xffffff, 0.5);
  fill.position.set(-2, -1, 1);
  scene.add(fill);

  const camera = new PerspectiveCamera(40, width() / height(), 0.1, 10000);
  const radius = Math.max(model.size.x, model.size.y, model.size.z);
  camera.position.set(0, 0, radius * 1.9);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  let frame = 0;
  const loop = () => {
    frame = requestAnimationFrame(loop);
    controls.update();
    renderer.render(scene, camera);
  };
  loop();
  const resize = new ResizeObserver(() => {
    camera.aspect = width() / height();
    camera.updateProjectionMatrix();
    renderer.setSize(width(), height());
  });
  resize.observe(container);
  return () => {
    cancelAnimationFrame(frame);
    resize.disconnect();
    controls.dispose();
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}
