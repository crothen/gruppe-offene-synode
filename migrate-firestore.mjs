// One-off: copy Firestore documents between Firebase projects using the
// Firebase CLI's login token. Usage: node migrate-firestore.mjs <srcProject> <dstProject>
import fs from 'fs';
import path from 'path';
import os from 'os';

const [src, dst] = process.argv.slice(2);
if (!src || !dst) { console.error('usage: node migrate-firestore.mjs <srcProject> <dstProject>'); process.exit(1); }
const COLLECTIONS = ['gos-events', 'gos-documents', 'gos-admins'];

const store = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json'), 'utf8'));
const H = { Authorization: 'Bearer ' + store.tokens.access_token, 'Content-Type': 'application/json' };
const base = p => `https://firestore.googleapis.com/v1/projects/${p}/databases/(default)/documents`;

const backup = {};
for (const c of COLLECTIONS) {
  const r = await (await fetch(`${base(src)}/${c}?pageSize=300`, { headers: H })).json();
  if (r.error) { console.error(c, r.error.message); process.exit(1); }
  backup[c] = r.documents || [];
  let ok = 0;
  for (const d of backup[c]) {
    const id = d.name.split('/').pop();
    const w = await fetch(`${base(dst)}/${c}/${encodeURIComponent(id)}`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: d.fields }) });
    if (w.ok) ok++; else console.log('FAIL', c, id, (await w.text()).slice(0, 200));
  }
  console.log(`${c}: ${backup[c].length} read from ${src}, ${ok} written to ${dst}`);
}
const out = path.join(os.tmpdir(), `${src}-firestore-backup.json`);
fs.writeFileSync(out, JSON.stringify(backup, null, 2));
console.log('backup:', out);
