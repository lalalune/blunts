// Geometry ported from prototype/index.html. No prototype payment logic is included.
import * as THREE from "three";
export function createTrayScene(canvas, host, moneyCanvas) {
  const vis = { stash: 0, fill: 0 };
  const rand = (a, b) => a + Math.random() * (b - a);
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = (a, b, x) => {
    const t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  const easeIO = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const lin = (hex) => new THREE.Color(hex);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "low-power",
  });
  const gl = renderer.getContext();
  const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
  const softwareGPU =
    debugInfo &&
    /swiftshader|llvmpipe|software/i.test(
      gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
    );
  const pixelRatio = softwareGPU
    ? 0.65
    : Math.min(2, window.devicePixelRatio || 1);
  renderer.setPixelRatio(pixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0c0806, 14, 26);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  const camTarget = new THREE.Vector3(0, 0.25, 0.05);
  const camDir = new THREE.Vector3(0, 0.95, 1).normalize();
  let camDist = 10;

  scene.add(new THREE.HemisphereLight(0xffe3bd, 0x1a0e06, 0.65));
  const key = new THREE.DirectionalLight(0xffd7a3, 2.0);
  key.position.set(2.5, 6, 3.5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x8fb0ff, 0.55);
  rim.position.set(-3, 2.5, -5);
  scene.add(rim);
  const fillL = new THREE.PointLight(0xffc27a, 1.1, 6, 2);
  fillL.position.set(0, 1.4, 0.4);
  scene.add(fillL);
  const troughL = new THREE.SpotLight(0xfff0d0, 2.2, 7, 0.55, 0.6, 1.5);
  troughL.position.set(0, 2.6, 1.6);
  troughL.target.position.set(0, 0.2, -0.45);
  scene.add(troughL, troughL.target);
  const emberLight = new THREE.PointLight(0xff6a2b, 0, 4, 2);
  scene.add(emberLight);

  /* ================= TEXTURES ================= */
  function canvasTex(w, h, draw) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d"), w, h);
    const t = new THREE.CanvasTexture(c);
    return t;
  }
  function makeLeaf() {
    return canvasTex(1024, 512, (g, w, h) => {
      const grd = g.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, "#3e2310");
      grd.addColorStop(0.35, "#5a3418");
      grd.addColorStop(0.6, "#63391b");
      grd.addColorStop(1, "#3a200e");
      g.fillStyle = grd;
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 2600; i++) {
        g.fillStyle = `rgba(${rand(40, 75) | 0},${rand(22, 42) | 0},${rand(8, 20) | 0},${rand(0.05, 0.2)})`;
        g.beginPath();
        g.ellipse(
          rand(0, w),
          rand(0, h),
          rand(4, 46),
          rand(2, 12),
          rand(0, 3),
          0,
          7,
        );
        g.fill();
      }
      for (let i = 0; i < 1600; i++) {
        g.fillStyle = `rgba(${rand(170, 210) | 0},${rand(120, 150) | 0},${rand(70, 95) | 0},${rand(0.03, 0.1)})`;
        g.beginPath();
        g.ellipse(
          rand(0, w),
          rand(0, h),
          rand(3, 18),
          rand(1, 5),
          rand(0, 3),
          0,
          7,
        );
        g.fill();
      }
      g.lineCap = "round";
      for (let i = 0; i < 16; i++) {
        const x0 = rand(-300, w),
          a = rand(0.2, 0.45);
        g.strokeStyle = `rgba(196,140,84,${a})`;
        g.lineWidth = rand(1.2, 3);
        g.beginPath();
        g.moveTo(x0, -10);
        const cx1 = x0 + rand(40, 90),
          cx2 = x0 + rand(90, 200),
          ex = x0 + rand(180, 300);
        g.bezierCurveTo(cx1, h * 0.3, cx2, h * 0.7, ex, h + 10);
        g.stroke();
        for (let j = 0; j < 10; j++) {
          const t = rand(0, 1);
          const px = lerp(x0, ex, t),
            py = t * h;
          g.lineWidth = rand(0.5, 1.2);
          g.strokeStyle = `rgba(214,172,118,${a * 0.6})`;
          g.beginPath();
          g.moveTo(px, py);
          g.quadraticCurveTo(
            px + rand(20, 50),
            py + rand(-15, 15),
            px + rand(40, 110),
            py + rand(-40, 40),
          );
          g.stroke();
        }
      }
      for (let i = 0; i < 900; i++) {
        g.strokeStyle = `rgba(30,14,4,${rand(0.05, 0.16)})`;
        g.lineWidth = rand(0.4, 1.1);
        const x = rand(0, w),
          y = rand(0, h);
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + rand(10, 50), y + rand(-4, 4));
        g.stroke();
      }
    });
  }
  function makeDollar() {
    return canvasTex(256, 256, (g, w, h) => {
      const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      r.addColorStop(0, "rgba(255,214,110,.75)");
      r.addColorStop(0.3, "rgba(255,180,60,.28)");
      r.addColorStop(1, "rgba(255,160,40,0)");
      g.fillStyle = r;
      g.fillRect(0, 0, w, h);
      g.font = "900 150px Figtree, Arial Black, sans-serif";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.shadowColor = "rgba(255,190,70,1)";
      g.shadowBlur = 30;
      g.fillStyle = "#FFE7A6";
      g.fillText("$", w / 2, h / 2 + 8);
      g.shadowBlur = 0;
      g.fillStyle = "#FFF6D8";
      g.fillText("$", w / 2, h / 2 + 8);
    });
  }
  function makeSpark() {
    return canvasTex(128, 128, (g, w, h) => {
      const c = w / 2;
      const r = g.createRadialGradient(c, c, 0, c, c, c);
      r.addColorStop(0, "rgba(255,250,220,1)");
      r.addColorStop(0.15, "rgba(255,220,130,.6)");
      r.addColorStop(1, "rgba(255,200,90,0)");
      g.fillStyle = r;
      g.fillRect(0, 0, w, h);
      g.fillStyle = "rgba(255,248,220,1)";
      g.beginPath();
      g.moveTo(c, 4);
      g.quadraticCurveTo(c, c, w - 4, c);
      g.quadraticCurveTo(c, c, c, h - 4);
      g.quadraticCurveTo(c, c, 4, c);
      g.quadraticCurveTo(c, c, c, 4);
      g.fill();
    });
  }
  function makeSoft(inner, outer) {
    return canvasTex(128, 128, (g, w) => {
      const c = w / 2;
      const r = g.createRadialGradient(c, c, 0, c, c, c);
      r.addColorStop(0, inner);
      r.addColorStop(1, outer);
      g.fillStyle = r;
      g.fillRect(0, 0, w, w);
    });
  }
  function makeSmoke() {
    return canvasTex(128, 128, (g, w) => {
      const c = w / 2;
      for (let i = 0; i < 26; i++) {
        const x = c + rand(-26, 26),
          y = c + rand(-26, 26),
          rr = rand(18, 40);
        const r = g.createRadialGradient(x, y, 0, x, y, rr);
        r.addColorStop(0, "rgba(210,205,200,.16)");
        r.addColorStop(1, "rgba(210,205,200,0)");
        g.fillStyle = r;
        g.fillRect(0, 0, w, w);
      }
    });
  }
  function makeTrayFloor() {
    return canvasTex(1024, 900, (g, w, h) => {
      g.fillStyle = "#17100b";
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 1400; i++) {
        g.strokeStyle = `rgba(255,220,170,${rand(0.01, 0.035)})`;
        g.lineWidth = 1;
        const y = rand(0, h);
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(w, y + rand(-2, 2));
        g.stroke();
      }
      g.strokeStyle = "rgba(245,196,81,.28)";
      g.lineWidth = 3;
      g.strokeRect(34, 34, w - 68, h - 68);
      g.strokeStyle = "rgba(245,196,81,.12)";
      g.lineWidth = 1.5;
      g.strokeRect(48, 48, w - 96, h - 96);
      g.font = "64px Bungee, Arial Black, sans-serif";
      g.textAlign = "center";
      g.fillStyle = "rgba(245,196,81,.13)";
      g.fillText("BLUNTS", w / 2, h * 0.54);
    });
  }

  /* ================= GEOMETRY CONSTANTS ================= */
  const L = 2.2,
    HL = L / 2,
    R0 = 0.19,
    W0 = 2 * Math.PI * R0 * 1.22;
  const TH_OPEN = 2.35,
    TH_FULL = 2 * Math.PI * 1.22;
  const taper = (t) => 0.9 + 0.2 * t;
  const FLOOR = 0.09;
  const TILT = 0.36,
    LIFT = 0.24;
  function setTilt(k) {
    inner.rotation.x = TILT * k;
    inner.position.y = -R0 + 0.012 + LIFT * k;
  }
  const HOME = new THREE.Vector3(0, FLOOR + R0, -0.48);
  const STASH_Z = 0.72,
    STASH_S = 0.3;

  let leafTex, leafMat, dollarTex, sparkTex, glowTex, smokeTex, dotTex, ashTex;

  /* ================= BUILD ================= */
  let sheetGeo,
    sheet,
    pivot,
    inner,
    qDots = [];
  const NX = 80,
    NV = 44;
  const crinkle = new Float32Array((NX + 1) * (NV + 1)).map(
    () => (Math.random() - 0.5) * 0.007,
  );
  function buildSheet() {
    const g = new THREE.BufferGeometry();
    const n = (NX + 1) * (NV + 1);
    const pos = new Float32Array(n * 3),
      uv = new Float32Array(n * 2),
      idx = [];
    for (let ix = 0; ix <= NX; ix++)
      for (let iv = 0; iv <= NV; iv++) {
        const k = ix * (NV + 1) + iv;
        uv[k * 2] = ix / NX;
        uv[k * 2 + 1] = iv / NV;
      }
    for (let ix = 0; ix < NX; ix++)
      for (let iv = 0; iv < NV; iv++) {
        const a = ix * (NV + 1) + iv,
          b = a + NV + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    g.setIndex(idx);
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    return g;
  }
  function shapeSheet(c) {
    const e = easeIO(clamp(c, 0, 1));
    const th = lerp(TH_OPEN, TH_FULL, e);
    const p = sheetGeo.attributes.position.array;
    for (let ix = 0; ix <= NX; ix++) {
      const t = ix / NX,
        x = -HL + t * L,
        tp = taper(t),
        R = (W0 * tp) / th;
      const pinch = 1 - 0.55 * e * smooth(0.84, 1, Math.abs(x) / HL);
      const edgeCurl = (1 - e) * 0.18;
      for (let iv = 0; iv <= NV; iv++) {
        const k = ix * (NV + 1) + iv,
          v = iv / NV;
        const phi =
          (v - 0.5) * th * (1 + edgeCurl * Math.pow(Math.abs(v - 0.5) * 2, 3));
        const rr =
          R * (1 + 0.1 * e * (v - 0.5)) * pinch + crinkle[k] * (1 - e * 0.7);
        p[k * 3] = x;
        p[k * 3 + 1] = R - rr * Math.cos(phi);
        p[k * 3 + 2] = rr * Math.sin(phi);
      }
    }
    sheetGeo.attributes.position.needsUpdate = true;
    sheetGeo.computeVertexNormals();
  }
  let curl = 0;

  /* pile slots */
  const NS = 1800;
  const slot = {
    type: new Uint8Array(NS),
    idx: new Uint16Array(NS),
    x: new Float32Array(NS),
    y: new Float32Array(NS),
    z: new Float32Array(NS),
    s: new Float32Array(NS * 3),
    q: [],
    state: new Uint8Array(NS),
    px: new Float32Array(NS),
    py: new Float32Array(NS),
    pz: new Float32Array(NS),
    vy: new Float32Array(NS),
    spin: [],
    ang: new Float32Array(NS),
    t0: new Float32Array(NS),
  };
  let spawned = 0,
    landed = 0;
  function buildSlots() {
    for (let i = 0; i < NS; i++) {
      const f = (i + Math.random()) / NS;
      const x = -0.97 + 1.94 * f + rand(-0.02, 0.02);
      const tp = taper((x + HL) / L),
        r = R0 * tp;
      const zw = 0.13 * tp,
        z = rand(-1, 1) * zw * Math.sqrt(Math.random());
      const base = r - Math.sqrt(Math.max(0, r * r - z * z));
      const h = 0.3 * tp * (1 - Math.pow(z / zw, 2));
      let y = base + 0.012 + h * Math.pow(Math.random(), 0.75);
      y = Math.min(
        y,
        r + Math.sqrt(Math.max(0, Math.pow(r * 0.86, 2) - z * z)),
      );
      slot.x[i] = x;
      slot.y[i] = y;
      slot.z[i] = z;
      const r2 = Math.random();
      let t = 0;
      for (let a = 0, acc = 0; a < FLAKE_TYPES.length; a++) {
        acc += FLAKE_TYPES[a].p;
        if (r2 < acc) {
          t = a;
          break;
        }
      }
      const T = FLAKE_TYPES[t];
      slot.type[i] = t;
      slot.idx[i] = T.n++;
      const sz = rand(T.s[0], T.s[1]),
        sq = T.squash ? 1 : 0;
      slot.s[i * 3] = sz * rand(0.85, 1.2);
      slot.s[i * 3 + 1] = sz * (sq ? rand(0.55, 0.9) : rand(0.85, 1.2));
      slot.s[i * 3 + 2] = sz * rand(0.85, 1.2);
      slot.q.push(
        new THREE.Quaternion().setFromEuler(
          new THREE.Euler(rand(0, 6), rand(0, 6), rand(0, 6)),
        ),
      );
      slot.spin.push(
        new THREE.Vector3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize(),
      );
    }
  }
  const dummy = new THREE.Object3D();
  function setSlotMatrix(i, x, y, z, q, sc = 1) {
    dummy.position.set(x, y, z);
    dummy.quaternion.copy(q);
    dummy.scale.set(
      slot.s[i * 3] * sc,
      slot.s[i * 3 + 1] * sc,
      slot.s[i * 3 + 2] * sc,
    );
    dummy.updateMatrix();
    pileMeshes[slot.type[i]].setMatrixAt(slot.idx[i], dummy.matrix);
  }
  const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
  function hideSlot(i) {
    pileMeshes[slot.type[i]].setMatrixAt(slot.idx[i], ZERO);
  }
  function flagPile() {
    pileMeshes.forEach((m) => (m.instanceMatrix.needsUpdate = true));
  }

  /* ground-weed pieces: angular crumbs with frost + pistils, crinkled leaf bits, orange hairs, stem bits */
  const FLAKE_TYPES = [
    { kind: "crumb", p: 0.2, s: [0.021, 0.034], squash: 1 },
    { kind: "crumb", p: 0.2, s: [0.018, 0.03], squash: 1 },
    { kind: "crumb", p: 0.16, s: [0.015, 0.025], squash: 1 },
    { kind: "leaf", p: 0.14, s: [0.03, 0.046] },
    { kind: "leaf", p: 0.14, s: [0.026, 0.04] },
    { kind: "hair", p: 0.1, s: [0.038, 0.055] },
    { kind: "stem", p: 0.06, s: [0.036, 0.06] },
  ].map((t) => Object.assign(t, { n: 0 }));
  const GREENS = [
    "#3d6419",
    "#4c7a1f",
    "#5c8a28",
    "#6a9a30",
    "#2f5214",
    "#7aa83a",
    "#557a2a",
  ];
  function paintFaces(g, pick) {
    const pos = g.attributes.position,
      c = new Float32Array(pos.count * 3);
    for (let f = 0; f < pos.count; f += 3) {
      const col = lin(pick());
      for (let k = 0; k < 3; k++) c.set([col.r, col.g, col.b], (f + k) * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(c, 3));
  }
  function crumbGeo() {
    let g = new THREE.DodecahedronGeometry(1, 0);
    if (g.index) g = g.toNonIndexed();
    const p = g.attributes.position,
      jit = new Map();
    for (let i = 0; i < p.count; i++) {
      const key =
        p.getX(i).toFixed(3) + p.getY(i).toFixed(3) + p.getZ(i).toFixed(3);
      if (!jit.has(key)) jit.set(key, rand(0.55, 1.3));
      const k = jit.get(key);
      p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k);
    }
    paintFaces(g, () => {
      const r = Math.random();
      return r < 0.09
        ? "#dfe8c6"
        : r < 0.17
          ? "#d9892f"
          : r < 0.21
            ? "#a6c86e"
            : GREENS[(Math.random() * GREENS.length) | 0];
    });
    g.computeVertexNormals();
    return g;
  }
  function leafGeo() {
    const sh = new THREE.Shape(),
      n = 16;
    for (let a = 0; a <= n; a++) {
      const ang = (a / n) * Math.PI * 2,
        r = (a % 2 ? 0.45 : 1) * rand(0.6, 1.1);
      const x = Math.cos(ang) * r,
        y = Math.sin(ang) * r * 0.7;
      a ? sh.lineTo(x, y) : sh.moveTo(x, y);
    }
    let g = new THREE.ShapeGeometry(sh);
    g = g.toNonIndexed();
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        y = p.getY(i);
      p.setZ(i, (x * x - y * y) * 0.35 + Math.sin(x * 6) * 0.06);
    }
    paintFaces(g, () => {
      const r = Math.random();
      return r < 0.05 ? "#cfe0a8" : GREENS[(Math.random() * GREENS.length) | 0];
    });
    g.computeVertexNormals();
    return g;
  }
  function hairGeo() {
    const pts = [];
    for (let k = 0; k <= 6; k++) {
      const t = k / 6;
      pts.push(
        new THREE.Vector3(
          t - 0.5,
          Math.sin(t * 5) * 0.15,
          Math.cos(t * 4) * 0.12,
        ),
      );
    }
    const g = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(pts),
      10,
      0.05,
      4,
      false,
    );
    const c = new Float32Array(g.attributes.position.count * 3);
    const col = lin("#e08a2e");
    for (let i = 0; i < c.length; i += 3) c.set([col.r, col.g, col.b], i);
    g.setAttribute("color", new THREE.BufferAttribute(c, 3));
    return g;
  }
  function stemGeo() {
    let g = new THREE.CylinderGeometry(0.09, 0.12, 1, 5, 1);
    g = g.toNonIndexed();
    g.rotateZ(Math.PI / 2);
    paintFaces(g, () => (Math.random() < 0.5 ? "#8c7a45" : "#6f7a3a"));
    g.computeVertexNormals();
    return g;
  }
  let pileMeshes = [];

  /* stash */
  let stashGroup, bluntLatheGeo;
  function buildLathe() {
    const pts = [];
    const N = 90;
    for (let s = 0; s <= N; s++) {
      const t = s / N,
        y = -HL + L * t;
      const pinch = 1 - 0.55 * smooth(0.84, 1, Math.abs(y) / HL);
      pts.push(new THREE.Vector2(Math.max(0.004, R0 * taper(t) * pinch), y));
    }
    const g = new THREE.LatheGeometry(pts, 48);
    g.rotateX(Math.PI / 2);
    return g;
  }
  function stashSlots(n) {
    const out = [];
    const bands = Math.floor(n / 10),
      loose = n % 10;
    const shownBands = Math.min(bands, 6);
    for (let b = 0; b < shownBands; b++) {
      const col = b % 2,
        lvl = Math.floor(b / 2),
        cx = -0.98 + col * 0.66;
      for (let j = 0; j < 10; j++) {
        const row = Math.floor(j / 5),
          i = j % 5;
        out.push({
          x: cx + (i - 2) * 0.118 + (row ? 0.059 : 0),
          y: FLOOR + 0.062 + row * 0.1 + lvl * 0.23,
          band: b,
          cx,
          cy: FLOOR + 0.11 + lvl * 0.23,
        });
      }
    }
    for (let k = 0; k < loose; k++)
      out.push({ x: 0.09 + k * 0.12, y: FLOOR + 0.062 });
    return { list: out, bands, shownBands };
  }
  /* Rubber band: a flat ribbon that follows the convex outline of the 10 blunt cross-sections,
   so it sits tight against the bundle. Outline = support function of the circles, sampled densely. */
  const BUNDLE_C = [];
  for (let j = 0; j < 10; j++) {
    const row = Math.floor(j / 5),
      i = j % 5;
    BUNDLE_C.push([(i - 2) * 0.118 + row * 0.059, -0.048 + row * 0.1]);
  }
  const BAND_DZ = [-0.13, 0.13];
  function bluntRadiusAt(dz) {
    const l = dz / STASH_S,
      t = (l + HL) / L;
    return R0 * taper(t) * STASH_S;
  }
  function bandGeometry(centers, r, width = 0.05, thick = 0.008, N = 220) {
    const pos = [],
      idx = [];
    for (let k = 0; k < N; k++) {
      const th = (k / N) * Math.PI * 2,
        ux = Math.cos(th),
        uy = Math.sin(th);
      let best = -1e9,
        c = centers[0];
      for (const cc of centers) {
        const d = cc[0] * ux + cc[1] * uy;
        if (d > best) {
          best = d;
          c = cc;
        }
      }
      const ri = r + 0.0012,
        ro = r + thick;
      for (const [rad, zz] of [
        [ri, -width / 2],
        [ri, width / 2],
        [ro, width / 2],
        [ro, -width / 2],
      ])
        pos.push(c[0] + ux * rad, c[1] + uy * rad, zz);
    }
    for (let k = 0; k < N; k++) {
      const a = k * 4,
        b = ((k + 1) % N) * 4;
      for (let f = 0; f < 4; f++) {
        const f2 = (f + 1) % 4;
        idx.push(a + f, b + f, a + f2, a + f2, b + f, b + f2);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }
  let bandGeos = null;
  const rubberMat = () =>
    new THREE.MeshStandardMaterial({
      color: lin("#b3281f"),
      roughness: 0.5,
      metalness: 0,
      side: THREE.DoubleSide,
      transparent: true,
    });
  let stashBlunts = [],
    stashBands = [];
  function rebuildStash(n, animateLastBand = false) {
    if (!bandGeos)
      bandGeos = BAND_DZ.map((dz) => bandGeometry(BUNDLE_C, bluntRadiusAt(dz)));
    stashGroup.traverse((o) => {
      if (o.isMesh && o.material !== leafMat) o.material.dispose();
    });
    stashGroup.clear();
    stashBlunts = [];
    stashBands = [];
    const { list, shownBands } = stashSlots(n);
    list.forEach((p, i) => {
      const m = new THREE.Mesh(bluntLatheGeo, leafMat);
      m.scale.setScalar(STASH_S);
      m.position.set(p.x, p.y, STASH_Z);
      m.rotation.z = (i * 1.7) % 6.28;
      stashGroup.add(m);
      stashBlunts.push(m);
    });
    for (let b = 0; b < shownBands; b++) {
      const p = list[b * 10];
      stashBands.push(
        BAND_DZ.map((dz, k) => {
          const t = new THREE.Mesh(bandGeos[k], rubberMat());
          t.position.set(p.cx, p.cy, STASH_Z + dz);
          stashGroup.add(t);
          return t;
        }),
      );
    }
    if (
      animateLastBand &&
      shownBands > 0 &&
      n % 10 === 0 &&
      Math.floor(n / 10) <= 6
    ) {
      const b = Math.floor(n / 10) - 1;
      stashBands[b].forEach((t) => (t.visible = false));
      for (let j = 0; j < 10; j++) {
        const m = stashBlunts[b * 10 + j];
        m.userData.to = m.position.clone();
        m.position.set(0.09 + j * 0.12, FLOOR + 0.062, STASH_Z);
      }
    }
  }

  /* dissolve material for sparking: same geometry, burns away from the tip */
  const BURN_GLSL = `
varying vec3 vLp; uniform float uBurn;
float h3(vec3 p){ p = fract(p * 0.3183099 + .1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vn(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3. - 2. * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }`;
  function makeBurnMat() {
    const m = leafMat.clone();
    m.userData.uBurn = { value: 0 };
    m.customProgramCacheKey = () => "burn";
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uBurn = m.userData.uBurn;
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vLp;")
        .replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nvLp = position;",
        );
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\n" + BURN_GLSL)
        .replace(
          "#include <clipping_planes_fragment>",
          `#include <clipping_planes_fragment>
        float bn = vn(vLp * 7.0) * .38 + vn(vLp * 22.0) * .28 + vn(vLp * 60.0) * .2 + vn(vLp * 150.0) * .14;
        float bEdge = mix(${(HL + 0.2).toFixed(3)}, ${(-HL - 0.2).toFixed(3)}, uBurn);
        float bd = (vLp.z + (bn - .5) * .3) - bEdge;
        if (bd > 0.0) discard;`,
        )
        .replace(
          "#include <map_fragment>",
          `#include <map_fragment>
        float ash = smoothstep(-.2, -.035, bd);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.16, .15, .14), ash);`,
        )
        .replace(
          "#include <emissivemap_fragment>",
          `#include <emissivemap_fragment>
        float bg = smoothstep(-.03, 0.0, bd);
        totalEmissiveRadiance += vec3(4.0, 1.3, .25) * bg * bg + vec3(.9, .25, .05) * smoothstep(-.07, -.02, bd) * (1. - bg);`,
        );
    };
    return m;
  }

  /* quarter markers */
  function buildQuarterDots() {
    const mat = new THREE.PointsMaterial({
      map: sparkTex,
      size: 0.06,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: 0xffd27a,
    });
    for (let q = 1; q <= 3; q++) {
      const x = -0.97 + (1.94 * q) / 4,
        t = (x + HL) / L,
        R = (W0 * taper(t)) / TH_OPEN;
      const pts = [];
      for (let k = 0; k <= 8; k++) {
        const v = 0.22 + (0.56 * k) / 8,
          phi = (v - 0.5) * TH_OPEN;
        pts.push(
          new THREE.Vector3(x, R - R * Math.cos(phi) + 0.01, R * Math.sin(phi)),
        );
      }
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      const p = new THREE.Points(g, mat.clone());
      inner.add(p);
      qDots.push(p);
    }
  }

  /* sprites */
  const sprites = [];
  function addSprite(tex, o) {
    const m = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      blending: o.blend || THREE.AdditiveBlending,
      color: o.color || 0xffffff,
      opacity: o.op ?? 1,
      depthTest: o.depthTest ?? true,
    });
    m.toneMapped = false;
    const s = new THREE.Sprite(m);
    s.position.copy(o.pos);
    s.scale.setScalar(o.size);
    (o.parent || scene).add(s);
    const sp = Object.assign(
      {
        s,
        age: 0,
        life: 2,
        vel: new THREE.Vector3(),
        grav: 0,
        size0: o.size,
        op0: o.op ?? 1,
      },
      o,
    );
    sprites.push(sp);
    return sp;
  }
  function burst(pos, n, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2),
        el = rand(-0.3, 1.2),
        sp = rand(0.6, 2.2) * (o.power || 1);
      addSprite(sparkTex, {
        pos: pos.clone(),
        size: rand(0.05, 0.14),
        life: rand(0.5, 1.1),
        vel: new THREE.Vector3(
          Math.cos(a) * sp,
          Math.abs(el) * sp,
          Math.sin(a) * sp * 0.6,
        ),
        grav: -2.2,
        kind: "spark",
        color: o.color || 0xffe29a,
      });
    }
  }

  /* dust */
  let dust;
  function buildDust() {
    const n = 160,
      g = new THREE.BufferGeometry(),
      p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      p[i * 3] = rand(-2.2, 2.2);
      p[i * 3 + 1] = rand(0, 3.2);
      p[i * 3 + 2] = rand(-2, 2);
    }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    dust = new THREE.Points(
      g,
      new THREE.PointsMaterial({
        map: dotTex,
        size: 0.035,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        color: 0xffc98a,
      }),
    );
    scene.add(dust);
  }

  function build() {
    leafTex = makeLeaf();
    leafTex.colorSpace = THREE.SRGBColorSpace;
    leafTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    dollarTex = makeDollar();
    sparkTex = makeSpark();
    glowTex = makeSoft("rgba(255,150,60,1)", "rgba(255,90,20,0)");
    dotTex = makeSoft("rgba(255,230,190,1)", "rgba(255,230,190,0)");
    ashTex = makeSoft("rgba(170,165,160,.9)", "rgba(120,115,110,0)");
    smokeTex = makeSmoke();
    leafMat = new THREE.MeshStandardMaterial({
      map: leafTex,
      bumpMap: leafTex,
      bumpScale: 0.012,
      roughness: 0.58,
      metalness: 0,
      side: THREE.DoubleSide,
    });

    // tray
    const tw = 2.84,
      td = 2.5,
      tr = 0.22;
    const rr = (w, d, r) => {
      const s = new THREE.Shape();
      const x = -w / 2,
        y = -d / 2;
      s.moveTo(x + r, y);
      s.lineTo(x + w - r, y);
      s.quadraticCurveTo(x + w, y, x + w, y + r);
      s.lineTo(x + w, y + d - r);
      s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
      s.lineTo(x + r, y + d);
      s.quadraticCurveTo(x, y + d, x, y + d - r);
      s.lineTo(x, y + r);
      s.quadraticCurveTo(x, y, x + r, y);
      return s;
    };
    const trayMat = new THREE.MeshStandardMaterial({
      color: lin("#231710"),
      metalness: 0.75,
      roughness: 0.38,
    });
    const base = new THREE.Mesh(
      new THREE.ExtrudeGeometry(rr(tw, td, tr), {
        depth: 0.06,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.02,
        bevelSegments: 2,
        curveSegments: 10,
      }),
      trayMat,
    );
    base.geometry.rotateX(-Math.PI / 2);
    base.position.set(0, 0.0, 0.08);
    scene.add(base);
    const ring = rr(tw + 0.02, td + 0.02, tr);
    const hole = rr(tw - 0.12, td - 0.12, tr - 0.06);
    ring.holes.push(hole);
    const rimMesh = new THREE.Mesh(
      new THREE.ExtrudeGeometry(ring, {
        depth: 0.16,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.015,
        bevelSegments: 3,
        curveSegments: 10,
      }),
      new THREE.MeshStandardMaterial({
        color: lin("#3a2616"),
        metalness: 0.85,
        roughness: 0.28,
      }),
    );
    rimMesh.geometry.rotateX(-Math.PI / 2);
    rimMesh.position.set(0, 0, 0.08);
    scene.add(rimMesh);
    const floorTex = makeTrayFloor();
    floorTex.colorSpace = THREE.SRGBColorSpace;
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(tw - 0.14, td - 0.14),
      new THREE.MeshStandardMaterial({
        map: floorTex,
        metalness: 0.5,
        roughness: 0.5,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, FLOOR - 0.005, 0.08);
    scene.add(floor);
    // warm pool of light under the wrap
    const pool = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 2.2),
      new THREE.MeshBasicMaterial({
        map: makeSoft("rgba(255,180,90,.28)", "rgba(255,150,60,0)"),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(0, FLOOR + 0.002, -0.45);
    scene.add(pool);

    // active blunt
    pivot = new THREE.Group();
    pivot.rotation.order = "YXZ";
    pivot.position.copy(HOME);
    scene.add(pivot);
    inner = new THREE.Group();
    pivot.add(inner);
    setTilt(1);
    sheetGeo = buildSheet();
    sheet = new THREE.Mesh(sheetGeo, leafMat);
    inner.add(sheet);
    shapeSheet(0);
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 1.3),
      new THREE.MeshBasicMaterial({
        map: makeSoft("rgba(0,0,0,.55)", "rgba(0,0,0,0)"),
        transparent: true,
        depthWrite: false,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(HOME.x, FLOOR + 0.004, HOME.z);
    scene.add(shadow);

    buildSlots();
    const crumbMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      flatShading: true,
      roughness: 0.62,
      metalness: 0,
    });
    const leafMatW = new THREE.MeshStandardMaterial({
      vertexColors: true,
      flatShading: true,
      roughness: 0.7,
      side: THREE.DoubleSide,
    });
    pileMeshes = FLAKE_TYPES.map((T) => {
      const geo =
        T.kind === "crumb"
          ? crumbGeo()
          : T.kind === "leaf"
            ? leafGeo()
            : T.kind === "hair"
              ? hairGeo()
              : stemGeo();
      const m = new THREE.InstancedMesh(
        geo,
        T.kind === "leaf" ? leafMatW : crumbMat,
        Math.max(1, T.n),
      );
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      m.frustumCulled = false;
      for (let j = 0; j < T.n; j++) {
        m.setMatrixAt(j, ZERO);
        const v = rand(0.7, 1.0);
        m.setColorAt(
          j,
          new THREE.Color(v, v * rand(0.97, 1.03), v * rand(0.9, 1)),
        );
      }
      inner.add(m);
      return m;
    });

    stashGroup = new THREE.Group();
    scene.add(stashGroup);
    bluntLatheGeo = buildLathe();
    rebuildStash(vis.stash);
    buildDust();
    presetFill(vis.fill);
  }

  /* instantly place a partially filled pile (no animation) */
  function presetFill(amount) {
    const n = Math.round((amount / 100) * NS);
    for (let i = 0; i < NS; i++) {
      if (i < n) {
        slot.state[i] = 2;
        setSlotMatrix(i, slot.x[i], slot.y[i], slot.z[i], slot.q[i]);
      } else {
        slot.state[i] = 0;
        hideSlot(i);
      }
    }
    spawned = landed = n;
    flagPile();
  }

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let busy = false,
    disposed = false,
    frame = 0,
    initialized = false,
    desired = 0,
    rendered = 0,
    draining = false;
  const setBusy = (value) => {
    busy = value;
    host.dataset.animating = String(value);
  };
  const setCounts = () => {};
  const setPips = () => {};
  const bumpChip = () => {};
  const haptic = () => {};
  const showStamp = (text) => {
    const el = host.querySelector(".scene-stamp");
    if (el) el.textContent = text;
  };
  /* ================= TWEENS ================= */
  const tweens = [];
  function tween(dur, fn, ease = easeIO) {
    return new Promise((res, reject) => {
      if (disposed) return reject(new Error("disposed"));
      tweens.push({ t: 0, dur, fn, ease, res, reject });
    });
  }
  const waits = new Map();
  const wait = (ms) =>
    new Promise((resolve, reject) => {
      if (disposed) return reject(new Error("disposed"));
      const id = setTimeout(() => {
        waits.delete(id);
        resolve();
      }, ms);
      waits.set(id, reject);
    });

  /* ================= FILL ================= */
  let pourQueue = null,
    dollarsLeft = 0;
  function pour(fromAmt, toAmt, speed = 1) {
    const s0 = Math.round((fromAmt / 100) * NS),
      s1 = Math.round((toAmt / 100) * NS);
    const dur = clamp((toAmt - fromAmt) * 0.17, 3.0, 8.0) / speed;
    dollarsLeft += Math.max(
      1,
      Math.round((toAmt - fromAmt) / 2.6 / Math.max(1, speed * 0.8)),
    );
    const order = [];
    for (let i = s0; i < s1; i++) order.push(i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [order[i], order[j]] = [order[j], order[i]];
    }
    return new Promise((res, reject) => {
      if (disposed) return reject(new Error("disposed"));
      pourQueue = {
        reject,
        s0,
        s1,
        order,
        oi: 0,
        next: s0,
        rate: (s1 - s0) / dur,
        acc: 0,
        dlrRate: dollarsLeft / dur,
        dAcc: 0,
        res,
        quarterFrom: Math.floor(fromAmt / 25 + 1e-6),
      };
    });
  }
  function spawnFlake(i) {
    slot.state[i] = 1;
    slot.px[i] = slot.x[i] + rand(-0.2, 0.2);
    slot.py[i] = rand(2.4, 3.6);
    slot.pz[i] = slot.z[i] + rand(-0.5, 0.3);
    slot.vy[i] = -rand(0.25, 0.5);
    slot.ang[i] = rand(0, 6);
    slot.t0[i] = slot.py[i];
  }
  const qtmp = new THREE.Quaternion();
  function stepFlakes(dt) {
    if (pourQueue) {
      const P = pourQueue;
      P.acc += P.rate * dt;
      while (P.acc >= 1 && P.oi < P.order.length) {
        spawnFlake(P.order[P.oi++]);
        P.acc -= 1;
        spawned++;
      }
      P.dAcc += P.dlrRate * dt;
      while (P.dAcc >= 1 && dollarsLeft > 0) {
        spawnDollar();
        P.dAcc -= 1;
        dollarsLeft--;
      }
    }
    let changed = false;
    for (let i = 0; i < NS; i++) {
      if (slot.state[i] !== 1) continue;
      changed = true;
      slot.vy[i] = Math.max(slot.vy[i] - 1.1 * dt, -1.05);
      slot.py[i] += slot.vy[i] * dt;
      const prog = clamp(
        1 - (slot.py[i] - slot.y[i]) / (slot.t0[i] - slot.y[i]),
        0,
        1,
      );
      const k = 1 - Math.pow(1 - prog, 2);
      const x = lerp(slot.px[i], slot.x[i], k),
        z = lerp(slot.pz[i], slot.z[i], k);
      slot.ang[i] += dt * 4;
      if (slot.py[i] <= slot.y[i]) {
        slot.state[i] = 2;
        landed++;
        setSlotMatrix(i, slot.x[i], slot.y[i], slot.z[i], slot.q[i]);
        const amtNow = (landed / NS) * 100;
        const q = Math.floor(amtNow / 25 + 1e-6);
        if (pourQueue && q > pourQueue.quarterFrom && q < 4) {
          pourQueue.quarterFrom = q;
          quarterPulse(q);
        }
      } else {
        qtmp.setFromAxisAngle(slot.spin[i], slot.ang[i]);
        qtmp.multiply(slot.q[i]);
        setSlotMatrix(i, x, slot.py[i], z, qtmp, 1.15);
      }
    }
    if (changed) {
      flagPile();
      setPips((landed / NS) * 100);
    }
    if (pourQueue && pourQueue.oi >= pourQueue.order.length) {
      let allDown = true;
      for (let i = pourQueue.s0; i < pourQueue.s1; i++)
        if (slot.state[i] === 1) {
          allDown = false;
          break;
        }
      if (allDown && dollarsLeft <= 0) {
        const r = pourQueue.res;
        pourQueue = null;
        r();
      }
    }
  }
  function spawnDollar() {
    const i = pourQueue
      ? pourQueue.order[(Math.random() * pourQueue.order.length) | 0]
      : Math.max(0, landed - 1);
    const target = new THREE.Vector3(slot.x[i], slot.y[i] + 0.03, slot.z[i]);
    const start = new THREE.Vector3(
      target.x + rand(-0.3, 0.3),
      rand(2.2, 3.4),
      target.z + rand(-0.4, 0.3),
    );
    const d = addSprite(dollarTex, {
      pos: start,
      size: rand(0.24, 0.32),
      life: 99,
      parent: inner,
      kind: "dollar",
      target,
      vy: -rand(0.2, 0.35),
      color: 0xffe08a,
    });
    d.sparks = [0, 1, 2, 3].map((k) =>
      addSprite(sparkTex, {
        pos: start.clone(),
        size: 0.06,
        life: 99,
        parent: inner,
        kind: "orbit",
        host: d,
        ph: k * 1.6 + rand(0, 1),
        rad: rand(0.13, 0.19),
        color: 0xfff1c0,
      }),
    );
  }
  function quarterPulse(q) {
    const dots = qDots[q - 1];
    if (dots) {
      dots.material.opacity = 1;
      dots.material.size = 0.14;
    }
    const wp = inner.localToWorld(
      new THREE.Vector3(-0.97 + (1.94 * q) / 4, 0.15, 0),
    );
    burst(
      inner.localToWorld(new THREE.Vector3(-0.97 + (1.94 * q) / 4, 0.15, 0)),
      28,
      { power: 1.1 },
    );
    const ring = addSprite(glowTex, {
      pos: wp.clone(),
      size: 0.2,
      life: 0.7,
      kind: "ring",
      op: 0.9,
    });
    ring.grow = 2.4;
    haptic(12);
  }

  async function rollUp(fast = false) {
    const sp = fast ? 1.8 : 1;
    qDots.forEach((d) => (d.visible = false));
    await wait(200 / sp);
    await tween(1.25 / sp, (t) => {
      curl = t;
      shapeSheet(t);
      setTilt(1 - t);
    });
    // seal shimmer
    const wp = pivot.position.clone();
    for (let k = 0; k < 5; k++)
      burst(wp.clone().add(new THREE.Vector3(-0.9 + k * 0.45, 0.05, 0)), 8, {
        power: 0.6,
      });
    showStamp(
      vis.stash + 1 === 10 * Math.ceil((vis.stash + 1) / 10) ? "" : "",
      "",
    );
    haptic(30);
    await tween(
      0.55 / sp,
      (t) => {
        pivot.rotation.x = t * Math.PI * 2;
        pivot.position.y = HOME.y + Math.sin(t * Math.PI) * 0.35;
      },
      easeIO,
    );
    pivot.rotation.x = 0;
    const n = vis.stash + 1;
    const { list } = stashSlots(n);
    const dst =
      n % 10 === 0
        ? { x: 0.09 + 9 * 0.12, y: FLOOR + 0.062 }
        : list[list.length - 1];
    const from = pivot.position.clone();
    const to = new THREE.Vector3(dst.x, dst.y, STASH_Z);
    await tween(
      0.75 / sp,
      (t) => {
        pivot.position.lerpVectors(from, to, t);
        pivot.position.y += Math.sin(t * Math.PI) * 0.6;
        pivot.scale.setScalar(lerp(1, STASH_S, t));
        pivot.rotation.y = (-Math.PI / 2) * t;
      },
      easeIO,
    );
    vis.stash = n;
    rebuildStash(n, n % 10 === 0);
    bumpChip("#chipBlunts");
    setCounts();
    burst(to, 20, { power: 0.8 });
    // reset the wrap: fresh one unrolls in from the side
    presetFill(0);
    for (const s of sprites)
      if (s.kind === "dollar" || s.kind === "orbit") s.dead = true;
    pivot.scale.setScalar(1);
    pivot.rotation.set(0, 0, 0);
    pivot.position.set(3.2, HOME.y, HOME.z);
    if (n % 10 === 0) await bandUp(n);
    await tween(
      0.8 / sp,
      (t) => {
        pivot.position.x = lerp(3.2, 0, t);
        curl = 1 - t;
        shapeSheet(curl);
        setTilt(t);
      },
      easeOut,
    );
    qDots.forEach((d) => {
      d.visible = true;
      d.material.opacity = 0.55;
      d.material.size = 0.06;
    });
    setPips(0);
  }
  const elasticOut = (t) =>
    t === 0 || t === 1
      ? t
      : Math.pow(2, -9 * t) * Math.sin(((t * 9 - 0.75) * (2 * Math.PI)) / 3) +
        1;
  async function bandUp(n) {
    const b = Math.floor(n / 10) - 1;
    showStamp("BAND UP");
    haptic([20, 40, 20]);
    billRain(110);
    const rainStart = performance.now();
    if (b > 5 || !stashBands[b]) {
      bumpChip("#chipBands");
      setCounts();
      await wait(5000);
      return;
    }
    const ms = stashBlunts.slice(b * 10, b * 10 + 10),
      froms = ms.map((m) => m.position.clone());
    await tween(
      0.7,
      (t) =>
        ms.forEach((m, j) => {
          const k = clamp(t * 1.4 - j * 0.04, 0, 1),
            e = easeIO(k);
          m.position.lerpVectors(froms[j], m.userData.to, e);
          m.position.y += Math.sin(e * Math.PI) * 0.12;
        }),
      (t) => t,
    );
    const bands = stashBands[b];
    bands.forEach((t) => {
      t.visible = true;
    });
    await tween(
      0.6,
      (t) =>
        bands.forEach((m) => {
          const k = lerp(1.6, 1, elasticOut(t));
          m.scale.set(k, k, 1);
        }),
      (t) => t,
    );
    const p = ms[0].userData.to;
    burst(new THREE.Vector3(p.x + 0.24, p.y + 0.15, STASH_Z), 40, {
      power: 1.2,
    });
    bumpChip("#chipBands");
    setCounts();
    await wait(Math.max(700, 4000 - (performance.now() - rainStart)));
  }
  // Public-domain scans of the Series 2009 $100 Federal Reserve Note (Wikimedia Commons; US Government work).
  const BILL_FRONT_SRC = new URL("./assets/bill-front.jpg", import.meta.url)
    .href;
  const BILL_BACK_SRC = new URL("./assets/bill-back.jpg", import.meta.url).href;

  /* $100 bill rain for BAND UP.
   Own layer above all UI, straight-on orthographic camera, constant fall speed until fully off screen.
   Bills bend and flutter in the vertex shader; front/back scans chosen by face direction. */
  const VH = 10; // view height in world units
  let billMesh = null,
    billRenderer = null,
    billScene = null,
    billCam = null,
    billsDrawn = false;
  const BILLS_MAX = 150,
    billState = [];
  const billUniforms = { uTime: { value: 0 } };
  const billTextures = [];
  function initBillLayer() {
    billRenderer = new THREE.WebGLRenderer({
      canvas: moneyCanvas,
      antialias: true,
      alpha: true,
    });
    billRenderer.setPixelRatio(pixelRatio);
    billRenderer.outputColorSpace = THREE.SRGBColorSpace;
    billRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    billRenderer.toneMappingExposure = 0.95;
    billRenderer.setClearColor(0x000000, 0);
    billScene = new THREE.Scene();
    billCam = new THREE.OrthographicCamera(-1, 1, VH / 2, -VH / 2, 0.1, 100);
    billCam.position.set(0, 0, 30);
    billCam.lookAt(0, 0, 0);
    billScene.add(new THREE.HemisphereLight(0xfff3e0, 0x2b1d12, 0.55));
    const key = new THREE.DirectionalLight(0xffe6c4, 0.95);
    key.position.set(-4, 6, 10);
    billScene.add(key);
    sizeBillLayer();
  }
  function sizeBillLayer() {
    if (!billRenderer) return;
    const w = host.clientWidth,
      h = host.clientHeight;
    billRenderer.setSize(w, h, false);
    const hw = (VH / 2) * (w / h);
    billCam.left = -hw;
    billCam.right = hw;
    billCam.updateProjectionMatrix();
  }
  function buildBillMesh() {
    initBillLayer();
    const ld = new THREE.TextureLoader();
    const front = ld.load(BILL_FRONT_SRC),
      back = ld.load(BILL_BACK_SRC);
    billTextures.push(front, back);
    [front, back].forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = billRenderer.capabilities.getMaxAnisotropy();
    });
    const geo = new THREE.PlaneGeometry(1, 0.421, 24, 8); // real 2.37:1 note proportions
    const phase = new Float32Array(BILLS_MAX);
    for (let i = 0; i < BILLS_MAX; i++) phase[i] = rand(0, 20);
    geo.setAttribute("aPhase", new THREE.InstancedBufferAttribute(phase, 1));
    const mat = new THREE.MeshStandardMaterial({
      map: front,
      color: 0xe2e2d6,
      side: THREE.DoubleSide,
      roughness: 0.85,
      metalness: 0,
    });
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = billUniforms.uTime;
      sh.uniforms.uBack = { value: back };
      sh.vertexShader = sh.vertexShader
        .replace(
          "#include <common>",
          "#include <common>\nuniform float uTime; attribute float aPhase;",
        )
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
        float bp = aPhase + uTime;
        float A = 1.6 + 1.1 * sin(bp * 1.7), B = .7 * sin(bp * 2.3);
        transformed.z += transformed.y * transformed.y * A + sin(transformed.x * 5.0 + bp * 4.0) * .03 + transformed.x * transformed.x * B;`,
        )
        .replace(
          "#include <beginnormal_vertex>",
          `#include <beginnormal_vertex>
        { float bp2 = aPhase + uTime; float A2 = 1.6 + 1.1 * sin(bp2 * 1.7), B2 = .7 * sin(bp2 * 2.3);
          objectNormal = normalize(vec3(-(cos(position.x * 5.0 + bp2 * 4.0) * .15 + 2.0 * position.x * B2), -2.0 * position.y * A2, 1.0)); }`,
        );
      sh.fragmentShader = sh.fragmentShader
        .replace(
          "#include <common>",
          "#include <common>\nuniform sampler2D uBack;",
        )
        .replace(
          "#include <map_fragment>",
          `#ifdef USE_MAP
        vec4 texelColor = gl_FrontFacing ? texture2D(map, vMapUv) : texture2D(uBack, vec2(1.0 - vMapUv.x, vMapUv.y));
         diffuseColor *= texelColor;
        #endif`,
        );
    };
    billMesh = new THREE.InstancedMesh(geo, mat, BILLS_MAX);
    billMesh.frustumCulled = false;
    for (let i = 0; i < BILLS_MAX; i++) {
      billMesh.setMatrixAt(i, ZERO);
      billState.push(null);
    }
    billScene.add(billMesh);
  }
  function billRain(n) {
    if (reduce) return;
    if (!billMesh) buildBillMesh();
    const hw = billCam.right,
      spread = 7.5; // stream length above the screen, in world units
    let k = 0;
    for (let i = 0; i < BILLS_MAX && k < n; i++)
      if (!billState[i]) {
        const w = hw * 2 * rand(0.28, 0.46);
        billState[i] = {
          x: rand(-hw, hw),
          y: VH / 2 + w * 0.5 + (k / n) * spread + rand(0, 0.6),
          z: rand(-8, 8),
          s: w,
          v: rand(4.0, 5.2),
          ph: rand(0, 6.28),
          w1: rand(1.8, 3.2),
          w2: rand(1.2, 2.2),
          spin: rand(-2.2, 2.2),
          rz: rand(-0.5, 0.5),
          age: 0,
        };
        k++;
      }
  }
  const _bq = new THREE.Quaternion(),
    _be = new THREE.Euler(),
    _bs = new THREE.Vector3(),
    _bm = new THREE.Matrix4(),
    _bp = new THREE.Vector3();
  function stepBills(dt) {
    if (!billMesh) return;
    billUniforms.uTime.value += dt;
    let any = false;
    for (let i = 0; i < BILLS_MAX; i++) {
      const b = billState[i];
      if (!b) continue;
      any = true;
      b.age += dt;
      b.y -= b.v * dt; // constant speed: no slowing, no fading
      b.x += Math.sin(b.age * b.w1 + b.ph) * 0.7 * dt; // side-to-side glide
      _be.set(
        Math.sin(b.age * b.w1 + b.ph) * 0.55,
        b.ph + b.age * b.spin,
        b.rz + Math.sin(b.age * b.w2 + b.ph) * 0.35,
        "XYZ",
      );
      _bq.setFromEuler(_be);
      _bp.set(b.x, b.y, b.z);
      _bs.set(b.s, b.s, b.s);
      _bm.compose(_bp, _bq, _bs);
      billMesh.setMatrixAt(i, _bm);
      if (b.y < -VH / 2 - b.s) {
        billState[i] = null;
        billMesh.setMatrixAt(i, ZERO);
      } // gone only once fully below the screen
    }
    if (any) billMesh.instanceMatrix.needsUpdate = true;
    if (any || billsDrawn) {
      billRenderer.render(billScene, billCam);
      billsDrawn = any;
    }
  }

  async function doFill(amount, method) {
    if (busy || !Number.isFinite(amount) || amount <= 0) return;
    setBusy(true);
    let remaining = amount,
      rolledThis = 0;
    while (remaining > 1e-6) {
      if (rolledThis >= 2 && remaining >= 100) {
        const k = Math.floor(remaining / 100);
        remaining -= k * 100;
        const before = vis.stash;
        vis.stash += k;
        rebuildStash(vis.stash);
        setCounts();
        bumpChip("#chipBlunts");
        burst(new THREE.Vector3(0.6, FLOOR + 0.2, STASH_Z), 50, { power: 1.3 });
        if (Math.floor(vis.stash / 10) > Math.floor(before / 10)) {
          showStamp("BAND UP");
          bumpChip("#chipBands");
          billRain(110);
          await wait(5000);
        }
        await wait(600);
        continue;
      }
      const room = 100 - vis.fill,
        add = Math.min(room, remaining);
      await pour(vis.fill, vis.fill + add, amount > 150 ? 1.7 : 1);
      vis.fill += add;
      remaining -= add;
      if (vis.fill >= 99.999) {
        await rollUp(amount > 150);
        vis.fill = 0;
        rolledThis++;
      }
    }
    setCounts();
    setBusy(false);
  }

  /* ================= SPARK ================= */
  async function popBands(from, to) {
    const popping = [];
    for (let b = from; b < Math.min(to, stashBands.length); b++)
      popping.push(...stashBands[b]);
    showStamp(to - from > 1 ? "BANDS POPPED" : "BAND POPPED");
    haptic([40, 30, 60]);
    // stretch...
    await tween(
      0.22,
      (t) =>
        popping.forEach((m) => {
          const k = 1 + t * 0.18;
          m.scale.set(k, k * 0.92, 1);
        }),
      (t) => t * t,
    );
    // ...snap
    const vel = popping.map(
        () =>
          new THREE.Vector3(rand(-1.4, 1.4), rand(1.6, 2.6), rand(-0.4, 1.2)),
      ),
      spin = popping.map(
        () => new THREE.Vector3(rand(-9, 9), rand(-9, 9), rand(-9, 9)),
      );
    popping.forEach((m) =>
      burst(m.position.clone().add(new THREE.Vector3(0, 0.1, 0)), 14, {
        power: 1.3,
        color: 0xff7a5a,
      }),
    );
    const bundleBlunts = [];
    for (let b = from; b < Math.min(to, stashBands.length); b++)
      bundleBlunts.push(...stashBlunts.slice(b * 10, b * 10 + 10));
    const starts = bundleBlunts.map((m) => m.position.clone());
    await tween(
      0.7,
      (t) => {
        popping.forEach((m, i) => {
          m.position.addScaledVector(vel[i], 0.016);
          vel[i].y -= 0.09;
          m.rotation.x += spin[i].x * 0.016;
          m.rotation.y += spin[i].y * 0.016;
          m.rotation.z += spin[i].z * 0.016;
          const k = lerp(1.18, 0.5, t);
          m.scale.set(k, k, 1);
          m.material.opacity = 1 - t;
        });
        bundleBlunts.forEach((m, i) => {
          m.position.x = starts[i].x + Math.sin(t * 30 + i) * 0.012 * (1 - t);
          m.position.y =
            starts[i].y +
            Math.abs(Math.sin(t * Math.PI * 2 + i)) * 0.03 * (1 - t);
        });
      },
      (t) => t,
    );
    bumpChip("#chipBands");
  }
  async function doSpark(target) {
    setBusy(true);
    const oldFill = vis.fill,
      newStash = Math.floor(target / 100),
      newFill = target - newStash * 100;
    const nBurn = Math.max(0, vis.stash - newStash);
    const { list } = stashSlots(vis.stash);
    const take = list.slice(Math.max(0, list.length - nBurn)).slice(-5);
    const bandsBefore = Math.floor(vis.stash / 10),
      bandsAfter = Math.floor(Math.max(0, vis.stash - nBurn) / 10);
    if (bandsAfter < bandsBefore) await popBands(bandsAfter, bandsBefore);
    vis.stash = Math.max(0, vis.stash - nBurn);
    rebuildStash(vis.stash);
    const burners = take.map((p, j) => {
      const m = new THREE.Mesh(bluntLatheGeo, makeBurnMat());
      m.scale.setScalar(STASH_S);
      m.position.set(p.x, p.y, STASH_Z);
      scene.add(m);
      return { m, from: m.position.clone(), j };
    });
    // lift into a fan
    const cnt = burners.length;
    await tween(0.8, (t) =>
      burners.forEach((b) => {
        const ty = 1.45 + (b.j - (cnt - 1) / 2) * 0.28 + (cnt - 1) * 0.14,
          tz = 1.25;
        b.m.position.set(
          lerp(b.from.x, 0, t),
          lerp(b.from.y, ty, t) + Math.sin(t * Math.PI) * 0.2,
          lerp(b.from.z, tz, t),
        );
        b.m.scale.setScalar(lerp(STASH_S, 0.68, t));
        b.m.rotation.y = (Math.PI / 2) * t;
      }),
    );
    // weed leaving the open wrap goes up in smoke
    if (newFill < oldFill - 0.01) vaporizeRange(newFill, oldFill);
    // burn
    const embers = burners.map((b) =>
      addSprite(glowTex, {
        pos: b.m.position.clone(),
        size: 0.32,
        life: 99,
        kind: "ember",
      }),
    );
    emberLight.intensity = 3;
    haptic(20);
    const tipL = new THREE.Vector3();
    await tween(
      2.6,
      (t) => {
        burners.forEach((b, i) => {
          b.m.material.userData.uBurn.value = t;
          // ember rides the dissolve edge; geometry is untouched
          tipL.set(0, 0, lerp(HL + 0.05, -HL - 0.05, t));
          const tip = b.m.localToWorld(tipL.clone());
          embers[i].s.position.copy(tip);
          embers[i].s.scale.setScalar(
            (0.26 + Math.sin(performance.now() / 70 + i) * 0.05) *
              (t > 0.95 ? (1 - t) * 20 : 1),
          );
          if (Math.random() < 0.4)
            addSprite(smokeTex, {
              pos: tip.clone().add(new THREE.Vector3(0, 0.05, 0)),
              size: rand(0.12, 0.24),
              life: rand(2.2, 3.2),
              vel: new THREE.Vector3(
                rand(-0.1, 0.1),
                rand(0.4, 0.7),
                rand(-0.08, 0.08),
              ),
              kind: "smoke",
              blend: THREE.NormalBlending,
              op: 0.32,
              grow: 2.2,
              color: 0xb9b2aa,
            });
          if (Math.random() < 0.45)
            addSprite(ashTex, {
              pos: tip.clone(),
              size: rand(0.025, 0.05),
              life: 1.4,
              vel: new THREE.Vector3(
                rand(-0.2, 0.2),
                rand(-0.1, 0.2),
                rand(-0.1, 0.1),
              ),
              grav: -2.5,
              kind: "ash",
              blend: THREE.NormalBlending,
            });
          if (Math.random() < 0.22)
            addSprite(sparkTex, {
              pos: tip.clone(),
              size: rand(0.04, 0.09),
              life: rand(0.4, 0.8),
              vel: new THREE.Vector3(
                rand(-0.4, 0.4),
                rand(0.2, 0.9),
                rand(-0.3, 0.3),
              ),
              grav: -1.5,
              kind: "spark",
              color: 0xffa050,
            });
          if (Math.random() < 0.16)
            addSprite(dollarTex, {
              pos: tip.clone(),
              size: rand(0.2, 0.28),
              life: 1.9,
              vel: new THREE.Vector3(
                rand(-0.25, 0.25),
                rand(0.9, 1.4),
                rand(-0.1, 0.1),
              ),
              kind: "rise",
              color: 0xffe08a,
            });
        });
        if (burners.length) emberLight.position.copy(embers[0].s.position);
      },
      (t) => t,
    );
    burners.forEach((b) => {
      scene.remove(b.m);
      b.m.material.dispose();
    });
    embers.forEach((e) => (e.dead = true));
    emberLight.intensity = 0;
    // cash taken from inside a blunt: the rest of that blunt goes back into the wrap
    setCounts();
    if (newFill > oldFill + 0.01) {
      await pour(oldFill, newFill, 2.6);
    }
    vis.fill = newFill;
    presetFill(newFill);
    setPips(newFill);
    await wait(1200);
    setBusy(false);
  }
  function vaporizeRange(a, b) {
    const i0 = Math.round((a / 100) * NS),
      i1 = Math.round((b / 100) * NS);
    for (let i = i0; i < i1; i += 3) {
      const wp = inner.localToWorld(
        new THREE.Vector3(slot.x[i], slot.y[i], slot.z[i]),
      );
      if (Math.random() < 0.5)
        addSprite(smokeTex, {
          pos: wp,
          size: rand(0.12, 0.25),
          life: rand(1.4, 2.4),
          vel: new THREE.Vector3(rand(-0.1, 0.1), rand(0.4, 0.8), 0),
          kind: "smoke",
          blend: THREE.NormalBlending,
          op: 0.5,
          grow: 1.6,
        });
    }
    presetFill(a);
  }
  function vaporize() {
    for (let i = 0; i < landed; i += 3) {
      const wp = inner.localToWorld(
        new THREE.Vector3(slot.x[i], slot.y[i], slot.z[i]),
      );
      if (Math.random() < 0.5)
        addSprite(smokeTex, {
          pos: wp,
          size: rand(0.12, 0.25),
          life: rand(1.4, 2.4),
          vel: new THREE.Vector3(rand(-0.1, 0.1), rand(0.4, 0.8), 0),
          kind: "smoke",
          blend: THREE.NormalBlending,
          op: 0.5,
          grow: 1.6,
        });
    }
    presetFill(0);
  }

  /* ================= LOOP ================= */
  let last = performance.now(),
    camSway = 0,
    pointerX = 0,
    pointerY = 0;
  const pointerMove = (e) => {
    const r = host.getBoundingClientRect();
    pointerX = (e.clientX - r.left) / r.width - 0.5;
    pointerY = (e.clientY - r.top) / r.height - 0.5;
  };
  host.addEventListener("pointermove", pointerMove);
  const tmpV = new THREE.Vector3();
  function tick(now) {
    const dt = Math.min(0.15, (now - last) / 1000);
    last = now;
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i];
      tw.t += dt;
      const k = clamp(tw.t / tw.dur, 0, 1);
      tw.fn(tw.ease(k));
      if (k >= 1) {
        tweens.splice(i, 1);
        tw.res();
      }
    }
    stepFlakes(dt);
    stepBills(dt);
    for (let i = sprites.length - 1; i >= 0; i--) {
      const p = sprites[i];
      p.age += dt;
      if (p.kind === "dollar") {
        if (!p.landed) {
          p.vy = Math.max(p.vy - 0.8 * dt, -0.8);
          p.s.position.y += p.vy * dt;
          const k = clamp(1 - (p.s.position.y - p.target.y) / 2.8, 0, 1);
          p.s.position.x = lerp(p.s.position.x, p.target.x, k * 0.08);
          p.s.position.z = lerp(p.s.position.z, p.target.z, k * 0.08);
          if (p.s.position.y <= p.target.y) {
            p.landed = true;
            p.age = 0;
            p.s.position.copy(p.target);
            burst(inner.localToWorld(p.target.clone()), 5, { power: 0.4 });
          }
        } else {
          const tw = 1 + Math.sin(p.age * 12) * 0.12;
          const fade = clamp(1 - (p.age - 1.4) / 0.8, 0, 1);
          p.s.scale.setScalar(p.size0 * tw * (0.6 + 0.4 * fade));
          p.s.material.opacity = fade;
          if (fade <= 0) p.dead = true;
        }
      } else if (p.kind === "orbit") {
        const h = p.host;
        if (!h || h.dead) p.dead = true;
        else {
          const a = p.age * 3.2 + p.ph;
          p.s.position.set(
            h.s.position.x + Math.cos(a) * p.rad,
            h.s.position.y + Math.sin(a * 1.3) * p.rad * 0.8,
            h.s.position.z + Math.sin(a) * p.rad * 0.5,
          );
          const tw = (Math.sin(p.age * 14 + p.ph * 3) + 1) / 2;
          p.s.scale.setScalar(0.03 + tw * 0.1);
          p.s.material.opacity = h.s.material.opacity;
        }
      } else if (p.kind === "ember") {
        // positioned by spark tween
      } else {
        p.vel.y += (p.grav || 0) * dt;
        p.s.position.addScaledVector(p.vel, dt);
        const k = p.age / p.life;
        if (p.kind === "smoke") {
          p.s.scale.setScalar(p.size0 * (1 + k * (p.grow || 1) * 2));
          p.s.material.opacity = p.op0 * (1 - k) * Math.min(1, p.age * 4);
          p.s.material.rotation += dt * 0.4;
          p.vel.x += Math.sin(p.age * 2 + i) * 0.02;
        } else if (p.kind === "ring") {
          p.s.scale.setScalar(p.size0 * (1 + k * (p.grow || 2)));
          p.s.material.opacity = p.op0 * (1 - k);
        } else if (p.kind === "rise") {
          p.s.material.opacity = 1 - k;
          p.s.scale.setScalar(p.size0 * (1 + Math.sin(p.age * 14) * 0.1));
        } else p.s.material.opacity = p.op0 * (1 - k);
        if (k >= 1) p.dead = true;
      }
      if (p.dead) {
        p.s.parent && p.s.parent.remove(p.s);
        p.s.material.dispose();
        sprites.splice(i, 1);
      }
    }
    qDots.forEach((d) => {
      if (d.material.opacity > 0.56) {
        d.material.opacity = Math.max(0.55, d.material.opacity - dt * 0.8);
        d.material.size = Math.max(0.06, d.material.size - dt * 0.15);
      }
    });
    // dust drift
    if (dust) {
      const a = dust.geometry.attributes.position.array;
      for (let i = 0; i < a.length; i += 3) {
        a[i + 1] += dt * 0.05;
        a[i] += Math.sin(now / 3000 + i) * dt * 0.02;
        if (a[i + 1] > 3.2) a[i + 1] = 0;
      }
      dust.geometry.attributes.position.needsUpdate = true;
    }
    // idle life
    if (!busy && curl === 0) inner.rotation.z = Math.sin(now / 1800) * 0.006;
    fillL.intensity = 1.1 + Math.sin(now / 900) * 0.1;
    camSway = now / 1000;
    tmpV
      .copy(camDir)
      .applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        Math.sin(camSway * 0.25) * 0.03 + pointerX * 0.08,
      );
    camera.position.copy(camTarget).addScaledVector(tmpV, camDist);
    camera.position.y += -pointerY * 0.3;
    camera.lookAt(camTarget);
    renderer.render(scene, camera);
  }

  function resize() {
    const w = host.clientWidth,
      h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    camDist = Math.max(
      1.54 / (tanH * camera.aspect),
      1.5 / (tanH * Math.max(0.45, 1 - 270 / h)),
    );
    camera.updateProjectionMatrix();
    sizeBillLayer();
    camera.position.copy(camTarget).addScaledVector(camDir, camDist);
    camera.lookAt(camTarget);
    renderer.render(scene, camera);
  }
  function snap(value) {
    vis.stash = Math.floor(value / 100);
    vis.fill = value % 100;
    stashGroup.traverse((o) => {
      if (o.isMesh && o.material !== leafMat) o.material.dispose();
    });
    rebuildStash(vis.stash);
    presetFill(vis.fill);
    rendered = value;
    resize();
  }
  async function drain() {
    if (draining || disposed) return;
    draining = true;
    try {
      while (!disposed && Math.abs(desired - rendered) > 0.00001) {
        const target = desired;
        host.dataset.animation = target > rendered ? "fill" : "spark";
        if (reduce) snap(target);
        else {
          if (target > rendered) await doFill(target - rendered);
          else await doSpark(target);
          rendered = target;
        }
      }
    } catch (error) {
      if (!disposed) {
        snap(desired);
        host.dataset.animation = "fallback";
      }
    } finally {
      draining = false;
      setBusy(false);
      showStamp("");
    }
  }
  let lastRender = 0;
  function loop(now) {
    if (disposed) return;
    if (!document.hidden && now - lastRender > (busy ? 32 : 66)) {
      tick(now);
      lastRender = now;
    } else if (document.hidden) last = now;
    frame = requestAnimationFrame(loop);
  }
  build();
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  if (!reduce) frame = requestAnimationFrame(loop);
  return {
    update(cents) {
      desired = Math.min(6999, Math.max(0, Number(cents) / 100));
      if (!initialized) {
        initialized = true;
        snap(desired);
      } else void drain();
    },
    dispose() {
      disposed = true;
      pourQueue?.reject(new Error("disposed"));
      pourQueue = null;
      cancelAnimationFrame(frame);
      observer.disconnect();
      host.removeEventListener("pointermove", pointerMove);
      for (const tw of tweens) tw.reject(new Error("disposed"));
      tweens.length = 0;
      for (const [id, reject] of waits) {
        clearTimeout(id);
        reject(new Error("disposed"));
      }
      waits.clear();
      const geometries = new Set(),
        materials = new Set(),
        textures = new Set([
          leafTex,
          dollarTex,
          sparkTex,
          glowTex,
          smokeTex,
          dotTex,
          ashTex,
          ...billTextures,
        ]);
      for (const root of [scene, billScene].filter(Boolean))
        root.traverse((o) => {
          if (o.geometry) geometries.add(o.geometry);
          if (o.material) for (const m of [o.material].flat()) materials.add(m);
        });
      for (const m of materials) {
        for (const v of Object.values(m)) if (v?.isTexture) textures.add(v);
        m.dispose();
      }
      for (const g of geometries) g.dispose();
      for (const t of textures) t?.dispose();
      bandGeos?.forEach((g) => g.dispose());
      renderer.dispose();
      billRenderer?.dispose();
    },
  };
}
