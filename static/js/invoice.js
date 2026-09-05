/**
 * OmniTools Pro - Invoice, Kwitansi & Surat Jalan Studio
 * Live interactive invoice calculation, Indonesian Terbilang, Logo upload, and Signature Pad
 */

let invoiceItems = [
  { description: "Jasa Pengembangan Web & Sistem API", qty: 1, price: 7500000 },
  { description: "Lisensi Cloud Hosting & Domain 1 Tahun", qty: 1, price: 1250000 },
  { description: "Maintenance & Pemeliharaan Sistem (Bulan 1)", qty: 1, price: 750000 }
];

let docMode = 'invoice'; // 'invoice', 'kwitansi', 'suratjalan'
let penColor = '#0f172a';
let isDrawing = false;

function initInvoice() {
  const today = new Date().toISOString().split('T')[0];
  const dueDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

  const dateInput = document.getElementById('invoiceDate');
  const dueInput = document.getElementById('dueDate');

  if (dateInput) dateInput.value = today;
  if (dueInput) dueInput.value = dueDate;

  // Check saved draft
  const saved = localStorage.getItem('omnitools_invoice_draft');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      if (data.items && data.items.length) invoiceItems = data.items;
      if (data.senderName) document.getElementById('senderName').value = data.senderName;
      if (data.senderEmail) document.getElementById('senderEmail').value = data.senderEmail;
      if (data.senderAddress) document.getElementById('senderAddress').value = data.senderAddress;
      if (data.clientName) document.getElementById('clientName').value = data.clientName;
      if (data.clientEmail) document.getElementById('clientEmail').value = data.clientEmail;
      if (data.clientAddress) document.getElementById('clientAddress').value = data.clientAddress;
      if (data.invoiceNumber) document.getElementById('invoiceNumber').value = data.invoiceNumber;
      if (data.currency) document.getElementById('currencySelect').value = data.currency;
      if (data.docMode) {
        docMode = data.docMode;
        const sel = document.getElementById('docTypeSelect');
        if (sel) sel.value = docMode;
      }
    } catch(e) {}
  }

  initSignaturePad();
  updateDocType();
  renderInvoice();
}

// -------------------------------------------------------------
// INDONESIAN TERBILANG ALGORITHM
// -------------------------------------------------------------
function angkaKeTerbilang(nilai) {
  const bilangan = [
    "", "Satu", "Dua", "Tiga", "Empat", "Lima",
    "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"
  ];

  const n = Math.floor(Math.abs(Number(nilai) || 0));
  if (n === 0) return "Nol Rupiah";

  function bilang(x) {
    if (x < 12) {
      return bilangan[x];
    } else if (x < 20) {
      return bilang(x - 10) + " Belas";
    } else if (x < 100) {
      return bilang(Math.floor(x / 10)) + " Puluh " + bilang(x % 10);
    } else if (x < 200) {
      return "Seratus " + bilang(x - 100);
    } else if (x < 1000) {
      return bilang(Math.floor(x / 100)) + " Ratus " + bilang(x % 100);
    } else if (x < 2000) {
      return "Seribu " + bilang(x - 1000);
    } else if (x < 1000000) {
      return bilang(Math.floor(x / 1000)) + " Ribu " + bilang(x % 1000);
    } else if (x < 1000000000) {
      return bilang(Math.floor(x / 1000000)) + " Juta " + bilang(x % 1000000);
    } else if (x < 1000000000000) {
      return bilang(Math.floor(x / 1000000000)) + " Miliar " + bilang(x % 1000000000);
    } else if (x < 1000000000000000) {
      return bilang(Math.floor(x / 1000000000000)) + " Triliun " + bilang(x % 1000000000000);
    }
    return "";
  }

  const hasil = bilang(n).replace(/\s+/g, ' ').trim();
  return hasil + " Rupiah";
}

