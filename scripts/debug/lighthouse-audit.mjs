// Usage: node scripts/debug/lighthouse-audit.mjs [url]
// Requires: lighthouse (already in dependencies)

import { promises as fs } from 'fs';
import path from 'path';

const TARGET_URL = process.argv[2] || 'http://localhost:3000';
const REPORT_DIR = path.resolve('lighthouse-reports');

async function main() {
  await fs.mkdir(REPORT_DIR, { recursive: true });

  const { default: lighthouse } = await import('lighthouse');
  const { default: puppeteer } = await import('puppeteer-core');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const endpoint = browser.wsEndpoint();
  const port = new URL(endpoint).port;

  try {
    const result = await lighthouse(TARGET_URL, {
      port: Number(port),
      output: ['json', 'html'],
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      formFactor: 'mobile',
      screenEmulation: {
        mobile: true,
        width: 412,
        height: 915,
        deviceScaleFactor: 2.625,
        disabled: false,
      },
      throttling: {
        rttMs: 150,
        throughputKbps: 1638.4,
        cpuSlowdownMultiplier: 4,
      },
    });

    if (!result) {
      console.error('Lighthouse run returned empty result');
      await browser.close();
      process.exit(1);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonPath = path.join(REPORT_DIR, `lighthouse-${timestamp}.json`);
    const htmlPath = path.join(REPORT_DIR, `lighthouse-${timestamp}.html`);

    const jsonStr = result.report?.[0];
    const htmlStr = result.report?.[1];

    if (jsonStr) await fs.writeFile(jsonPath, jsonStr);
    if (htmlStr) await fs.writeFile(htmlPath, htmlStr);

    const data = jsonStr ? JSON.parse(jsonStr) : null;
    if (data?.categories) {
      console.log('\n=== Lighthouse Results ===');
      console.log(`URL: ${TARGET_URL}`);
      console.log(`Time: ${new Date().toISOString()}`);
      console.log('');
      for (const [key, cat] of Object.entries(data.categories)) {
        const score = Math.round((cat.score ?? 0) * 100);
        const emoji = score >= 90 ? '🟢' : score >= 50 ? '🟡' : '🔴';
        console.log(`${emoji} ${key}: ${score}`);
      }
      if (data.audits) {
        console.log('\nKey Metrics:');
        const metrics = ['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index'];
        for (const id of metrics) {
          const audit = data.audits[id];
          if (audit) {
            console.log(`  ${audit.title}: ${audit.displayValue || audit.numericValue}`);
          }
        }
      }
    }

    console.log(`\nReports saved to:`);
    console.log(`  JSON: ${jsonPath}`);
    console.log(`  HTML: ${htmlPath}`);

    await browser.close();
  } catch (err) {
    console.error('Lighthouse audit failed:', err.message);
    process.exit(1);
  }
}

main();
