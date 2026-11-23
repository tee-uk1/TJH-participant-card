/* =========================================================
 * DESIGN CONFIG (developers). Wording, links, hashtags, the focus list
 * and the post text live in config.js (SETTINGS) so anyone can edit them.
 * ========================================================= */
const CONFIG = {
  ...SETTINGS,
  // Logo variants (transparent PNGs). Each theme picks one via its `logo` key.
  logos: {
    white: 'assets/logo-white.png',
    lapis: 'assets/logo-lapis.png',
  },
  // Brand fonts: Lato (primary). To try Poppins (secondary) for headings,
  // add it to the Google Fonts link in index.html and set headingFont: 'Poppins'.
  headingFont: 'Lato',
  bodyFont: 'Lato',
  // Card themes. Every color is from the brand tonal maps: Lapis Lazuli
  // #333399, Deep Saffron #FF9933, Mute Green #99CC99 and their tints.
  // Lavender is the Lapis tint #CACAED.
  // The first theme is the default.
  themes: [
    {
      id: 'lavender', name: 'Lavender', swatch: ['#CACAED', '#FF9933'],
      bg: '#CACAED', band: '#FFFBF7', ring: '#FF9933', halo: '#FFFBF7',
      loop: '#FFFBF7', loopAlpha: 0.8,
      text: '#333399', muted: '#1F1F5E',
      avatarBg: '#F6F6FC', avatarText: '#333399',
      chipBg: '#333399', chipLabel: '#FFB66E', chipText: '#FFFBF7',
      ribbon: '#FFFBF7', ribbonAlpha: 0.95, cohort: '#438543', tags: '#333399',
      logo: 'lapis',
    },
    {
      id: 'lapis', name: 'Lapis', swatch: ['#1F1F5E', '#FF9933'],
      bg: '#1F1F5E', band: '#161641', ring: '#FF9933', halo: '#29297C',
      loop: '#5454C6', loopAlpha: 0.35,
      text: '#FFFBF7', muted: '#CACAED',
      avatarBg: '#333399', avatarText: '#FFFBF7',
      chipBg: '#FF9933', chipLabel: '#1F1F5E', chipText: '#1F1F5E',
      ribbon: '#333399', ribbonAlpha: 1, cohort: '#99CC99', tags: '#FFB66E',
      logo: 'white',
    },
  ],
  formats: {
    square:    { w: 1080, h: 1080 },
    landscape: { w: 1200, h: 627 },
  },
};

/* ========================================================= */

const $ = (id) => document.getElementById(id);
const canvas = $('card');
const ctx = canvas.getContext('2d');

const state = {
  themeId: CONFIG.themes[0].id,
  photo: null,   // HTMLImageElement
  zoom: 1,
  offset: { x: 0, y: 0 }, // photo pan, as a fraction of the photo circle's diameter
  avatar: null,            // where the photo circle was last drawn {cx, cy, r}
  exporting: false,        // true while drawing the image people download/copy/share
  moving: false,           // "Move photo" mode: dragging on, page scroll over the card paused
  logos: {},     // variant name -> HTMLImageElement
};

/* ---------- helpers ---------- */

// Weights >= 600 use headingFont; lighter text uses bodyFont.
const font = (weight, size, family) => {
  const f = family || (weight >= 600 ? CONFIG.headingFont : CONFIG.bodyFont);
  return `${weight} ${size}px "${f}", system-ui, sans-serif`;
};

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Split text into lines that fit maxWidth; clamp to maxLines with an ellipsis. */
function wrap(text, maxWidth, maxLines) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth || !line) {
      line = test;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);

  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1];
    while (last.length && ctx.measureText(last + '…').width > maxWidth) last = last.slice(0, -1);
    kept[maxLines - 1] = last.trimEnd() + '…';
    return kept;
  }
  return lines;
}

/** Choose the largest font size (down to min) at which text fits within maxLines. */
function fitText(text, weight, size, minSize, maxWidth, maxLines) {
  let s = size;
  for (; s > minSize; s -= 2) {
    ctx.font = font(weight, s);
    const words = text.split(/\s+/).filter(Boolean);
    const longestWord = Math.max(0, ...words.map((w) => ctx.measureText(w).width));
    if (longestWord <= maxWidth && wrap(text, maxWidth, 99).length <= maxLines) break;
  }
  ctx.font = font(weight, s);
  return { size: s, lines: wrap(text, maxWidth, maxLines) };
}