// -------------------------------------------------------------
// DOCUMENT TYPE SWITCHER (INVOICE / KWITANSI / SURAT JALAN)
// -------------------------------------------------------------
function updateDocType() {
  const sel = document.getElementById('docTypeSelect');
  if (sel) docMode = sel.value;

  const docTitle = document.getElementById('p-docTitle');
  const clientLabel = document.getElementById('p-clientLabel');
  const dueRow = document.getElementById('p-dueRow');
  const terbilangBox = document.getElementById('p-terbilangBox');
  const totalsBox = document.getElementById('p-totalsBox');
  const paymentBox = document.getElementById('p-paymentBox');
  const grandTotalLabel = document.getElementById('p-grandTotalLabel');
  const leftSigLabel = document.getElementById('p-leftSigLabel');
  const rightSigLabel = document.getElementById('p-rightSigLabel');
  const thPrice = document.getElementById('p-thPrice');
  const thTotal = document.getElementById('p-thTotal');

  if (docMode === 'kwitansi') {
    if (docTitle) docTitle.innerText = 'KWITANSI PEMBAYARAN';
    if (clientLabel) clientLabel.innerText = 'Telah Terima Dari:';
    if (dueRow) dueRow.style.display = 'none';
    if (terbilangBox) terbilangBox.style.display = 'block';
    if (totalsBox) totalsBox.style.display = 'flex';
    if (paymentBox) paymentBox.style.display = 'block';
    if (grandTotalLabel) grandTotalLabel.innerText = 'Uang Sejumlah:';
    if (leftSigLabel) leftSigLabel.innerText = 'Penerima Pembayaran,';
    if (rightSigLabel) rightSigLabel.innerText = 'Tanda Tangan & Cap,';
    if (thPrice) thPrice.style.display = '';
    if (thTotal) thTotal.style.display = '';
  } else if (docMode === 'suratjalan') {
    if (docTitle) docTitle.innerText = 'SURAT JALAN';
    if (clientLabel) clientLabel.innerText = 'Tujuan Pengiriman:';
    if (dueRow) dueRow.style.display = 'none';
    if (terbilangBox) terbilangBox.style.display = 'none';
    if (totalsBox) totalsBox.style.display = 'none';
    if (paymentBox) paymentBox.style.display = 'none';
    if (leftSigLabel) leftSigLabel.innerText = 'Penerima Barang,';
    if (rightSigLabel) rightSigLabel.innerText = 'Pengirim / Bag. Gudang,';
    if (thPrice) thPrice.style.display = 'none';
    if (thTotal) thTotal.style.display = 'none';
  } else {
    // Default: INVOICE
    if (docTitle) docTitle.innerText = 'INVOICE';
    if (clientLabel) clientLabel.innerText = 'Ditujukan Kepada:';
    if (dueRow) dueRow.style.display = '';
    if (terbilangBox) terbilangBox.style.display = 'block';
    if (totalsBox) totalsBox.style.display = 'flex';
    if (paymentBox) paymentBox.style.display = 'block';
    if (grandTotalLabel) grandTotalLabel.innerText = 'Total Tagihan:';
    if (leftSigLabel) leftSigLabel.innerText = 'Penerima / Klien,';
    if (rightSigLabel) rightSigLabel.innerText = 'Hormat Kami,';
    if (thPrice) thPrice.style.display = '';
    if (thTotal) thTotal.style.display = '';
  }

  renderInvoice();
}

// -------------------------------------------------------------
// LOGO UPLOAD & REMOVAL
// -------------------------------------------------------------
function handleLogoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    const pLogoImg = document.getElementById('p-logoImg');
    const pLogoBox = document.getElementById('p-logoBox');
    if (pLogoImg && pLogoBox) {
      pLogoImg.src = dataUrl;
      pLogoBox.style.display = 'block';
    }
  };
  reader.readAsDataURL(file);
}

function removeLogo() {
  const input = document.getElementById('logoUploadInput');
  if (input) input.value = '';
  const pLogoBox = document.getElementById('p-logoBox');
  const pLogoImg = document.getElementById('p-logoImg');
  if (pLogoBox) pLogoBox.style.display = 'none';
  if (pLogoImg) pLogoImg.src = '';
}

