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
rep(`const COLS = ['alunos', 'turmas', 'chamadas', 'lancamentos'];`, `const COLS = ['alunos', 'turmas', 'chamadas', 'lancamentos', 'avisos', 'mural', 'oportunidades', 'justificativas', 'pedidos', 'interessados'];`);
rep(`    finMes: ym(new Date()),`, `    finMes: ym(new Date()), portalSub: 'justificativas', inscAba: 'alunos',`);

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
rep(`      <div class="section-title" style="margin:6px 0 -6px"><h2>Todas as inscrições</h2><span>separadas por situação</span></div>
      \${alunosPanel()}\`;`, `      \${pedidosSec()}
      \${inscAbas()}
      \${S.inscAba === 'interessados' ? interessadosPanel() : \`<div class="section-title" style="margin:6px 0 -6px"><h2>Todas as inscrições</h2><span>separadas por situação</span></div>\${alunosPanel()}\`}\`;`);

// Turma ganha o campo "Curso" (um curso pode ter várias turmas, ex.: manhã e tarde).
rep(`      <label class="field full"><span>Nome da turma / curso</span><input class="input" id="t-nome" value="\${esc(t.nome)}" placeholder="Ex.: Informática básica — tarde"></label>`,
`      <label class="field"><span>Curso</span><input class="input" id="t-curso" list="dl-cursos" value="\${esc(t.curso || '')}" placeholder="Ex.: Informática básica"><datalist id="dl-cursos">\${cursosList().map((c) => \`<option value="\${esc(c)}">\`).join('')}</datalist></label>
      <label class="field"><span>Nome da turma</span><input class="input" id="t-nome" value="\${esc(t.nome)}" placeholder="Ex.: Informática básica — tarde"></label>`);
rep(`professor: val('t-prof'), cor };`, `professor: val('t-prof'), cor, curso: val('t-curso') || nome };`);

// Ficha: pode abrir já preenchida a partir de um pedido do portal, e ao salvar conclui o pedido.
rep(`  function alunoModal(id, presetTurma) {
    if (id && !get('alunos', id)) return;
    const a = id ? { ...get('alunos', id), status: sit(get('alunos', id)) } : { nome: '', turmaIds: presetTurma ? [presetTurma] : [], status: 'matriculado', matriculaEm: today(), autorizaImagem: 'Pendente', termoAssinado: 'Pendente' };`,
`  function alunoModal(id, presetTurma, pre) {
    if (id && !get('alunos', id)) return;
    const a = id ? { ...get('alunos', id), status: sit(get('alunos', id)) } : { nome: '', turmaIds: presetTurma ? [presetTurma] : [], status: 'matriculado', matriculaEm: today(), autorizaImagem: 'Pendente', termoAssinado: 'Pendente' };
    if (pre) Object.assign(a, pre.campos);`);
rep(`    openModal(id ? esc(a.nome) : 'Nova inscrição', \`\${photo}\${nav}`, `    openModal(pre ? 'Matrícula: ficha do aluno' : id ? esc(a.nome) : 'Nova inscrição', \`\${pre ? pre.banner : ''}\${photo}\${nav}`);
rep(`    $('#modal-root .modal').dataset.ctx = JSON.stringify({ type: 'aluno', id });`, `    $('#modal-root .modal').dataset.ctx = JSON.stringify({ type: 'aluno', id, pedidoId: pre ? pre.pedidoId : '' });`);
rep(`    const newId = id || uid();
    if (await guard(() => put('alunos', newId, body), id ? 'Ficha atualizada.' : 'Inscrição salva. Se quiser, adicione a foto.')) { closeModal(); if (!id) alunoModal(newId); }`,
`    const newId = id || uid();
    const pedidoId = JSON.parse($('#modal-root .modal')?.dataset.ctx || '{}').pedidoId;
    if (pedidoId) {
      const turmaFinal = body.turmaIds.find((t) => t === get('pedidos', pedidoId)?.turmaEscolhida) || body.turmaIds[0] || '';
      if (await guard(async () => { await put('alunos', newId, body); await patch('pedidos', pedidoId, { status: 'aprovado', alunoId: newId, turmaFinal, avaliadoEm: new Date().toISOString() }); const iid = get('pedidos', pedidoId)?.interessadoId; if (iid) await patch('interessados', iid, { alunoId: newId, viraAlunoEm: new Date().toISOString() }); }, \`Matrícula concluída: \${nome.split(' ')[0]} está em \${turmaNome(turmaFinal)}.\`)) closeModal();
      return;
    }
    if (await guard(() => put('alunos', newId, body), id ? 'Ficha atualizada.' : 'Inscrição salva. Se quiser, adicione a foto.')) { closeModal(); if (!id) alunoModal(newId); }`);

