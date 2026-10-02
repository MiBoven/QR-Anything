// ========================================================================
// QR Anything — app.js
// All QR generation, styling, compositing and export happens client-side.
// ========================================================================

// ---------- Theme ----------
const root = document.documentElement;
const darkModeSwitch = document.getElementById('darkModeSwitch');
function setTheme(t) {
  root.setAttribute('data-theme', t);
  localStorage.setItem('qra-theme', t);
  darkModeSwitch.classList.toggle('on', t === 'dark');
}
setTheme(localStorage.getItem('qra-theme') || 'dark');

// ---------- Header: menu / fullscreen / brand ----------
function wireDropdown(toggleId, menuId) {
  const toggle = document.getElementById(toggleId);
  const menu = document.getElementById(menuId);
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = menu.hidden;
    document.querySelectorAll('.dropdown').forEach(m => { m.hidden = true; });
    menu.hidden = !willOpen;
  });
  return menu;
}
const dropdownMenu = wireDropdown('menuToggle', 'dropdownMenu');
document.addEventListener('click', (e) => {
  document.querySelectorAll('.dropdown').forEach(menu => {
    if (!menu.hidden && !menu.contains(e.target)) menu.hidden = true;
  });
});
document.getElementById('darkModeToggle').addEventListener('click', () => {
  setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
});
document.getElementById('fullscreenToggle').addEventListener('click', () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
  else document.exitFullscreen?.();
});
document.getElementById('brandHome').addEventListener('click', () => location.reload());

// ---------- Modals ----------
function wireModal(openBtnId, bgId, closeBtnId) {
  const bg = document.getElementById(bgId);
  document.getElementById(openBtnId).addEventListener('click', () => { bg.classList.add('open'); dropdownMenu.hidden = true; });
  document.getElementById(closeBtnId).addEventListener('click', () => bg.classList.remove('open'));
  bg.addEventListener('click', (e) => { if (e.target === bg) bg.classList.remove('open'); });
}
wireModal('settingsOpen', 'settingsModalBg', 'closeSettingsModal');
wireModal('aboutOpen', 'aboutModalBg', 'closeAboutModal');
document.getElementById('resetSettingsBtn').addEventListener('click', () => {
  if (confirm('Reset all saved settings for this app?')) {
    localStorage.removeItem('qra-settings');
    location.reload();
  }
});

// ---------- Data type fields ----------
const dataType = document.getElementById('dataType');
const typeFieldsEls = document.querySelectorAll('.type-fields');
const summaryRow = document.getElementById('summaryRow');
const contentSummary = document.getElementById('contentSummary');
const openDetailsBtn = document.getElementById('openDetailsBtn');
const detailsModalBg = document.getElementById('detailsModalBg');
const detailsTitle = document.getElementById('detailsTitle');

// Content types with several fields: one summary field in the card, full form in a modal
const MULTI_TYPES = {
  wifi:  { title: 'Wi-Fi network',   button: 'Details',   placeholder: 'Network name…' },
  vcard: { title: 'Contact (vCard)', button: 'Show card', placeholder: 'Contact name…' },
  email: { title: 'E-mail',          button: 'Details',   placeholder: 'Recipient…' },
  sms:   { title: 'SMS',             button: 'Details',   placeholder: 'Phone number…' },
};

function getSummaryText() {
  const v = id => document.getElementById(id).value.trim();
  switch (dataType.value) {
    case 'wifi':  return v('f-wifi-ssid');
    case 'vcard': return (v('f-vc-first') + ' ' + v('f-vc-last')).trim();
    case 'email': return v('f-em-to');
    case 'sms':   return v('f-sms-number');
  }
  return '';
}
function updateSummary() {
  contentSummary.value = getSummaryText();
}
function updateContentUI() {
  const type = dataType.value;
  const multi = MULTI_TYPES[type];
  typeFieldsEls.forEach(el => el.hidden = el.id !== 'fields-' + type);
  summaryRow.hidden = !multi;
  if (multi) {
    detailsTitle.textContent = multi.title;
    openDetailsBtn.textContent = multi.button;
    contentSummary.placeholder = multi.placeholder;
    updateSummary();
  }
}
function openDetails() { detailsModalBg.classList.add('open'); }
openDetailsBtn.addEventListener('click', openDetails);
contentSummary.addEventListener('click', openDetails);
document.getElementById('closeDetailsModal').addEventListener('click', () => detailsModalBg.classList.remove('open'));
detailsModalBg.addEventListener('click', (e) => { if (e.target === detailsModalBg) detailsModalBg.classList.remove('open'); });

dataType.addEventListener('change', () => {
  updateContentUI();
  scheduleRender();
});

function escVCard(s) { return (s || '').replace(/([,;\\])/g, '\\$1'); }

