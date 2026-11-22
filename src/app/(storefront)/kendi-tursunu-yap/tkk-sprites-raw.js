/* Gerçekçi turşu parçaları: her çeşit için yükseklik haritasından ışıklandırılmış küçük görseller (sprite) üretir.
 * TKKSPR.draw(ctx, kind, hexColor, variant) parçayı (0,0) merkezine çizer. Sonuçlar önbelleğe alınır. */
(function () {
  var RES = 2.6, CACHE = {};
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
  /* Uzun gövde: x ekseni boyunca yarıçap profili rf(t) ve eğri merkez çizgisi cy(t) (t = x/L) */
  function tube(x, y, L, rf, cy) {
    var t = x / L; if (t < -1.02 || t > 1.02) return null;
    var r = Math.max(0, rf(t)), dy = y - (cy ? cy(t) : 0), m = r - Math.abs(dy);
    var z = r > 0 ? Math.sqrt(Math.max(0, r * r - dy * dy)) : 0;
    return { m: m, z: z, r: r, dy: dy, t: t, th: r > 0 ? Math.asin(cl(dy / r, -1, 1)) : 0 };
  }
  function ell(x, y, a, b) { var e = (x * x) / (a * a) + (y * y) / (b * b), s = Math.sqrt(e); return { e: e, m: (1 - s) * Math.min(a, b), z: Math.sqrt(Math.max(0, 1 - e)) }; }
  function stem(x, y, x0, x1, yc, r) { if (x < x0 || x > x1) return null; var m = r - Math.abs(y - yc); if (m < -1) return null; return { m: Math.min(m, x - x0 + .6, x1 - x + 3), z: Math.sqrt(Math.max(0, r * r - (y - yc) * (y - yc))) + 1.2, c: [88, 116, 46], g: .45 }; }
  var GREEN_STEM = [92, 120, 48];

  var SHAPES = {
    gherkin: { w: 58, h: 24, f: function (x, y, K) {
      var L = 26 * (0.9 + K.v * .06), q = tube(x, y, L, function (t) { return 9.6 * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(t), 2.4)), .5); }, function (t) { return 2.4 * t * t - 1.2; });
      if (!q || q.m < -1) return null;
      var n = K.N(x * .7, y * .7), wart = sm(.7, .84, n), z = q.z + wart * .75 * sm(1, 3, q.z);
      var st = sm(.3, .8, .5 + .5 * Math.sin(q.th * 5.5 + K.N2(x * .1, 2) * 4));
      var c = mix(K.base, tint(K.base, 62, 58, 8), .34 * st);
      c = mix(c, add(K.base, -30), sm(.8, .92, n) * .55);
      if (q.t > .82) c = mix(c, tint(K.base, 40, 30, -10), sm(.82, 1, q.t) * .6);
      return { m: q.m, z: z, c: c, g: .8 };
    } },
    acur: { w: 62, h: 22, f: function (x, y, K) {
      var q = tube(x, y, 28, function (t) { return 8 * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(t), 3)), .45); }, function (t) { return 3 * Math.sin(t * 1.4 + K.v); });
      if (!q || q.m < -1) return null;
      var rib = Math.abs(Math.cos(q.th * 4)), z = q.z * (.86 + .14 * rib) + .4 * (K.N(x * .5, y * .5) - .5);
      var c = mix(add(K.base, -16), tint(K.base, 30, 30, 18), rib * .55);
      return { m: q.m, z: z, c: c, g: .55, t: .15 };
    } },
    pepper: { w: 72, h: 22, f: function (x, y, K) {
      var L = 29, cy = function (t) { return 2.6 * Math.sin(t * 1.6 + K.v * .8); };
      var s = stem(x, y, -38, -28, cy(-1) - .5, 2.1); if (s) return s;
      var q = tube(x, y, L, function (t) { return 7.4 * (1 - .8 * Math.pow((t + 1) / 2, 1.6)) * Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(t), 12))); }, cy);
      if (!q || q.m < -1) return null;
      var z = q.z + .9 * (fbm(K.N, x * .16, y * .45) - .5) - .7 * Math.exp(-Math.pow(q.dy / (q.r * .3 + .01), 2)) * sm(.4, .7, K.N2(x * .2, 5));
      var c = K.base; if (q.t < -.86) c = mix(c, GREEN_STEM, sm(-.86, -1, q.t) * .7);
      return { m: q.m, z: z, c: c, g: .9 };
    } },
    chili: { w: 44, h: 18, f: function (x, y, K) {
      var cy = function (t) { return 2 * Math.sin(t * 1.8 + K.v); };
      var s = stem(x, y, -23, -16, cy(-1), 1.7); if (s) return s;
      var q = tube(x, y, 17, function (t) { return 5.8 * (1 - .85 * Math.pow((t + 1) / 2, 1.3)) * Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(t), 10))); }, cy);
      if (!q || q.m < -1) return null;
      return { m: q.m, z: q.z + .5 * (K.N(x * .3, y * .5) - .5), c: K.base, g: .95 };
    } },
    jalapeno: { w: 50, h: 22, f: function (x, y, K) {
      var s = stem(x, y, -27, -18, -.5, 2.3); if (s) return s;
      var q = tube(x, y, 19, function (t) { return (8.6 - 2.8 * (t + 1) / 2) * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(t), 5)), .5); }, function (t) { return 1.2 * t * t; });
      if (!q || q.m < -1) return null;
      var cork = sm(.72, .78, K.N(x * .9, y * 2.2)) * sm(-.8, -.2, q.t) * .5;
      return { m: q.m, z: q.z + .4 * (K.N(x * .25, y * .4) - .5), c: mix(K.base, [150, 132, 92], cork), g: .95 };
    } },
    fatpep: { w: 60, h: 28, f: function (x, y, K) {
      var s = stem(x, y, -32, -24, 0, 2.4); if (s) return s;
      var q = tube(x, y, 25, function (t) { return 11 * (1 - .65 * Math.pow((t + 1) / 2, 1.8)) * Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(t), 8))); }, function (t) { return 1.5 * Math.sin(t * 2 + K.v); });
      if (!q || q.m < -1) return null;
      var lobe = Math.abs(Math.sin(q.th * 1.5)), z = q.z * (.85 + .15 * (1 - lobe)) + .9 * (fbm(K.N, x * .14, y * .3) - .5);
      return { m: q.m, z: z, c: K.base, g: .85, t: .1 };
    } },
    rpep: { w: 30, h: 30, f: function (x, y, K) {
      var a = Math.atan2(y, x), d = Math.sqrt(x * x + y * y), R = 11.8 * (1 + .065 * Math.cos(5 * a + K.v));
      var sd = Math.sqrt((x + 1.5) * (x + 1.5) + (y + 2) * (y + 2));
      if (sd < 2.6) return { m: 2.6 - sd + 3, z: 9 + (2.6 - sd), c: GREEN_STEM, g: .4 };
      var m = R - d; if (m < -1) return null;
      var z = Math.sqrt(Math.max(0, R * R - d * d)) * .85 - .9 * Math.pow(.5 - .5 * Math.cos(5 * a + K.v), 5) - 1.6 * Math.exp(-sd * sd / 14);
      var c = sd < 5 ? mix(K.base, add(K.base, -30), (5 - sd) / 5 * .6) : K.base;
      return { m: m, z: z, c: c, g: .95 };
    } },
    leaf: { w: 62, h: 38, f: function (x, y, K) {
      var e = (x / 27) * (x / 27) + (y / 14.5) * (y / 14.5), bn = (K.N(x * .08 + K.v * 3, y * .1) - .5) * .55;
      var m = (1 - Math.sqrt(e) + bn) * 12; if (m < -1) return null;
      var dv = Math.abs(y - 3.2 * Math.sin(x * .07 + K.v)), vm = Math.exp(-dv * .75);
      var ph = x * .11 - Math.abs(y - 3.2 * Math.sin(x * .07 + K.v)) * .17 + K.v, fr = ph - Math.floor(ph);
      var s2 = Math.exp(-Math.abs(fr - .5) * 16) * sm(1.2, 3, dv) * .7;
      var z = 2.4 * sm(0, 6, m) + 1.3 * (fbm(K.N2, x * .12, y * .14) - .5) + vm * 1.1 + s2 * .45;
      var c = mix(K.base, tint(K.base, 48, 50, 40), Math.max(vm * .85, s2 * .7));
      c = mix(c, add(K.base, -22), sm(.55, .9, K.N2(x * .2, y * .2)) * .25);
      return { m: m, z: z, c: c, g: .55, t: .45 };
    } },
    stick: { w: 58, h: 15, f: function (x, y, K) {
      var hl = 26 * (0.82 + K.v * .07), hw = 5.4, cr = 2.4, qx = Math.abs(x) - hl + cr, qy = Math.abs(y) - hw + cr;
      var sd = Math.sqrt(Math.max(qx, 0) * Math.max(qx, 0) + Math.max(qy, 0) * Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - cr, m = -sd;
      if (m < -1) return null;
      var z = 2.8 * sm(0, 2.8, m) + .25 * (K.N(x * .4, y * 1.2) - .5);
      var c = mix(K.base, add(K.base, -14), .5 + .5 * Math.sin(y * 2.4 + K.N(x * .05, y) * 3));
      c = mix(c, tint(K.base, 34, 30, 14), Math.exp(-Math.pow((y - .8) / 1.5, 2)) * .45);
      if (Math.abs(x) > hl - 2) c = mix(c, add(K.base, -24), .35);
      return { m: m, z: z, c: c, g: .6 };
    } },
    cube: { w: 28, h: 28, f: function (x, y, K) {
      var hs = 10.6 - K.v * .4, cr = 3, qx = Math.abs(x) - hs + cr, qy = Math.abs(y) - hs + cr;
      var sd = Math.sqrt(Math.max(qx, 0) * Math.max(qx, 0) + Math.max(qy, 0) * Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - cr, m = -sd;
      if (m < -1) return null;
      var d = Math.sqrt((x + 15 + K.v * 3) * (x + 15 + K.v * 3) + (y + 12) * (y + 12)), ring = .5 + .5 * Math.sin(d * 1.45 + K.N(x * .2, y * .2) * 2);
      return { m: m, z: 3.2 * sm(0, 3.6, m) + .3 * (K.N(x * .5, y * .5) - .5), c: mix(add(K.base, -12), tint(K.base, 52, 22, 40), ring * .32), g: .85 };
    } },
    floret: { w: 32, h: 34, f: function (x, y, K) {
      var C = [[-6, -3, 7.2], [6, -4, 7.6], [0, -10, 7], [-1, 1, 6.6], [4.5, 3, 5]], best = -9, bz = 0;
      for (var i = 0; i < C.length; i++) { var dx = x - C[i][0] - K.v * .6, dy = y - C[i][1], dd = Math.sqrt(dx * dx + dy * dy), mm = C[i][2] - dd; if (mm > best) best = mm; if (mm > 0) bz = Math.max(bz, Math.sqrt(C[i][2] * C[i][2] - dd * dd)); }
      if (best > -1) return { m: best, z: bz + .7 * (K.N(x * 1.1, y * 1.1) - .5), c: mix(K.base, add(K.base, -26), sm(.6, .85, K.N2(x * .6, y * .6)) * .5), g: .3 };
      if (y > 4 && y < 14 && Math.abs(x) < 3.4 - (y - 4) * .14) return { m: Math.min(3.4 - (y - 4) * .14 - Math.abs(x), 14 - y), z: 2.2 * Math.sqrt(Math.max(0, 1 - Math.pow(x / 3.4, 2))), c: mix(K.base, [214, 222, 176], .6), g: .3 };
      return null;
    } },
    bean: { w: 64, h: 13, f: function (x, y, K) {
      var q = tube(x, y, 28, function (t) { return 3.5 * (1 + .18 * Math.max(0, Math.sin(t * 13 + K.v))) * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(t), 4)), .5); }, function (t) { return 2.6 * t * t - 1.3; });
      if (!q || q.m < -1) return null;
      var seam = Math.exp(-Math.pow((q.dy + q.r * .55) / .5, 2)) * .35;
      return { m: q.m, z: q.z, c: mix(K.base, add(K.base, -35), seam), g: .6 };
    } },
    okra: { w: 58, h: 19, f: function (x, y, K) {
      var s = stem(x, y, -29, -23, 0, 2.6); if (s) { s.c = [110, 112, 62]; return s; }
      var q = tube(x, y, 24, function (t) { return 7.4 * (.18 + .82 * Math.pow(1 - (t + 1) / 2, .7)) * Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(t), 10))); }, function (t) { return 1.8 * t * t; });
      if (!q || q.m < -1) return null;
      var rib = Math.abs(Math.cos(q.th * 2.5 + .3)), z = q.z * (.8 + .2 * rib);
      var c = mix(add(K.base, -20), tint(K.base, 24, 26, 10), rib * .6); if (q.t < -.8) c = mix(c, [118, 110, 60], sm(-.8, -.95, q.t) * .8);
      return { m: q.m, z: z, c: c, g: .5 };
    } },
    corn: { w: 46, h: 16, f: function (x, y, K) {
      var q = tube(x, y, 20, function (t) { return 6.4 * (1 - .42 * (t + 1) / 2) * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(t), 5)), .5); });
      if (!q || q.m < -1) return null;
      var a = x * .45 + K.v, kx = a - Math.floor(a), b = q.th * 2.3 + .5 * Math.floor(a), ky = b - Math.floor(b);
      var kz = (1 - Math.pow(2 * kx - 1, 2)) * (1 - Math.pow(2 * ky - 1, 2));
      return { m: q.m, z: q.z + 1.1 * kz, c: mix(K.base, tint(K.base, -30, -40, -20), (1 - kz) * .45), g: .65 };
    } },
    clove: { w: 20, h: 28, f: function (x, y, K) {
      var t = y / 12; if (t < -1.02 || t > 1.02) return null;
      var wr = 7.2 * Math.sqrt(Math.max(0, 1 - t * t)) * (.5 + .5 * (t + 1) / 2 + .1), cx = 1.6 * t * t * (K.v % 2 ? 1 : -1), dx = x - cx, m = wr - Math.abs(dx);
      if (m < -1) return null;
      var c = mix(K.base, add(K.base, -14), .5 + .5 * Math.sin(dx * 3)); if (t > .85) c = mix(c, [190, 170, 120], sm(.85, 1, t) * .7);
      return { m: m, z: Math.sqrt(Math.max(0, wr * wr - dx * dx)), c: c, g: .75, t: .5 };
    } },
    bulb: { w: 30, h: 30, f: function (x, y, K) {
      var a = Math.atan2(y, x), d = Math.sqrt(x * x + y * y), R = 12 * (1 + .05 * Math.cos(7 * a + K.v));
      var m = R - d; if (m < -1) return null;
      var seg = Math.pow(.5 - .5 * Math.cos(7 * a + K.v), 4), z = Math.sqrt(Math.max(0, R * R - d * d)) - 1.1 * seg * sm(2, 8, d);
      var c = mix(K.base, [176, 150, 120], seg * .35); if (d < 2.4) c = [168, 140, 98];
      return { m: m, z: z, c: c, g: .5, t: .3 };
    } },
    melon: { w: 38, h: 30, f: function (x, y, K) {
      var E = ell(x, y, 16.5, 12.5); if (E.m < -1) return null;
      var s = sm(.42, .62, .5 + .5 * Math.sin(y / 12.5 * 3.14 * 3.5 + K.N(x * .1, y * .1) * 1.6));
      var c = mix(K.base, add(K.base, -55), s * .6); c = mix(c, tint(K.base, 40, 40, 30), sm(.78, .9, K.N2(x * .7, y * .7)) * .5);
      return { m: E.m, z: E.z * 10, c: c, g: .35 };
    } },
    plum: { w: 30, h: 28, f: function (x, y, K) {
      var E = ell(x, y, 12.4, 11.2); if (E.m < -1) return null;
      var z = E.z * 10 - .45 * Math.exp(-Math.pow((x - 2 - y * .2) / 1.3, 2)) * sm(.2, .8, E.z);
      var c = mix(K.base, tint(K.base, 30, 26, -10), sm(.5, 1, K.N(x * .15, y * .15)) * .35);
      return { m: E.m, z: z, c: mix(c, [220, 226, 200], E.z * .1), g: .8 };
    } },
    almond: { w: 42, h: 24, f: function (x, y, K) {
      var t = x / 19; if (Math.abs(t) > 1.02) return null;
      var wr = 10 * Math.sqrt(Math.max(0, 1 - t * t)) * (1 - .3 * Math.max(0, t)), m = wr - Math.abs(y - 1.5 * t * t);
      if (m < -1) return null;
      var c = mix(K.base, add(K.base, -24), K.N(x * 1.6, y * 1.6) * .35);
      return { m: m, z: Math.sqrt(Math.max(0, wr * wr - (y - 1.5 * t * t) * (y - 1.5 * t * t))) * .9, c: c, g: .12 };
    } },
    tomato: { w: 30, h: 30, f: function (x, y, K) {
      var a = Math.atan2(y + 3, x + 2), sd = Math.sqrt((x + 2) * (x + 2) + (y + 3) * (y + 3)), star = 4.6 * (.45 + .55 * Math.pow(Math.abs(Math.cos(2.5 * a + K.v)), 3));
      var E = ell(x, y, 12.2, 11.6); if (E.m < -1) return null;
      if (sd < star && E.m > 1) return { m: E.m, z: E.z * 10 + .8, c: [86, 120, 52], g: .3 };
      return { m: E.m, z: E.z * 10 - .5 * Math.pow(.5 - .5 * Math.cos(4 * Math.atan2(y, x)), 3), c: K.base, g: .95 };
    } },
    apple: { w: 30, h: 30, f: function (x, y, K) {
      var E = ell(x, y, 12.6, 12); if (E.m < -1) return null;
      var sd = Math.sqrt((x - 1) * (x - 1) + (y + 4) * (y + 4));
      var c = mix(K.base, tint(K.base, 40, 0, -20), sm(.45, .9, K.N(x * .12, y * .12)) * .4); if (sm(.8, .86, K.N2(x * 1.2, y * 1.2)) > .5) c = add(c, 26);
      if (sd < 1.6) c = [96, 70, 40];
      return { m: E.m, z: E.z * 10 - 1.8 * Math.exp(-sd * sd / 9), c: c, g: .55 };
    } },
    dolma: { w: 42, h: 24, f: function (x, y, K) {
      var q = tube(x, y, 17, function (t) { return 9.6 * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(t), 10)), .5); });
      if (!q || q.m < -1) return null;
      var ph = x * .09 + q.th * .5 + K.v, fr = ph - Math.floor(ph), vein = Math.exp(-Math.abs(fr - .5) * 12) * .5;
      var fold = Math.exp(-Math.pow((x - 6 * Math.sin(q.th * 1.2 + K.v)) / 1.3, 2));
      return { m: q.m, z: q.z - .8 * fold + .4 * vein, c: mix(mix(K.base, tint(K.base, 40, 44, 30), vein), add(K.base, -30), fold * .5), g: .55, t: .3 };
    } },
    eggdolma: { w: 52, h: 24, f: function (x, y, K) {
      var s = stem(x, y, -26, -19, 0, 3.2); if (s) { s.c = [96, 104, 58]; return s; }
      var E = ell(x, y, 21.5, 9.8); if (E.m < -1) return null;
      var slit = Math.abs(y + 1.2 - .8 * Math.sin(x * .2)) < 2.6 * Math.sqrt(Math.max(0, 1 - Math.pow(x / 15, 2)));
      if (slit) { var rice = sm(.62, .7, K.N(x * 1.3, y * 1.3)); return { m: E.m, z: E.z * 6 - 1.2, c: mix([196, 92, 50], [236, 226, 200], rice), g: .4 }; }
      return { m: E.m, z: E.z * 9, c: K.base, g: .95 };
    } }
  };

  function build(kind, col, v) {
    var D = SHAPES[kind] || SHAPES.plum, pad = 4, W = Math.ceil((D.w + pad * 2) * RES), H = Math.ceil((D.h + pad * 2) * RES);
    var K = { N: noise(hsh(kind) + v * 977), N2: noise(hsh(kind) + v * 977 + 51), v: v, base: rgb(col) };
    var n = W * H, Z = new Float32Array(n), M = new Float32Array(n), CR = new Float32Array(n * 3), GL = new Float32Array(n), TR = new Float32Array(n);
    var ox = D.w / 2 + pad, oy = D.h / 2 + pad, i = 0, px, py, o;
    for (py = 0; py < H; py++) for (px = 0; px < W; px++, i++) {
      o = D.f((px + .5) / RES - ox, (py + .5) / RES - oy, K);
      if (!o) { M[i] = -9; continue; }
      var c = o.c || K.base; M[i] = o.m; Z[i] = o.m > 0 ? o.z : 0; CR[i * 3] = c[0]; CR[i * 3 + 1] = c[1]; CR[i * 3 + 2] = c[2]; GL[i] = o.g || 0; TR[i] = o.t || 0;
    }
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var g = cv.getContext('2d'), img = g.createImageData(W, H), d = img.data;
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
    g.putImageData(img, 0, 0);
    var out = document.createElement('canvas'); out.width = W; out.height = H;
    var go = out.getContext('2d'); go.shadowColor = 'rgba(28,36,16,.38)'; go.shadowBlur = 2.6 * RES; go.shadowOffsetX = .8 * RES; go.shadowOffsetY = 1.8 * RES;
    go.drawImage(cv, 0, 0);
    return { cv: out, w: D.w + pad * 2, h: D.h + pad * 2 };
  }
  function get(kind, col, v) { var key = kind + col + (v | 0); return CACHE[key] || (CACHE[key] = build(kind, col, v | 0)); }
  window.TKKSPR = {
    kinds: SHAPES,
    draw: function (c, kind, col, v) { var s = get(kind, col, v); c.drawImage(s.cv, -s.w / 2, -s.h / 2, s.w, s.h); },
    warm: function (kind, col) { for (var v = 0; v < 3; v++) get(kind, col, v); }
  };
})();
