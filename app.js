/* =========================================================
 * CONFIG: edit this block to match The Job Hackers branding
 * ========================================================= */
const CONFIG = {
  org: 'The Job Hackers',
  program: 'Agile MBA™',
  headlineIntro: "I'm taking part in",
  quoteLabel: "What I'm looking forward to",
  // Logo variants (transparent PNGs). Each theme picks one via its `logo` key.
  logos: {
    white: 'assets/logo-white.png',
    lapis: 'assets/logo-lapis.png',
  },
  courseUrl: 'https://www.thejobhackers.org/participant/',
  cardHashtags: ['#AgileMBA', '#AlwaysAJobHacker'],                              // shown on the image
  hashtags: ['#AgileMBA', '#AlwaysAJobHacker', '#TheJobHackers', '#Agile', '#Scrum'], // used in the post
  // Usage counting (see README). Leave empty to turn counting off.
  // GoatCounter is free for nonprofits, uses no cookies and never receives
  // what people type: only anonymous events like "card downloaded".
  goatcounterCode: '',
  // "Skill improvement focus" dropdown, based on the Agile MBA™ curriculum.
  focusOptions: [
    'Agile foundations',
    'Scrum in practice',
    'Product ownership & value',
    'Flow, Kanban & WIP limits',
    'Systems thinking',
    'Estimation & uncertainty',
    'TDD, BDD & technical debt',
    'Psychological safety',
    'Leading Agile teams',
    'Helping teams adopt AI',
    'Scrum certification (PSM I)',
    'Moving into an Agile role',
  ],
  // Brand fonts: Lato is primary (and what the website uses for headings);
  // Poppins is the secondary brand font if you want a different heading feel.
  headingFont: 'Lato',
  bodyFont: 'Lato',
  // Brand palette: Lapis Lazuli #333399, Deep Saffron #FF9933,
  // Sunglow #FFCC33, Mute Green #99CC99 (tints from the brand tonal maps)
  // The first theme is the default. 'outline' draws the quote box like the
  // Lapis-bordered cards on the website.
  themes: [
    { id: 'website',       name: 'Website',         dark: false, bg1: '#FFFFFF', bg2: '#F6F6FC', accent: '#FF9933', text: '#333399', muted: '#4B4B81', pillText: '#FFFFFF', logo: 'lapis', accentText: '#D06800', quoteStyle: 'outline' },
    { id: 'lapis-saffron', name: 'Lapis & Saffron', dark: true,  bg1: '#333399', bg2: '#1F1F5E', accent: '#FF9933', text: '#FFFFFF', muted: '#CACAED', pillText: '#1F1F5E', logo: 'white' },
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

function drawLines(lines, x, y, lineHeight) {
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
  return y + lines.length * lineHeight;
}

function initials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
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
    goal: v('goal'),
    format: document.querySelector('input[name="format"]:checked').value,
  };
}

/* ---------- drawing primitives ---------- */

