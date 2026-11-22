const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const vm = require("vm");

const raw = fs.readFileSync("src/app/(storefront)/kendi-tursunu-yap/tkk-sprites-raw.js", "utf8");

const ctx = { console, Math, Uint8Array, Float32Array };
vm.createContext(ctx);

const scriptCode = `
  var RES = 2.6;
  function cl(v, a, b) { return v < a ? a : v > b ? b : v; }
  function sm(a, b, t) { t = cl((t - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function rgb(hex) { var c = parseInt(String(hex).slice(1), 16); return [c >> 16, c >> 8 & 255, c & 255]; }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function add(a, d) { return [a[0] + d, a[1] + d, a[2] + d]; }
  function tint(a, r, g, b) { return [a[0] + r, a[1] + g, a[2] + b]; }
  function hsh(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function noise(seed) {
    var P = new Uint8Array(512), x = (seed >>> 0) || 7, i, j, t;
    function R() { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }
    for (i = 0; i < 256; i++) P[i] = i;
    for (i = 255; i > 0; i--) { j = Math.floor(R() * (i + 1)); t = P[i]; P[i] = P[j]; P[j] = t; }
    for (i = 0; i < 256; i++) P[i + 256] = P[i];
    function h(a, b) { return P[P[a & 255] + (b & 255)] / 255; }
    return function (px, py) {
      var xi = Math.floor(px), yi = Math.floor(py), xf = px - xi, yf = py - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      var a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    };
  }
  function fbm(N, x, y) { return N(x, y) * .55 + N(x * 2.1 + 17, y * 2.1 + 9) * .3 + N(x * 4.3 + 3, y * 4.3 + 41) * .15; }
  function tube(x, y, L, rf, cy) {
    var t = x / L; if (t < -1.02 || t > 1.02) return null;
    var r = Math.max(0, rf(t)), dy = y - (cy ? cy(t) : 0), m = r - Math.abs(dy);
    var z = r > 0 ? Math.sqrt(Math.max(0, r * r - dy * dy)) : 0;
    return { m: m, z: z, r: r, dy: dy, t: t, th: r > 0 ? Math.asin(cl(dy / r, -1, 1)) : 0 };
  }
  function ell(x, y, a, b) { var e = (x * x) / (a * a) + (y * y) / (b * b), s = Math.sqrt(e); return { e: e, m: (1 - s) * Math.min(a, b), z: Math.sqrt(Math.max(0, 1 - e)) }; }
  function stem(x, y, x0, x1, yc, r) { if (x < x0 || x > x1) return null; var m = r - Math.abs(y - yc); if (m < -1) return null; return { m: Math.min(m, x - x0 + .6, x1 - x + 3), z: Math.sqrt(Math.max(0, r * r - (y - yc) * (y - yc))) + 1.2, c: [88, 116, 46], g: .45 }; }
  var GREEN_STEM = [92, 120, 48];

  ` + raw.slice(raw.indexOf("var SHAPES = {"), raw.indexOf("function build(")) + `

  function renderPixels(kind, col, v) {
    var D = SHAPES[kind] || SHAPES.plum, pad = 8, W = Math.ceil((D.w + pad * 2) * RES), H = Math.ceil((D.h + pad * 2) * RES);
    var K = { N: noise(hsh(kind) + v * 977), N2: noise(hsh(kind) + v * 977 + 51), v: v, base: rgb(col) };
    var n = W * H, Z = new Float32Array(n), M = new Float32Array(n), CR = new Float32Array(n * 3), GL = new Float32Array(n), TR = new Float32Array(n);
    var ox = D.w / 2 + pad, oy = D.h / 2 + pad, i = 0, px, py, o;
    for (py = 0; py < H; py++) for (px = 0; px < W; px++, i++) {
      o = D.f((px + .5) / RES - ox, (py + .5) / RES - oy, K);
      if (!o) { M[i] = -9; continue; }
      var c = o.c || K.base; M[i] = o.m; Z[i] = o.m > 0 ? o.z : 0; CR[i * 3] = c[0]; CR[i * 3 + 1] = c[1]; CR[i * 3 + 2] = c[2]; GL[i] = o.g || 0; TR[i] = o.t || 0;
    }
    var d = new Uint8Array(W * H * 4);
    var lx = -.45, ly = -.62, lz = .64, ll = Math.sqrt(lx * lx + ly * ly + lz * lz); lx /= ll; ly /= ll; lz /= ll;
    var hx = lx, hy = ly, hz = lz + 1, hl = Math.sqrt(hx * hx + hy * hy + hz * hz); hx /= hl; hy /= hl; hz /= hl;
    for (py = 1; py < H - 1; py++) for (px = 1; px < W - 1; px++) {
      i = py * W + px; var a = cl(M[i] * RES + .5, 0, 1); if (a <= 0) continue;
      var dzx = (Z[i + 1] - Z[i - 1]) * RES / 2, dzy = (Z[i + W] - Z[i - W]) * RES / 2;
      var nx = -dzx, ny = -dzy, nz = 1, nl = Math.sqrt(nx * nx + ny * ny + 1); nx /= nl; ny /= nl; nz /= nl;
      var df = Math.max(0, nx * lx + ny * ly + nz * lz), sp = Math.pow(Math.max(0, nx * hx + ny * hy + nz * hz), 46) * GL[i];
      var tr = TR[i], lit = .46 + .66 * df + tr * .18, rim = .8 + .2 * cl(Z[i] / 3, 0, 1);
      var k = i * 4;
      d[k] = cl(CR[i * 3] * lit * rim + 255 * sp, 0, 255);
      d[k + 1] = cl(CR[i * 3 + 1] * lit * rim + 255 * sp, 0, 255);
      d[k + 2] = cl(CR[i * 3 + 2] * lit * rim + 245 * sp, 0, 255);
      d[k + 3] = a * 255 * (1 - tr * .14);
    }
    return { W, H, d };
  }
  this.renderPixels = renderPixels;
`;

