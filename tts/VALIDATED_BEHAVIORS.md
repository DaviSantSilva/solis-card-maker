# Solis TTS — Comportamentos Validados

Checklist de regressão para os scripts em `tts/`. Como o código roda
dentro do sandbox do Tabletop Simulator (sem runtime externo para
testes automatizados), a validação é manual, em partida real.

**Como usar:** antes de entregar qualquer nova feature ou fix nos
scripts do TTS, revisar os itens relevantes desta lista contra o
comportamento atual. Qualquer alteração que quebrar um item marcado
como ✅ é uma regressão e deve ser corrigida antes do commit.

Última validação completa: confirmada por Davi, todos os itens ✅.

---

## 1. Menu de configuração (`solis-setup-ui.xml` + handlers em `solis-global.lua`)

| # | Comportamento | Critério de aprovação |
|---|---|---|
| 1.1 | Painel não ocupa a tela inteira | Painel renderiza em tamanho fixo (620×740), centralizado, com `rectAlignment="MiddleCenter"` |
| 1.2 | Seleção de jogadores é exclusiva (radio) | Marcar "3" desmarca automaticamente qualquer outro número já marcado |
| 1.3 | Seleção de idioma é exclusiva (radio) | Marcar um idioma desmarca qualquer outro já marcado |
| 1.4 | Seleção de modo é exclusiva (radio) | Marcar Automático/Manual desmarca a outra opção |
| 1.5 | Não é possível ficar com 0 opções marcadas | Tentar desmarcar sem marcar outra reverte para o estado anterior |
| 1.6 | Apenas o host pode interagir | Jogador não-host clicando em qualquer checkbox/botão do menu: ação é revertida, nada muda no `setupState` |
| 1.7 | Callbacks XmlUI recebem o objeto Player, não uma string de cor | `isHost(player)` usa `player.host` diretamente — nunca `Player[playerColor]` |
| 1.8 | Botão fechar (✕) fecha o painel | `solisSetupPanel.active` vira `false`, `reopenPanelButton.active` vira `true` |
| 1.9 | Botão de reabrir é discreto | Apenas ícone "⚙", 44×44px, canto inferior direito (`rectAlignment="LowerRight"`) |
| 1.10 | Comando de emergência `/fecharsolis` funciona | Digitar no chat fecha o painel independente do estado dos botões |

---

## 2. Import do manifest (`fetchManifestAndSpawn` → `buildDeckLists`)

| # | Comportamento | Critério de aprovação |
|---|---|---|
| 2.1 | Busca o manifest do idioma selecionado | `manifest.json` (PT) ou `manifest-{locale}.json` conforme `setupState.locale` |
| 2.2 | Classificação de cartas iniciais | `meta.rarity == "inicial"` E `meta.companyId` válido → vai para o deck daquela corp |
| 2.3 | Classificação de cartas de mercado | Qualquer carta que não seja inicial (ou com `companyId` inválido) → vai para o baralho principal |
| 2.4 | Quantidades vêm do manifest, não hardcoded | `meta.quantity` de cada carta é respeitado — sem números de jogo fixos no script |
| 2.5 | Diagnóstico pré-spawn bate com o catálogo real | Status mostra `Mercado: 162 cópias (62 designs)` e `10 (2 designs)` por corp — validado contra o catálogo publicado |

---

## 3. Geração das cartas na mesa (`spawnAllDecks` → `processSpawnQueue`)

| # | Comportamento | Critério de aprovação |
|---|---|---|
| 3.1 | Cartas respondem à física normalmente | `Locked = false` explícito no ObjectState — cartas caem, colidem, empilham como objetos normais |
| 3.2 | Cartas nascem com o verso para cima | `rotZ = 180` (não `rotY` — esse eixo só gira no próprio plano, não troca face/verso) |
| 3.3 | Geração em lotes não trava o TTS | `BATCH_DELAY = 0.08s` entre cada spawn, via `Wait.time` recursivo |
| 3.4 | Cartas da mesma posição viram um Deck único | `group()` chamado em `mergeAllPendingDecks()` para cada posição com mais de 1 objeto |
| 3.5 | "Começar" é idempotente — clicar de novo não duplica | `clearAllTargetPositions()` remove tudo nas 6 posições (busca ampla 3×6×3, `max_distance=6`) antes de gerar as novas |
| 3.6 | Clique duplo durante o processamento é bloqueado | `isSpawning` trava o botão (`interactable=false`) até `mergeAllPendingDecks` terminar ou um erro ocorrer |
| 3.7 | Diagnóstico pós-spawn bate com o pré-spawn | Contagem real na mesa (`getQuantity()` por posição) == diagnóstico calculado do manifest |

---

