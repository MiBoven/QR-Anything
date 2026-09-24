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
const menuToggle = document.getElementById('menuToggle');
const dropdownMenu = document.getElementById('dropdownMenu');
menuToggle.addEventListener('click', () => { dropdownMenu.hidden = !dropdownMenu.hidden; });
document.addEventListener('click', (e) => {
  if (!dropdownMenu.hidden && !dropdownMenu.contains(e.target) && e.target !== menuToggle) {
    dropdownMenu.hidden = true;
  }
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
dataType.addEventListener('change', () => {
  typeFieldsEls.forEach(el => el.hidden = el.id !== 'fields-' + dataType.value);
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
const dotType = document.getElementById('dotType');
const cornerType = document.getElementById('cornerType');
const dotColor = document.getElementById('dotColor');
const bgColor = document.getElementById('bgColor');
[dotType, cornerType, dotColor, bgColor].forEach(el => el.addEventListener('input', scheduleRender));

// ---------- Logo ----------
const logoEnabled = document.getElementById('logoEnabled');
const logoFields = document.getElementById('logoFields');
const logoFile = document.getElementById('logoFile');
let logoImage = null;
logoEnabled.addEventListener('change', () => { logoFields.hidden = !logoEnabled.checked; scheduleRender(); });
logoFile.addEventListener('change', async () => {
  const f = logoFile.files[0];
  if (!f) { logoImage = null; scheduleRender(); return; }
  logoImage = await loadImageFile(f);
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
bgImageFile.addEventListener('change', async () => {
  const f = bgImageFile.files[0];
  if (!f) { backgroundImage = null; scheduleRender(); return; }
  backgroundImage = await loadImageFile(f);
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

// ---------- Frame ----------
const frameEnabled = document.getElementById('frameEnabled');
const frameFields = document.getElementById('frameFields');
const frameColor = document.getElementById('frameColor');
const frameThickness = document.getElementById('frameThickness');
const frameRadius = document.getElementById('frameRadius');
const framePadding = document.getElementById('framePadding');
frameEnabled.addEventListener('change', () => { frameFields.hidden = !frameEnabled.checked; scheduleRender(); });
[frameColor, frameThickness, frameRadius, framePadding].forEach(el => el.addEventListener('input', scheduleRender));

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
  .forEach(section => section.querySelectorAll('input, textarea, select').forEach(el => el.addEventListener('input', scheduleRender)));

// ---------- QR base size / constants ----------
const QR_SIZE = 600;             // base QR module area in px
const MAX_LOGO_RATIO = 0.28;     // logo never larger than 28% of QR area

// ---------- Core render pipeline ----------
const previewCanvas = document.getElementById('previewCanvas');
let renderTimer = null;
function scheduleRender() { clearTimeout(renderTimer); renderTimer = setTimeout(render, 150); }

async function render() {
  const dataStr = buildData();
  document.getElementById('scanResult').hidden = true;

  // Social media detection (only relevant for link-like content)
  const social = detectSocial(dataStr);
  socialCard.hidden = !social;
  if (social) socialLabel.textContent = `${social.label} logo detected`;

  const useLogo = logoEnabled.checked && logoImage;

  // 1. Render the pure, styled QR code via qr-code-styling into an offscreen container.
  // A QR code is shown from the very start, even for an empty string.
  const qrOptions = {
    width: QR_SIZE,
    height: QR_SIZE,
    type: 'canvas',
    data: dataStr,
    margin: 4,
    qrOptions: { errorCorrectionLevel: useLogo ? 'H' : 'Q' },
    dotsOptions: { color: dotColor.value, type: dotType.value },
    cornersSquareOptions: { color: dotColor.value, type: cornerType.value === 'dot' ? 'dot' : (cornerType.value === 'extra-rounded' ? 'extra-rounded' : 'square') },
    cornersDotOptions: { color: dotColor.value, type: cornerType.value === 'dot' ? 'dot' : 'square' },
    backgroundOptions: { color: (bgImageEnabled.checked && backgroundImage) ? 'rgba(0,0,0,0)' : bgColor.value },
  };
  if (useLogo) {
    qrOptions.image = logoImage.src;
    qrOptions.imageOptions = { imageSize: MAX_LOGO_RATIO, margin: 8, crossOrigin: 'anonymous' };
  }

  let qrCanvas = null;
  try {
    const holder = document.createElement('div');
    const qr = new QRCodeStyling(qrOptions);
    qr.append(holder);
    await new Promise(r => setTimeout(r, 30)); // let the library finish drawing
    qrCanvas = holder.querySelector('canvas');
  } catch (err) {
    qrCanvas = null; // e.g. content the encoder can't handle — fall back to a blank placeholder below
  }

  if (!qrCanvas) {
    const ctx = previewCanvas.getContext('2d');
    previewCanvas.width = QR_SIZE; previewCanvas.height = QR_SIZE;
    ctx.fillStyle = getComputedStyle(root).getPropertyValue('--surface-2');
    ctx.fillRect(0, 0, QR_SIZE, QR_SIZE);
    saveSettings();
    return;
  }

  // 2. Compose: background image -> QR -> frame -> title, onto the master canvas
  const pad = frameEnabled.checked ? Number(framePadding.value) : 0;
  const frameW = frameEnabled.checked ? Number(frameThickness.value) : 0;
  const innerSize = QR_SIZE + pad * 2 + frameW * 2;

  const hasTitle = titleEnabled.checked && titleText.value.trim();
  const titlePos = titlePosition.value;
  const titleSpace = hasTitle ? 64 : 0;
  const horizontalTitle = hasTitle && (titlePos === 'left' || titlePos === 'right');

  const finalW = innerSize + (horizontalTitle ? titleSpace : 0);
  const finalH = innerSize + (!horizontalTitle && hasTitle ? titleSpace : 0);

  previewCanvas.width = finalW;
  previewCanvas.height = finalH;
  const ctx = previewCanvas.getContext('2d');
  ctx.clearRect(0, 0, finalW, finalH);
  ctx.fillStyle = bgColor.value;
  ctx.fillRect(0, 0, finalW, finalH);

  let qrOriginX = hasTitle && titlePos === 'left' ? titleSpace : 0;
  let qrOriginY = hasTitle && titlePos === 'top' ? titleSpace : 0;

  // background image (behind the code)
  if (bgImageEnabled.checked && backgroundImage) {
    ctx.save();
    ctx.globalAlpha = Number(bgImageOpacity.value) / 100;
    drawImageCover(ctx, backgroundImage, qrOriginX, qrOriginY, innerSize, innerSize);
    ctx.restore();
  }

  // frame
  if (frameEnabled.checked) {
    const r = Number(frameRadius.value);
    roundRectStroke(ctx, qrOriginX + frameW / 2, qrOriginY + frameW / 2, innerSize - frameW, innerSize - frameW, r, frameColor.value, frameW);
  }

  // the QR code itself
  ctx.drawImage(qrCanvas, qrOriginX + pad + frameW, qrOriginY + pad + frameW, QR_SIZE, QR_SIZE);

  // social platform logo badge next to the title
  if (social && socialEnabled.checked) {
    const badge = new Image();
    badge.src = `icons/social/${social.key}.svg`;
    await new Promise(res => { badge.onload = res; badge.onerror = res; });
    if (badge.width) {
      const bs = 28;
      ctx.drawImage(badge, qrOriginX + innerSize - bs - 6, qrOriginY + 6, bs, bs);
    }
  }

  // title
  if (hasTitle) {
    ctx.fillStyle = dotColor.value;
    ctx.font = '600 28px -apple-system, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const text = titleText.value.trim();
    if (titlePos === 'top') ctx.fillText(text, finalW / 2, titleSpace / 2, finalW - 20);
    else if (titlePos === 'bottom') ctx.fillText(text, finalW / 2, innerSize + titleSpace / 2, finalW - 20);
    else if (titlePos === 'left') {
      ctx.save(); ctx.translate(titleSpace / 2, finalH / 2); ctx.rotate(-Math.PI / 2);
      ctx.fillText(text, 0, 0, finalH - 20); ctx.restore();
    } else if (titlePos === 'right') {
      ctx.save(); ctx.translate(innerSize + titleSpace / 2, finalH / 2); ctx.rotate(Math.PI / 2);
      ctx.fillText(text, 0, 0, finalH - 20); ctx.restore();
    }
  }

  render.lastData = dataStr;
  saveSettings();
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
  const ctx = previewCanvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, previewCanvas.width, previewCanvas.height);
  const code = jsQR(imageData.data, imageData.width, imageData.height);
  resultEl.hidden = false;
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

// ---------- Export ----------
function downloadCanvas(mime, ext) {
  previewCanvas.toBlob(blob => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `qrcode.${ext}`;
    a.click();
  }, mime, 0.95);
}
document.getElementById('downloadPng').addEventListener('click', () => downloadCanvas('image/png', 'png'));
document.getElementById('downloadJpg').addEventListener('click', () => downloadCanvas('image/jpeg', 'jpg'));
document.getElementById('downloadSvg').addEventListener('click', () => {
  const dataStr = buildData();
  if (!dataStr) return;
  const useLogo = logoEnabled.checked && logoImage;
  const qr = new QRCodeStyling({
    width: QR_SIZE, height: QR_SIZE, type: 'svg', data: dataStr, margin: 4,
    qrOptions: { errorCorrectionLevel: useLogo ? 'H' : 'Q' },
    dotsOptions: { color: dotColor.value, type: dotType.value },
    cornersSquareOptions: { color: dotColor.value, type: cornerType.value === 'dot' ? 'dot' : (cornerType.value === 'extra-rounded' ? 'extra-rounded' : 'square') },
    cornersDotOptions: { color: dotColor.value, type: cornerType.value === 'dot' ? 'dot' : 'square' },
    backgroundOptions: { color: bgColor.value },
    ...(useLogo ? { image: logoImage.src, imageOptions: { imageSize: MAX_LOGO_RATIO, margin: 8 } } : {}),
  });
  qr.download({ name: 'qrcode', extension: 'svg' });
});

// ---------- Settings persistence ----------
function saveSettings() {
  const s = {
    dataType: dataType.value, dotType: dotType.value, cornerType: cornerType.value,
    dotColor: dotColor.value, bgColor: bgColor.value,
    logoEnabled: logoEnabled.checked, bgImageEnabled: bgImageEnabled.checked, bgImageOpacity: bgImageOpacity.value,
    frameEnabled: frameEnabled.checked, frameColor: frameColor.value, frameThickness: frameThickness.value,
    frameRadius: frameRadius.value, framePadding: framePadding.value,
    titleEnabled: titleEnabled.checked, titlePosition: titlePosition.value,
    socialEnabled: socialEnabled.checked,
  };
  localStorage.setItem('qra-settings', JSON.stringify(s));
}
function loadSettings() {
  let s;
  try { s = JSON.parse(localStorage.getItem('qra-settings')); } catch { return; }
  if (!s) return;
  dataType.value = s.dataType ?? dataType.value;
  dotType.value = s.dotType ?? dotType.value;
  cornerType.value = s.cornerType ?? cornerType.value;
  dotColor.value = s.dotColor ?? dotColor.value;
  bgColor.value = s.bgColor ?? bgColor.value;
  logoEnabled.checked = !!s.logoEnabled;
  bgImageEnabled.checked = !!s.bgImageEnabled;
  bgImageOpacity.value = s.bgImageOpacity ?? bgImageOpacity.value;
  frameEnabled.checked = !!s.frameEnabled;
  frameColor.value = s.frameColor ?? frameColor.value;
  frameThickness.value = s.frameThickness ?? frameThickness.value;
  frameRadius.value = s.frameRadius ?? frameRadius.value;
  framePadding.value = s.framePadding ?? framePadding.value;
  titleEnabled.checked = !!s.titleEnabled;
  titlePosition.value = s.titlePosition ?? titlePosition.value;
  socialEnabled.checked = s.socialEnabled !== false;

  typeFieldsEls.forEach(el => el.hidden = el.id !== 'fields-' + dataType.value);
  logoFields.hidden = !logoEnabled.checked;
  bgImageFields.hidden = !bgImageEnabled.checked;
  frameFields.hidden = !frameEnabled.checked;
  titleFields.hidden = !titleEnabled.checked;
  bgImageOpacityLabel.textContent = bgImageOpacity.value + '%';
}

// ---------- Init ----------
loadSettings();
render();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('service-worker.js').catch(() => {}));
}
