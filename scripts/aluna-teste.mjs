// Cadastra (ou reativa) uma aluna de teste no banco e libera o acesso dela ao Portal do Aluno.
// Uso (no GitHub, com a chave da conta de serviço): node scripts/aluna-teste.mjs email@exemplo.com
import { createHash } from 'node:crypto';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const email = String(process.argv[2] || '').trim().toLowerCase();
if (!/^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(email)) throw new Error('E-mail inválido');
initializeApp({ credential: applicationDefault(), projectId: process.env.PID });
const db = getFirestore();

const semAcento = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const cursoKey = (t) => semAcento(t.curso || String(t.nome || '').trim().split(/\s+/)[0]);
const ativo = (a) => !a.status || a.status === 'matriculado' || a.status === 'ativo';
const agora = new Date().toISOString();

const turmas = Object.fromEntries((await db.collection('turmas').get()).docs.map((d) => [d.id, d.data()]));
const alunos = (await db.collection('alunos').get()).docs.map((d) => ({ id: d.id, ...d.data() }));
let minhas = alunos.filter((a) => String(a.email || '').trim().toLowerCase() === email);

if (!minhas.length) {
  const livres = (id) => (Number(turmas[id].capacidade) || 99) - alunos.filter((a) => ativo(a) && (a.turmaIds || []).includes(id)).length;
  const info = Object.keys(turmas).filter((id) => cursoKey(turmas[id]) === 'informatica').sort((x, y) => livres(y) - livres(x));
  const tid = info[0] || Object.keys(turmas)[0];
  const ref = db.collection('alunos').doc();
  const ficha = { nome: 'Eduarda (teste)', email, turmaIds: tid ? [tid] : [], status: 'matriculado', criadoEm: agora, atualizadoEm: agora };
  await ref.set(ficha);
  minhas = [{ id: ref.id, ...ficha }];
  console.log('Ficha de teste criada na turma:', tid ? turmas[tid].nome : '(nenhuma)');
} else {
  for (const a of minhas) if (!ativo(a)) { await db.collection('alunos').doc(a.id).update({ status: 'matriculado', atualizadoEm: agora }); a.status = 'matriculado'; }
  console.log('Já existia ficha com esse e-mail:', minhas.length);
}

// Mesmo resumo que a gestão monta (a gestão continua atualizando sozinha depois).
const chamadas = (await db.collection('chamadas').get()).docs.map((d) => d.data());
const ids = [...new Set(minhas.flatMap((a) => a.turmaIds || []))].filter((id) => turmas[id]);
const tr = Object.fromEntries(ids.map((id) => { const t = turmas[id]; return [id, { nome: t.nome || '', curso: cursoKey(t), dias: t.dias || [], horario: t.horario || '', horarioFim: t.horarioFim || '', professor: t.professor || '', cor: t.cor || '#1c2d6b' }]; }));
const freq = {};
for (const a of minhas) { freq[a.id] = {}; for (const tid of a.turmaIds || []) if (tr[tid]) freq[a.id][tid] = chamadas.filter((c) => c.turmaId === tid && c.registros && c.registros[a.id]).sort((x, y) => String(x.data).localeCompare(String(y.data))).slice(-60).map((c) => ({ d: c.data, v: c.registros[a.id] })); }
await db.collection('portalAluno').doc(email).set({ alunoIds: minhas.map((a) => a.id), alunos: minhas.map((a) => ({ id: a.id, nome: a.nome || '', turmaIds: (a.turmaIds || []).filter((id) => tr[id]) })), turmas: tr, freq, atualizadoEm: agora });
await db.collection('emailsAlunos').doc(createHash('sha256').update(email).digest('hex')).set({ ok: true });
console.log('Acesso ao Portal do Aluno liberado.');
