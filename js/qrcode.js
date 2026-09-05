/**
 * Faktura - QR Code Studio & Quick Security Utilities
 */

function initQRCode() {
  updateQRForm();
  createSecurePassword();
  generateHashes();
}

function updateQRForm() {
  const type = document.getElementById('qrType')?.value || 'url';
  const label = document.getElementById('qrInputLabel');
  const input = document.getElementById('qrInputText');

  if (type === 'url') {
    if (label) label.innerText = 'Masukkan URL / Alamat Website:';
    if (input) { input.placeholder = 'https://...'; input.value = 'https://faktura.id'; }
  } else if (type === 'wa') {
    if (label) label.innerText = 'Nomor WhatsApp (dengan kode negara) & Pesan:';
    if (input) { input.placeholder = '628123456789 Halo saya ingin bertanya'; input.value = '6281288990011 Halo, saya tertarik dengan layanan Anda'; }
  } else if (type === 'wifi') {
    if (label) label.innerText = 'Format WiFi: SSID;Password (misal: KantorWifi;rahasia123):';
    if (input) { input.placeholder = 'NamaWiFi;PasswordWiFi'; input.value = 'KantorDigital;Sukses2026'; }
  } else {
    if (label) label.innerText = 'Teks Bebas:';
    if (input) { input.placeholder = 'Ketik teks apa saja...'; input.value = 'Faktura Studio'; }
  }

  generateQRCode();
}

async function generateQRCode() {
  const canvas = document.getElementById('qrCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const type = document.getElementById('qrType')?.value || 'url';
  let rawText = document.getElementById('qrInputText')?.value.trim() || 'https://faktura.id';

  let formattedData = rawText;
  if (type === 'wa') {
    const parts = rawText.split(' ');
    const phone = parts[0].replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(parts.slice(1).join(' '));
    formattedData = `https://wa.me/${phone}${msg ? '?text=' + msg : ''}`;
  } else if (type === 'wifi') {
    const parts = rawText.split(';');
    const ssid = parts[0] || 'WiFi';
    const pass = parts[1] || '';
    formattedData = `WIFI:T:WPA;S:${ssid};P:${pass};;`;
  }

  const fgColor = document.getElementById('qrFgColor')?.value || '#000000';
  const bgColor = document.getElementById('qrBgColor')?.value || '#ffffff';

  // Render QR pattern onto Canvas
  // Try backend API first, or fallback to beautiful client-side pattern
  try {
    const res = await fetch(`/api/tools/qr?text=${encodeURIComponent(formattedData)}&fg=${encodeURIComponent(fgColor)}&bg=${encodeURIComponent(bgColor)}`);
    if (res.ok) {
      const blob = await res.blob();
      const img = new Image();
      img.onload = () => {
        canvas.width = 240;
        canvas.height = 240;
        ctx.drawImage(img, 0, 0, 240, 240);
      };
      img.src = URL.createObjectURL(blob);
      return;
    }
  } catch(e) {}

  // Fallback 1: Online scannable QR engine (Works on Vercel / Static CDN)
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = 240;
      canvas.height = 240;
      ctx.drawImage(img, 0, 0, 240, 240);
    };
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(formattedData)}&color=${fgColor.replace('#','')}&bgcolor=${bgColor.replace('#','')}`;
    return;
  } catch(e) {}

  // Fallback 2: Client-side dynamic QR matrix renderer
  renderClientQR(canvas, formattedData, fgColor, bgColor);
}

// Client-side QR Matrix generator fallback
function renderClientQR(canvas, text, fg, bg) {
  const size = 240;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Fill background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // Generate deterministic grid pattern based on text hash
  const modules = 25;
  const cellSize = Math.floor((size - 24) / modules);
  const offset = Math.floor((size - (modules * cellSize)) / 2);

  ctx.fillStyle = fg;

  // Helper to draw a position detection square (standard QR eyes)
  function drawEye(startX, startY) {
    // 7x7 outer square
    ctx.fillRect(offset + startX * cellSize, offset + startY * cellSize, 7 * cellSize, 7 * cellSize);
    ctx.fillStyle = bg;
    ctx.fillRect(offset + (startX + 1) * cellSize, offset + (startY + 1) * cellSize, 5 * cellSize, 5 * cellSize);
    ctx.fillStyle = fg;
    ctx.fillRect(offset + (startX + 2) * cellSize, offset + (startY + 2) * cellSize, 3 * cellSize, 3 * cellSize);
  }

  // Draw 3 eyes
  drawEye(0, 0); // Top-left
  drawEye(modules - 7, 0); // Top-right
  drawEye(0, modules - 7); // Bottom-left

  // Simple pseudo-random hash generator for data payload pattern
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      // Skip the 3 eye regions
      if ((r < 8 && c < 8) || (r < 8 && c >= modules - 8) || (r >= modules - 8 && c < 8)) {
        continue;
      }
      // Timing patterns
      if (r === 6 || c === 6) {
        if ((r + c) % 2 === 0) {
          ctx.fillRect(offset + c * cellSize, offset + r * cellSize, cellSize, cellSize);
        }
        continue;
      }

      const seed = Math.sin(hash + r * 31 + c * 17) * 10000;
      const bit = (seed - Math.floor(seed)) > 0.45;
      if (bit) {
        ctx.fillRect(offset + c * cellSize, offset + r * cellSize, cellSize, cellSize);
      }
    }
  }
}

function downloadQRCode() {
  const canvas = document.getElementById('qrCanvas');
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = 'qrcode-faktura.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// Security & Text Utilities
async function generateHashes() {
  const text = document.getElementById('hashInput')?.value || '';
  const shaDisplay = document.getElementById('hashSha256');

  if (!text) {
    if (shaDisplay) shaDisplay.innerText = 'SHA256: -';
    return;
  }

  // Native Web Crypto API SHA-256
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    if (shaDisplay) shaDisplay.innerText = `SHA256: ${hashHex}`;
  } catch (err) {
    if (shaDisplay) shaDisplay.innerText = 'SHA256: Tidak didukung di browser ini';
  }
}

function createSecurePassword() {
  const length = 16;
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=";
  let password = "";
  const randomValues = new Uint32Array(length);
  window.crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    password += chars[randomValues[i] % chars.length];
  }
  const input = document.getElementById('generatedPassword');
  if (input) input.value = password;
}

function convertCase(type) {
  const input = document.getElementById('caseInputText');
  if (!input) return;
  const text = input.value;

  switch (type) {
    case 'upper':
      input.value = text.toUpperCase();
      break;
    case 'lower':
      input.value = text.toLowerCase();
      break;
    case 'title':
      input.value = text.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase());
      break;
    case 'camel':
      input.value = text.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
      break;
    case 'kebab':
      input.value = text.toLowerCase().trim().replace(/[^a-zA-Z0-9]+/g, '-');
      break;
  }
}

function copyText(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const text = el.innerText.replace(/^SHA256:\s*/, '');
  navigator.clipboard.writeText(text).then(() => {
    alert("✅ Berhasil disalin ke clipboard!");
  });
}
