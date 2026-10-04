// Geometry ported from prototype/index.html. No prototype payment logic is included.
import * as THREE from "three";
export function createTrayScene(canvas, host) {
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
  const lin = (hex) => new THREE.Color(hex).convertSRGBToLinear();

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
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

  build();
  let frame = 0,
    lastFrame = 0;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  function render(time = 0) {
    if (!document.hidden) {
      camera.position.copy(camTarget).addScaledVector(camDir, camDist);
      if (!motion.matches) camera.position.x += Math.sin(time / 6000) * 0.12;
      camera.lookAt(camTarget);
      renderer.render(scene, camera);
    }
  }
  function loop(time) {
    const rect = host.getBoundingClientRect();
    if (time - lastFrame > 66 && rect.bottom > 0 && rect.top < innerHeight) {
      render(time);
      lastFrame = time;
    }
    frame = requestAnimationFrame(loop);
  }
  function resize() {
    const w = host.clientWidth,
      h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camDist = Math.max(
      6,
      1.8 / (Math.tan(THREE.MathUtils.degToRad(15)) * camera.aspect),
    );
    camera.updateProjectionMatrix();
    render();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  function motionChange() {
    cancelAnimationFrame(frame);
    if (motion.matches) render();
    else frame = requestAnimationFrame(loop);
  }
  motion.addEventListener("change", motionChange);
  resize();
  motionChange();
  return {
    update(cents) {
      const value = Math.max(0, Number(cents) / 100);
      // A bounded visual representation, never a substitute for the numeric balance.
      stashGroup.traverse((o) => {
        if (o.isMesh && o.material !== leafMat) o.material.dispose();
      });
      rebuildStash(Math.min(69, Math.floor(value / 100)));
      presetFill(value % 100);
      render();
    },
    dispose() {
      cancelAnimationFrame(frame);
      observer.disconnect();
      motion.removeEventListener("change", motionChange);
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
        ]);
      scene.traverse((o) => {
        if (o.geometry) geometries.add(o.geometry);
        if (o.material) for (const m of [o.material].flat()) materials.add(m);
      });
      for (const m of materials) {
        for (const value of Object.values(m))
          if (value?.isTexture) textures.add(value);
        m.dispose();
      }
      geometries.forEach((g) => g.dispose());
      textures.forEach((t) => t?.dispose());
      bandGeos?.forEach((g) => g.dispose());
      renderer.dispose();
    },
  };
}
