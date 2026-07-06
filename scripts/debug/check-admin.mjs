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

// Step 1: Go to admin (redirects to login)
console.log('=== STEP 1: Navigate to /admin ===');
await page.goto('http://localhost:3000/admin', { waitUntil: 'load', timeout: 30000 });
await new Promise(r => setTimeout(r, 5000));
console.log(`URL: ${page.url()}`);

// Step 2: Login
console.log('\n=== STEP 2: Login ===');
const usernameInput = await page.$('input[name="username"]');
const passwordInput = await page.$('input[name="password"]');
const submitBtn = await page.$('button[type="submit"]');

if (usernameInput && passwordInput && submitBtn) {
  console.log('Filling login form...');
  await usernameInput.fill('admin');
  await passwordInput.fill('admin');
  await submitBtn.click();
  
  await new Promise(r => setTimeout(r, 8000));
  console.log(`URL after login: ${page.url()}`);
}

// Step 3: Navigate to Services tab
if (!page.url().includes('/login')) {
  console.log('\n=== STEP 3: Check admin page ===');
  await new Promise(r => setTimeout(r, 3000));
}

console.log('\n=== FINAL ERRORS ===');
if (errors.length === 0) {
  console.log('No errors ✅');
} else {
  // Deduplicate
  const unique = [...new Set(errors)];
  unique.forEach(e => console.log(e));
  console.log(`\nTotal unique errors: ${unique.length}`);
}

console.log('\n=== FINAL WARNINGS ===');
if (warnings.length === 0) {
  console.log('No warnings ✅');
} else {
  const unique = [...new Set(warnings)];
  unique.forEach(w => console.log(w));
  console.log(`\nTotal unique warnings: ${unique.length}`);
}

await browser.close();