## 4. Atribuição jogador ↔ corporação (`assignCorpsToPlayers`, modo Automático)

| # | Comportamento | Critério de aprovação |
|---|---|---|
| 4.1 | Respeita o nº de jogadores selecionado no menu | Selecionar N jogadores gera exatamente N decks de corporação — não sempre 5 |
| 4.2 | Prioridade 1 — cores já sentadas | Jogador sentado numa cor de corp reivindica aquela corp automaticamente |
| 4.3 | Prioridade 2 — forçar sentar jogadores sem cor | Jogador na sala sem cor escolhida é movido (`changeColor`) para uma corp restante, até completar N |
| 4.4 | Prioridade 3 — sortear o restante | Se não há mais jogadores na sala para completar N, sorteia entre as corps realmente não reivindicadas (Fisher-Yates com `math.randomseed(os.time())` em `onLoad`) |
| 4.5 | Deck de corp não-atribuída nunca é gerado (modo Auto) | Só as N corps do resultado de `assignCorpsToPlayers()` entram na fila de spawn |
| 4.6 | Modo Manual sempre gera as 5 corps | Independente da seleção de jogadores, todas as 5 são geradas — deslocadas 25 unidades no eixo Z da posição normal (área de espera fora da mesa) |
| 4.7 | Mercado é sempre completo | Composição do baralho principal não depende do nº de jogadores nem do modo |

---

## 5. Player Deck Manager (`player-deck-manager.lua`, um script por corp)

| # | Comportamento | Critério de aprovação |
|---|---|---|
| 5.1 | Um único script serve as 5 corps | `corpId = self.getDescription()` — objeto identifica a corp pela Description |
| 5.2 | Botão "Comprar até 5" funciona | Puxa cartas até a zona de mão ter 5, usando `positions().hand` |
| 5.3 | Botão ajustável [-] [Comprar até X] [+] funciona | X persiste entre saves via `onSave`/`onLoad`, mínimo 1 |
| 5.4 | Compra vai para a zona de mão física, não a mão oculta do TTS | `takeObject` com posição = coordenada de mesa (`hand`), não `deck.deal()` |
| 5.5 | Auto-reshuffle quando o deck acaba no meio da compra | Descarte é movido para a posição do deck e embaralhado automaticamente, sem interromper a operação de compra |
| 5.6 | Botão "Reconstruir deck" funciona | Move todo o descarte para a posição do deck e embaralha |

---

## 6. Market Manager (`market-manager.lua`)

| # | Comportamento | Critério de aprovação |
|---|---|---|
| 6.1 | 6 zonas de compra preenchidas ao carregar | `fillAllSlots()` popula do deck do mercado, 2s após `onLoad` |
| 6.2 | Cada carta em zona de compra tem botão "Comprar" | Botão anexado à própria carta (`card.createButton`), não à zona |
| 6.3 | Comprar move a carta para o descarte da corp certa | `Global.call("getCorpForColor", playerColor)` identifica a corp pela cor da cadeira do comprador |
| 6.4 | Zona vazia (compra individual) é reabastecida automaticamente | `refillSlotIfEmpty` puxa do deck do mercado |
| 6.5 | "Limpar mercado" funciona como esteira, não reposição direta | Descarta 5 e 6 SEM repor → desloca 4→6, 3→5, 2→4, 1→3 (ordem direita→esquerda) → só 1 e 2 recebem carta nova do deck |
| 6.6 | Botão de compra é reindexado a cada movimento na esteira | `card.clearButtons()` + `attachBuyButton(card, novoSlotIndex)` — sem isso, uma carta deslocada dispararia a compra do slot antigo |
| 6.7 | Compras são bloqueadas durante a transição da esteira | `marketLocked` impede clique em "Comprar" enquanto o deslocamento está em andamento |

---

## Notas de manutenção

- **Callbacks XmlUI vs createButton:** XmlUI (`onValueChanged`/`onClick` no XML) recebe o **objeto Player** como primeiro argumento. `createButton`'s `click_function` recebe a **cor como string**. Não confundir os dois — foi a causa de um bug sério (item 1.7).
- **Eixo de rotação de cartas:** Y gira no próprio plano (não troca face/verso). Z troca face/verso. Não confundir (item 3.2).
- **`Locked` não tem default seguro:** sempre declarar explicitamente em qualquer novo `ObjectState` gerado via `spawnObjectData` (item 3.1).
- **Copiar/colar do chat para o TTS pode corromper o script:** se um erro de sintaxe aparecer mesmo com o código validando limpo em `luac`, suspeitar de corrupção no clipboard antes de investigar lógica. Processo seguro: baixar o arquivo, copiar de um editor de texto puro, colar substituindo tudo.
