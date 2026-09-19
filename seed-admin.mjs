const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';

const payload = {
  "username": "",
  "password": "",
  "firstName": "",
  "lastName": "",
  setupSecret: process.env.ADMIN_SETUP_SECRET,
};

if (!payload.setupSecret) {
  throw new Error('ADMIN_SETUP_SECRET is not set');
}

const res = await fetch(`${baseUrl}/api/admin/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

const text = await res.text();

console.log(res.status, res.statusText);
console.log(text);

process.exit(res.ok ? 0 : 1);