function getData() {
  const v = (id) => $(id).value.trim();
  return {
    fullName: v('fullName') || 'Your Name',
    role: v('role'),
    company: v('company'),
    country: v('country'),
    cohort: v('cohort'),          // e.g. "Q4 2026"
    focus: v('focus'),
    format: document.querySelector('input[name="format"]:checked').value,
  };
}

/* ---------- drawing primitives ---------- */

// Canvas letter-spacing isn't supported everywhere (e.g. older Safari); skip it there.
const HAS_LETTER_SPACING = 'letterSpacing' in CanvasRenderingContext2D.prototype;
function withLetterSpacing(px, fn) {
  if (HAS_LETTER_SPACING) ctx.letterSpacing = `${px}px`;
  fn();
  if (HAS_LETTER_SPACING) ctx.letterSpacing = '0px';
}

/** Thick arc with a rounded tail and an arrowhead at its end (clockwise). */
function drawLoopArrow(cx, cy, r, start, end, width, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, r, start, end);
  ctx.stroke();

  // Arrowhead: tangent points along the clockwise direction of travel
  const px = cx + Math.cos(end) * r;
  const py = cy + Math.sin(end) * r;
  const tx = -Math.sin(end), ty = Math.cos(end); // tangent
  const nx = Math.cos(end), ny = Math.sin(end);  // radial
  const len = width * 1.5, half = width * 1.15;
  ctx.beginPath();
  ctx.moveTo(px + tx * len, py + ty * len);
  ctx.lineTo(px + nx * half, py + ny * half);
  ctx.lineTo(px - nx * half, py - ny * half);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Rounded ribbon that ends in an arrow point on the right ("moving forward"). */