vm.runInContext(scriptCode, ctx);

function makePNG(width, height, rgbaBuffer) {
  const IHDR = Buffer.alloc(13);
  IHDR.writeUInt32BE(width, 0);
  IHDR.writeUInt32BE(height, 4);
  IHDR[8] = 8;
  IHDR[9] = 6;
  IHDR[10] = 0;
  IHDR[11] = 0;
  IHDR[12] = 0;

  const rowSize = 1 + width * 4;
  const filtered = Buffer.alloc(height * rowSize);
  for (let y = 0; y < height; y++) {
    filtered[y * rowSize] = 0;
    rgbaBuffer.copy(filtered, y * rowSize + 1, y * width * 4, (y + 1) * width * 4);
  }

  const IDAT = zlib.deflateSync(filtered);

  function chunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(8 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4);
    data.copy(buf, 8);
    let c = 0xffffffff;
    const crcBuf = Buffer.concat([Buffer.from(type), data]);
    for (let i = 0; i < crcBuf.length; i++) {
      c ^= crcBuf[i];
      for (let k = 0; k < 8; k++) {
        c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
      }
    }
    buf.writeInt32BE((c ^ 0xffffffff) | 0, 8 + len);
    return buf;
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", IHDR),
    chunk("IDAT", IDAT),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

// Add soft drop shadow: blur alpha down and right
function addShadow(W, H, src) {
  const out = Buffer.alloc(W * H * 4);
  const ox = 2, oy = 4; // shadow offset
  // Shadow pass
  for (let y = oy; y < H; y++) {
    for (let x = ox; x < W; x++) {
      const srcIdx = ((y - oy) * W + (x - ox)) * 4;
      const alpha = src[srcIdx + 3];
      if (alpha > 10) {
        const dstIdx = (y * W + x) * 4;
        const shA = Math.round((alpha / 255) * 65); // 0.25 opacity
        out[dstIdx] = 20;
        out[dstIdx + 1] = 30;
        out[dstIdx + 2] = 16;
        out[dstIdx + 3] = shA;
      }
    }
  }
  // Source composite over shadow
  for (let i = 0; i < W * H; i++) {
    const sA = src[i * 4 + 3] / 255;
    if (sA > 0.01) {
      const dA = out[i * 4 + 3] / 255;
      const outA = sA + dA * (1 - sA);
      out[i * 4] = Math.round((src[i * 4] * sA + out[i * 4] * dA * (1 - sA)) / outA);
      out[i * 4 + 1] = Math.round((src[i * 4 + 1] * sA + out[i * 4 + 1] * dA * (1 - sA)) / outA);
      out[i * 4 + 2] = Math.round((src[i * 4 + 2] * sA + out[i * 4 + 2] * dA * (1 - sA)) / outA);
      out[i * 4 + 3] = Math.round(outA * 255);
    }
  }
  return out;
}

const SPRITES = [
  { slug: "salatalik", kind: "gherkin", color: "#4f6e24" },
  { slug: "kornison", kind: "gherkin", color: "#456620" },
  { slug: "beyaz-lahana", kind: "leaf", color: "#d6dc9c" },
  { slug: "kirmizi-lahana", kind: "leaf", color: "#7b2d6e" },
  { slug: "havuc", kind: "stick", color: "#e8742a" },
  { slug: "sivri-biber", kind: "pepper", color: "#6a9a35" },
  { slug: "kirmizi-biber", kind: "fatpep", color: "#c8302c" },
  { slug: "karnabahar", kind: "floret", color: "#efe7cc" },
  { slug: "pancar", kind: "cube", color: "#8a1d45" },
  { slug: "yesil-domates", kind: "tomato", color: "#9fbf4a" },
  { slug: "ayva", kind: "apple", color: "#d2cb68" },
  { slug: "sarimsak", kind: "bulb", color: "#ece2c4" },
  { slug: "kuru-aci-biber", kind: "chili", color: "#b3261e" },
  { slug: "dereotu", kind: "leaf", color: "#3e6e28" },
  { slug: "defne-yapragi", kind: "leaf", color: "#5a7a3a" },
  { slug: "nohut", kind: "cube", color: "#d8c28a" },
  { slug: "hardal-tohumu", kind: "rpep", color: "#caa842" },
  { slug: "jalapeno", kind: "jalapeno", color: "#2f5e22" },
  { slug: "fasulye", kind: "bean", color: "#8fb04f" },
  { slug: "bamya", kind: "okra", color: "#6f8f3a" },
  { slug: "kelek", kind: "melon", color: "#b7c98a" },
  { slug: "acur", kind: "acur", color: "#a7c46a" },
  { slug: "kiraz-biberi", kind: "rpep", color: "#c8302c" },
];

const outDir = path.join(__dirname, "../public/images/sprites");
fs.mkdirSync(outDir, { recursive: true });

console.log("Generating 3D realistic pickle sprites...");
let count = 0;
for (const item of SPRITES) {
  for (let v = 0; v < 3; v++) {
    const res = ctx.renderPixels(item.kind, item.color, v);
    const withShadow = addShadow(res.W, res.H, Buffer.from(res.d.buffer));
    const png = makePNG(res.W, res.H, withShadow);
    const filename = `${item.slug}-${v}.png`;
    fs.writeFileSync(path.join(outDir, filename), png);
    count++;
  }
}
console.log(`Successfully generated ${count} 3D realistic sprites in public/images/sprites/`);