function buildData() {
  const type = dataType.value;
  switch (type) {
    case 'text':
      return document.getElementById('f-text').value;
    case 'url': {
      let v = document.getElementById('f-url').value.trim();
      if (v && !/^https?:\/\//i.test(v)) v = 'https://' + v;
      return v;
    }
    case 'wifi': {
      const ssid = document.getElementById('f-wifi-ssid').value;
      const pass = document.getElementById('f-wifi-pass').value;
      const enc = document.getElementById('f-wifi-enc').value;
      const hidden = document.getElementById('f-wifi-hidden').checked;
      if (!ssid) return '';
      return `WIFI:T:${enc};S:${escVCard(ssid)};${enc === 'nopass' ? '' : 'P:' + escVCard(pass) + ';'}H:${hidden ? 'true' : 'false'};;`;
    }
    case 'vcard': {
      const first = document.getElementById('f-vc-first').value;
      const last = document.getElementById('f-vc-last').value;
      const org = document.getElementById('f-vc-org').value;
      const phone = document.getElementById('f-vc-phone').value;
      const email = document.getElementById('f-vc-email').value;
      const url = document.getElementById('f-vc-url').value;
      if (!first && !last) return '';
      let lines = ['BEGIN:VCARD', 'VERSION:3.0', `N:${escVCard(last)};${escVCard(first)}`, `FN:${escVCard((first + ' ' + last).trim())}`];
      if (org) lines.push(`ORG:${escVCard(org)}`);
      if (phone) lines.push(`TEL:${escVCard(phone)}`);
      if (email) lines.push(`EMAIL:${escVCard(email)}`);
      if (url) lines.push(`URL:${escVCard(url)}`);
      lines.push('END:VCARD');
      return lines.join('\n');
    }
    case 'email': {
      const to = document.getElementById('f-em-to').value;
      const subject = document.getElementById('f-em-subject').value;
      const body = document.getElementById('f-em-body').value;
      if (!to) return '';
      const params = [];
      if (subject) params.push('subject=' + encodeURIComponent(subject));
      if (body) params.push('body=' + encodeURIComponent(body));
      return `mailto:${to}${params.length ? '?' + params.join('&') : ''}`;
    }
    case 'phone': {
      const p = document.getElementById('f-phone').value;
      return p ? `tel:${p}` : '';
    }
    case 'sms': {
      const num = document.getElementById('f-sms-number').value;
      const body = document.getElementById('f-sms-body').value;
      if (!num) return '';
      return `sms:${num}${body ? '?body=' + encodeURIComponent(body) : ''}`;
    }
  }
  return '';
}

// ---------- Social media detection ----------
const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram', match: /instagram\.com/i },
  { key: 'youtube', label: 'YouTube', match: /(youtube\.com|youtu\.be)/i },
  { key: 'tiktok', label: 'TikTok', match: /tiktok\.com/i },
  { key: 'facebook', label: 'Facebook', match: /facebook\.com/i },
  { key: 'x', label: 'X (Twitter)', match: /(x\.com|twitter\.com)/i },
  { key: 'whatsapp', label: 'WhatsApp', match: /(wa\.me|whatsapp\.com)/i },
  { key: 'linkedin', label: 'LinkedIn', match: /linkedin\.com/i },
  { key: 'spotify', label: 'Spotify', match: /spotify\.com/i },
  { key: 'github', label: 'GitHub', match: /github\.com/i },
  { key: 'pinterest', label: 'Pinterest', match: /pinterest\./i },
  { key: 'snapchat', label: 'Snapchat', match: /snapchat\.com/i },
  { key: 'threads', label: 'Threads', match: /threads\.net/i },
];
function detectSocial(dataStr) {
  return SOCIAL_PLATFORMS.find(p => p.match.test(dataStr)) || null;
}

// ---------- Style controls ----------
const styleEnabled = document.getElementById('styleEnabled');
const styleFields = document.getElementById('styleFields');
const dotType = document.getElementById('dotType');
const cornerType = document.getElementById('cornerType');
const dotColor = document.getElementById('dotColor');
const bgColor = document.getElementById('bgColor');
styleEnabled.addEventListener('change', () => { styleFields.hidden = !styleEnabled.checked; scheduleRender(); });
[dotType, cornerType].forEach(el => el.addEventListener('input', scheduleRender));
wireColorHex('dotColor', 'dotColorHex');
wireColorHex('bgColor', 'bgColorHex');
wireEyedropper('dotColorEyedropper', 'dotColor', 'dotColorHex');
wireEyedropper('bgColorEyedropper', 'bgColor', 'bgColorHex');

// Syncs a <input type=color> with a paired hex text field in both directions.
function wireColorHex(colorId, hexId) {
  const colorEl = document.getElementById(colorId);
  const hexEl = document.getElementById(hexId);
  colorEl.addEventListener('input', () => { hexEl.value = colorEl.value; scheduleRender(); });
  hexEl.addEventListener('input', () => {
    const v = hexEl.value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      colorEl.value = v.toLowerCase();
      scheduleRender();
    } else if (/^#[0-9a-fA-F]{3}$/.test(v)) {
      colorEl.value = ('#' + [...v.slice(1)].map(c => c + c).join('')).toLowerCase();
      scheduleRender();
    }
  });
}

