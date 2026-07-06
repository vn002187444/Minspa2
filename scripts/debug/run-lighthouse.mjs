import lighthouse from 'lighthouse';
import { writeFile } from 'fs/promises';

const url = process.argv[2] || 'http://localhost:3000';
const port = Number(process.argv[3]) || 9222;

const result = await lighthouse(url, {
  port,
  output: 'json',
  onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
  formFactor: 'mobile',
  screenEmulation: { mobile: true, width: 412, height: 915, deviceScaleFactor: 2.625 },
  throttling: { rttMs: 150, throughputKbps: 1638.4, cpuSlowdownMultiplier: 4 },
});

const lhr = result.lhr;
const categories = lhr.categories;

for (const [key, cat] of Object.entries(categories)) {
  const score = Math.round((cat.score ?? 0) * 100);
  const emoji = score >= 90 ? '🟢' : score >= 50 ? '🟡' : '🔴';
  console.log(`${emoji} ${key}: ${score}`);
}

const metrics = ['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index'];
for (const id of metrics) {
  const a = lhr.audits[id];
  if (a) console.log(`  ${a.title}: ${a.displayValue || a.numericValue}`);
}

const reportPath = `lighthouse-reports/report-mobile-${Date.now()}.json`;
await writeFile(reportPath, JSON.stringify(lhr, null, 2));
console.log(`\nReport saved: ${reportPath}`);
