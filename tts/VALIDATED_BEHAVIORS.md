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
| 1.11 | Botões/painéis soltos de UI se movem corretamente do `rectAlignment` | Usar `offsetXY="x y"`, nunca `position="x y z"` — este último é ignorado em UI 2D solta, o elemento fica preso no ponto de ancoragem |
| 1.12 | Colar novo conteúdo na aba UI não deixa elementos duplicados | Sempre Ctrl+A + Delete + confirmar caixa vazia antes de colar. IDs duplicados fazem `setAttribute`/`onCloseClick` só afetar uma cópia, deixando a outra travada na tela |

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
| 3.8 | Todos os decks são embaralhados ao final | `shuffleAllDecks()` chama `.shuffle()` em cada posição de `positionByKey` — cobre tanto modo Automático quanto Manual (posições deslocadas) |
| 3.9 | Mercado é preenchido automaticamente ao final | `fillMarketSlotsFromDeck()` vira as 6 cartas do topo do deck do mercado para as zonas de compra, face para cima, staggered para evitar colisão física |
| 3.10 | Deck do mercado não fica torto após a distribuição | Rotação do deck restante é travada explicitamente (`setRotationSmooth`) depois da última extração — corrige o torque acumulado de puxar 6 cartas seguidas |
| 3.11 | Painel fecha automaticamente ao final do setup | Mensagem muda para "Aproveite o jogo, boa sorte!", painel fecha sozinho 5s depois via `onCloseClick()` chamado diretamente |

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

## 5. Gerenciador de Deck/Descarte do Jogador (`hand-manager.lua`) — arquitetura v4, Layout Zones em 1 objeto

> Substitui a versão de 10 objetos manuais (v3). Um único objeto gera
> as 10 zonas (5 deck + 5 descarte) automaticamente via
> `Global.call("getAllCorpIds")` — mesmo padrão do `market-manager.lua`.
> Botões vivem numa âncora (escala 1:1) 2 unidades abaixo (Z) de cada
> zona, sem risco de erro de escala.

| # | Comportamento | Critério de aprovação |
|---|---|---|
| 5.1 | As 10 zonas nascem automaticamente ao carregar | Loop sobre `getAllCorpIds()`, uma zona de deck + uma de descarte por corp, sem precisar criar objetos manualmente |
| 5.2 | Zona de deck tem exatamente 2 grupos de botão | "Comprar até 5" (fixo) e "[-] Comprar X [+]" (ajustável) |
| 5.3 | Zona de descarte tem exatamente 2 botões | "Descartar Mão" e "Refazer Deck" |
| 5.4 | Botão ajustável [-] [Comprar X] [+] funciona | X persiste entre saves via `onSave`/`onLoad` (tabela `drawSettings`, chaveada por corp), mínimo 1 |
| 5.5 | Compra vai para a zona de mão física, não a mão oculta do TTS | `takeObject` com posição = `positions().hand`, não `deck.deal()` |
| 5.6 | Auto-reshuffle quando o deck acaba no meio da compra | Descarte é movido para a posição do deck e embaralhado automaticamente, sem interromper a compra |
| 5.7 | "Refazer Deck" funciona | Move todo o descarte para a posição do deck e embaralha — substitui os antigos "Reembaralhar" + "Mover Deck" separados por uma única ação |
| 5.8 | "Descartar Mão" funciona | Move todas as cartas de `Player[playerColor].getHandObjects()` para o descarte |
| 5.9 | Botões usam função global única por corp+ação, não um despachante por "id" | `createButton()` chama `click_function` com `(objeto, cor, clique_alt)` — **sem** parâmetro de id (diferente do XmlUI declarativo). `registerHandlersForCorp()` gera `onDraw5_<corp>`, `onDrawMid_<corp>` etc. dinamicamente, mesmo padrão já validado em `market-manager.lua` (`onBuyClick_1..6`) |
| 5.10 | Editar o label do botão "Comprar X" não precisa relocalizar via Physics.cast | Referência da âncora guardada em `deckAnchors[corp]` na criação — `editButton({index=2, ...})` direto |
| 5.11 | Ações do hand-manager são bloqueadas enquanto o setup ainda está rodando em background | `Global.call("isSetupRunning")` checado no início de `drawToHandZone`, `discardHand`, `rebuildDeck` — evita corrida "owned by different scripts" com a cauda assíncrona do setup (shuffle/preenchimento do mercado) |

