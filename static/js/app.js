/**
 * OmniTools Pro - Main App Controller
 * Tabs, theme toggles, and initialization.
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMonetization();
  initInvoice();
  calcKPR();
  initQRCode();
});

// Tab Switching
function switchTab(tabId) {
  const tabs = ['invoice', 'calculator', 'qrcode'];
  tabs.forEach(t => {
    const btn = document.getElementById(`tabBtn-${t}`);
    const sec = document.getElementById(`tab-${t}`);
    if (t === tabId) {
      if (btn) btn.classList.add('active');
      if (sec) sec.classList.add('active');
    } else {
      if (btn) btn.classList.remove('active');
      if (sec) sec.classList.remove('active');
    }
  });

  // Re-trigger render/calc if needed
  if (tabId === 'invoice') renderInvoice();
  if (tabId === 'calculator') calcKPR();
  if (tabId === 'qrcode') generateQRCode();
}

// Dark / Light Theme
function initTheme() {
  const savedTheme = localStorage.getItem('omnitools_theme') || 'dark';
  applyTheme(savedTheme);

  const toggleBtn = document.getElementById('themeToggleBtn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem('omnitools_theme', next);
    });
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const toggleBtn = document.getElementById('themeToggleBtn');
  if (toggleBtn) {
    toggleBtn.innerText = theme === 'dark' ? '🌙' : '☀️';
  }
}
