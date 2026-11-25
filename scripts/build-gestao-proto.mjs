// Gera portal/gestao-coordenacao.html: protótipo do site de gestão (dados de exemplo, nada é salvo)
// com o que a equipe vai usar para o Portal do Aluno. NÃO altera o site publicado: parte de uma cópia de iris.html.
// Quando aprovado, as mesmas mudanças são levadas para iris.html.
import { readFileSync, writeFileSync } from 'node:fs';

let app = readFileSync('iris.html', 'utf8');
const rep = (a, b) => {
  const n = app.split(a).length - 1;
  if (n !== 1) throw new Error(`Trecho encontrado ${n} vezes: ${a.slice(0, 80)}`);
  app = app.replace(a, () => b);
};

app = app.replace('<title>Gestão Instituto Íris</title>', '<title>Gestão Íris · Portal</title>');

// Estilos extras (no mesmo padrão visual do site).
rep('.banner { display: flex;', `.ptabs { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 2px; scrollbar-width: none; }
.ptabs::-webkit-scrollbar { display: none; }
.ptabs .chip { white-space: nowrap; flex: none; }
.quote { padding: 10px 12px; border-radius: 10px; background: var(--surface-2); font-size: 14.5px; }
.kv { display: grid; grid-template-columns: auto 1fr; gap: 6px 14px; font-size: 14.5px; }
.kv dt { color: var(--muted); } .kv dd { margin: 0; font-weight: 600; min-width: 0; overflow-wrap: anywhere; }
.mural-thumb { width: 52px; height: 40px; border-radius: 8px; flex: none; object-fit: cover; background: var(--surface-2); }
.foto-prev { width: 100%; max-height: 220px; object-fit: cover; border-radius: 10px; margin-top: 8px; }
.item.off { opacity: .6; }
.banner { display: flex;`);

// Novo ícone.
rep(`    trash: '`, `    mega: '<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15 9a3 3 0 0 1 0 6M18 6a7 7 0 0 1 0 12"/>',
    trash: '`);

// Coleções novas.
rep(`const COLS = ['alunos', 'turmas', 'chamadas', 'lancamentos'];`, `const COLS = ['alunos', 'turmas', 'chamadas', 'lancamentos', 'avisos', 'mural', 'oportunidades', 'justificativas', 'pedidos'];`);
rep(`    finMes: ym(new Date()),`, `    finMes: ym(new Date()), portalSub: 'avisos',`);

// Aba nova no menu, com contador do que espera avaliação.
rep(`    ['inscricoes', 'Inscrições', 'form'],\n`, `    ['inscricoes', 'Inscrições', 'form'],\n    ['portal', 'Portal', 'mega'],\n`);
rep(`    const novas = alunosList().filter((a) => sit(a) === 'inscrito').length;
    const btn = (id, label, ic) => \`<button class="tab\${S.view === id ? ' on' : ''}" data-act="nav" data-v="\${id}" aria-current="\${S.view === id ? 'page' : 'false'}">\${icon(ic)}<span>\${label}</span>\${id === 'inscricoes' && novas ? \`<span class="dot num">\${novas}</span>\` : ''}</button>\`;`,
`    const dots = { inscricoes: alunosList().filter((a) => sit(a) === 'inscrito').length + pendentes('pedidos').length, portal: pendentes('justificativas').length };
    const btn = (id, label, ic) => \`<button class="tab\${S.view === id ? ' on' : ''}" data-act="nav" data-v="\${id}" aria-current="\${S.view === id ? 'page' : 'false'}">\${icon(ic)}<span>\${label}</span>\${dots[id] ? \`<span class="dot num">\${dots[id]}</span>\` : ''}</button>\`;`);
rep(`inscricoes: vInscricoes, financas: vFinancas }`, `inscricoes: vInscricoes, portal: vPortal, financas: vFinancas }`);

// Painel: justificativas para avaliar.
rep(`          <div>
            <div class="section-title"><h2>Fichas incompletas</h2>`, `          \${justCard()}
          <div>
            <div class="section-title"><h2>Fichas incompletas</h2>`);

// Chamada: aviso das justificativas daquela aula.
rep(`      \${notices()}
      <div class="card pad stack" style="gap:10px">`, `      \${notices()}
      \${(() => { const js = pendentes('justificativas').filter((j) => j.turmaId === ch.turmaId && j.data === ch.data); return js.length ? \`<div class="banner">\${icon('info')}<span class="grow">\${plural(js.length, 'justificativa', 'justificativas')} de falta desta aula para avaliar: \${js.map((j) => esc(get('alunos', j.alunoId)?.nome || '')).join(', ')}.</span><button class="btn sm" data-act="just-open" data-id="\${js[0].id}">Avaliar</button></div>\` : ''; })()}
      <div class="card pad stack" style="gap:10px">`);

// Inscrições: pedidos feitos pelo Portal do Aluno.
rep(`      <div class="section-title" style="margin:6px 0 -6px"><h2>Todas as inscrições</h2>`, `      \${pedidosSec()}
      <div class="section-title" style="margin:6px 0 -6px"><h2>Todas as inscrições</h2>`);

// Visões e janelas novas.
rep(`  // ───────────── Finanças ─────────────`, readFileSync('portal/coord-ext.js', 'utf8') + `\n  // ───────────── Finanças ─────────────`);