// Lets the person sample a color from anywhere on screen (not just the page) via the
// browser's native eyedropper. Only Chromium-based desktop browsers support this
// (Chrome/Edge 95+) — the button stays hidden everywhere else, mobile included.
function wireEyedropper(btnId, colorId, hexId) {
  const btn = document.getElementById(btnId);
  if (!('EyeDropper' in window)) return; // stays hidden
  btn.hidden = false;
  btn.addEventListener('click', async () => {
    try {
      const result = await new EyeDropper().open();
      document.getElementById(colorId).value = result.sRGBHex;
      document.getElementById(hexId).value = result.sRGBHex;
      scheduleRender();
    } catch (err) { /* user pressed Escape — nothing to do */ }
  });
}

// ---------- Logo ----------
const logoEnabled = document.getElementById('logoEnabled');
const logoFields = document.getElementById('logoFields');
const logoFile = document.getElementById('logoFile');
let logoImage = null;
logoEnabled.addEventListener('change', () => { logoFields.hidden = !logoEnabled.checked; scheduleRender(); });
wireDropZone('logoDrop', 'logoFile', 'logoDropLabel', async (file) => {
  logoImage = file ? await loadImageFile(file) : null;
  scheduleRender();
});

// ---------- Background image ----------
const bgImageEnabled = document.getElementById('bgImageEnabled');
const bgImageFields = document.getElementById('bgImageFields');
const bgImageFile = document.getElementById('bgImageFile');
const bgImageOpacity = document.getElementById('bgImageOpacity');
const bgImageOpacityLabel = document.getElementById('bgImageOpacityLabel');
let backgroundImage = null;
bgImageEnabled.addEventListener('change', () => { bgImageFields.hidden = !bgImageEnabled.checked; scheduleRender(); });
wireDropZone('bgImageDrop', 'bgImageFile', 'bgImageDropLabel', async (file) => {
  backgroundImage = file ? await loadImageFile(file) : null;
  scheduleRender();
});
bgImageOpacity.addEventListener('input', () => {
  bgImageOpacityLabel.textContent = bgImageOpacity.value + '%';
  scheduleRender();
});

function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// A JPG75-style drop zone: click/tap opens the file picker, or drag an image in.
// onFile(file|null) is called with the chosen file (or null if cleared).
function wireDropZone(dropId, inputId, labelId, onFile) {
  const drop = document.getElementById(dropId);
  const input = document.getElementById(inputId);
  const label = document.getElementById(labelId);

  function setFile(file) {
    label.textContent = file ? file.name : 'Tap to choose an image';
    onFile(file || null);
  }

  input.addEventListener('change', () => setFile(input.files[0] || null));

  ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => {
    e.preventDefault(); drop.classList.add('drag');
  }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => {
    e.preventDefault(); drop.classList.remove('drag');
  }));
  drop.addEventListener('drop', e => {
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      try {
        // reflect the dropped file in the <input> too, so it stays in sync
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
      } catch (err) { /* older browsers: input stays out of sync, harmless */ }
      setFile(file);
    }
  });
}

// ---------- Frame ----------
const frameEnabled = document.getElementById('frameEnabled');
const frameFields = document.getElementById('frameFields');
const frameColor = document.getElementById('frameColor');
const frameColorRow = document.getElementById('frameColorRow');
const frameColorSync = document.getElementById('frameColorSync');
const frameThickness = document.getElementById('frameThickness');
const frameRadius = document.getElementById('frameRadius');
const framePadding = document.getElementById('framePadding');
const frameMargin = document.getElementById('frameMargin');
frameEnabled.addEventListener('change', () => { frameFields.hidden = !frameEnabled.checked; scheduleRender(); });
frameColorSync.addEventListener('change', () => { frameColorRow.hidden = frameColorSync.checked; scheduleRender(); });
[frameThickness, frameRadius, framePadding, frameMargin].forEach(el => el.addEventListener('input', scheduleRender));
wireColorHex('frameColor', 'frameColorHex');
wireEyedropper('frameColorEyedropper', 'frameColor', 'frameColorHex');

// Effective frame color: either the user's own choice, or synced to the code color
function getFrameColor(style) {
  return frameColorSync.checked ? style.dotColor : frameColor.value;
}

// ---------- Number steppers (up/down buttons for number inputs) ----------
document.querySelectorAll('.stepper-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.target);
    if (!target) return;
    const step = Number(btn.dataset.step);
    const min = target.min !== '' ? Number(target.min) : -Infinity;
    const max = target.max !== '' ? Number(target.max) : Infinity;
    const next = Math.min(max, Math.max(min, Number(target.value) + step));
    target.value = next;
    target.dispatchEvent(new Event('input', { bubbles: true }));
  });
});

// ---------- Title ----------
const titleEnabled = document.getElementById('titleEnabled');
const titleFields = document.getElementById('titleFields');
const titleText = document.getElementById('titleText');
const titlePosition = document.getElementById('titlePosition');
titleEnabled.addEventListener('change', () => { titleFields.hidden = !titleEnabled.checked; scheduleRender(); });
[titleText, titlePosition].forEach(el => el.addEventListener('input', scheduleRender));

