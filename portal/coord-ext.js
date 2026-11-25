  // ───────────── Portal do Aluno (o que a equipe publica e avalia) ─────────────
  const semId = (o) => { if (!o) return {}; const { id, ...r } = o; return r; };
  const pendentes = (col) => list(col).filter((x) => x.status === 'pendente');
  const nomeAluno = (id) => get('alunos', id)?.nome || 'Aluno removido';
  const turmaNome = (id) => get('turmas', id)?.nome || '—';
  const turmaOptions = (sel, todas) => (todas ? `<option value="">${todas}</option>` : '') + turmasList().map((t) => `<option value="${t.id}"${t.id === sel ? ' selected' : ''}>${esc(t.nome)}</option>`).join('');
  const STJ = { pendente: ['Em análise', 'amber'], aceita: ['Aceita', 'green'], recusada: ['Não aceita', 'red'], aprovado: ['Matriculado', 'green'], recusado: ['Recusado', 'red'] };
  const stPill = (s) => `<span class="pill ${STJ[s]?.[1] || ''}">${STJ[s]?.[0] || esc(s)}</span>`;
  const delFoot = (col, id, saveAct) => `${id ? confirmBtn('del-portal', 'Excluir', 'Confirmar exclusão', 'btn ghost') : ''}<span class="grow"></span><button class="btn" data-act="modal-close">Cancelar</button><button class="btn primary" data-act="${saveAct}" data-id="${id || ''}">${id ? 'Salvar' : 'Publicar'}</button>`;

  function justRow(j) {
    return `<button class="item" data-act="just-open" data-id="${j.id}">${avatar(get('alunos', j.alunoId), 36)}<div class="grow"><strong>${esc(nomeAluno(j.alunoId))}</strong><span class="sub">${esc(turmaNome(j.turmaId))} · falta em ${fmtWeekday(j.data)}</span></div>${stPill(j.status)}</button>`;
  }
  function justCard() {
    const p = pendentes('justificativas');
    if (!p.length) return '';
    return `<div><div class="section-title"><h2>Justificativas para avaliar</h2><span>${plural(p.length, 'pendente', 'pendentes')}</span></div>
      <div class="card list">${p.map(justRow).join('')}</div></div>`;
  }

  function pedidosSec() {
    const p = pendentes('pedidos').sort((a, b) => String(a.enviadoEm).localeCompare(String(b.enviadoEm)));
    if (!p.length) return '';
    return `<section><div class="section-title"><h2>Pedidos pelo Portal do Aluno</h2><span>${plural(p.length, 'aguardando aprovação', 'aguardando aprovação')}</span></div>
      <div class="card list">${p.map((x) => `<button class="item" data-act="ped-open" data-id="${x.id}">${avatar(get('alunos', x.alunoId) || { nome: x.nome }, 36)}<div class="grow"><strong>${esc(nomePedido(x))}</strong><span class="sub">Quer entrar em <b>${esc(cursoPedido(x))}</b>${x.alunoId ? '' : ' · pessoa nova'}</span><span class="sub num" style="display:block;color:var(--green);font-weight:700">WhatsApp ${esc(x.telefone || '—')}</span></div><span class="pill amber">Avaliar</span></button>`).join('')}</div></section>`;
  }

  function vPortal() {
    const subs = [['avisos', 'Avisos'], ['mural', 'Mural'], ['oportunidades', 'Oportunidades'], ['cursos', 'Cursos abertos'], ['justificativas', 'Justificativas']];
    const nj = pendentes('justificativas').length;
    const acao = { avisos: `<button class="btn primary" data-act="aviso-new">${icon('plus')}Novo aviso</button>`, mural: `<button class="btn primary" data-act="mural-new">${icon('plus')}Nova publicação</button>`, oportunidades: `<button class="btn primary" data-act="op-new">${icon('plus')}Nova oportunidade</button>` }[S.portalSub] || '';
    const sub = { avisos: pAvisos, mural: pMural, oportunidades: pOport, cursos: pCursos, justificativas: pJust }[S.portalSub] || pAvisos;
    return header('Portal do Aluno', 'Portal', 'O que os alunos veem no portal deles: avisos, mural, oportunidades e cursos com inscrição aberta.', acao) + notices() + `
      <div class="ptabs" role="tablist" aria-label="Seções do portal">${subs.map(([k, l]) => `<button class="chip${S.portalSub === k ? ' on' : ''}" role="tab" aria-selected="${S.portalSub === k}" data-act="p-sub" data-v="${k}">${l}${k === 'justificativas' && nj ? ` <i class="num">${nj}</i>` : ''}</button>`).join('')}</div>
      ${sub()}`;
  }

  function pAvisos() {
    const l = list('avisos').sort((a, b) => String(b.ate).localeCompare(String(a.ate)));
    const hoje = today();
    if (!l.length) return `<div class="empty card"><h3>Nenhum aviso</h3><p>Os avisos aparecem na tela inicial do portal e somem sozinhos na data escolhida.</p><button class="btn primary" data-act="aviso-new">${icon('plus')}Novo aviso</button></div>`;
    return `<p class="small muted">Aparecem na tela inicial do aluno até a data escolhida. Depois somem sozinhos.</p>
      <div class="card list">${l.map((a) => { const on = a.ate >= hoje; return `<button class="item${on ? '' : ' off'}" data-act="aviso-open" data-id="${a.id}"><div class="grow"><strong>${esc(a.titulo)}</strong><span class="sub">${a.turmaId ? esc(turmaNome(a.turmaId)) : 'Todos os alunos'} · ${on ? 'até ' + fmtDate(a.ate) : 'venceu em ' + fmtDate(a.ate)}</span></div>${a.importante ? '<span class="pill red">Importante</span>' : ''}<span class="pill ${on ? 'green' : ''}">${on ? 'No ar' : 'Vencido'}</span></button>`; }).join('')}</div>`;
  }
  function pMural() {
    const l = list('mural').sort((a, b) => String(b.criadoEm).localeCompare(String(a.criadoEm)));
    if (!l.length) return `<div class="empty card"><h3>Mural vazio</h3><p>Publique fotos e novidades do instituto.</p><button class="btn primary" data-act="mural-new">${icon('plus')}Nova publicação</button></div>`;
    return `<p class="small muted">Fotos e novidades que aparecem na aba Mural do portal. Antes de postar foto de aluno, confira se a ficha autoriza uso de imagem.</p>
      <div class="card list">${l.map((m) => `<button class="item" data-act="mural-open" data-id="${m.id}">${m.foto ? `<img class="mural-thumb" src="${esc(m.foto)}" alt="">` : `<span class="mural-thumb" style="display:grid;place-items:center;color:var(--faint)">${icon('cam')}</span>`}<div class="grow"><strong>${esc(m.titulo)}</strong><span class="sub">Publicado em ${fmtDate((m.criadoEm || '').slice(0, 10))}</span></div></button>`).join('')}</div>`;
  }
  function pOport() {
    const l = list('oportunidades').sort((a, b) => String(a.prazo).localeCompare(String(b.prazo)));
    const hoje = today();
    if (!l.length) return `<div class="empty card"><h3>Nenhuma oportunidade</h3><p>Vagas, cursos e editais de fora do instituto, com o link da inscrição.</p><button class="btn primary" data-act="op-new">${icon('plus')}Nova oportunidade</button></div>`;
    return `<p class="small muted">Vagas, cursos e editais de fora do instituto. O aluno toca e vai direto para a inscrição no site de quem oferece. Somem depois do prazo.</p>
      <div class="card list">${l.map((o) => { const on = o.prazo >= hoje; return `<button class="item${on ? '' : ' off'}" data-act="op-open" data-id="${o.id}"><div class="grow"><strong>${esc(o.titulo)}</strong><span class="sub">${esc(o.tipo)} · ${on ? 'até ' + fmtDate(o.prazo) : 'encerrada'} · ${esc(hostDe(o.link))}</span></div></button>`; }).join('')}</div>`;
  }
  function pCursos() {
    const ts = turmasList();
    if (!ts.length) return `<div class="empty card"><h3>Nenhuma turma</h3><p>Crie turmas na aba Turmas para abrir inscrições no portal.</p></div>`;
    return `<p class="small muted">Turmas que aparecem em "Cursos do Íris" no portal, com o botão de inscrição. Os pedidos chegam em Inscrições para aprovar.</p>
      <div class="card list">${ts.map((t) => { const n = alunosDaTurma(t.id).length; const cap = Number(t.capacidade) || 0; const livres = cap ? Math.max(0, cap - n) : null; return `<button class="item" data-act="curso-open" data-id="${t.id}"><span class="dotc" style="background:${esc(t.cor || '#1c2d6b')}"></span><div class="grow"><strong>${esc(t.nome)}</strong><span class="sub">${livres == null ? 'Vagas não definidas' : livres ? plural(livres, 'vaga livre', 'vagas livres') : 'Sem vagas: entra na lista de espera'}</span></div><span class="pill ${t.portalAberto ? 'green' : ''}">${t.portalAberto ? 'Inscrições abertas' : 'Fechado'}</span></button>`; }).join('')}</div>`;
  }
  function pJust() {
    const l = list('justificativas').sort((a, b) => Number(b.status === 'pendente') - Number(a.status === 'pendente') || String(b.enviadoEm).localeCompare(String(a.enviadoEm)));
    if (!l.length) return '<div class="empty card"><h3>Nenhuma justificativa</h3><p>Quando um aluno justificar uma falta pelo portal, ela aparece aqui.</p></div>';
    return `<p class="small muted">A falta só passa a contar como justificada depois que alguém da equipe aceita. Até lá, continua como falta.</p>
      <div class="card list">${l.map(justRow).join('')}</div>`;
  }
  function hostDe(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u || 'sem link'; } }

  // Janelas de edição
  function avisoModal(id) {
    const a = id ? get('avisos', id) : { titulo: '', texto: '', turmaId: '', ate: addDays(today(), 7), importante: false };
    openModal(id ? 'Editar aviso' : 'Novo aviso', `<div class="form-grid">
      <label class="field full"><span>Título</span><input class="input" id="a-tit" maxlength="90" value="${esc(a.titulo)}" placeholder="Ex.: Sem aula na sexta-feira"></label>
      <label class="field full"><span>Mensagem</span><textarea class="textarea" id="a-txt">${esc(a.texto)}</textarea></label>
      <label class="field"><span>Para quem</span><select class="select" id="a-turma">${turmaOptions(a.turmaId, 'Todos os alunos')}</select></label>
      <label class="field"><span>Mostrar até</span><input class="input" type="date" id="a-ate" value="${esc(a.ate)}"></label>
      <label class="check full"><input type="checkbox" id="a-imp"${a.importante ? ' checked' : ''}><span>Importante: aparece em vermelho e no topo</span></label>
    </div>`, delFoot('avisos', id, 'aviso-save'));
    $('#modal-root .modal').dataset.ctx = JSON.stringify({ col: 'avisos', id });
  }
  async function saveAviso(id) {
    const body = { titulo: val('a-tit'), texto: val('a-txt'), turmaId: val('a-turma'), ate: val('a-ate'), importante: document.getElementById('a-imp').checked };
    if (!body.titulo || !body.ate) return toast('Preencha o título e a data em que o aviso some.');
    const prev = id ? get('avisos', id) : null;
    if (await guard(() => put('avisos', id || uid(), { ...semId(prev), ...body, criadoEm: prev?.criadoEm || new Date().toISOString() }), id ? 'Aviso atualizado.' : 'Aviso publicado no portal.')) closeModal();
  }

  let fotoMural = null;
  function muralModal(id) {
    const m = id ? get('mural', id) : { titulo: '', texto: '', foto: '' };
    fotoMural = m.foto || '';
    openModal(id ? 'Editar publicação' : 'Nova publicação no mural', `<div class="form-grid">
      <label class="field full"><span>Foto</span><input class="input" type="file" id="m-foto" accept="image/*"><img class="foto-prev" id="m-prev" alt=""${m.foto ? ` src="${esc(m.foto)}"` : ' hidden'}></label>
      <label class="field full"><span>Título</span><input class="input" id="m-tit" maxlength="90" value="${esc(m.titulo)}"></label>
      <label class="field full"><span>Texto</span><textarea class="textarea" id="m-txt">${esc(m.texto)}</textarea></label>
    </div>`, delFoot('mural', id, 'mural-save'));
    $('#modal-root .modal').dataset.ctx = JSON.stringify({ col: 'mural', id });
  }
  function lerFotoMural(file) {
    if (!file) return;
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, 1280 / Math.max(img.width, img.height)); const c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      fotoMural = c.toDataURL('image/jpeg', 0.8); URL.revokeObjectURL(url);
      const p = document.getElementById('m-prev'); if (p) { p.src = fotoMural; p.hidden = false; }
    };
    img.src = url;
  }
  async function saveMural(id) {
    const body = { titulo: val('m-tit'), texto: val('m-txt'), foto: fotoMural || '' };
    if (!body.titulo) return toast('Escreva um título.');
    const prev = id ? get('mural', id) : null;
    if (await guard(() => put('mural', id || uid(), { ...semId(prev), ...body, criadoEm: prev?.criadoEm || new Date().toISOString() }), id ? 'Publicação atualizada.' : 'Publicado no mural.')) closeModal();
  }

  function opModal(id) {
    const o = id ? get('oportunidades', id) : { tipo: 'Emprego', titulo: '', texto: '', quem: '', prazo: addDays(today(), 14), link: '' };
    openModal(id ? 'Editar oportunidade' : 'Nova oportunidade', `<div class="form-grid">
      <label class="field"><span>Tipo</span><select class="select" id="o-tipo">${['Emprego', 'Estágio', 'Curso', 'Edital'].map((x) => `<option${o.tipo === x ? ' selected' : ''}>${x}</option>`).join('')}</select></label>
      <label class="field"><span>Inscrições até</span><input class="input" type="date" id="o-prazo" value="${esc(o.prazo)}"></label>
      <label class="field full"><span>Título</span><input class="input" id="o-tit" maxlength="100" value="${esc(o.titulo)}"></label>
      <label class="field full"><span>Descrição</span><textarea class="textarea" id="o-txt">${esc(o.texto)}</textarea></label>
      <label class="field full"><span>Para quem</span><input class="input" id="o-quem" value="${esc(o.quem)}" placeholder="Ex.: de 16 a 24 anos, ensino médio"></label>
      <label class="field full"><span>Link da inscrição</span><input class="input" type="url" id="o-link" value="${esc(o.link)}" placeholder="https://"></label>
    </div>`, delFoot('oportunidades', id, 'op-save'));
    $('#modal-root .modal').dataset.ctx = JSON.stringify({ col: 'oportunidades', id });
  }
  async function saveOp(id) {
    const body = { tipo: val('o-tipo'), prazo: val('o-prazo'), titulo: val('o-tit'), texto: val('o-txt'), quem: val('o-quem'), link: val('o-link') };
    if (!body.titulo || !body.prazo) return toast('Preencha o título e o prazo.');
    if (!/^https?:\/\/\S+\.\S+/.test(body.link)) return toast('Cole o link da inscrição (começando com https://).');
    const prev = id ? get('oportunidades', id) : null;
    if (await guard(() => put('oportunidades', id || uid(), { ...semId(prev), ...body }), id ? 'Oportunidade atualizada.' : 'Oportunidade publicada.')) closeModal();
  }

  function cursoModal(id) {
    const t = get('turmas', id); if (!t) return;
    openModal(`Portal: ${esc(t.nome)}`, `<div class="form-grid">
      <label class="check full"><input type="checkbox" id="c-aberto"${t.portalAberto ? ' checked' : ''}><span><b>Inscrições abertas no portal</b><br><span class="small muted">O curso aparece em "Cursos do Íris" com o botão de inscrição.</span></span></label>
      <label class="field full"><span>Descrição para os alunos</span><textarea class="textarea" id="c-desc" placeholder="O que se aprende no curso">${esc(t.portalDescricao || '')}</textarea></label>
      <label class="field full"><span>Para quem</span><input class="input" id="c-quem" value="${esc(t.portalQuem || '')}" placeholder="Ex.: a partir de 12 anos"></label>
      <p class="small muted full">Dias, horário e vagas vêm da turma: ${(t.dias || []).map((d) => DIAS[d]).join(', ') || 'sem dias'} · ${esc(horarioTxt(t) || '--:--')} · ${Number(t.capacidade) || 0} vagas.</p>
    </div>`, `<span class="grow"></span><button class="btn" data-act="modal-close">Cancelar</button><button class="btn primary" data-act="curso-save" data-id="${id}">Salvar</button>`);
  }
  async function saveCurso(id) {
    const body = { portalAberto: document.getElementById('c-aberto').checked, portalDescricao: val('c-desc'), portalQuem: val('c-quem') };
    if (await guard(() => patch('turmas', id, body), body.portalAberto ? 'Inscrições abertas no portal.' : 'Curso fechado no portal.')) closeModal();
  }

  function justModal(id) {
    const j = get('justificativas', id); if (!j) return;
    const a = get('alunos', j.alunoId);
    const pend = j.status === 'pendente';
    openModal('Justificativa de falta', `<div class="row" style="margin-bottom:14px">${avatar(a, 44)}<div class="grow"><b>${esc(nomeAluno(j.alunoId))}</b><div class="small muted">${esc(turmaNome(j.turmaId))} · falta em ${fmtLong(j.data)}</div></div>${stPill(j.status)}</div>
      <div class="quote">${esc(j.motivo)}</div>
      ${j.anexo ? `<p class="small muted" style="margin-top:8px">Anexo: <b>${esc(j.anexo)}</b> (no site, abre a foto ou o PDF enviado)</p>` : '<p class="small muted" style="margin-top:8px">Sem anexo.</p>'}
      ${pend ? `<label class="field" style="margin-top:14px"><span>Resposta para o aluno (opcional)</span><textarea class="textarea" id="j-resp" placeholder="Ex.: traga o atestado original na próxima aula"></textarea></label>
        <p class="small muted" style="margin-top:8px">Ao aceitar, a chamada desse dia muda de <b>Falta</b> para <b>Justificada</b>.</p>` : j.resposta ? `<p class="small" style="margin-top:12px"><b>Resposta enviada:</b> ${esc(j.resposta)}</p>` : ''}`,
      pend ? `<button class="btn" data-act="go-chamada" data-t="${j.turmaId}" data-d="${j.data}">Ver chamada</button><span class="grow"></span><button class="btn danger" data-act="just-dec" data-id="${id}" data-v="recusada">Não aceitar</button><button class="btn primary" data-act="just-dec" data-id="${id}" data-v="aceita">Aceitar</button>`
        : `<button class="btn" data-act="go-chamada" data-t="${j.turmaId}" data-d="${j.data}">Ver chamada</button><span class="grow"></span><button class="btn" data-act="modal-close">Fechar</button>`);
  }
  async function decidirJust(id, status) {
    const j = get('justificativas', id); if (!j) return;
    const resposta = val('j-resp');
    const key = `${j.turmaId}_${j.data}`; const ch = get('chamadas', key);
    const ok = await guard(async () => {
      await patch('justificativas', id, { status, resposta, avaliadoEm: new Date().toISOString(), avaliadoPor: S.me?.email || '' });
      if (status === 'aceita' && ch) await patch('chamadas', key, { registros: { ...(ch.registros || {}), [j.alunoId]: 'J' } });
    }, status === 'aceita' ? 'Aceita: a falta agora conta como justificada.' : 'Justificativa não aceita: a falta continua contando.');
    if (ok) closeModal();
  }

  const cursoDe = (t) => t.curso || t.nome;
  const cursosList = () => [...new Set(turmasList().map(cursoDe))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const turmasDoCurso = (c) => turmasList().filter((t) => cursoDe(t) === c);
  const vagasTxt = (t) => { const cap = Number(t.capacidade) || 0; if (!cap) return 'vagas não definidas'; const l = cap - alunosDaTurma(t.id).length; return l > 0 ? plural(l, 'vaga', 'vagas') : 'lotada'; };
  const nomePedido = (p) => (p.alunoId ? nomeAluno(p.alunoId) : p.nome || 'Sem nome');
  const cursoPedido = (p) => p.curso || (get('turmas', p.turmaId) ? cursoDe(get('turmas', p.turmaId)) : '—');
  const waLink = (tel) => { let d = String(tel || '').replace(/\D/g, ''); if (d.length <= 11) d = '55' + d; return `https://wa.me/${d}`; };

  function pedidoModal(id) {
    const p = get('pedidos', id); if (!p) return;
    const a = p.alunoId ? get('alunos', p.alunoId) : null;
    const curso = cursoPedido(p);
    const ts = turmasDoCurso(curso);
    const sel = p.turmaId || ts[0]?.id || '';
    openModal('Pedido de inscrição', `<div class="row" style="margin-bottom:14px">${avatar(a || { nome: p.nome }, 44)}<div class="grow"><b>${esc(nomePedido(p))}</b><div class="small muted">${a ? 'Já é aluno(a) do instituto' : 'Pessoa nova: ainda não tem ficha'} · pedido em ${fmtDate((p.enviadoEm || '').slice(0, 10))}</div></div>${a ? `<button class="btn sm" data-act="aluno-open" data-id="${a.id}">Ver ficha</button>` : ''}</div>
      <div class="card pad" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;background:var(--green-soft);border-color:transparent;box-shadow:none">
        <div class="grow"><div class="small" style="color:var(--green);font-weight:700">Telefone / WhatsApp</div><div class="num" style="font-family:var(--display);font-size:22px;font-weight:800;white-space:nowrap">${esc(p.telefone || '—')}</div></div>
        <a class="btn primary" style="background:var(--green);border-color:var(--green);text-decoration:none" href="${esc(waLink(p.telefone))}" target="_blank" rel="noopener">Chamar no WhatsApp</a>
      </div>
      <dl class="kv" style="margin-top:14px"><dt>Curso pedido</dt><dd>${esc(curso)}</dd>${p.nascimento ? `<dt>Nascimento</dt><dd>${fmtDate(p.nascimento)} · ${age(p.nascimento)} anos</dd>` : ''}${p.obs ? `<dt>Recado</dt><dd style="font-weight:400">${esc(p.obs)}</dd>` : ''}</dl>
      <div class="form-grid" style="margin-top:16px">
        <label class="field"><span>Curso</span><select class="select" id="p-curso">${cursosList().map((c) => `<option${c === curso ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
        <label class="field"><span>Turma</span><select class="select" id="p-turma">${ts.map((t) => `<option value="${t.id}"${t.id === sel ? ' selected' : ''}>${esc(t.nome)} · ${esc(vagasTxt(t))}</option>`).join('')}</select></label>
      </div>
      <p class="small muted" style="margin-top:12px">Combine com o aluno pelo WhatsApp e depois toque em <b>Matricular e preencher ficha</b>: a ficha completa abre já com o nome, o telefone e a turma, para você terminar de preencher com os dados que ele passar.</p>
      <label class="field" style="margin-top:12px"><span>Se for recusar: motivo para o aluno (opcional)</span><input class="input" id="p-resp" placeholder="Ex.: turma lotada, abriremos nova turma em março"></label>`,
      `<button class="btn danger" data-act="ped-dec" data-id="${id}" data-v="recusado">Recusar</button><span class="grow"></span><button class="btn" data-act="modal-close">Depois</button><button class="btn primary" data-act="ped-ficha" data-id="${id}">Matricular e preencher ficha</button>`);
  }
  function fichaDoPedido(id) {
    const p = get('pedidos', id); if (!p) return;
    const turmaId = val('p-turma');
    if (!turmaId) return toast('Escolha a turma.');
    patch('pedidos', id, { turmaEscolhida: turmaId });
    const a = p.alunoId ? get('alunos', p.alunoId) : null;
    const t = get('turmas', turmaId);
    const campos = a
      ? { turmaIds: [...new Set([...(a.turmaIds || []), turmaId])], status: 'matriculado', matriculaEm: a.matriculaEm || today(), telefone: a.telefone || p.telefone }
      : { nome: p.nome || '', nascimento: p.nascimento || '', telefone: p.telefone || '', turmaIds: [turmaId], status: 'matriculado', matriculaEm: today(), comoConheceu: 'Outro', obs: p.obs ? 'Recado no pedido pelo portal: ' + p.obs : '' };
    const banner = `<div class="banner" style="margin-bottom:14px">${icon('info')}<span class="grow">Matrícula em <b>${esc(cursoDe(t))} · ${esc(t.nome)}</b>. Telefone: <b class="num">${esc(p.telefone || '—')}</b> <a href="${esc(waLink(p.telefone))}" target="_blank" rel="noopener" style="color:inherit;font-weight:700">(abrir WhatsApp)</a>. Preencha a ficha com os dados que o aluno passar e toque em <b>Salvar ficha</b> para concluir.</span></div>`;
    alunoModal(p.alunoId || null, null, { pedidoId: id, campos, banner });
  }
  async function decidirPedido(id, status) {
    const resposta = val('p-resp');
    if (await guard(() => patch('pedidos', id, { status, resposta, avaliadoEm: new Date().toISOString() }), 'Pedido recusado.')) closeModal();
  }
