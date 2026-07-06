import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const errors = [];
const warnings = [];
page.on('console', msg => {
  if (msg.type() === 'error') errors.push(`[ERROR] ${msg.text()}`);
  if (msg.type() === 'warning') warnings.push(`[WARN] ${msg.text()}`);
});
page.on('pageerror', err => {
  errors.push(`[PAGE ERROR] ${err.message}`);
});

// Normal load
console.log('=== Home page load ===');
await page.goto('http://localhost:3000', { waitUntil: 'load', timeout: 30000 });
await new Promise(r => setTimeout(r, 5000));

// Set language cookie to English and reload
console.log('=== Switch language to English ===');
await page.evaluate(() => {
  document.cookie = 'googtrans=/vi/en; path=/; SameSite=Lax';
});
await page.reload({ waitUntil: 'load', timeout: 30000 });
await new Promise(r => setTimeout(r, 10000));

console.log('\n=== ERRORS ===');
if (errors.length === 0) {
  console.log('No errors ✅');
} else {
  const unique = [...new Set(errors)];
  unique.forEach(e => console.log(e));
}

console.log('\n=== WARNINGS ===');
if (warnings.length === 0) {
  console.log('No warnings ✅');
} else {
  const unique = [...new Set(warnings)];
  unique.forEach(w => console.log(w));
}

await browser.close();