// ---------- Social logo toggle ----------
const socialCard = document.getElementById('socialCard');
const socialLabel = document.getElementById('socialLabel');
const socialEnabled = document.getElementById('socialEnabled');
socialEnabled.addEventListener('change', scheduleRender);

// ---------- Data field inputs ----------
document.querySelectorAll('#fields-text, #fields-url, #fields-wifi, #fields-vcard, #fields-email, #fields-phone, #fields-sms')
  .forEach(section => section.querySelectorAll('input, textarea, select').forEach(el => {
    el.addEventListener('input', () => { updateSummary(); scheduleRender(); });
  }));

// ---------- QR base size / constants ----------
const QR_SIZE = 600;             // base QR module area in px
const MAX_LOGO_RATIO = 0.28;     // logo never larger than 28% of QR area

function getStyleValues() {
  if (styleEnabled.checked) {
    return { dotType: dotType.value, cornerType: cornerType.value, dotColor: dotColor.value, bgColor: bgColor.value };
  }
  return { dotType: 'square', cornerType: 'square', dotColor: '#000000', bgColor: '#ffffff' };
}

function drawPlaceholder(emoji, hint) {
  const ctx = previewCanvas.getContext('2d');
  previewCanvas.width = QR_SIZE; previewCanvas.height = QR_SIZE;
  ctx.fillStyle = getComputedStyle(root).getPropertyValue('--surface-2');
  ctx.fillRect(0, 0, QR_SIZE, QR_SIZE);
  ctx.textAlign = 'center';
  ctx.fillStyle = getComputedStyle(root).getPropertyValue('--text-secondary');
  ctx.font = '120px -apple-system, "Segoe UI", Roboto, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, QR_SIZE / 2, QR_SIZE / 2 - 50);
  ctx.font = '600 26px -apple-system, "Segoe UI", Roboto, sans-serif';
  wrapText(ctx, hint, QR_SIZE / 2, QR_SIZE / 2 + 70, QR_SIZE - 100, 34);
}