---

## 6. Market Manager (`market-manager.lua`) — arquitetura v2, Layout Zones

> Reescrito para usar `LayoutZone` nativas do TTS em vez de `Physics.cast`
> para detectar cartas. Botão de compra vive na **zona** (fixo), não mais
> na carta — simplifica bastante a lógica de "Limpar mercado".

| # | Comportamento | Critério de aprovação |
|---|---|---|
| 6.1 | 6 Layout Zones são criadas automaticamente ao carregar | `spawnObject(type="LayoutZone")` em cada `POSITIONS.market.slots[i]`, sem precisar desenhar manualmente no F3 |
| 6.2 | Zonas são 5% maiores que uma carta padrão | `CARD_WIDTH * 1.05`, `CARD_LENGTH * 1.05` (`ZONE_SCALE_MULT`) |
| 6.3 | Cartas e zonas ficam alinhadas lateralmente ao deck do mercado | `POSITIONS.market.slots` no Global tem Z idêntico ao `market.deck.z` em todas as 6 posições |
| 6.4 | Botão "Comprar" fixo na zona, 5% abaixo da borda inferior | `zone.createButton()` (não `card.createButton()`), offset Z = `(zoneLength/2) + (zoneLength * 0.05)` |
| 6.5 | 6 zonas preenchidas ao carregar | `fillAllSlots()`, 2s após `onLoad` |
| 6.6 | Comprar move a carta para o descarte da corp certa | `Global.call("getCorpForColor", playerColor)` identifica a corp pela cor da cadeira do comprador |
| 6.7 | Zona vazia (compra individual) é reabastecida automaticamente | `refillSlotIfEmpty` detecta vazio via `zone.getObjects()` e puxa do deck do mercado |
| 6.8 | "Limpar mercado" funciona como esteira, não reposição direta | Descarta 5 e 6 SEM repor → desloca 4→6, 3→5, 2→4, 1→3 (ordem direita→esquerda) → só 1 e 2 recebem carta nova do deck |
| 6.9 | Esteira NÃO precisa reindexar nenhum botão | Botão pertence à zona (fixa) — mover a carta com `shiftCardToZone()` é só `setPositionSmooth`, sem `clearButtons`/`createButton` |
| 6.10 | Compras são bloqueadas durante a transição da esteira | `marketLocked` impede clique em "Comprar" enquanto o deslocamento está em andamento |
| 6.11 | Botão "Limpar mercado" fica na zona de descarte, à direita dela | Anexado via `createButton` com offset no eixo X (`buttonXOffset`), não Z — diferencia de um botão de compra abaixo |
| 6.11 | Zona de descarte segue o mesmo padrão das zonas de compra | `createZone()` compartilhado — 5% maior que carta, alinhada lateralmente (mesmo Z do deck), sem botão |
| 6.12 | Botão de compra fica na mesma altura das cartas | Zona nasce em `pos.y + 0.3` (igual ao target das cartas), botão usa Y local = 0 — sem offset vertical algum |
| 6.13 | Botão de compra fica abaixo da zona, não acima | Z local negativo — positivo posicionava do lado errado |
| 6.14 | Deck do mercado não fica torto mesmo em compras individuais | `refillSlotIfEmpty` (chamada a cada compra) também estabiliza a rotação após `takeObject()` — não só o fluxo de setup inicial |
| 6.14 | Todas as 6 zonas + descarte são criadas mesmo se uma falhar | `createZone()` usa `callback_function` do `spawnObject` — chamar `.LayoutZone.setOptions()` direto sem esperar o callback pode travar silenciosamente o resto do `onLoad` |

---

## Notas de manutenção

