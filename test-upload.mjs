import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { SignJWT } from 'jose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envLocal = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8');
const jwtMatch = envLocal.match(/^JWT_SECRET="(.+)"$/m);
const jwtSecret = jwtMatch ? jwtMatch[1] : '';

async function createSessionCookie() {
  const key = new TextEncoder().encode(jwtSecret);
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return await new SignJWT({ user: { id: '00000000-0000-0000-0000-000000000000', role: 'ADMIN', username: 'admin' }, expires })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('30d').sign(key);
}

async function main() {
  const sessionCookie = await createSessionCookie();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addCookies([{ name:'session', value:sessionCookie, domain:'localhost', path:'/', httpOnly:true, sameSite:'Lax' }]);
  const page = await context.newPage();

  page.on('response', resp => {
    if (resp.status() >= 400) console.log(`HTTP ${resp.status()}: ${resp.url().substring(0,100)}`);
  });

  await page.goto('http://localhost:3000/admin', { waitUntil:'networkidle', timeout:30000 });
  console.log('URL:', page.url());

  // Wait for load
  await page.waitForTimeout(5000);

  // Close notification
  const closeBtn = page.locator('button:has-text("Bật"), button:has-text("Sau")').first();
  if (await closeBtn.isVisible()) await closeBtn.click();
  await page.waitForTimeout(1000);

  // Click Dịch vụ
  await page.locator('button:has-text("Dịch vụ")').first().click();
  console.log('Clicked Dịch vụ');
  
  // Wait for services to load
  await page.waitForTimeout(5000);

  // Check page content
  const body = await page.locator('body').innerText();
  const lines = body.split('\n').filter(l => l.trim());
  const svcIdx = lines.findIndex(l => l.includes('Thêm'));
  console.log('Around Thêm:', lines.slice(Math.max(0,svcIdx-2), svcIdx+10).join(' | '));

  // Look for "Thêm dịch vụ" text
  const themBtn = page.locator('text=Thêm dịch vụ').first();
  if (await themBtn.isVisible()) {
    await themBtn.click();
    console.log('Clicked Thêm dịch vụ');
  } else {
    // Try any button with Thêm
    const themAny = page.locator('button:has-text("Thêm"), a:has-text("Thêm"), span:has-text("Thêm"), div:has-text("Thêm")').first();
    if (await themAny.isVisible()) {
      await themAny.click();
      console.log('Clicked Thêm element');
    } else {
      console.log('No Thêm found');
      // Debug: print all clickable
      const allBtns = await page.locator('button').allTextContents();
      console.log('All buttons:', allBtns.filter(b => b.trim()).map(b => b.trim()).join(', '));
    }
  }
  await page.waitForTimeout(3000);

  const fi = page.locator('#svc-imageUrl');
  if (await fi.count() > 0) {
    const imgPath = path.join(__dirname, 'test-img.png');
    const png = Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A,0x00,0x00,0x00,0x0D,0x49,0x48,0x44,0x52,0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01,0x08,0x02,0x00,0x00,0x00,0x90,0x77,0x53,0xDE,0x00,0x00,0x00,0x0C,0x49,0x44,0x41,0x54,0x08,0xD7,0x63,0xF8,0xCF,0xC0,0x00,0x00,0x00,0x03,0x00,0x01,0x36,0x28,0x19,0x00,0x00,0x00,0x00,0x00,0x49,0x45,0x4E,0x44,0xAE,0x42,0x60,0x82]);
    fs.writeFileSync(imgPath, png);
    await fi.setInputFiles(imgPath);
    console.log('File uploaded!');
    await page.waitForTimeout(8000);
  } else {
    await page.screenshot({ path: 'debug.png', fullPage: true });
  }

  await browser.close();
}

main().catch(err => { console.error(err.message); });
