# AVISÊ

> Você escolhe o que quer. O AVISÊ fica de olho.

Radar pessoal de eventos e ingressos. O usuário escolhe artistas e eventos, define cidade,
setor e preço-alvo, e o AVISÊ monitora anúncios, abertura de vendas, lotes, preços e revendas —
avisando só quando algo importante acontece.

**Fase 1** (esta versão): site responsivo (mobile first) com dados mockados e simulação de monitoramento.

## Rodando

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # testes do motor de monitoramento
npm run build      # typecheck + build de produção
npm run monitor    # worker de monitoramento no terminal (5 ciclos)
```

## Testando o fluxo principal

1. Abra a landing → **Criar meu Avisê** (ou **Entrar com a conta de demonstração**).
2. Faça o onboarding (artistas, cidades, viagem, orçamento).
3. **Explorar** ou busque “BTS” → abra **BTS — São Paulo**.
4. **Adicionar ao Meu Avisê** → setor *Pista Premium*, preço máximo *1500*.
5. Em **Meu Avisê** (ou Alertas), clique **Rodar ciclo agora**.
6. O preço cai de R$ 1.590 para R$ 1.290 → aparecem os alertas *O preço caiu!* e *Preço atingido!*.
7. Clique **Ver ingresso** → página de saída para a fonte (fictícia nesta versão).

Rode mais ciclos para ver: novo show anunciado, revenda encontrada, mudança de lote, abertura
de vendas, esgotado, ingresso disponível novamente e novo menor preço.
**Reiniciar** (no painel de simulação ou no Perfil) volta tudo ao início.

## Importante

- Eventos, locais, preços e fontes são **fictícios**; nomes de artistas são só exemplos.
- Contas ficam salvas apenas no navegador (localStorage). Não use senha real.
- Arquitetura, fontes e schema: [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md), [`docs/schema.prisma`](docs/schema.prisma).