- **Callbacks XmlUI vs createButton:** XmlUI (`onValueChanged`/`onClick` no XML) recebe o **objeto Player** como primeiro argumento. `createButton`'s `click_function` recebe a **cor como string**. Não confundir os dois — foi a causa de um bug sério (item 1.7).
- **`createButton` NÃO tem parâmetro de `id` no callback — só XmlUI declarativo tem.** `click_function` de `createButton()` é chamado com `(objeto, cor_do_jogador, clique_alternativo)` — três argumentos fixos, nunca um "id" do botão. Um padrão `<Defaults onClick="buttonHandler">` de referência XmlUI (onde um único despachante lê o `id` do elemento clicado) **não se traduz diretamente** para botões criados via código — só funciona em painéis XML declarativos. Para múltiplos botões dinâmicos com a mesma ação-por-corp, gerar uma função global ÚNICA por combinação corp+ação (ex: `_G["onDraw5_" .. corp] = function(...) ... end`), nunca um despachante único lendo um id inexistente (item 5.9).
- **Uma `LayoutZone` física sentada exatamente onde cartas são geradas/spawnadas pode prender a última carta.** `LayoutZone` gerencia ativamente os objetos que entram nela. Se ela ocupa a MESMA posição onde outro script gera/empilha cartas (ex: o ponto de spawn do deck no setup), a última carta que assenta ali pode ficar fisicamente suspensa até o jogador clicar nela manualmente — sintoma de a zona estar "segurando" o objeto aguardando confirmação de interação. Só crie uma `LayoutZone` física quando o código realmente usa `zone.getObjects()` para detectar o conteúdo — se a detecção usa `Physics.cast` direto (como em `hand-manager.lua`), a zona é desnecessária e só introduz risco (item 5.1).
- **QUALQUER `LayoutZone` (mesmo pequena, mesmo só para hospedar botão) precisa de `setOptions()` explícito — nunca deixe no padrão.** Já causou o mesmo tipo de bug (carta extra suspensa, aparecendo tarde) DUAS vezes: uma vez com a zona do deck em si (removida), outra com a âncora de botão (escala 1:1, só 2 unidades do deck) que nunca teve `setOptions()` chamado — herdava o comportamento padrão de gerenciamento ativo e capturava uma carta de passagem durante o spawn staggered. Toda `LayoutZone` criada, mesmo como suporte inerte de botão, deve desativar explicitamente qualquer trigger: `max_objects_per_group=0, trigger_for_face_down=false, trigger_for_face_up=false, instant_refill=false`.
- **O setup tem uma "cauda" assíncrona de vários segundos depois de parecer visualmente pronto.** `mergeAllPendingDecks` → shuffle (0.6s) → preencher mercado (1s) → diagnóstico (2s) → mensagem final (5s) — tudo em background via `Wait.time` encadeado. Se outro script (ex: `hand-manager.lua`) tentar mexer no mesmo deck/descarte NESSA janela, o TTS lança "Attempt to perform operations with resources owned by different scripts" — uma corrida real entre dois scripts, não um bug de lógica isolado. Fix: expor a flag de "setup em andamento" via `Global.call` (`isSetupRunning()`), e qualquer script que manipule deck/descarte deve checar isso antes de agir, avisando o jogador para aguardar em vez de arriscar a corrida.
- **Eixo de rotação de cartas:** Y gira no próprio plano (não troca face/verso). Z troca face/verso. Não confundir (item 3.2).
- **`Locked` não tem default seguro:** sempre declarar explicitamente em qualquer novo `ObjectState` gerado via `spawnObjectData` (item 3.1).
- **Copiar/colar do chat para o TTS pode corromper o script:** se um erro de sintaxe aparecer mesmo com o código validando limpo em `luac`, suspeitar de corrupção no clipboard antes de investigar lógica. Processo seguro: baixar o arquivo, copiar de um editor de texto puro, colar substituindo tudo.
- **Colar sem limpar a caixa primeiro duplica IDs:** se um painel some ao fechar mas continua bloqueando a tela (ex: precisa de ESC para ver a mesa), suspeitar de dois elementos com o mesmo `id` — provavelmente o conteúdo antigo não foi apagado antes de colar o novo. `onCloseClick`/`setAttribute` por ID só afeta a primeira ocorrência, deixando a duplicata visível. Sempre Ctrl+A + Delete, confirmar caixa vazia, só então colar.
- **`offsetXY` vs `position` em elementos de UI 2D:** `offsetXY="x y"` é o atributo correto para deslocar um elemento de UI (Panel/Button/etc.) a partir do seu `rectAlignment` — é posicionamento em pixels na tela. `position="x y z"` é para posição 3D no mundo (objetos físicos, ou elementos de UI ancorados a um objeto específico) e é **ignorado silenciosamente** em elementos soltos de UI 2D — o elemento fica sempre exatamente no ponto de ancoragem do `rectAlignment`, nunca se move, não importa o valor. Sintoma: mudar os números não tem nenhum efeito visível. Sempre usar `offsetXY` para reposicionar botões/painéis na tela (item 1.11).
- **Reconsultar `zone.getObjects()` em sequências com `setPositionSmooth` é uma race condition:** `setPositionSmooth` é uma animação, não instantâneo — se um passo posterior consulta `zone.getObjects()` de novo antes da animação anterior terminar, a detecção fica inconsistente (a carta "saindo" ainda conta como presente). Sintoma: passos de uma sequência (ex: esteira do mercado) parecem "sumir" silenciosamente, só o último passo (que não depende de releitura) funciona. Fix: capturar TODAS as referências de objeto necessárias de uma vez, no início da função, antes de mover qualquer coisa — os passos seguintes usam essas referências diretamente, nunca reconsultam a zona (item 6.8).
- **`createButton` amplifica offsets locais pela escala do objeto pai:** a posição de um botão criado com `objeto.createButton({position=...})` é local ao pai, mas essa posição é MULTIPLICADA pela escala (`scale`) do pai antes de virar posição de mundo. Se o pai tem `scale = {2.31, 0.5, 3.31}` (como nossas zonas), um offset local de `-2.50` NÃO resulta em -2.50 unidades de mundo — resulta em `-2.50 * escala`. Fórmula correta para atingir uma posição de mundo desejada: `local = (mundo_desejado - mundo_do_pai) / escala_do_pai`, calculado eixo a eixo. Sintoma de esquecer isso: o botão se move, mas para um lugar completamente diferente do esperado, ou nem parece se mover perceptivelmente dependendo da escala (item 6.4, 6.11).
- **A fórmula de correção de escala é confiável só com 1 eixo — com 3 eixos simultâneos, prefira uma âncora dedicada.** Testado: corrigir só Z (botões de compra) bateu exato. Corrigir X+Y+Z ao mesmo tempo (botão de limpar mercado) resultou num pequeno erro residual que não era só arredondamento — a conta reversa a partir da posição medida deu um fator de escala Z impossível (negativo), sugerindo alguma interação de escala não puramente linear quando múltiplos eixos entram em jogo numa LayoutZone com escala não-uniforme. Solução mais robusta para posicionamento em 3 eixos: `createButtonAnchor(worldPos, buttonParams)` — spawna uma LayoutZone minúscula com `scale={1,1,1}` exatamente na posição de mundo desejada, e anexa o botão com offset local `{0,0,0}`. Sem escala não-uniforme, sem cálculo, sem risco de erro acumulado (item 6.4).
- **Puxar múltiplas cartas do MESMO deck no MESMO frame (sem delay) causa corrida — só uma extração conta.** `deckPile.takeObject()` chamado duas vezes seguidas sem nenhum `Wait.time` entre as chamadas parece funcionar (sem erro), mas só uma das duas cartas efetivamente é extraída — a segunda silenciosamente não conta. Já apareceu 3 vezes neste projeto: `drawToHandZone` (player-deck-manager), `fillMarketSlotsFromDeck` (solis-global), e o refill de 1/2 pós-esteira (market-manager) — as duas primeiras já escalonavam corretamente desde o início, a terceira foi corrigida depois de reportado. Regra geral: qualquer sequência de `takeObject()`/`deal()` do mesmo deck precisa de um `Wait.time` de pelo menos ~0.2-0.3s entre cada chamada, nunca no mesmo frame (item 6.7).
- **Escala do objeto amplifica offsets locais de `createButton`:** a posição de um botão anexado via `object.createButton({position=...})` é interpretada no espaço local do objeto — se esse objeto tem `scale.y` diferente de 1 (ex: uma LayoutZone com `scale={w, 2, l}`), um deslocamento vertical no botão é amplificado por esse fator de escala. Em vez de calcular a compensação exata, é mais seguro reduzir a escala do objeto no eixo que causa o problema e/ou fazer o objeto já nascer na altura/posição desejada, deixando o offset do botão em 0 (item 6.12).
