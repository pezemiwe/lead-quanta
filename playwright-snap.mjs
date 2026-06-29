import { chromium } from 'playwright';
const OUT = 'C:/Users/DELL/AppData/Local/Temp/claude/c--Users-DELL-Documents-lead-quanta/ebbd6d07-1d1e-4815-b606-de36f8e60c95/scratchpad';

const br = await chromium.launch({ headless: true });
const ctx = await br.newContext();
const pg = await ctx.newPage();
await pg.setViewportSize({ width: 1400, height: 900 });

const snap = async (url, name) => {
  await pg.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
  await pg.waitForTimeout(1000);
  await pg.screenshot({ path: `${OUT}/${name}.png` });
  console.log(name, 'done');
};

// Set the correct localStorage key before navigating
await pg.goto('http://localhost:5174');
await pg.waitForLoadState('domcontentloaded');
await pg.evaluate(() => {
  localStorage.setItem('aq_persona', JSON.stringify({ name: 'Amina Yusuf', role: 'Portfolio Manager', avatar: 'AY' }));
});
await pg.reload({ waitUntil: 'networkidle' });

await snap('http://localhost:5174/modules', 'modules');
await snap('http://localhost:5174/market-data/dashboard', 'market-data-dashboard');
await snap('http://localhost:5174/duration-risk/dashboard', 'duration-risk-dashboard');
await snap('http://localhost:5174/duration-risk/duration-table', 'duration-table');
await snap('http://localhost:5174/valuation/overview', 'valuation-overview');
await snap('http://localhost:5174/accounting/accruals', 'accounting-accruals');
await snap('http://localhost:5174/deals/blotter', 'deals-blotter');
await snap('http://localhost:5174/governance/audit-log', 'governance-audit-log');
await snap('http://localhost:5174/governance/access-control', 'governance-access-control');
await snap('http://localhost:5174/governance/compliance', 'governance-compliance');
await snap('http://localhost:5174/governance/approvals-workflow', 'governance-approvals');

// Mobile
await pg.setViewportSize({ width: 390, height: 844 });
await snap('http://localhost:5174/market-data/dashboard', 'mobile-market-data');
await snap('http://localhost:5174/duration-risk/dashboard', 'mobile-duration-risk');
await snap('http://localhost:5174/deals/blotter', 'mobile-deals-blotter');

await br.close();
