const fs = require('fs');
const path = require('path');
async function run() {
  const login = async (email) => {
    const r = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'demo123' })
    });
    return r.headers.get('set-cookie');
  };
  const adminCookie = await login('admin@draxelyra.local');
  const fakeJpeg = Buffer.from('FFD8FFE000104A46494600010101006000600000FFDB004300', 'hex');
  const form = new FormData();
  form.append('caseId', 'C-1048');
  form.append('type', 'image');
  form.append('metadata', JSON.stringify({ foo: 'bar' }));
  form.append('file', new Blob([fakeJpeg], { type: 'image/jpeg' }), 'test.jpg');
  
  const res = await fetch('http://localhost:3000/api/evidence/upload', {
    method: 'POST',
    headers: {
      'Cookie': adminCookie,
    },
    body: form,
  });
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Data:', data);
  if (data.evidence && data.evidence.uri) {
    console.log('File exists?', fs.existsSync(path.join(process.cwd(), data.evidence.uri)));
  }
}
run();
