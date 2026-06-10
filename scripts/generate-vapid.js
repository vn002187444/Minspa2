const webpush = require('web-push');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('--- KHÓA VAPID THÔNG BÁO WEB PUSH ---');
console.log('Hãy copy các giá trị này vào file .env.local hoặc Vercel Environment Variables:');
console.log('');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('WEB_PUSH_EMAIL=mailto:hotro@minnailhair.com');
console.log('------------------------------------');