function drawRibbonArrow(x, y, w, h, color, alpha = 1) {
  const tip = h * 0.55;
  const r = h / 2;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - tip, y);
  ctx.lineTo(x + w, y + h / 2);
  ctx.lineTo(x + w - tip, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.arc(x + r, y + r, r, Math.PI / 2, Math.PI * 1.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Draw the logo `h` px tall. align: left | center | right (x is that edge/center). */
function drawBrand(t, x, top, h, align = 'left') {
  const logo = state.logos[t.logo];
  if (logo) {
    const w = (logo.width / logo.height) * h;
    const left = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
    ctx.drawImage(logo, left, top, w, h);
    return;
  }
  ctx.fillStyle = t.text;
  ctx.font = font(900, h * 0.25);
  ctx.textAlign = align;
  ctx.fillText(CONFIG.org.toUpperCase(), x, top + h * 0.5);
  ctx.textAlign = 'left';
}

function drawAvatar(t, cx, cy, r) {
  // Soft outer halo, then the Saffron ring
  ctx.beginPath();
  ctx.arc(cx, cy, r + 20, 0, Math.PI * 2);
  ctx.fillStyle = t.halo;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, r + 10, 0, Math.PI * 2);
  ctx.fillStyle = t.ring;
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  state.avatar = { cx, cy, r };
  if (state.photo) {
    // Cover-fit the photo into the circle, then apply zoom around the center
    const img = state.photo;
    const d = r * 2;
    const base = Math.max(d / img.width, d / img.height) * state.zoom;
    const w = img.width * base;
    const h = img.height * base;
    // Pan: clamp so the photo always covers the circle, and store the clamped value
    const maxX = (w - d) / 2 / d, maxY = (h - d) / 2 / d;
    state.offset.x = Math.max(-maxX, Math.min(maxX, state.offset.x));
    state.offset.y = Math.max(-maxY, Math.min(maxY, state.offset.y));
    ctx.drawImage(img, cx - w / 2 + state.offset.x * d, cy - h / 2 + state.offset.y * d, w, h);
  } else {
    ctx.fillStyle = t.avatarBg;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    const logo = state.logos[t.logo];
    if (state.exporting && logo) {
      // No photo in the final image: use the theme's Job Hackers logo instead
      const h = r * 1.22;
      const w = (logo.width / logo.height) * h;
      ctx.drawImage(logo, cx - w / 2, cy - h / 2, w, h);
    } else {
      // Preview only: show where the photo will go
      ctx.fillStyle = t.avatarText;
      ctx.font = font(900, r * 0.24);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      withLetterSpacing(r * 0.02, () => {
        ctx.fillText('YOUR PHOTO', cx, cy - r * 0.15);
        ctx.fillText('HERE', cx, cy + r * 0.17);
      });
      ctx.textBaseline = 'alphabetic';
    }
  }
  ctx.restore();
}

/** Filled "BUILDING SKILLS IN · …" chip centered on cx. Returns its bottom y. */
function drawFocusChip(t, focus, cx, top, s, maxW) {
  const h = 46 * s;
  const padX = 22 * s;
  ctx.font = font(900, 20 * s);
  const label = CONFIG.focusLabel.toUpperCase();
  const gap = 12 * s;
  const labelW = ctx.measureText(label).width;
  ctx.font = font(700, 24 * s);
  let text = focus;
  while (text.length > 1 && labelW + gap + ctx.measureText(text).width + padX * 2 > maxW) text = text.slice(0, -2) + '…';
  const w = labelW + gap + ctx.measureText(text).width + padX * 2;
  const x = cx - w / 2;

  ctx.fillStyle = t.chipBg;
  roundRect(x, top, w, h, h / 2);
  ctx.fill();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = t.chipLabel;
  ctx.font = font(900, 20 * s);
  ctx.fillText(label, x + padX, top + h / 2 + 1);
  ctx.fillStyle = t.chipText;
  ctx.font = font(700, 24 * s);
  ctx.fillText(text, x + padX + labelW + gap, top + h / 2 + 1);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'center';
  return top + h;
}

function roleLine(d) {
  if (d.role && d.company) return `${d.role} · ${d.company}`;
  return d.role || d.company || '';
}

function cohortLine(d) {
  return d.cohort ? `${d.cohort} Cohort`.toUpperCase() : '';
}

/** Small location pin whose tip sits at (x, baseY). */
function drawPin(x, baseY, h, color, holeColor) {
  const r = h * 0.36;
  const cy = baseY - h + r;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, cy, r, 0.78 * Math.PI, 2.22 * Math.PI);
  ctx.lineTo(x, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = holeColor;
  ctx.beginPath();
  ctx.arc(x, cy, r * 0.42, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Name, then country (with a pin), then role · organization, then the focus
 * chip, all centered on cx from `top`. With `dry` set it only measures.
 * `sc` scales every size so the same code serves both formats.
 * Returns the y of the bottom of the block.
 */
function drawPersonBlock(d, t, cx, top, maxW, sc, dry = false) {
  ctx.textAlign = 'center';

  // Name: big and bold. Shrink to stay on one line; wrap to two only for very long names
  const name = d.fullName.toUpperCase();
  let nf = fitText(name, 900, 74 * sc, 46 * sc, maxW, 1);
  ctx.font = font(900, nf.size);
  if (wrap(name, maxW, 99).length > 1) nf = fitText(name, 900, 54 * sc, 36 * sc, maxW, 2);
  const nameLH = nf.size * 1.04;
  let base = top + nf.size * 0.9;
  if (!dry) {
    ctx.fillStyle = t.text;
    withLetterSpacing(1 * sc, () => nf.lines.forEach((l, i) => ctx.fillText(l, cx, base + i * nameLH)));
  }
  base += (nf.lines.length - 1) * nameLH;

  // Country, directly under the name
  if (d.country) {
    const size = 26 * sc;
    base += size * 1.75;
    ctx.font = font(900, size);
    const text = d.country.toUpperCase();
    const spacing = 3 * sc;
    const textW = ctx.measureText(text).width + (HAS_LETTER_SPACING ? spacing * text.length : 0);
    const pinW = size * 0.75, gap = size * 0.4;
    const startX = cx - (pinW + gap + textW) / 2;
    if (!dry) {
      drawPin(startX + pinW / 2, base, size * 1.05, t.ring, t.bg);
      ctx.fillStyle = t.muted;
      ctx.textAlign = 'left';
      ctx.font = font(900, size);
      withLetterSpacing(spacing, () => ctx.fillText(text, startX + pinW + gap, base));
      ctx.textAlign = 'center';
    }
  }

  // Role · organization
  const role = roleLine(d);
  if (role) {
    const rf = fitText(role, 700, 32 * sc, 20 * sc, maxW, 1);
    base += rf.size * 1.6;
    if (!dry) {
      ctx.fillStyle = t.text;
      ctx.fillText(rf.lines[0], cx, base);
    }
  }

  // Focus chip
  if (d.focus) {
    const chipTop = base + 26 * sc;
    base = dry ? chipTop + 46 * sc * 1.05 : drawFocusChip(t, d.focus, cx, chipTop, sc * 1.05, maxW);
  }
  return base;
}

/** Cohort line and the cardFooter items, centered on a forward-pointing ribbon. */
function drawFooter(d, t, cx, ribbonX, ribbonY, ribbonW, ribbonH, sc) {
  drawRibbonArrow(ribbonX, ribbonY, ribbonW, ribbonH, t.ribbon, t.ribbonAlpha);
  ctx.textAlign = 'center';
  const tags = CONFIG.cardFooter.join('   ·   ');
  const line = cohortLine(d);
  const maxW = ribbonW - ribbonH * 1.4;
  const mid = ribbonY + ribbonH / 2;
  if (line) {
    ctx.fillStyle = t.cohort;
    const f = fitText(line, 900, 28 * sc, 18 * sc, maxW, 1);
    withLetterSpacing(1.5 * sc, () => ctx.fillText(f.lines[0], cx, mid - 6 * sc));
    ctx.fillStyle = t.tags;
    ctx.font = font(900, 26 * sc);
    ctx.fillText(tags, cx, mid + 30 * sc);
  } else {
    ctx.fillStyle = t.tags;
    ctx.font = font(900, 28 * sc);
    ctx.fillText(tags, cx, mid + 10 * sc);
  }
}

/** Top band with the logo and a Saffron rule under it. */
function drawBand(t, W, h, logoH, logoX, align) {
  ctx.fillStyle = t.band;
  ctx.fillRect(0, 0, W, h);
  ctx.fillStyle = t.ring;
  ctx.fillRect(0, h, W, Math.max(5, h * 0.04));
  drawBrand(t, logoX, (h - logoH) / 2, logoH, align);
}

/* ---------- layouts ---------- */

function drawSquare(d, t, W, H) {
  const cx = W / 2;
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, W, H);

  // Background "iteration" loops, partly off-canvas, behind everything
  drawLoopArrow(-30, 600, 300, -0.42 * Math.PI, 0.38 * Math.PI, 54, t.loop, t.loopAlpha);
  drawLoopArrow(W + 40, 540, 280, 0.58 * Math.PI, 1.38 * Math.PI, 54, t.loop, t.loopAlpha); // arrowhead sits below the logo band

  drawBand(t, W, 150, 118, cx, 'center');

  // Headline
  ctx.textAlign = 'center';
  ctx.fillStyle = t.text;
  ctx.font = font(900, 34);
  withLetterSpacing(4, () => ctx.fillText(`${CONFIG.headlineIntro} the`.toUpperCase(), cx, 218));
  const hf = fitText(CONFIG.program.toUpperCase(), 900, 108, 70, W - 120, 1);
  ctx.fillText(hf.lines[0], cx, 318);

  // Photo (inside its sprint loop) and the person block, centered together
  // in the space between the headline and the footer ribbon
  const areaTop = 360, areaBottom = 935, gap = 26;
  const blockH = drawPersonBlock(d, t, cx, 0, W - 160, 1, true);
  // Shrink the photo if a long name plus every optional field won't fit
  const r = Math.max(84, Math.min(112, (areaBottom - areaTop - gap - blockH) / 2 - 56));
  const loopR = r + 46, extent = loopR + 10;
  const total = extent * 2 + gap + blockH;
  const ay = areaTop + Math.max(0, (areaBottom - areaTop - total) / 2) + extent;
  drawLoopArrow(cx, ay, loopR, -0.2 * Math.PI, 1.55 * Math.PI, 18, t.loop, Math.min(1, t.loopAlpha + 0.25));
  drawAvatar(t, cx, ay, r);
  drawPersonBlock(d, t, cx, ay + extent + gap, W - 160, 1);

  drawFooter(d, t, cx, 70, 955, W - 120, 96, 0.95);
}

function drawLandscape(d, t, W, H) {
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, W, H);

  drawLoopArrow(W + 30, 370, 230, 0.58 * Math.PI, 1.4 * Math.PI, 42, t.loop, t.loopAlpha); // arrowhead sits below the logo band

  drawBand(t, W, 96, 76, 40, 'left');
  // Headline in the band, right side
  ctx.textAlign = 'right';
  ctx.fillStyle = t.text;
  ctx.font = font(900, 22);
  withLetterSpacing(3, () => ctx.fillText(`${CONFIG.headlineIntro} the`.toUpperCase(), W - 44, 42));
  ctx.font = font(900, 40);
  ctx.fillText(CONFIG.program.toUpperCase(), W - 44, 80);

  // Left column: avatar in its loop
  const acx = 230, ay = 372, r = 112;
  drawLoopArrow(acx, ay, r + 46, -0.2 * Math.PI, 1.55 * Math.PI, 18, t.loop, Math.min(1, t.loopAlpha + 0.25));
  drawAvatar(t, acx, ay, r);

  // Right column: centered text
  const colX = 440, colW = W - colX - 50, cx = colX + colW / 2;
  const blockH = drawPersonBlock(d, t, cx, 0, colW, 0.8, true);
  drawPersonBlock(d, t, cx, 120 + Math.max(0, (360 - blockH) / 2), colW, 0.8);
  drawFooter(d, t, cx, colX, 500, colW, 92, 0.78);
}

/* ---------- render ---------- */

function render() {
  const d = getData();
  const t = CONFIG.themes.find((x) => x.id === state.themeId);
  const { w: W, h: H } = CONFIG.formats[d.format];
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }
  ctx.clearRect(0, 0, W, H);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';

  if (d.format === 'landscape') drawLandscape(d, t, W, H);
  else drawSquare(d, t, W, H);

  updatePost(d);
  $('alt-text').value = buildAltText(d);
  $('photo-nudge').hidden = !!state.photo;
  $('drag-hint').hidden = !state.photo;
  $('move-photo').hidden = !state.photo;
  const ready = !!$('fullName').value.trim();
  $('download').disabled = !ready;
  $('copy-image').disabled = !ready;
  $('share-image').disabled = !ready;
}

