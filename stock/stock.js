const $ = (id) => document.getElementById(id);

const principalEl = $("principal");
const monthlyEl   = $("monthly");
const rateEl      = $("rate");
const yearsEl     = $("years");
const feeEl       = $("fee");
const freqEl      = $("freq");

const finalValueEl   = $("finalValue");
const totalContribEl = $("totalContrib");
const profitEl       = $("profit");
const tbody          = $("tbody");

const calcBtn  = $("calcBtn");
const resetBtn = $("resetBtn");

function fmt(n){
  return n.toLocaleString("zh-Hant-TW", { maximumFractionDigits: 0 });
}

function clampNumber(x){
  if (!Number.isFinite(x) || x < 0) return 0;
  return x;
}

/**
 * 複利模型：
 * - 年化報酬率 r，年化費用率 f
 * - 使用 (1+r)/(1+f) 作為近似的淨增長因子（比直接 r-f 更合理一點）
 * - 依 frequency 分期複利
 * - 每月投入：如果 freq 不是 12，會把「每月投入」換算成「每期投入」
 */
function calculate(){
  const P0 = clampNumber(Number(principalEl.value));
  const m  = clampNumber(Number(monthlyEl.value));
  const r  = Number(rateEl.value) / 100; // annual
  const f  = Number(feeEl.value) / 100;  // annual
  const Y  = Math.max(1, Math.floor(Number(yearsEl.value)));
  const freq = Math.max(1, Math.floor(Number(freqEl.value)));

  // 淨年化因子（近似）
  const netAnnualFactor = (1 + r) / (1 + f);
  const periodRate = Math.pow(netAnnualFactor, 1 / freq) - 1;

  // 將每月投入換算成每期投入（按時間比例近似）
  const monthsPerPeriod = 12 / freq;
  const contribPerPeriod = m * monthsPerPeriod;

  const totalPeriods = Y * freq;

  let value = P0;

  // 年度明細：每年切一次
  const rows = [];
  let totalContrib = P0;

  for (let year = 1; year <= Y; year++){
    const startOfYear = value;
    let contribThisYear = 0;

    for (let k = 0; k < freq; k++){
      // 先投入再成長（假設定期定額在期初投入）
      value += contribPerPeriod;
      contribThisYear += contribPerPeriod;
      totalContrib += contribPerPeriod;

      value *= (1 + periodRate);
    }

    const endOfYear = value;
    const growthThisYear = endOfYear - startOfYear - contribThisYear;

    rows.push({
      year,
      startOfYear,
      contribThisYear,
      growthThisYear,
      endOfYear
    });
  }

  const profit = value - totalContrib;

  // render numbers
  finalValueEl.textContent   = `${fmt(value)} 元`;
  totalContribEl.textContent = `${fmt(totalContrib)} 元`;
  profitEl.textContent       = `${fmt(profit)} 元`;

  // render table
  tbody.innerHTML = rows.map(r => `
    <tr>
      <td>${r.year}</td>
      <td>${fmt(r.startOfYear)}</td>
      <td>${fmt(r.contribThisYear)}</td>
      <td>${fmt(r.growthThisYear)}</td>
      <td>${fmt(r.endOfYear)}</td>
    </tr>
  `).join("");
}

function reset(){
  principalEl.value = 700000;
  monthlyEl.value   = 0;
  rateEl.value      = 8;
  yearsEl.value     = 10;
  feeEl.value       = 0.2;
  freqEl.value      = 12;

  finalValueEl.textContent = "-";
  totalContribEl.textContent = "-";
  profitEl.textContent = "-";
  tbody.innerHTML = "";
}

calcBtn.addEventListener("click", calculate);
resetBtn.addEventListener("click", reset);

// 讓使用者改數字就能按 Enter 直接算
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") calculate();
});