// Painel: seção Divulgação (como as pessoas conheceram o Íris), para o marketing.
rep(`      <section>
        <div class="section-title"><h2>Quem são os alunos</h2>`, `      \${divulgacaoSec()}
      <section>
        <div class="section-title"><h2>Quem são os alunos</h2>`);

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
      case 'op-resumo': resumoOp(t.dataset.id); break;
      case 'insc-aba': S.inscAba = t.dataset.v; render(); break;
      case 'int-open': interessadoModal(t.dataset.id); break;
      case 'curso-open': cursoModal(t.dataset.id); break;
      case 'curso-save': saveCurso(t.dataset.id); break;
      case 'just-open': justModal(t.dataset.id); break;
      case 'just-dec': decidirJust(t.dataset.id, t.dataset.v); break;
      case 'ped-open': pedidoModal(t.dataset.id); break;
      case 'ped-dec': decidirPedido(t.dataset.id, t.dataset.v); break;
      case 'ped-ficha': fichaDoPedido(t.dataset.id); break;`);
rep(`        if (key === 'del-lanc')`, `        if (key === 'del-portal') { if (await guard(() => del(ctx.col, ctx.id), 'Removido.')) closeModal(); }
        if (key === 'del-lanc')`);
rep(`  document.addEventListener('input', (e) => {`, `  document.addEventListener('change', (e) => { if (e.target.id === 'm-foto') lerFotoMural(e.target.files[0]); });
  document.addEventListener('input', (e) => {`);

rep(`  document.addEventListener('change', (e) => { if (e.target.id === 'm-foto') lerFotoMural(e.target.files[0]); });`,
`  document.addEventListener('change', (e) => { if (e.target.id === 'm-foto') lerFotoMural(e.target.files[0]); if (e.target.id === 'p-curso') { const sel = document.getElementById('p-turma'); sel.innerHTML = turmasDoCurso(e.target.value).map((t) => \`<option value="\${t.id}">\${esc(t.nome)} · \${esc(vagasTxt(t))}</option>\`).join(''); } });`);

// Dados de exemplo do portal.
rep(`    return { turmas, alunos, chamadas, lancamentos };`, `    turmas[t1].curso = 'Informática básica'; turmas[t2].curso = 'Reforço escolar'; turmas[t3].curso = 'Dança';
    turmas['ex-turma-info-manha'] = { nome: 'Informática básica — manhã', curso: 'Informática básica', dias: [2, 4], horario: '09:00', horarioFim: '11:00', capacidade: 12, professor: 'Prof. Carla', cor: '#1d8bb5', portalAberto: true, exemplo: true };
    Object.assign(turmas[t1], { portalAberto: true, portalDescricao: 'Computador, internet, e-mail, Word e Excel do zero.', portalQuem: 'A partir de 10 anos' });
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
    // Cliques de exemplo nas oportunidades.
    const ids = Object.keys(alunos).filter((k) => alunos[k].status === 'matriculado');
    oportunidades['ex-op1'].cliques = Object.fromEntries(ids.slice(0, 7).map((k, i) => [k, 1 + (i % 3)]));
    oportunidades['ex-op2'].cliques = Object.fromEntries(ids.slice(2, 6).map((k) => [k, 1]));
    oportunidades['ex-op1'].criadoEm = new Date(Date.now() - 6 * 864e5).toISOString();
    oportunidades['ex-op2'].criadoEm = new Date(Date.now() - 2 * 864e5).toISOString();
    // Justificativas: usa faltas reais dos exemplos de chamada.
    const faltas = [];
    for (const c of Object.values(chamadas).sort((a, b) => b.data.localeCompare(a.data))) for (const [aid, v] of Object.entries(c.registros)) if (v === 'F') faltas.push({ aid, c });
    const usados = new Set(); const justificativas = {};
    [['Consulta médica, tenho o atestado.', 'atestado.jpg'], ['Fiquei sem ônibus por causa da chuva.', '']].forEach(([motivo, anexo], k) => {
      const f = faltas.find((x) => !usados.has(x.aid)); if (!f) return; usados.add(f.aid);
      justificativas['ex-ju' + k] = { alunoId: f.aid, turmaId: f.c.turmaId, data: f.c.data, motivo, anexo, status: 'pendente', enviadoEm: new Date().toISOString(), exemplo: true };
    });
    const pedidos = {
      'ex-pe1': { alunoId: 'ex-aluno-1', curso: 'Reforço escolar', turmaId: t2, telefone: '(21) 98765-4321', obs: 'Quero reforço de matemática para o ENEM.', status: 'pendente', enviadoEm: new Date(Date.now() - 864e5).toISOString(), exemplo: true },
      'ex-pe2': { alunoId: 'ex-aluno-2', curso: 'Dança', turmaId: t3, telefone: '(21) 97777-1234', obs: 'Só consigo aos sábados.', status: 'pendente', enviadoEm: new Date().toISOString(), exemplo: true },
    };
    const INT = [['Marcos Vinícius Alves', '2006-08-14', 'Éden', 'Instagram', '(21) 99123-4567'], ['Juliana Prado', '2001-01-22', 'Vilar dos Teles', 'Indicação', '(21) 99234-5678'], ['Renata Gomes', '1979-11-05', 'Éden', 'Na rua / evento', '(21) 99345-6789'], ['Lucas Ferreira', '2008-04-30', 'Coelho da Rocha', 'Instagram', '(21) 99456-7890'], ['Patrícia Souza', '1992-07-18', 'Centro', 'WhatsApp', '(21) 99567-8901'], ['Thiago Martins', '2007-12-02', 'Éden', 'Escola', '(21) 99678-9012'], ['Bianca Rocha', '1999-03-09', 'Jardim Meriti', 'Instagram', '(21) 99789-0123'], ['Sérgio Lima', '1965-09-27', 'Vilar dos Teles', 'Indicação', '(21) 99890-1234']];
    const interessados = {};
    INT.forEach(([nome, nascimento, bairro, comoConheceu, telefone], k) => (interessados['ex-in' + k] = { nome, nascimento, bairro, comoConheceu, telefone, email: nome.split(' ')[0].toLowerCase().normalize('NFD').replace(/[^a-z]/g, '') + '@exemplo.com', aceitaComunicacoes: k % 3 ? 'Sim' : 'Não', criadoEm: new Date(Date.now() - (k * 3 + 1) * 864e5).toISOString(), exemplo: true }));
    interessados['ex-in2'].alunoId = 'ex-aluno-2';
    pedidos['ex-pe3'] = { interessadoId: 'ex-in0', alunoId: '', nome: 'Marcos Vinícius Alves', nascimento: '2006-08-14', curso: 'Informática básica', turmaId: '', telefone: '(21) 99123-4567', obs: 'Prefiro de manhã.', status: 'pendente', enviadoEm: new Date().toISOString(), exemplo: true };
    return { turmas, alunos, chamadas, lancamentos, avisos, mural, oportunidades, justificativas, pedidos, interessados };`);

writeFileSync('portal/gestao-coordenacao.html', `<script>window.IRIS_DEMO = true;</script>\n${app}`);
console.log('portal/gestao-coordenacao.html gerado');