/* ---------- LinkedIn post skeleton ----------
 * Deliberately a skeleton, not a finished post: the [bracketed] parts are
 * prompts for people to answer in their own words, and the opening line
 * varies, so posts from the same cohort don't read like copies. */

const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));

let openerIndex = Math.floor(Math.random() * Math.max(1, CONFIG.postOpeners.length - 1));

function buildPost(d) {
  const vars = {
    cohort: d.cohort ? `the ${d.cohort} cohort` : 'the latest cohort',
    focus: d.focus,
    courseUrl: CONFIG.courseUrl,
  };
  vars.focusLine = d.focus ? fill(CONFIG.postFocus, vars) : CONFIG.postFocusMissing;
  return [
    fill(CONFIG.postOpeners[openerIndex], vars),
    ...CONFIG.postParagraphs.map((p) => fill(p, vars)),
    CONFIG.postHashtags.join(' '),
  ].join('\n\n');
}

function updateBracketStatus() {
  const n = ($('post-text').value.match(/\[[^\]]*\]/g) || []).length;
  const el = $('bracket-status');
  el.textContent = n
    ? `${n} part${n === 1 ? '' : 's'} in [brackets] left to personalize`
    : 'All personalized. Ready to post!';
  el.classList.toggle('done', n === 0);
}

