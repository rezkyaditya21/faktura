/**
 * OmniTools Pro - Calculators Engine
 * KPR/Loan simulator, UMKM & PPh tax calculator, Margin & Markup.
 */

function switchCalcSubtab(subtab) {
  const tabs = ['kpr', 'pajak', 'margin'];
  tabs.forEach(t => {
    const btn = document.getElementById(`cbtn-${t}`);
    const sec = document.getElementById(`csec-${t}`);
    if (t === subtab) {
      if (btn) btn.classList.add('active');
      if (sec) sec.style.display = 'block';
    } else {
      if (btn) btn.classList.remove('active');
      if (sec) sec.style.display = 'none';
    }
  });

  if (subtab === 'kpr') calcKPR();
  if (subtab === 'pajak') calcTax();
  if (subtab === 'margin') calcMargin();
}

// 1. KPR & Loan Simulator
function calcKPR() {
  const principal = parseFloat(document.getElementById('kprLoan')?.value) || 0;
  const annualRate = parseFloat(document.getElementById('kprInterest')?.value) || 0;
  const years = parseFloat(document.getElementById('kprTenure')?.value) || 1;

  if (principal <= 0 || years <= 0) return;

  const totalMonths = years * 12;
  let monthlyPayment = 0;
  let totalPayment = 0;
  let totalInterest = 0;

  if (annualRate <= 0) {
    monthlyPayment = principal / totalMonths;
    totalPayment = principal;
    totalInterest = 0;
  } else {
    const monthlyRate = (annualRate / 100) / 12;
    monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
    totalPayment = monthlyPayment * totalMonths;
    totalInterest = totalPayment - principal;
  }

  setElText('kprMonthlyResult', formatRupiah(monthlyPayment) + ' / bln');
  setElText('kprPrincipalTotal', formatRupiah(principal));
  setElText('kprInterestTotal', formatRupiah(totalInterest));
  setElText('kprGrandTotal', formatRupiah(totalPayment));
}

// 2. UMKM & PPh Tax Simulator
function calcTax() {
  const annualRevenue = parseFloat(document.getElementById('taxRevenue')?.value) || 0;
  const category = document.getElementById('taxType')?.value || 'umkm-op';

  let taxableRevenue = 0;
  let finalTax = 0;
  let explanation = '';

  if (category === 'umkm-op') {
    // Orang Pribadi PP 23 / UU HPP: Bebas pajak untuk omzet s/d 500 juta
    const threshold = 500000000;
    if (annualRevenue <= threshold) {
      taxableRevenue = 0;
      finalTax = 0;
      explanation = `Omzet di bawah batas bebas pajak Rp 500 Juta (UU HPP). Bebas pajak PPh Final!`;
    } else {
      taxableRevenue = annualRevenue - threshold;
      finalTax = taxableRevenue * 0.005; // 0.5%
      explanation = `Omzet kena pajak: ${formatRupiah(taxableRevenue)} (setelah potongan Rp 500 Juta). Tarif PPh Final 0.5%.`;
    }
  } else {
    // Badan Usaha (CV/PT): 0.5% dari seluruh omzet
    taxableRevenue = annualRevenue;
    finalTax = taxableRevenue * 0.005;
    explanation = `UMKM Badan (CV/PT): Dikenakan PPh Final 0.5% dari seluruh peredaran bruto tanpa batas pengurangan.`;
  }

  const monthlyAvg = finalTax / 12;
  const effectiveRate = annualRevenue > 0 ? ((finalTax / annualRevenue) * 100).toFixed(2) : 0;

  setElText('taxResultValue', formatRupiah(finalTax) + ' / thn');
  setElText('taxExplanation', explanation);
  setElText('taxMonthlyAvg', formatRupiah(monthlyAvg) + ' / bln');
  setElText('taxEffectiveRate', effectiveRate + ' %');
}

// 3. Margin & Markup Calculator
function calcMargin() {
  const cost = parseFloat(document.getElementById('marginCost')?.value) || 0;
  const targetMarginPercent = parseFloat(document.getElementById('marginTarget')?.value) || 0;

  if (cost <= 0 || targetMarginPercent <= 0 || targetMarginPercent >= 100) return;

  // Margin = (Price - Cost) / Price  =>  Price = Cost / (1 - Margin/100)
  const marginFraction = targetMarginPercent / 100;
  const sellingPrice = cost / (1 - marginFraction);
  const profit = sellingPrice - cost;
  const markupPercent = (profit / cost) * 100;
  const roi = (sellingPrice / cost) * 100;

  setElText('marginSellingPrice', formatRupiah(sellingPrice));
  setElText('marginProfit', formatRupiah(profit));
  setElText('marginMarkupPercent', markupPercent.toFixed(2) + ' %');
  setElText('marginRoi', roi.toFixed(2) + ' %');
}

function formatRupiah(num) {
  const rounded = Math.round(Number(num) || 0);
  return 'Rp ' + rounded.toLocaleString('id-ID');
}
