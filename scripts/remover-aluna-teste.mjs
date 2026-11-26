// Remove uma aluna de teste e tudo o que ficou dela: ficha, marcações na chamada, justificativas,
// cliques em oportunidades, pedidos feitos com o e-mail e o acesso ao Portal do Aluno.
// Uso (no GitHub, com a chave da conta de serviço): node scripts/remover-aluna-teste.mjs email@exemplo.com
import { createHash } from 'node:crypto';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const email = String(process.argv[2] || '').trim().toLowerCase();
if (!/^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(email)) throw new Error('E-mail inválido');
initializeApp({ credential: applicationDefault(), projectId: process.env.PID });
const db = getFirestore();
const doEmail = (v) => String(v || '').trim().toLowerCase() === email;

const fichas = (await db.collection('alunos').get()).docs.filter((d) => doEmail(d.data().email));
const ids = new Set(fichas.map((d) => d.id));
console.log('Fichas com esse e-mail:', fichas.map((d) => d.data().nome).join(', ') || 'nenhuma');

let marcas = 0;
for (const c of (await db.collection('chamadas').get()).docs) {
  const reg = c.data().registros || {};
  const meus = Object.keys(reg).filter((k) => ids.has(k));
  if (meus.length) { await c.ref.update(Object.fromEntries(meus.map((k) => [`registros.${k}`, FieldValue.delete()]))); marcas += meus.length; }
}
console.log('Marcações removidas da chamada:', marcas);

let just = 0;
for (const j of (await db.collection('justificativas').get()).docs) if (ids.has(j.data().alunoId) || doEmail(j.data().email)) { await j.ref.delete(); just++; }
console.log('Justificativas removidas:', just);

let cliques = 0;
for (const o of (await db.collection('oportunidades').get()).docs) {
  const meus = Object.keys(o.data().cliques || {}).filter((k) => ids.has(k));
  if (meus.length) { await o.ref.update(Object.fromEntries(meus.map((k) => [`cliques.${k}`, FieldValue.delete()]))); cliques += meus.length; }
}
console.log('Cliques em oportunidades removidos:', cliques);

let pedidos = 0;
for (const p of (await db.collection('pedidos').get()).docs) if (doEmail(p.data().email)) { await db.collection('acompanhamento').doc(p.id).delete(); await p.ref.delete(); pedidos++; }
console.log('Pedidos de inscrição removidos:', pedidos);

for (const f of fichas) await f.ref.delete();
await db.collection('portalAluno').doc(email).delete();
await db.collection('emailsAlunos').doc(createHash('sha256').update(email).digest('hex')).delete();
console.log('Ficha apagada e acesso ao Portal do Aluno removido.');
