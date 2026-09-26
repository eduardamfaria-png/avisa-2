# Arquitetura do AVISÊ

O AVISÊ é um **radar pessoal de eventos e ingressos**: descoberta + monitoramento + alerta.
Ele não vende ingressos — leva o usuário até a fonte.

## Camadas

```
src/
  core/            Domínio puro (sem React, sem browser) — usado pelo front e pelo worker
    types.ts         Entidades
    sources/         Interfaces de fontes + SourceRegistry
    monitoring/      Motor: runCycle → detectChanges → buildNotifications
    market.ts        Consultas de preço (menor preço, histórico, estatísticas)
    location.ts      Distância e área de interesse por artista
    plans.ts         Limites Gratuito/Premium e ponto único de links de saída (afiliados)
  mocks/           ⚠️ Dados e fontes FICTÍCIAS (separados de tudo)
  repositories/    Persistência (localStorage hoje; trocar por API/DB)
  services/        Catálogo, busca, filtros, recomendações ("Por que estou vendo isso?")
  state/           Store da aplicação (sessão, Radar, alertas, simulação)
  components/      Componentes reutilizáveis
  pages/           Telas
server/worker.ts   Worker periódico (mesmo motor do front)
docs/schema.prisma Schema relacional de referência
```

## Fluxo de monitoramento

`runMonitoringCycle(registry, world)` → `detectChanges` → `buildNotifications` (por usuário):

1. consultar fontes disponíveis (cada fonte isolada; falha de uma não derruba o ciclo)
2. verificar novos eventos (`EventSource`)
3. verificar preços (`TicketSource` / `ResaleSource`)
4. comparar com histórico (`PriceHistory`)
5. detectar queda (`price_drop`)
6. detectar novo menor preço (`new_lowest_price`)
7. atualizar banco (novo `WorldState`)
8. gerar alertas respeitando Radar, artistas seguidos (com área), preço-alvo e níveis (Sempre / Importantes / Desativado)

Exemplo (`comparePrices(1590, 1290, 1590)`):
`price_drop = true`, `price_difference = 300`, `percentage_change = -18.87`, `new_lowest_price = true`.

## Fontes

Toda fonte implementa uma interface de `core/sources/types.ts` e é registrada no `SourceRegistry`.
Adicionar/remover uma plataforma não altera o motor.

**Regra:** só registrar em produção fontes com coleta **técnica e legalmente permitida**
(API oficial com termos compatíveis, contrato de parceria ou feed autorizado). Não assumir que
qualquer plataforma permite API, scraping, coleta ou redistribuição. O campo
`TicketSource.integration` documenta a base de cada integração.

Para criar uma integração real: `src/integrations/<plataforma>.ts` implementando
`TicketSourceAdapter`/`ResaleSourceAdapter`/`EventSource`, e registrar no lugar de `createMockRegistry`.

## Mocks

Tudo em `src/mocks/` é fictício e sinalizado na interface (banner de demonstração, fontes
"(demo)", selo "Fictícia"). O roteiro `mocks/scenario.ts` faz cada ciclo produzir um tipo de
alerta de forma previsível; depois do roteiro, os preços de revenda oscilam de forma determinística.

## Monetização futura (não implementada)

- `core/plans.ts`: limites por plano (Radar, preços-alvo, histórico, notificações prioritárias).
- `outboundUrl()`: ponto único para parâmetros de afiliado/parceria.
- Nenhum pagamento é simulado.

## Próximos passos (Fase 2/3)

Comunidade, reviews, comentários, seguidores, retrospectiva, conquistas (schema já previsto);
push/e-mail (campo `Notification.channel`); integrações reais; Premium.
