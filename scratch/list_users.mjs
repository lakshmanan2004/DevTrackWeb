const res = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@college.edu', password: 'devtrack@2026' })
});
const data = await res.json();
console.log('Admin login status:', !!data.token);

const usersRes = await fetch('http://localhost:5000/api/users', {
  headers: { Authorization: `Bearer ${data.token}` }
});
const users = await usersRes.json();
console.log('Available users:');
users.forEach(u => console.log(`- ${u.role}: ${u.email} (${u.name})`));
