import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();

async function checkPage(url, label) {
  const page = await context.newPage();
  const errors = [];
  const warnings = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`[${label} ERROR] ${msg.text()}`);
    if (msg.type() === 'warning') warnings.push(`[${label} WARN] ${msg.text()}`);
  });
  page.on('pageerror', err => {
    errors.push(`[${label} PAGE ERROR] ${err.message}`);
  });

  await page.goto(url, { waitUntil: 'load', timeout: 15000 });
  await new Promise(r => setTimeout(r, 8000));

  console.log(`\n=== ${label} ERRORS ===`);
  if (errors.length === 0) {
    console.log(`No errors ✅`);
  } else {
    errors.forEach(e => console.log(e));
  }

  console.log(`\n=== ${label} WARNINGS ===`);
  if (warnings.length === 0) {
    console.log(`No warnings ✅`);
  } else {
    warnings.forEach(w => console.log(w));
  }

  await page.close();
  return { errors, warnings };
}

// Test 1: Normal load
const r1 = await checkPage('http://localhost:3000', 'Normal');

// Test 2: Simulate language switch to English (cookie then reload)
if (r1.errors.length === 0) {
  const page2 = await context.newPage();
  const errors2 = [];
  const warnings2 = [];
  
  page2.on('console', msg => {
    if (msg.type() === 'error') errors2.push(`[LangSwitch ERROR] ${msg.text()}`);
    if (msg.type() === 'warning') warnings2.push(`[LangSwitch WARN] ${msg.text()}`);
  });
  page2.on('pageerror', err => {
    errors2.push(`[LangSwitch PAGE ERROR] ${err.message}`);
  });

  await page2.goto('http://localhost:3000', { waitUntil: 'load', timeout: 15000 });
  await new Promise(r => setTimeout(r, 3000));
  
  // Set Google Translate cookie for English
  await page2.evaluate(() => {
    document.cookie = 'googtrans=/vi/en; path=/; SameSite=Lax';
  });
  
  // Reload to trigger translation
  await page2.reload({ waitUntil: 'load', timeout: 15000 });
  await new Promise(r => setTimeout(r, 10000));

  console.log(`\n=== LANGUAGE SWITCH ERRORS ===`);
  if (errors2.length === 0) {
    console.log(`No errors ✅`);
  } else {
    errors2.forEach(e => console.log(e));
  }

  console.log(`\n=== LANGUAGE SWITCH WARNINGS ===`);
  if (warnings2.length === 0) {
    console.log(`No warnings ✅`);
  } else {
    warnings2.forEach(w => console.log(w));
  }

  await page2.close();
}

await browser.close();