function wrapText(ctx, text, cx, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  const lines = [];
  words.forEach(word => {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => ctx.fillText(l, cx, startY + i * lineHeight));
}

// ---------- Core render pipeline ----------
const previewCanvas = document.getElementById('previewCanvas');
let renderTimer = null;
function scheduleRender() { clearTimeout(renderTimer); renderTimer = setTimeout(render, 150); }

// ---------- Collapsible preview ----------
const previewCollapseToggle = document.getElementById('previewCollapseToggle');
const previewCollapsible = document.getElementById('previewCollapsible');
const previewCollapseIcon = document.getElementById('previewCollapseIcon');
function setPreviewCollapsed(collapsed) {
  previewCollapsible.hidden = collapsed;
  previewCollapseIcon.textContent = collapsed ? '▸' : '▾';
  previewCollapseToggle.title = collapsed ? 'Expand preview' : 'Collapse preview';
}
previewCollapseToggle.addEventListener('click', () => {
  setPreviewCollapsed(!previewCollapsible.hidden);
  saveSettings();
});

// Real QR byte-capacity ceilings (version 40, byte mode) for the error
// correction levels this app uses. A logo forces level H, which lowers it.
const QR_MAX_BYTES = { Q: 1663, H: 1273 };

const charCounterEl = document.getElementById('charCounter');
function updateCharCounter(dataStr) {
  const useLogo = logoEnabled.checked && logoImage;
  const max = useLogo ? QR_MAX_BYTES.H : QR_MAX_BYTES.Q;
  const used = new TextEncoder().encode(dataStr || '').length;
  const remaining = max - used;
  if (remaining > 10) { charCounterEl.hidden = true; return { max, used, remaining }; }
  charCounterEl.hidden = false;
  charCounterEl.classList.remove('neutral', 'warn', 'over');
  if (remaining < 0) {
    charCounterEl.textContent = `${-remaining} Zeichen zu viel (max. ${max})`;
    charCounterEl.classList.add('over');
  } else {
    charCounterEl.textContent = `${remaining}/${max} Zeichen übrig`;
    charCounterEl.classList.add(remaining <= 5 ? 'warn' : 'neutral');
  }
  return { max, used, remaining };
}

let renderSeq = 0;

async function render() {
  const seq = ++renderSeq; // lets us drop results of superseded (older) renders
  const dataStr = buildData();
  document.getElementById('scanResult').hidden = true;

  // Social media detection (only relevant for link-like content)
  const social = detectSocial(dataStr);
  socialCard.hidden = !social;
  if (social) socialLabel.textContent = `${social.label} logo detected`;

  const counter = updateCharCounter(dataStr);
  updateChangedMarkers();

  // No content yet: show a friendly placeholder instead of attempting to
  // encode an empty string (which isn't valid per the QR standard).
  if (!dataStr) {
    drawPlaceholder('🐒', 'Hier erscheint dein QR-Code, sobald du oben etwas eingibst.');
    setPlaceholderState(true);
    saveSettings();
    return;
  }

  // Too long for what a QR code can hold at the current error-correction level
  if (counter.remaining < 0) {
    const useLogo = logoEnabled.checked && logoImage;
    drawPlaceholder('🥵', `${-counter.remaining} Zeichen zu viel — bitte kürzen${useLogo ? ' (mit Logo ist das Limit niedriger)' : ''}.`);
    setPlaceholderState(true);
    saveSettings();
    return;
  }

  const work = document.createElement('canvas');
  const ok = await composeQR(work, QR_SIZE);
  if (seq !== renderSeq) return; // a newer render took over

  if (!ok) {
    drawPlaceholder('⚠️', 'Dieser Inhalt kann nicht als QR-Code kodiert werden.');
    setPlaceholderState(true);
    saveSettings();
    return;
  }

  previewCanvas.width = work.width;
  previewCanvas.height = work.height;
  previewCanvas.getContext('2d').drawImage(work, 0, 0);
  render.lastData = dataStr;
  setPlaceholderState(false);
  saveSettings();
}

function setPlaceholderState(flag) {
  render.isPlaceholder = flag;
  previewCanvas.style.cursor = flag ? 'default' : 'zoom-in';
}

// Draws the complete composition (background image, QR, frame, badge, title)
// onto `canvas` at the given QR size. Everything scales with size / QR_SIZE,
// so the preview (600) and high-resolution exports look identical.
async function composeQR(canvas, size) {
  const dataStr = buildData();
  if (!dataStr) return false;
  const k = size / QR_SIZE;
  const S = v => Math.round(v * k);
  const useLogo = logoEnabled.checked && logoImage;
  const style = getStyleValues();
  const social = detectSocial(dataStr);

  // 1. The pure, styled QR code via qr-code-styling
  const qrOptions = {
    width: size,
    height: size,
    type: 'canvas',
    data: dataStr,
    margin: S(4),
    qrOptions: { errorCorrectionLevel: useLogo ? 'H' : 'Q' },
    dotsOptions: { color: style.dotColor, type: style.dotType },
    cornersSquareOptions: { color: style.dotColor, type: style.cornerType === 'dot' ? 'dot' : (style.cornerType === 'extra-rounded' ? 'extra-rounded' : 'square') },
    cornersDotOptions: { color: style.dotColor, type: style.cornerType === 'dot' ? 'dot' : 'square' },
    backgroundOptions: { color: (bgImageEnabled.checked && backgroundImage) ? 'rgba(0,0,0,0)' : style.bgColor },
  };
  if (useLogo) {
    qrOptions.image = logoImage.src;
    qrOptions.imageOptions = { imageSize: MAX_LOGO_RATIO, margin: S(8), crossOrigin: 'anonymous' };
  }

  let qrBitmap = null;
  try {
    const qr = new QRCodeStyling(qrOptions);
    const blob = await qr.getRawData('png'); // waits until the library has finished drawing
    if (!blob) return false;
    qrBitmap = await createImageBitmap(blob);
  } catch (err) {
    return false; // e.g. content too long for the encoder, or size too large for this device
  }

  // 2. Compose: background image -> frame -> QR -> badge -> title
  const pad = frameEnabled.checked ? S(Number(framePadding.value)) : 0;
  const frameW = frameEnabled.checked ? S(Number(frameThickness.value)) : 0;
  const margin = frameEnabled.checked ? S(Number(frameMargin.value)) : 0;
  const frameBlockSize = size + pad * 2 + frameW * 2; // QR + padding + frame stroke, no outer margin
  const innerSize = frameBlockSize + margin * 2;      // + the blank margin around the frame

  const hasTitle = titleEnabled.checked && titleText.value.trim();
  const titlePos = titlePosition.value;
  const titleSpace = hasTitle ? S(64) : 0;
  const horizontalTitle = hasTitle && (titlePos === 'left' || titlePos === 'right');

  const finalW = innerSize + (horizontalTitle ? titleSpace : 0);
  const finalH = innerSize + (!horizontalTitle && hasTitle ? titleSpace : 0);

  canvas.width = finalW;
  canvas.height = finalH;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, finalW, finalH);
  ctx.fillStyle = style.bgColor;
  ctx.fillRect(0, 0, finalW, finalH);

  const qrOriginX = hasTitle && titlePos === 'left' ? titleSpace : 0;
  const qrOriginY = hasTitle && titlePos === 'top' ? titleSpace : 0;

  // background image (behind the code, confined to the frame block — not the outer margin)
  if (bgImageEnabled.checked && backgroundImage) {
    ctx.save();
    ctx.globalAlpha = Number(bgImageOpacity.value) / 100;
    drawImageCover(ctx, backgroundImage, qrOriginX + margin, qrOriginY + margin, frameBlockSize, frameBlockSize);
    ctx.restore();
  }

  // frame
  if (frameEnabled.checked) {
    const r = S(Number(frameRadius.value));
    roundRectStroke(ctx, qrOriginX + margin + frameW / 2, qrOriginY + margin + frameW / 2, frameBlockSize - frameW, frameBlockSize - frameW, r, getFrameColor(style), frameW);
  }

  // the QR code itself
  ctx.drawImage(qrBitmap, qrOriginX + margin + frameW + pad, qrOriginY + margin + frameW + pad, size, size);
  qrBitmap.close();

  // social platform logo badge
  if (social && socialEnabled.checked) {
    const badge = new Image();
    badge.src = `icons/social/${social.key}.svg`;
    await new Promise(res => { badge.onload = res; badge.onerror = res; });
    if (badge.width) {
      const bs = S(28);
      ctx.drawImage(badge, qrOriginX + innerSize - bs - S(6), qrOriginY + S(6), bs, bs);
    }
  }

  // title
  if (hasTitle) {
    ctx.fillStyle = style.dotColor;
    ctx.font = `600 ${S(28)}px -apple-system, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const text = titleText.value.trim();
    const maxW = S(20);
    if (titlePos === 'top') ctx.fillText(text, finalW / 2, titleSpace / 2, finalW - maxW);
    else if (titlePos === 'bottom') ctx.fillText(text, finalW / 2, innerSize + titleSpace / 2, finalW - maxW);
    else if (titlePos === 'left') {
      ctx.save(); ctx.translate(titleSpace / 2, finalH / 2); ctx.rotate(-Math.PI / 2);
      ctx.fillText(text, 0, 0, finalH - maxW); ctx.restore();
    } else if (titlePos === 'right') {
      ctx.save(); ctx.translate(innerSize + titleSpace / 2, finalH / 2); ctx.rotate(Math.PI / 2);
      ctx.fillText(text, 0, 0, finalH - maxW); ctx.restore();
    }
  }
  return true;
}

// Renders the composition into a fresh canvas at any size (used for exports / lightbox)
async function exportCanvas(size) {
  const c = document.createElement('canvas');
  return (await composeQR(c, size)) ? c : null;
}

function drawImageCover(ctx, img, x, y, w, h) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale, sh = h / scale;
  const sx = (img.width - sw) / 2, sy = (img.height - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function roundRectStroke(ctx, x, y, w, h, r, color, lineWidth) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

// ---------- Scan test (software-only, no camera) ----------
document.getElementById('scanTestBtn').addEventListener('click', () => {
  const resultEl = document.getElementById('scanResult');
  resultEl.hidden = false;
  if (render.isPlaceholder || !render.lastData) {
    resultEl.textContent = 'ℹ️ Gib zuerst Inhalt ein, um den Scan-Test durchzuführen.';
    resultEl.className = 'scan-result fail';
    return;
  }
  const ctx = previewCanvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, previewCanvas.width, previewCanvas.height);
  const code = jsQR(imageData.data, imageData.width, imageData.height);
  if (code && code.data === render.lastData) {
    resultEl.textContent = '✅ Scannable — decodes correctly.';
    resultEl.className = 'scan-result ok';
  } else if (code) {
    resultEl.textContent = '⚠️ Scannable, but decoded content differs — check styling.';
    resultEl.className = 'scan-result fail';
  } else {
    resultEl.textContent = '❌ Not scannable — reduce background visibility or logo size.';
    resultEl.className = 'scan-result fail';
  }
});

// ---------- Toast ----------
const toastEl = document.getElementById('toast');
let toastTimer = null;
function showToast(msg, ms = 2200) {
  toastEl.textContent = msg;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, ms);
}
function hideToast() { clearTimeout(toastTimer); toastEl.hidden = true; }

// ---------- Export ----------
const exportSize = document.getElementById('exportSize');
const exportMenu = wireDropdown('exportMenuToggle', 'exportMenu');
exportSize.addEventListener('click', (e) => e.stopPropagation());
exportSize.addEventListener('change', saveSettings);

function sanitizeFilenamePart(s) {
  return (s || '').replace(/[\\/:*?"<>|]/g, '').trim().replace(/\s+/g, '_');
}

// "qr-code--<first 20 chars of the text>", or for links:
// "qr-code--www--<first 15 chars after the last # (preferred) or last />"
function buildDownloadName() {
  const dataStr = buildData();
  if (dataType.value === 'url' && dataStr) {
    const rest = dataStr.replace(/^https?:\/\//i, '');
    const hashIdx = rest.lastIndexOf('#');
    const slashIdx = rest.lastIndexOf('/');
    let after;
    if (hashIdx !== -1) after = rest.slice(hashIdx + 1);
    else if (slashIdx !== -1) after = rest.slice(slashIdx + 1);
    else after = rest;
    const slug = sanitizeFilenamePart(after || rest).slice(0, 15);
    return `qr-code--www--${slug || 'link'}`;
  }
  const base = sanitizeFilenamePart(dataStr).slice(0, 20);
  return `qr-code--${base || 'code'}`;
}

async function downloadImage(mime, ext) {
  if (render.isPlaceholder) { showToast('No valid QR code to download yet'); return; }
  const size = Number(exportSize.value) || QR_SIZE;
  let canvas = previewCanvas;
  if (size !== QR_SIZE) {
    showToast('Creating image…', 30000);
    canvas = await exportCanvas(size);
    if (!canvas) { showToast('Could not create an image at this size'); return; }
  }
  canvas.toBlob(blob => {
    if (!blob) { showToast('Size too large for this device — try a smaller one'); return; }
    hideToast();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${buildDownloadName()}.${ext}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  }, mime, 0.95);
}
document.getElementById('downloadPng').addEventListener('click', () => downloadImage('image/png', 'png'));
document.getElementById('downloadJpg').addEventListener('click', () => downloadImage('image/jpeg', 'jpg'));

// Vector version of the plain styled code (no frame/title/background)
function makeSvgQR(dataStr) {
  const useLogo = logoEnabled.checked && logoImage;
  const style = getStyleValues();
  return new QRCodeStyling({
    width: QR_SIZE, height: QR_SIZE, type: 'svg', data: dataStr, margin: 4,
    qrOptions: { errorCorrectionLevel: useLogo ? 'H' : 'Q' },
    dotsOptions: { color: style.dotColor, type: style.dotType },
    cornersSquareOptions: { color: style.dotColor, type: style.cornerType === 'dot' ? 'dot' : (style.cornerType === 'extra-rounded' ? 'extra-rounded' : 'square') },
    cornersDotOptions: { color: style.dotColor, type: style.cornerType === 'dot' ? 'dot' : 'square' },
    backgroundOptions: { color: style.bgColor },
    ...(useLogo ? { image: logoImage.src, imageOptions: { imageSize: MAX_LOGO_RATIO, margin: 8 } } : {}),
  });
}
document.getElementById('downloadSvg').addEventListener('click', () => {
  exportMenu.hidden = true;
  const dataStr = buildData();
  if (!dataStr || render.isPlaceholder) { showToast('No valid QR code to download yet'); return; }
  makeSvgQR(dataStr).download({ name: buildDownloadName(), extension: 'svg' });
});

// ---------- Copy iframe code (menu) ----------
// An <iframe> whose srcdoc contains the QR code as an inline SVG, ready to paste into any website.
async function buildIframeCode() {
  const blob = await makeSvgQR(buildData()).getRawData('svg');
  let svg = await blob.text();
  svg = svg.replace(/<\?xml[^>]*\?>\s*/, '').replace(/<!DOCTYPE[^>]*>\s*/, '').replace(/\r?\n\s*/g, '').trim();
  const doc = '<!DOCTYPE html><style>html,body{margin:0}svg{display:block;width:100%;height:auto}</style>' + svg;
  const escaped = doc.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return `<iframe title="QR code" width="300" height="300" style="border:0" srcdoc="${escaped}"></iframe>`;
}

// Safari only allows clipboard writes inside the click gesture, so hand it a promise
async function copyText(textPromise) {
  if (window.ClipboardItem && navigator.clipboard && navigator.clipboard.write) {
    try {
      await navigator.clipboard.write([new ClipboardItem({
        'text/plain': textPromise.then(t => new Blob([t], { type: 'text/plain' })),
      })]);
      return true;
    } catch (err) { /* fall through to writeText */ }
  }
  try {
    await navigator.clipboard.writeText(await textPromise);
    return true;
  } catch (err) {
    return false;
  }
}
document.getElementById('copyIframeBtn').addEventListener('click', async () => {
  exportMenu.hidden = true;
  if (!buildData() || render.isPlaceholder) { showToast('No valid QR code to copy yet'); return; }
  const ok = await copyText(buildIframeCode());
  showToast(ok ? 'iframe code copied' : 'Could not copy — please try again');
});

// ---------- Lightbox: tap the QR code to view it large ----------
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
let lightboxUrl = null;
previewCanvas.addEventListener('click', async () => {
  if (render.isPlaceholder) return;
  const big = (await exportCanvas(1200)) || previewCanvas; // crisper than the small preview
  big.toBlob(blob => {
    if (!blob) return;
    lightboxUrl = URL.createObjectURL(blob);
    lightboxImg.src = lightboxUrl;
    lightbox.hidden = false;
  });
});
function closeLightbox() {
  lightbox.hidden = true;
  lightboxImg.removeAttribute('src');
  if (lightboxUrl) { URL.revokeObjectURL(lightboxUrl); lightboxUrl = null; }
}
lightbox.addEventListener('click', closeLightbox);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !lightbox.hidden) closeLightbox(); });

// ---------- Settings persistence ----------
const DATA_FIELD_IDS = [
  'f-text', 'f-url',
  'f-wifi-ssid', 'f-wifi-pass', 'f-wifi-enc', 'f-wifi-hidden',
  'f-vc-first', 'f-vc-last', 'f-vc-org', 'f-vc-phone', 'f-vc-email', 'f-vc-url',
  'f-em-to', 'f-em-subject', 'f-em-body',
  'f-phone',
  'f-sms-number', 'f-sms-body',
];
function getDataFieldValues() {
  const out = {};
  DATA_FIELD_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) out[id] = el.type === 'checkbox' ? el.checked : el.value;
  });
  return out;
}
function setDataFieldValues(vals) {
  if (!vals) return;
  DATA_FIELD_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (!el || !(id in vals)) return;
    if (el.type === 'checkbox') el.checked = !!vals[id];
    else el.value = vals[id];
  });
}

function saveSettings() {
  const s = {
    dataType: dataType.value, dotType: dotType.value, cornerType: cornerType.value,
    dotColor: dotColor.value, bgColor: bgColor.value,
    logoEnabled: logoEnabled.checked, bgImageEnabled: bgImageEnabled.checked, bgImageOpacity: bgImageOpacity.value,
    frameEnabled: frameEnabled.checked, frameColor: frameColor.value, frameColorSync: frameColorSync.checked,
    frameThickness: frameThickness.value,
    frameRadius: frameRadius.value, framePadding: framePadding.value, frameMargin: frameMargin.value,
    titleEnabled: titleEnabled.checked, titlePosition: titlePosition.value,
    socialEnabled: socialEnabled.checked, styleEnabled: styleEnabled.checked,
    exportSize: exportSize.value, previewCollapsed: previewCollapsible.hidden,
    dataFields: getDataFieldValues(),
  };
  localStorage.setItem('qra-settings', JSON.stringify(s));
}
function loadSettings() {
  let s;
  try { s = JSON.parse(localStorage.getItem('qra-settings')); } catch { return; }
  if (!s) return;
  dataType.value = s.dataType ?? dataType.value;
  styleEnabled.checked = !!s.styleEnabled;
  dotType.value = s.dotType ?? dotType.value;
  cornerType.value = s.cornerType ?? cornerType.value;
  dotColor.value = s.dotColor ?? dotColor.value;
  bgColor.value = s.bgColor ?? bgColor.value;
  logoEnabled.checked = !!s.logoEnabled;
  bgImageEnabled.checked = !!s.bgImageEnabled;
  bgImageOpacity.value = s.bgImageOpacity ?? bgImageOpacity.value;
  frameEnabled.checked = !!s.frameEnabled;
  frameColor.value = s.frameColor ?? frameColor.value;
  frameColorSync.checked = !!s.frameColorSync;
  frameThickness.value = s.frameThickness ?? frameThickness.value;
  frameRadius.value = s.frameRadius ?? frameRadius.value;
  framePadding.value = s.framePadding ?? framePadding.value;
  frameMargin.value = s.frameMargin ?? frameMargin.value;
  titleEnabled.checked = !!s.titleEnabled;
  titlePosition.value = s.titlePosition ?? titlePosition.value;
  socialEnabled.checked = s.socialEnabled !== false;
  exportSize.value = s.exportSize ?? exportSize.value;
  setPreviewCollapsed(!!s.previewCollapsed);
  setDataFieldValues(s.dataFields);

  updateContentUI();
  styleFields.hidden = !styleEnabled.checked;
  logoFields.hidden = !logoEnabled.checked;
  bgImageFields.hidden = !bgImageEnabled.checked;
  frameFields.hidden = !frameEnabled.checked;
  frameColorRow.hidden = frameColorSync.checked;
  titleFields.hidden = !titleEnabled.checked;
  bgImageOpacityLabel.textContent = bgImageOpacity.value + '%';
  document.getElementById('dotColorHex').value = dotColor.value;
  document.getElementById('bgColorHex').value = bgColor.value;
  document.getElementById('frameColorHex').value = frameColor.value;
}

// ---------- Click-a-label-to-reset ----------
const FIELD_DEFAULTS = {
  dotType: 'square',
  cornerType: 'square',
  dotColor: '#000000',
  bgColor: '#ffffff',
  frameColor: '#000000',
  frameThickness: '8',
  frameRadius: '16',
  framePadding: '20',
  frameMargin: '12',
  titlePosition: 'bottom',
  bgImageOpacity: '30',
  exportSize: '600',
};

// Shows a small blue dot next to a reset-label's name whenever its value
// no longer matches the default (the label is also the click-to-reset control).
function updateChangedMarkers() {
  document.querySelectorAll('.reset-label').forEach(label => {
    const id = label.dataset.target;
    if (!(id in FIELD_DEFAULTS)) return;
    const el = document.getElementById(id);
    if (!el) return;
    label.classList.toggle('changed', String(el.value) !== String(FIELD_DEFAULTS[id]));
  });
}

document.querySelectorAll('.reset-label').forEach(label => {
  label.addEventListener('click', () => {
    const id = label.dataset.target;
    const el = document.getElementById(id);
    if (!el || !(id in FIELD_DEFAULTS)) return;
    el.value = FIELD_DEFAULTS[id];
    const hexEl = document.getElementById(id + 'Hex');
    if (hexEl) hexEl.value = FIELD_DEFAULTS[id];
    if (id === 'bgImageOpacity') bgImageOpacityLabel.textContent = FIELD_DEFAULTS[id] + '%';
    scheduleRender();
  });
});

// ---------- Init ----------
loadSettings();
updateContentUI();
render();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('service-worker.js').catch(() => {}));
}