function updatePost(d) {
  const post = $('post-text');
  if (post.dataset.edited !== 'true') post.value = buildPost(d);
  updateBracketStatus();
}

/* ---------- wiring ---------- */

function buildSwatches() {
  const wrapEl = $('swatches');
  CONFIG.themes.forEach((t) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', String(t.id === state.themeId));
    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.style.background = `linear-gradient(135deg, ${t.swatch[0]} 55%, ${t.swatch[1]} 55%)`;
    b.append(dot, t.name);
    b.addEventListener('click', () => {
      state.themeId = t.id;
      wrapEl.querySelectorAll('.swatch').forEach((s) => s.setAttribute('aria-checked', 'false'));
      b.setAttribute('aria-checked', 'true');
      render();
    });
    wrapEl.appendChild(b);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

$('card-form').addEventListener('change', render);
$('card-form').addEventListener('input', render);

$('post-text').addEventListener('input', (e) => {
  e.target.dataset.edited = 'true';
  updateBracketStatus();
});

$('new-opener').addEventListener('click', () => {
  const post = $('post-text');
  if (post.dataset.edited === 'true' &&
      !confirm('This will replace the text you have written so far. Continue?')) return;
  openerIndex = (openerIndex + 1) % CONFIG.postOpeners.length;
  post.dataset.edited = 'false';
  updatePost(getData());
});

/** Fill the cohort, focus and country inputs. */
function buildFormOptions() {
  const today = cohortToday();
  const current = quarterLabel(quarterOf(today));
  const cohortSel = $('cohort');
  cohortOptions(today).forEach((q) => {
    const label = quarterLabel(q);
    cohortSel.add(new Option(label, label, false, label === current));
  });

  const focusSel = $('focus');
  focusSel.add(new Option('Choose a focus…', ''));
  CONFIG.focusOptions.forEach((f) => focusSel.add(new Option(f, f)));

  const list = $('country-list');
  COUNTRIES.forEach((c) => list.appendChild(new Option(c)));
}

$('photo').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  try {
    state.photo = await loadImage(url);
    state.zoom = 1;
    state.offset = { x: 0, y: 0 };
    $('zoom').value = 1;
    $('photo-controls').hidden = false;
    setMoving(false);
    // Pulse the Move photo button a few times so people notice it
    const fab = $('move-photo');
    fab.classList.remove('pulse');
    requestAnimationFrame(() => requestAnimationFrame(() => fab.classList.add('pulse')));
  } catch {
    alert('Sorry, that image could not be read. Please try a JPG or PNG.');
  }
  render();
});