// Ações.
rep(`case 'go-chamada': openChamada(`, `case 'go-chamada': closeModal(); openChamada(`);
rep(`      case 'csv-alunos': csvAlunos(); break;`, `      case 'csv-alunos': csvAlunos(); break;
      case 'p-sub': S.portalSub = t.dataset.v; render(); break;
      case 'aviso-new': avisoModal(null); break;
      case 'aviso-open': avisoModal(t.dataset.id); break;
      case 'aviso-save': saveAviso(t.dataset.id); break;
      case 'mural-new': muralModal(null); break;
      case 'mural-open': muralModal(t.dataset.id); break;
      case 'mural-save': saveMural(t.dataset.id); break;
      case 'op-new': opModal(null); break;
      case 'op-open': opModal(t.dataset.id); break;
      case 'op-save': saveOp(t.dataset.id); break;
      case 'curso-open': cursoModal(t.dataset.id); break;
      case 'curso-save': saveCurso(t.dataset.id); break;
      case 'just-open': justModal(t.dataset.id); break;
      case 'just-dec': decidirJust(t.dataset.id, t.dataset.v); break;
      case 'ped-open': pedidoModal(t.dataset.id); break;
      case 'ped-dec': decidirPedido(t.dataset.id, t.dataset.v); break;`);
rep(`        if (key === 'del-lanc')`, `        if (key === 'del-portal') { if (await guard(() => del(ctx.col, ctx.id), 'Removido.')) closeModal(); }
        if (key === 'del-lanc')`);
rep(`  document.addEventListener('input', (e) => {`, `  document.addEventListener('change', (e) => { if (e.target.id === 'm-foto') lerFotoMural(e.target.files[0]); });
  document.addEventListener('input', (e) => {`);

// Dados de exemplo do portal.
rep(`    return { turmas, alunos, chamadas, lancamentos };`, `    Object.assign(turmas[t1], { portalAberto: true, portalDescricao: 'Computador, internet, e-mail, Word e Excel do zero.', portalQuem: 'A partir de 10 anos' });
    Object.assign(turmas[t3], { portalAberto: true, portalDescricao: 'Ritmos variados, expressão corporal e apresentações ao longo do ano.', portalQuem: 'A partir de 7 anos' });
    const fwd = (n) => { const x = new Date(d); x.setDate(x.getDate() + n); return ymd(x); };
    const avisos = {
      'ex-av1': { titulo: 'Sem aula de Dança neste sábado', texto: 'O salão estará em manutenção. As aulas voltam no sábado seguinte.', turmaId: t3, ate: fwd(4), importante: true, criadoEm: new Date().toISOString(), exemplo: true },
      'ex-av2': { titulo: 'Festa de fim de ano: dia 13/12', texto: 'Todos os alunos e famílias estão convidados. Traga um prato para dividir!', turmaId: '', ate: fwd(18), criadoEm: new Date().toISOString(), exemplo: true },
      'ex-av3': { titulo: 'Inscrições para o recesso', texto: 'Aviso antigo, já saiu da tela dos alunos.', turmaId: '', ate: back(3), criadoEm: new Date(Date.now() - 20 * 864e5).toISOString(), exemplo: true },
    };
    const mural = {
      'ex-mu1': { titulo: 'Apresentação da turma de Dança', texto: 'As alunas e alunos da Dança se apresentaram na praça do Éden no domingo.', foto: '', criadoEm: new Date(Date.now() - 3 * 864e5).toISOString(), exemplo: true },
      'ex-mu2': { titulo: 'Mutirão de pintura do instituto', texto: 'Voluntários pintaram as salas no último fim de semana.', foto: '', criadoEm: new Date(Date.now() - 16 * 864e5).toISOString(), exemplo: true },
    };
    const oportunidades = {
      'ex-op1': { tipo: 'Emprego', titulo: 'Jovem Aprendiz em supermercado da região', texto: 'Para quem tem de 14 a 22 anos e está estudando.', quem: 'De 14 a 22 anos', prazo: fwd(10), link: 'https://exemplo.com/jovem-aprendiz', exemplo: true },
      'ex-op2': { tipo: 'Curso', titulo: 'Curso gratuito de Excel online', texto: 'Curso com certificado, oferecido por instituição parceira.', quem: 'Todas as idades', prazo: fwd(20), link: 'https://exemplo.com/excel', exemplo: true },
    };
    // Justificativas: usa faltas reais dos exemplos de chamada.
    const faltas = [];
    for (const c of Object.values(chamadas).sort((a, b) => b.data.localeCompare(a.data))) for (const [aid, v] of Object.entries(c.registros)) if (v === 'F') faltas.push({ aid, c });
    const usados = new Set(); const justificativas = {};
    [['Consulta médica, tenho o atestado.', 'atestado.jpg'], ['Fiquei sem ônibus por causa da chuva.', '']].forEach(([motivo, anexo], k) => {
      const f = faltas.find((x) => !usados.has(x.aid)); if (!f) return; usados.add(f.aid);
      justificativas['ex-ju' + k] = { alunoId: f.aid, turmaId: f.c.turmaId, data: f.c.data, motivo, anexo, status: 'pendente', enviadoEm: new Date().toISOString(), exemplo: true };
    });
    const pedidos = {
      'ex-pe1': { alunoId: 'ex-aluno-3', turmaId: t3, telefone: '(21) 98765-4321', obs: 'Ele adora dançar, pode ser no sábado.', status: 'pendente', enviadoEm: new Date(Date.now() - 864e5).toISOString(), exemplo: true },
      'ex-pe2': { alunoId: 'ex-aluno-6', turmaId: t1, telefone: '(21) 97777-1234', obs: '', status: 'pendente', enviadoEm: new Date().toISOString(), exemplo: true },
    };
    return { turmas, alunos, chamadas, lancamentos, avisos, mural, oportunidades, justificativas, pedidos };`);

writeFileSync('portal/gestao-coordenacao.html', `<script>window.IRIS_DEMO = true;</script>\n${app}`);
console.log('portal/gestao-coordenacao.html gerado');
