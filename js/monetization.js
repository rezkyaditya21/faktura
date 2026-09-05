/**
 * Faktura - Monetization Engine
 * Handles AdSense slots, Affiliate links, Donation modals, and Pro License System.
 */

const DEFAULT_CONFIG = {
  site_name: "Faktura",
  adsense: {
    enabled: false,
    client_id: ""
  },
  donations: {
    saweria_url: "https://saweria.co/rezky8stream",
    trakteer_url: "https://trakteer.id/9dt8jhh95fifdycl33ah",
    buymeacoffee_url: "https://buymeacoffee.com",
    bank_info: "BCA / Mandiri / Dana: Hubungi Pemilik"
  },
  affiliates: [
    {
      name: "Hostinger Cloud & Web Hosting",
      badge: "Diskon 75% + Domain Gratis",
      description: "Hosting berkecepatan tinggi dengan uptime 99.9%, sertifikat SSL gratis, dan panel kontrol modern.",
      url: "https://hostinger.co.id",
      icon: "⚡"
    },
    {
      name: "Midtrans Payment Gateway",
      badge: "Resmi & Terpercaya",
      description: "Terima pembayaran QRIS, e-Wallet (GoPay, OVO, Dana), Virtual Account, & Kartu Kredit otomatis.",
      url: "https://midtrans.com",
      icon: "💳"
    },
    {
      name: "Canva Pro Desain & Bisnis",
      badge: "Paling Populer",
      description: "Ribuan template premium untuk promosi produk, logo perusahaan, invoice, dan konten media sosial.",
      url: "https://canva.com",
      icon: "🎨"
    }
  ],
  pro_keys: ["PRO2026", "FAKTURAPRO", "VIPMEMBER"]
};

let appConfig = { ...DEFAULT_CONFIG };

// Load config from server or localStorage
async function initMonetization() {
  try {
    let res = await fetch('/api/config');
    if (!res.ok) {
      res = await fetch('/monetization.json');
    }
    if (res.ok) {
      const serverConfig = await res.json();
      appConfig = { ...DEFAULT_CONFIG, ...serverConfig };
    }
  } catch (err) {
    console.log("Using local monetization configuration");
  }

  applyMonetizationSettings();
  checkProStatus();
}

function applyMonetizationSettings() {
  // Update donation links
  const saweriaBtn = document.getElementById('donateSaweriaBtn');
  const trakteerBtn = document.getElementById('donateTrakteerBtn');
  const bmacBtn = document.getElementById('donateBmacBtn');
  const bankInfo = document.getElementById('donateBankInfo');

  if (saweriaBtn && appConfig.donations.saweria_url) saweriaBtn.href = appConfig.donations.saweria_url;
  if (trakteerBtn && appConfig.donations.trakteer_url) trakteerBtn.href = appConfig.donations.trakteer_url;
  if (bmacBtn && appConfig.donations.buymeacoffee_url) bmacBtn.href = appConfig.donations.buymeacoffee_url;
  if (bankInfo && appConfig.donations.bank_info) bankInfo.innerText = appConfig.donations.bank_info;

  // WhatsApp Partnership Link
  const donateWaBtn = document.getElementById('donateWaBtn');
  const footerWaBtn = document.getElementById('footerWaBtn');
  if (appConfig.donations.contact_wa) {
    const rawWa = appConfig.donations.contact_wa.replace(/\D/g, '');
    const waLink = `https://wa.me/${rawWa}?text=Halo%20Admin%20Faktura,%20saya%20tertarik%20untuk%20bekerja%20sama%20/%20pasang%20iklan`;
    let display = rawWa;
    if (display.startsWith('62')) display = '0' + display.slice(2);
    if (display.length >= 11) {
      display = `${display.slice(0, 4)}-${display.slice(4, 8)}-${display.slice(8)}`;
    }
    if (donateWaBtn) {
      donateWaBtn.href = waLink;
      donateWaBtn.innerHTML = `<span>💬</span> WhatsApp: ${display}`;
    }
    if (footerWaBtn) {
      footerWaBtn.href = waLink;
    }
  }

  // Top Banner / AdSense visibility
  const topAdWrapper = document.getElementById('topAdWrapper');
  if (topAdWrapper) {
    topAdWrapper.style.display = (appConfig.adsense && appConfig.adsense.enabled) ? 'block' : 'none';
  }

  // Affiliate Section visibility
  const affSection = document.getElementById('affiliateSection');
  const showAffiliates = appConfig.affiliates_enabled === true;
  if (affSection) {
    affSection.style.display = showAffiliates ? 'block' : 'none';
  }

  // Render affiliate cards only if enabled
  const affContainer = document.getElementById('affiliateCardsContainer');
  if (affContainer && showAffiliates && appConfig.affiliates) {
    affContainer.innerHTML = appConfig.affiliates.map(item => `
      <div class="affiliate-card">
        <div>
          <div class="aff-top">
            <span class="aff-icon">${item.icon || '🚀'}</span>
            <span class="aff-badge">${item.badge || 'Rekomendasi'}</span>
          </div>
          <h3 class="aff-title">${item.name}</h3>
          <p class="aff-desc">${item.description}</p>
        </div>
        <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="width: 100%; text-align: center;">
          Kunjungi Layanan →
        </a>
      </div>
    `).join('');
  }
}

// Pro License Check & Activation
function checkProStatus() {
  const isPro = localStorage.getItem('omnitools_pro_active') === 'true';
  const badge = document.getElementById('proStatusBadge');
  const watermark = document.getElementById('invoiceWatermark');

  if (isPro) {
    if (badge) badge.style.display = 'inline-block';
    if (watermark) watermark.style.display = 'none';
  } else {
    if (badge) badge.style.display = 'none';
    if (watermark) watermark.style.display = 'block';
  }
  return isPro;
}

function activateLicenseKey() {
  const input = document.getElementById('licenseKeyInput');
  if (!input) return;
  const key = input.value.trim().toUpperCase();

  if (appConfig.pro_keys.includes(key)) {
    localStorage.setItem('omnitools_pro_active', 'true');
    checkProStatus();
    closeModal('proModal');
    alert('🎉 Selamat! Lisensi Pro berhasil diaktifkan. Tanda air telah dihilangkan!');
  } else {
    alert('❌ Kunci lisensi tidak valid. Coba gunakan: PRO2026');
  }
}

function openDonateModal() {
  document.getElementById('donateModal')?.classList.add('active');
}

function openProModal() {
  document.getElementById('proModal')?.classList.add('active');
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('active');
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});