$('zoom').addEventListener('input', (e) => { state.zoom = parseFloat(e.target.value); render(); });

$('remove-photo').addEventListener('click', () => {
  state.photo = null;
  state.offset = { x: 0, y: 0 };
  $('photo').value = '';
  $('photo-controls').hidden = true;
  setMoving(false);
  render();
});

/**
 * The PNG people take away. It's drawn in "export" mode (the logo replaces
 * the "YOUR PHOTO HERE" placeholder), then the preview is redrawn.
 * toBlob copies the canvas as soon as it's called, so redrawing straight
 * after is safe.
 */
function exportBlob() {
  state.exporting = true;
  render();
  const blob = new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  state.exporting = false;
  render();
  return blob;
}

const slugify = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

$('download').addEventListener('click', () => {
  const name = $('fullName').value.trim() || 'participant';
  const slug = slugify(name);
  exportBlob().then((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `agile-mba-${slug}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
});

function showCopyStatus(msg) {
  const el = $('copy-status');
  el.textContent = msg;
  clearTimeout(showCopyStatus.timer);
  showCopyStatus.timer = setTimeout(() => (el.textContent = ''), 4000);
}

// Copy the card straight to the clipboard so it can be pasted into a LinkedIn post.
$('copy-image').addEventListener('click', async () => {
  if (!navigator.clipboard || !window.ClipboardItem) {
    showCopyStatus("Your browser can't copy images. Please use Download PNG instead.");
    return;
  }
  try {
    // Passing a promise keeps Safari happy (the clipboard write must start during the click)
    const blob = exportBlob();
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    showCopyStatus('Card copied! Paste it into your LinkedIn post with Ctrl+V (or ⌘V on Mac).');
  } catch {
    showCopyStatus("Couldn't copy the image. Please use Download PNG instead.");
  }
});

/* ---------- share sheet (phones): send the card straight to the LinkedIn app ---------- */
function cardFile() {
  return exportBlob().then((blob) => {
    const slug = slugify($('fullName').value.trim() || 'participant');
    return new File([blob], `agile-mba-${slug}.png`, { type: 'image/png' });
  });
}

(function setupShare() {
  // Only offer it where the browser can share image files (mostly phones and tablets)
  try {
    const test = new File([new Blob()], 'x.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [test] })) $('share-image').hidden = false;
  } catch { /* not supported */ }
})();

$('share-image').addEventListener('click', async () => {
  try {
    await navigator.share({ files: [await cardFile()] });
  } catch (err) {
    if (err && err.name !== 'AbortError') showCopyStatus("Couldn't open sharing. Please use Download PNG instead.");
  }
});

/* ---------- drag the photo to reposition it (mouse and touch) ---------- */
let drag = null;
const toCanvas = (e) => {
  const rect = canvas.getBoundingClientRect();
  return { x: (e.clientX - rect.left) * (canvas.width / rect.width), y: (e.clientY - rect.top) * (canvas.height / rect.height) };
};
/** Switch "Move photo" mode on or off. Off keeps normal page scrolling on phones. */
function setMoving(on) {
  state.moving = on && !!state.photo;
  ['move-photo', 'move-photo-form'].forEach((id) => {
    const btn = $(id);
    btn.textContent = state.moving ? '✓ Done' : '✥ Move photo';
    btn.setAttribute('aria-pressed', String(state.moving));
  });
  $('move-hint').hidden = !state.moving;
  canvas.classList.toggle('moving', state.moving);
  $('canvas-wrap').classList.toggle('moving', state.moving);
  if (!state.moving) endDrag();
}
$('move-photo').addEventListener('click', () => setMoving(!state.moving));
// The form's button also brings the card into view (on phones it's further down the page)
$('move-photo-form').addEventListener('click', () => {
  setMoving(!state.moving);
  if (state.moving) $('canvas-wrap').scrollIntoView({ behavior: 'smooth', block: 'center' });
});

canvas.addEventListener('pointerdown', (e) => {
  if (!state.moving || !state.photo || !state.avatar) return;
  const p = toCanvas(e);
  const { cx, cy, r } = state.avatar;
  if (Math.hypot(p.x - cx, p.y - cy) > r * 1.4) return; // only grab near the photo
  drag = { x: p.x, y: p.y };
  canvas.setPointerCapture(e.pointerId);
  canvas.classList.add('dragging');
  e.preventDefault();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = toCanvas(e);
  const d = state.avatar.r * 2;
  state.offset.x += (p.x - drag.x) / d;
  state.offset.y += (p.y - drag.y) / d;
  drag = p;
  render();
});
function endDrag() { drag = null; canvas.classList.remove('dragging'); }
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

/* ---------- alt text ---------- */
function buildAltText(d) {
  const name = $('fullName').value.trim() || 'A participant';
  const role = roleLine(d);
  let text = `Card announcing that ${name}${role ? `, ${role},` : ''} is taking part in ${CONFIG.org}' ${CONFIG.program}`;
  text += d.cohort ? ` (${d.cohort} cohort).` : '.';
  if (d.country) text += ` Location: ${d.country}.`;
  if (d.focus) text += ` ${CONFIG.focusLabel}: ${d.focus}.`;
  return text;
}

$('copy-alt').addEventListener('click', async () => {
  const btn = $('copy-alt');
  try {
    await navigator.clipboard.writeText($('alt-text').value);
    btn.textContent = 'Copied!';
  } catch {
    $('alt-text').select();
    btn.textContent = 'Press Ctrl+C to copy';
  }
  setTimeout(() => (btn.textContent = 'Copy text'), 2000);
});

$('copy-post').addEventListener('click', async () => {
  const btn = $('copy-post');
  try {
    await navigator.clipboard.writeText($('post-text').value);
    btn.textContent = 'Copied!';
    if (/\[[^\]]*\]/.test($('post-text').value)) btn.textContent = 'Copied. Fill in the [brackets] before posting!';
  } catch {
    $('post-text').select();
    btn.textContent = 'Press Ctrl+C to copy';
  }
  setTimeout(() => (btn.textContent = 'Copy text'), 2000);
});

(async function init() {
  buildSwatches();
  buildFormOptions();
  $('linkedin-page').href = CONFIG.linkedinPage;
  await Promise.all(Object.entries(CONFIG.logos).map(async ([key, src]) => {
    try { state.logos[key] = await loadImage(src); } catch { /* fall back to wordmark */ }
  }));
  render();
  // Re-render once web fonts are ready so the canvas uses the brand fonts
  try {
    await Promise.all([
      document.fonts.load(font(900, 40)),
      document.fonts.load(font(700, 40)),
      document.fonts.load(font(400, 40)),
    ]);
    await document.fonts.ready;
  } catch { /* system font fallback is fine */ }
  render();
})();