// -------------------------------------------------------------
// SIGNATURE PAD (CANVAS)
// -------------------------------------------------------------
function initSignaturePad() {
  const canvas = document.getElementById('signatureCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  function startDraw(e) {
    isDrawing = true;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function endDraw() {
    if (isDrawing) {
      isDrawing = false;
      syncSignatureToPreview();
    }
  }

  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  window.addEventListener('mouseup', endDraw);

  canvas.addEventListener('touchstart', startDraw, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  window.addEventListener('touchend', endDraw);
}

function setPenColor(color) {
  penColor = color;
}

function clearSignature() {
  const canvas = document.getElementById('signatureCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const sigImg = document.getElementById('p-sigImg');
  if (sigImg) {
    sigImg.src = '';
    sigImg.style.display = 'none';
  }
}

function syncSignatureToPreview() {
  const canvas = document.getElementById('signatureCanvas');
  const sigImg = document.getElementById('p-sigImg');
  if (!canvas || !sigImg) return;

  const dataUrl = canvas.toDataURL('image/png');
  sigImg.src = dataUrl;
  sigImg.style.display = 'block';
}

// -------------------------------------------------------------
// MAIN RENDER INVOICE
// -------------------------------------------------------------
function formatCurrency(amount, currency = 'IDR') {
  const num = Number(amount) || 0;
  switch (currency) {
    case 'USD':
      return '$ ' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    case 'EUR':
      return '€ ' + num.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    case 'SGD':
      return 'S$ ' + num.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    case 'MYR':
      return 'RM ' + num.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    case 'IDR':
    default:
      return 'Rp ' + Math.round(num).toLocaleString('id-ID');
  }
}

function renderInvoice() {
  const currency = document.getElementById('currencySelect')?.value || 'IDR';

  // Read Inputs
  const senderName = document.getElementById('senderName')?.value || 'Nama Perusahaan Anda';
  const senderEmail = document.getElementById('senderEmail')?.value || '';
  const senderAddress = document.getElementById('senderAddress')?.value || '';

  const clientName = document.getElementById('clientName')?.value || 'Nama Klien / Perusahaan';
  const clientEmail = document.getElementById('clientEmail')?.value || '';
  const clientAddress = document.getElementById('clientAddress')?.value || '';

  const invNum = document.getElementById('invoiceNumber')?.value || 'INV-001';
  const invDate = document.getElementById('invoiceDate')?.value || '';
  const dueDate = document.getElementById('dueDate')?.value || '';
  const status = document.getElementById('invoiceStatus')?.value || 'BELUM DIBAYAR';
  const taxRate = parseFloat(document.getElementById('taxRate')?.value) || 0;
  const discountAmount = parseFloat(document.getElementById('discountAmount')?.value) || 0;
  const paymentDetails = document.getElementById('paymentDetails')?.value || '';

  const signerName = document.getElementById('signerNameInput')?.value || 'Nama Penanda Tangan';
  const signerTitle = document.getElementById('signerTitleInput')?.value || '';

  // Update Preview Header & Details
  setElText('p-senderName', senderName);
  setElText('p-senderEmail', senderEmail);
  setElText('p-senderAddress', senderAddress);

  setElText('p-clientName', clientName);
  setElText('p-clientEmail', clientEmail);
  setElText('p-clientAddress', clientAddress);

  setElText('p-invoiceNumber', invNum);
  setElText('p-invoiceDate', formatDate(invDate));
  setElText('p-dueDate', formatDate(dueDate));
  setElText('p-paymentDetails', paymentDetails);

  setElText('p-signerName', signerName);
  setElText('p-signerTitle', signerTitle);

  // Status Badge in Preview
  const badge = document.getElementById('p-statusBadge');
  if (badge) {
    badge.innerText = status;
    if (status === 'LUNAS') {
      badge.style.background = '#dcfce7';
      badge.style.color = '#15803d';
    } else if (status === 'DRAFT') {
      badge.style.background = '#f1f5f9';
      badge.style.color = '#475569';
    } else {
      badge.style.background = '#fee2e2';
      badge.style.color = '#dc2626';
    }
  }

  // Render Input Rows in Form
  const inputTbody = document.getElementById('itemsTableBody');
  if (inputTbody) {
    inputTbody.innerHTML = invoiceItems.map((item, idx) => `
      <tr>
        <td>
          <input type="text" value="${escapeHtml(item.description)}" 
            placeholder="Deskripsi barang / jasa" 
            oninput="updateItem(${idx}, 'description', this.value)">
        </td>
        <td>
          <input type="number" min="1" value="${item.qty}" 
            style="text-align: center;" 
            oninput="updateItem(${idx}, 'qty', this.value)">
        </td>
        <td>
          <input type="number" min="0" step="1000" value="${item.price}" 
            oninput="updateItem(${idx}, 'price', this.value)">
        </td>
        <td style="text-align: center;">
          <button class="btn-remove-row" onclick="removeInvoiceItem(${idx})" title="Hapus baris">&times;</button>
        </td>
      </tr>
    `).join('');
  }

  // Render Preview Rows & Calculate Totals
  let subtotal = 0;
  const previewTbody = document.getElementById('p-itemsBody');
  if (previewTbody) {
    previewTbody.innerHTML = invoiceItems.map(item => {
      const lineTotal = (item.qty || 0) * (item.price || 0);
      subtotal += lineTotal;
      if (docMode === 'suratjalan') {
        return `
          <tr>
            <td><strong>${escapeHtml(item.description || 'Barang')}</strong></td>
            <td style="text-align: center;">${item.qty || 1} Unit</td>
            <td style="display: none;">-</td>
            <td style="display: none;">-</td>
          </tr>
        `;
      }
      return `
        <tr>
          <td><strong>${escapeHtml(item.description || 'Layanan / Produk')}</strong></td>
          <td style="text-align: center;">${item.qty || 1}</td>
          <td style="text-align: right;">${formatCurrency(item.price, currency)}</td>
          <td style="text-align: right; font-weight: 600;">${formatCurrency(lineTotal, currency)}</td>
        </tr>
      `;
    }).join('');
  }

  const taxAmount = (subtotal * taxRate) / 100;
  const grandTotal = Math.max(0, subtotal + taxAmount - discountAmount);

  setElText('p-subtotal', formatCurrency(subtotal, currency));
  setElText('p-taxRate', taxRate);
  setElText('p-taxAmount', formatCurrency(taxAmount, currency));
  setElText('p-grandTotal', formatCurrency(grandTotal, currency));

  // Terbilang
  const terbilangStr = angkaKeTerbilang(grandTotal);
  setElText('p-terbilangText', terbilangStr);

  const discRow = document.getElementById('p-discountRow');
  if (discRow) {
    if (discountAmount > 0) {
      discRow.style.display = 'flex';
      setElText('p-discountAmount', '-' + formatCurrency(discountAmount, currency));
    } else {
      discRow.style.display = 'none';
    }
  }

  saveDraft();
}

function updateItem(index, field, value) {
  if (!invoiceItems[index]) return;
  if (field === 'qty') {
    invoiceItems[index].qty = Math.max(1, parseInt(value) || 1);
  } else if (field === 'price') {
    invoiceItems[index].price = Math.max(0, parseFloat(value) || 0);
  } else {
    invoiceItems[index].description = value;
  }
  renderInvoice();
}

function addInvoiceItem() {
  invoiceItems.push({ description: "Barang / Layanan Baru", qty: 1, price: 500000 });
  renderInvoice();
}

function removeInvoiceItem(index) {
  if (invoiceItems.length <= 1) {
    alert("Minimal harus ada 1 baris rincian invoice.");
    return;
  }
  invoiceItems.splice(index, 1);
  renderInvoice();
}

function updateInvoiceTheme() {
  const theme = document.getElementById('invoiceTheme')?.value || 'theme-minimal';
  const paper = document.getElementById('invoiceSheet');
  if (paper) {
    paper.className = 'invoice-paper ' + theme;
  }
}

function loadSampleData() {
  invoiceItems = [
    { description: "Jasa Konsultasi Arsitektur Software", qty: 2, price: 4500000 },
    { description: "Deployment & Setup Server Berkecepatan Tinggi (Rust)", qty: 1, price: 8000000 },
    { description: "Integrasi API & Payment Gateway QRIS", qty: 1, price: 3500000 }
  ];
  renderInvoice();
}

function resetInvoiceData() {
  if (confirm("Reset semua data invoice ke awal?")) {
    localStorage.removeItem('omnitools_invoice_draft');
    invoiceItems = [{ description: "Layanan / Produk 1", qty: 1, price: 1000000 }];
    clearSignature();
    removeLogo();
    renderInvoice();
  }
}

function saveDraft() {
  const draft = {
    items: invoiceItems,
    docMode: docMode,
    senderName: document.getElementById('senderName')?.value,
    senderEmail: document.getElementById('senderEmail')?.value,
    senderAddress: document.getElementById('senderAddress')?.value,
    clientName: document.getElementById('clientName')?.value,
    clientEmail: document.getElementById('clientEmail')?.value,
    clientAddress: document.getElementById('clientAddress')?.value,
    invoiceNumber: document.getElementById('invoiceNumber')?.value,
    currency: document.getElementById('currencySelect')?.value
  };
  localStorage.setItem('omnitools_invoice_draft', JSON.stringify(draft));
}

function copyInvoiceSummary() {
  const invNum = document.getElementById('p-invoiceNumber')?.innerText || '';
  const client = document.getElementById('p-clientName')?.innerText || '';
  const total = document.getElementById('p-grandTotal')?.innerText || '';
  const due = document.getElementById('p-dueDate')?.innerText || '';
  const pay = document.getElementById('p-paymentDetails')?.innerText || '';
  const terbilang = document.getElementById('p-terbilangText')?.innerText || '';

  const text = `Halo, berikut ringkasan ${docMode.toUpperCase()} untuk ${client}:\n\n` +
    `No. Dokumen: ${invNum}\n` +
    `Total: ${total} (${terbilang})\n` +
    `Jatuh Tempo: ${due}\n\n` +
    `Pembayaran dapat ditransfer melalui:\n${pay}\n\n` +
    `Terima kasih atas kerja samanya!`;

  navigator.clipboard.writeText(text).then(() => {
    alert("✅ Ringkasan berhasil disalin ke clipboard!");
  }).catch(() => {
    alert("Gagal menyalin otomatis. Silakan salin manual.");
  });
}

// Helpers
function setElText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}