function drawBackground(t, W, H) {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, t.bg1);
  g.addColorStop(1, t.bg2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Decorative rings in the top-right corner
  ctx.save();
  ctx.strokeStyle = t.accent;
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    ctx.globalAlpha = 0.18 - i * 0.03;
    ctx.beginPath();
    ctx.arc(W, 0, H * 0.28 + i * H * 0.09, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // Accent bar along the bottom
  ctx.fillStyle = t.accent;
  ctx.fillRect(0, H - 12, W, 12);
}

/** Draw the logo with its top-left at (x, top), `h` px tall. Falls back to a wordmark. */
function drawBrand(t, x, top, h, align = 'left') {
  const logo = state.logos[t.logo];
  if (logo) {
    const w = (logo.width / logo.height) * h;
    ctx.drawImage(logo, align === 'right' ? x - w : x, top, w, h);
    return;
  }
  ctx.fillStyle = t.text;
  ctx.font = font(800, h * 0.25);
  ctx.textAlign = align;
  ctx.fillText(CONFIG.org.toUpperCase(), x, top + h * 0.5);
  ctx.textAlign = 'left';
}

function drawPill(t, text, edgeX, y, scale = 1, align = 'right') {
  ctx.font = font(700, 22 * scale);
  const padX = 22 * scale;
  const h = 46 * scale;
  const w = ctx.measureText(text.toUpperCase()).width + padX * 2;
  const x = align === 'right' ? edgeX - w : edgeX;
  ctx.fillStyle = t.accent;
  roundRect(x, y - h / 2 - 8 * scale, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = t.pillText;
  ctx.textBaseline = 'middle';
  ctx.fillText(text.toUpperCase(), x + padX, y - 8 * scale + 1);
  ctx.textBaseline = 'alphabetic';
}

function drawAvatar(t, name, cx, cy, r) {
  // Accent ring
  ctx.beginPath();
  ctx.arc(cx, cy, r + 10, 0, Math.PI * 2);
  ctx.fillStyle = t.accent;
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  if (state.photo) {
    // Cover-fit the photo into the circle, then apply zoom around the center
    const img = state.photo;
    const d = r * 2;
    const base = Math.max(d / img.width, d / img.height) * state.zoom;
    const w = img.width * base;
    const h = img.height * base;
    ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
  } else {
    ctx.fillStyle = t.bg2;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.fillStyle = t.text;
    ctx.font = font(800, r * 0.8);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials(name), cx, cy + r * 0.04);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }
  ctx.restore();
}

/** Outlined "Focus: …" chip. Returns the y of its bottom edge. */
function drawFocusChip(t, focus, x, top, s, maxW) {
  const h = 46 * s;
  const padX = 20 * s;
  ctx.font = font(700, 22 * s);
  const label = 'FOCUS  ';
  const labelW = ctx.measureText(label).width;
  ctx.font = font(400, 24 * s);
  let text = focus;
  while (text.length > 1 && labelW + ctx.measureText(text).width + padX * 2 > maxW) text = text.slice(0, -2) + '…';
  const w = labelW + ctx.measureText(text).width + padX * 2;

  roundRect(x, top, w, h, h / 2);
  ctx.strokeStyle = t.accent;
  ctx.lineWidth = 2 * s;
  ctx.stroke();

  ctx.textBaseline = 'middle';
  ctx.fillStyle = t.accentText || t.accent;
  ctx.font = font(700, 22 * s);
  ctx.fillText(label, x + padX, top + h / 2 + 1);
  ctx.fillStyle = t.text;
  ctx.font = font(400, 24 * s);
  ctx.fillText(text, x + padX + labelW, top + h / 2 + 1);
  ctx.textBaseline = 'alphabetic';
  return top + h;
}

/** Footer: "Q4 2026 Cohort · Country" on the left, hashtags on the right. */
function drawFooter(d, t, W, H, M, x, size, bottom) {
  ctx.font = font(700, size);
  ctx.textAlign = 'right';
  ctx.fillStyle = t.accentText || t.accent;
  const tags = CONFIG.cardHashtags.join('  ');
  ctx.fillText(tags, W - M, H - bottom);
  const tagsW = ctx.measureText(tags).width;
  ctx.textAlign = 'left';

  const left = [d.cohort && `${d.cohort} Cohort`, d.country].filter(Boolean).join('  ·  ');
  if (!left) return;
  ctx.fillStyle = t.muted;
  const f = fitText(left, 700, size, size * 0.7, W - M - x - tagsW - 30, 1);
  ctx.fillText(f.lines[0], x, H - bottom);
}

function roleLine(d) {
  if (d.role && d.company) return `${d.role} · ${d.company}`;
  return d.role || d.company || '';
}

function drawQuote(t, text, x, y, w, h, s) {
  if (t.quoteStyle === 'outline') {
    ctx.fillStyle = '#FFFFFF';
    roundRect(x, y, w, h, 22 * s);
    ctx.fill();
    ctx.strokeStyle = t.text;
    ctx.lineWidth = 2 * s;
    ctx.stroke();
  } else {
    ctx.fillStyle = t.dark ? 'rgba(255,255,255,0.08)' : 'rgba(51,51,153,0.07)';
    roundRect(x, y, w, h, 22 * s);
    ctx.fill();
    ctx.fillStyle = t.accent;
    roundRect(x, y, 8 * s, h, 4 * s);
    ctx.fill();
  }

  const pad = 36 * s;
  ctx.fillStyle = t.accentText || t.accent;
  ctx.font = font(700, 20 * s);
  ctx.fillText(CONFIG.quoteLabel.toUpperCase(), x + pad, y + pad + 14 * s);

  const maxLines = Math.max(1, Math.floor((h - pad * 2 - 40 * s) / (44 * s)));
  const fit = fitText(`“${text}”`, 400, 34 * s, 24 * s, w - pad * 2, maxLines);
  ctx.fillStyle = t.text;
  drawLines(fit.lines, x + pad, y + pad + 62 * s, fit.size * 1.3);
}

/* ---------- layouts ---------- */

function drawSquare(d, t, W, H) {
  const M = 80;
  drawBrand(t, M, 50, 140);
  drawPill(t, CONFIG.program, W - M, 128);

  // Headline
  ctx.fillStyle = t.muted;
  ctx.font = font(400, 40);
  ctx.fillText(CONFIG.headlineIntro, M, 262);
  ctx.fillStyle = t.text;
  ctx.font = font(800, 88);
  ctx.fillText(`the ${CONFIG.program}`, M, 360);

  // Avatar + name block
  const r = 140;
  const cy = d.goal ? 590 : 650;
  drawAvatar(t, d.fullName, M + r + 10, cy, r);

  // Measure name, role and focus first so the block can be centered on the avatar
  const tx = M + r * 2 + 70;
  const tw = W - tx - M;
  const name = fitText(d.fullName, 800, 64, 40, tw, 2);
  const nameLH = name.size * 1.1;
  const role = roleLine(d);
  const rf = role ? fitText(role, 400, 32, 24, tw, 2) : null;
  const roleLH = rf ? rf.size * 1.25 : 0;
  const chipH = 46;

  const blockH = name.lines.length * nameLH
    + (rf ? 10 + rf.lines.length * roleLH : 0)
    + (d.focus ? 18 + chipH : 0);
  let top = cy - blockH / 2;

  ctx.fillStyle = t.text;
  ctx.font = font(800, name.size);
  drawLines(name.lines, tx, top + name.size * 0.9, nameLH);
  top += name.lines.length * nameLH;

  if (rf) {
    top += 10;
    ctx.fillStyle = t.muted;
    ctx.font = font(400, rf.size);
    drawLines(rf.lines, tx, top + rf.size * 0.95, roleLH);
    top += rf.lines.length * roleLH;
  }

  if (d.focus) drawFocusChip(t, d.focus, tx, top + 18, 1, tw);

  if (d.goal) drawQuote(t, d.goal, M, 770, W - M * 2, 200, 1);

  drawFooter(d, t, W, H, M, M, 26, 50);
}

function drawLandscape(d, t, W, H) {
  const M = 60;
  const s = 0.72;

  // Avatar column
  const r = 135;
  drawAvatar(t, d.fullName, M + r + 10, H / 2 - 10, r);

  // Content column
  const x = M + r * 2 + 70;
  const w = W - x - M;
  drawPill(t, CONFIG.program, x, 82, s, 'left');
  drawBrand(t, W - M, 30, 96, 'right');

  ctx.fillStyle = t.muted;
  ctx.font = font(400, 28);
  ctx.fillText(`${CONFIG.headlineIntro} the ${CONFIG.program}`, x, 158);

  ctx.fillStyle = t.text;
  const name = fitText(d.fullName, 800, 58, 36, w, 1);
  let y = drawLines(name.lines, x, 226, name.size);

  const role = roleLine(d);
  if (role) {
    ctx.fillStyle = t.muted;
    const rf = fitText(role, 400, 28, 20, w, 1);
    y = drawLines(rf.lines, x, y + 8, rf.size);
  }

  if (d.focus) y = drawFocusChip(t, d.focus, x, y + 4, 0.8, w);

  if (d.goal) drawQuote(t, d.goal, x, y + 20, w, H - (y + 20) - 82, s);

  drawFooter(d, t, W, H, M, x, 20, 40);
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

  drawBackground(t, W, H);
  if (d.format === 'landscape') drawLandscape(d, t, W, H);
  else drawSquare(d, t, W, H);

  updatePost(d);
  $('download').disabled = !$('fullName').value.trim();
}

/* ---------- LinkedIn post skeleton ----------
 * Deliberately a skeleton, not a finished post: the [bracketed] parts are
 * prompts for people to answer in their own words, and the opening line
 * varies, so posts from the same cohort don't read like copies. */

const OPENERS = [
  (c) => `I've just joined ${c} of The Job Hackers' Agile MBA™! 🚀`,
  (c) => `New chapter: I'm taking part in the Agile MBA™ from The Job Hackers (${c}).`,
  (c) => `Back in learning mode 📚 I've signed up for The Job Hackers' Agile MBA™, ${c}.`,
  (c) => `Some personal news: I'm part of ${c} of the Agile MBA™ with The Job Hackers.`,
  (c) => `[Write your own opening line, e.g. a question or a moment that made you sign up]`,
];
let openerIndex = Math.floor(Math.random() * (OPENERS.length - 1));

function buildPost(d) {
  const cohort = d.cohort ? `the ${d.cohort} cohort` : 'the latest cohort';
  const focus = d.focus
    ? `My main focus: ${d.focus}.`
    : `My main focus: [the skill you most want to build, e.g. Scrum, flow or systems thinking].`;
  const goal = d.goal
    ? `${d.goal}`
    : `[What will you do differently at work once you've built that skill?]`;

  return [
    OPENERS[openerIndex](cohort),
    '',
    `Why now: [In a sentence or two, what made you sign up? A challenge at work, a career move, a team you want to help?]`,
    '',
    `${focus} ${goal}`,
    '',
    `Over six weeks of live sessions we'll cover [name 2 or 3 topics you're most curious about, e.g. Scrum, product development flow, systems thinking, psychological safety].`,
    '',
    `[Optional: thank someone who recommended the course, or invite your network to join a future cohort.]`,
    '',
    `The Job Hackers is a volunteer-led nonprofit that makes learning about modern knowledge work affordable for people around the world.`,
    '',
    `Find out more about the Agile MBA™: ${CONFIG.courseUrl}`,
    '',
    CONFIG.hashtags.join(' '),
  ].join('\n');
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
    b.title = t.name;
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-label', t.name);
    b.setAttribute('aria-checked', String(t.id === state.themeId));
    b.style.background = `linear-gradient(135deg, ${t.bg1} 50%, ${t.accent} 50%)`;
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
$('card-form').addEventListener('input', (e) => {
  if (e.target.id === 'goal') $('goal-counter').textContent = `${e.target.value.length}/160`;
  render();
});

$('post-text').addEventListener('input', (e) => {
  e.target.dataset.edited = 'true';
  updateBracketStatus();
});

$('new-opener').addEventListener('click', () => {
  const post = $('post-text');
  if (post.dataset.edited === 'true' &&
      !confirm('This will replace the text you have written so far. Continue?')) return;
  openerIndex = (openerIndex + 1) % OPENERS.length;
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
    $('zoom').value = 1;
    $('photo-controls').hidden = false;
  } catch {
    alert('Sorry, that image could not be read. Please try a JPG or PNG.');
  }
  render();
});

$('zoom').addEventListener('input', (e) => { state.zoom = parseFloat(e.target.value); render(); });

$('remove-photo').addEventListener('click', () => {
  state.photo = null;
  $('photo').value = '';
  $('photo-controls').hidden = true;
  render();
});

/* ---------- usage counting ----------
 * Sends anonymous counts only (no names, roles or other form data).
 * Does nothing until CONFIG.goatcounterCode is set. */
function loadCounter() {
  if (!CONFIG.goatcounterCode) return;
  const sc = document.createElement('script');
  sc.async = true;
  sc.src = 'https://gc.zgo.at/count.js';
  sc.dataset.goatcounter = `https://${CONFIG.goatcounterCode}.goatcounter.com/count`;
  document.head.appendChild(sc);
}

function countEvent(name) {
  if (!CONFIG.goatcounterCode || !window.goatcounter || !window.goatcounter.count) return;
  try { window.goatcounter.count({ path: name, title: name, event: true }); } catch { /* never block the user */ }
}

const slugify = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

$('download').addEventListener('click', () => {
  const d = getData();
  countEvent(`card-download/${slugify(d.cohort || 'no-cohort')}/${d.format}/${state.themeId}`);
  const name = $('fullName').value.trim() || 'participant';
  const slug = slugify(name);
  canvas.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `agile-mba-${slug}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }, 'image/png');
});

$('copy-post').addEventListener('click', async () => {
  const btn = $('copy-post');
  countEvent('post-copied');
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
  loadCounter();
  await Promise.all(Object.entries(CONFIG.logos).map(async ([key, src]) => {
    try { state.logos[key] = await loadImage(src); } catch { /* fall back to wordmark */ }
  }));
  render();
  // Re-render once web fonts are ready so the canvas uses the brand fonts
  try {
    await Promise.all([
      document.fonts.load(font(800, 40)),
      document.fonts.load(font(700, 40)),
      document.fonts.load(font(400, 40)),
    ]);
    await document.fonts.ready;
  } catch { /* system font fallback is fine */ }
  render();
})();
