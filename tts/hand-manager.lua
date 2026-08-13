-- ============================================================
-- Solis — Gerenciador de Deck/Descarte do Jogador (Layout Zones)
--
-- Mesmo padrão do market-manager.lua: cria automaticamente as
-- 10 zonas (5 deck + 5 descarte, uma por corporação) a partir
-- das posições do Global — não precisa desenhar nada manualmente
-- nem criar 10 objetos separados.
--
-- Como instalar:
-- 1. Cole solis-global.lua no Global Script da partida ANTES deste.
-- 2. Crie UM único objeto discreto em qualquer lugar da mesa.
-- 3. Cole este script na aba SCRIPT desse objeto.
-- As 10 zonas + botões nascem automaticamente ao carregar.
--
-- Zona de deck — 2 grupos de botão:
--   "Comprar até 5" (fixo) e "Comprar" (ajustável, com [-] [+])
-- Zona de descarte — 2 botões:
--   "Descartar Mão" e "Refazer Deck" (descarte inteiro → deck,
--   embaralha tudo)
--
-- IMPORTANTE: createButton() chama click_function com
-- (objeto, cor_do_jogador, clique_alternativo) — NÃO existe um
-- parâmetro de id, diferente do XmlUI declarativo. Por isso cada
-- botão usa uma função global ÚNICA gerada dinamicamente por
-- corp+ação (mesmo padrão já validado em market-manager.lua),
-- em vez de um único despachante lendo um "id".
-- ============================================================

local BELOW_OFFSET = 2 -- botões ficam 2 unidades abaixo (Z) de cada zona

local deckAnchors  = {} -- corpId -> objeto âncora dos botões de compra (para editButton)
local drawSettings = {} -- corpId -> { count = 5 }

-- ── ciclo de vida ──────────────────────────────────────────

-- Janela de segurança: nenhuma ação de botão é aceita nos primeiros
-- segundos após o carregamento da mesa. Objetos restaurados de um
-- save (decks, cartas) ainda estão sendo internamente assentados
-- pelo TTS logo após o load — interagir cedo demais causa o mesmo
-- tipo de erro "owned by different scripts" que a corrida com o
-- setup causava. Essa janela cobre AMBOS os cenários.
local isReady = false

function onLoad(savedData)
    if savedData ~= nil and savedData ~= "" then
        local ok, decoded = pcall(JSON.decode, savedData)
        if ok and decoded then drawSettings = decoded end
    end

    local corpIds = Global.call("getAllCorpIds")
    for _, corp in ipairs(corpIds) do
        if drawSettings[corp] == nil then
            drawSettings[corp] = { count = 5 }
        end

        registerHandlersForCorp(corp)

        local pos = Global.call("getCorpPositions", corp)
        createDeckZone(corp, pos.deck)
        createDiscardZone(corp, pos.discard)
    end

    Wait.time(function() isReady = true end, 4)
end

-- Checagem combinada: bloqueia ação se a mesa acabou de carregar
-- OU se o setup (botão Começar) ainda está rodando em background.
local function isBusy()
    if not isReady then return true end
    return Global.call("isSetupRunning")
end

function onSave()
    return JSON.encode(drawSettings)
end

-- ── registro de handlers únicos por corp ─────────────────────

function registerHandlersForCorp(corp)
    _G["onDraw5_" .. corp] = function(_, playerColor)
        drawToHandZone(corp, 5, playerColor)
    end

    _G["onDrawMinus_" .. corp] = function()
        drawSettings[corp].count = math.max(1, drawSettings[corp].count - 1)
        updateDrawLabel(corp)
    end

    _G["onDrawPlus_" .. corp] = function()
        drawSettings[corp].count = drawSettings[corp].count + 1
        updateDrawLabel(corp)
    end

    _G["onDrawMid_" .. corp] = function(_, playerColor)
        drawToHandZone(corp, drawSettings[corp].count, playerColor)
    end

    _G["onDiscardHand_" .. corp] = function(_, playerColor)
        discardHand(corp, playerColor)
    end

    _G["onRebuildDeck_" .. corp] = function(_, playerColor)
        rebuildDeck(corp, playerColor)
    end
end

-- ── criação das âncoras de botão ──────────────────────────────
-- NOTA: nenhuma LayoutZone física é criada em cima do deck/descarte
-- neste arquivo — diferente do market-manager.lua, aqui a detecção
-- de carta usa Physics.cast (findPileAt) diretamente, não
-- zone.getObjects(). Uma LayoutZone sentada exatamente na posição
-- onde o deck é gerado pelo solis-global.lua causava um bug: a
-- ÚLTIMA carta ficava suspensa (fisicamente 'presa' pelo
-- gerenciamento ativo da zona) até o jogador clicar nela
-- manualmente. Como a zona nunca era usada funcionalmente aqui,
-- a solução foi simplesmente não criá-la.

-- Cria uma âncora (escala 1:1, sem amplificação) numa posição de
-- mundo exata — mesma técnica usada no botão de limpar mercado.
-- Usada aqui para hospedar cada GRUPO de botões (deck ou descarte)
-- de uma corp, 2 unidades abaixo da zona correspondente.
local function createButtonAnchor(worldPos, buttons, onReady)
    spawnObject({
        type     = "LayoutZone",
        position = worldPos,
        scale    = { 1, 1, 1 },
        callback_function = function(anchor)
            -- IMPORTANTE: sem isso, a âncora herda o comportamento
            -- PADRÃO de uma LayoutZone (que gerencia ativamente
            -- objetos próximos). Como fica só 2 unidades do deck,
            -- que é populado carta por carta durante o setup, ela
            -- podia capturar uma carta de passagem — causando uma
            -- carta extra suspensa, chegando tarde, depois de tudo
            -- pronto. Desativa qualquer trigger/gerenciamento:
            -- a âncora vira puramente um suporte de botão, inerte.
            anchor.LayoutZone.setOptions({
                max_objects_per_group = 0,
                combine_into_decks    = false,
                trigger_for_face_down = false,
                trigger_for_face_up   = false,
                instant_refill        = false,
            })

            for _, btn in ipairs(buttons) do
                anchor.createButton(btn)
            end
            if onReady then onReady(anchor) end
        end,
    })
end

function createDeckZone(corp, deckPos)
    local anchorPos = { deckPos.x, deckPos.y + 0.3, deckPos.z - BELOW_OFFSET }

    -- Layout vertical: 2 linhas.
    -- Linha 1 (z=0): "Comprar até 5", centralizado
    -- Linha 2 (z=-0.75): [-] [Comprar X] [+], lado a lado
    createButtonAnchor(anchorPos, {
        {
            click_function = "onDraw5_" .. corp,
            function_owner = self,
            label          = "Comprar até 5",
            position       = { 0, 0, 0 },
            rotation       = { 0, 180, 0 },
            width          = 1700,
            height         = 700,
            font_size      = 220,
            color          = { 0.086, 0.086, 0.086 },
            font_color     = { 0.8, 0.8, 0.8 },
        },
        {
            click_function = "onDrawMinus_" .. corp,
            function_owner = self,
            label          = "−",
            position       = { -0.6, 0, -0.75 },
            rotation       = { 0, 180, 0 },
            width          = 500,
            height         = 700,
            font_size      = 350,
            color          = { 0.086, 0.086, 0.086 },
            font_color     = { 0.8, 0.8, 0.8 },
        },
        {
            click_function = "onDrawMid_" .. corp,
            function_owner = self,
            label          = "Comprar " .. drawSettings[corp].count,
            position       = { 0, 0, -0.75 },
            rotation       = { 0, 180, 0 },
            width          = 1700,
            height         = 700,
            font_size      = 200,
            color          = { 0.086, 0.086, 0.086 },
            font_color     = { 0.8, 0.8, 0.8 },
        },
        {
            click_function = "onDrawPlus_" .. corp,
            function_owner = self,
            label          = "+",
            position       = { 0.6, 0, -0.75 },
            rotation       = { 0, 180, 0 },
            width          = 500,
            height         = 700,
            font_size      = 350,
            color          = { 0.086, 0.086, 0.086 },
            font_color     = { 0.8, 0.8, 0.8 },
        },
    }, function(anchor)
        deckAnchors[corp] = anchor
    end)
end

function createDiscardZone(corp, discardPos)
    local anchorPos = { discardPos.x, discardPos.y + 0.3, discardPos.z - BELOW_OFFSET }

    -- Layout vertical: "Descartar Mão" em cima, "Refazer Deck" embaixo
    createButtonAnchor(anchorPos, {
        {
            click_function = "onDiscardHand_" .. corp,
            function_owner = self,
            label          = "Descartar Mão",
            position       = { 0, 0, 0 },
            rotation       = { 0, 180, 0 },
            width          = 1700,
            height         = 700,
            font_size      = 200,
            color          = { 0.086, 0.086, 0.086 },
            font_color     = { 0.8, 0.8, 0.8 },
        },
        {
            click_function = "onRebuildDeck_" .. corp,
            function_owner = self,
            label          = "Refazer Deck",
            position       = { 0, 0, -0.9 },
            rotation       = { 0, 180, 0 },
            width          = 1700,
            height         = 700,
            font_size      = 200,
            color          = { 0.086, 0.086, 0.086 },
            font_color     = { 0.8, 0.8, 0.8 },
        },
    })
end

-- Atualiza o texto do botão "Comprar X" depois de +/- mudar a
-- quantidade. Usa a referência da âncora guardada na criação —
-- o botão "drawMid" é sempre o 3º criado (índice 2, 0-based).
function updateDrawLabel(corp)
    local anchor = deckAnchors[corp]
    if anchor == nil then return end
    anchor.editButton({ index = 2, label = "Comprar " .. drawSettings[corp].count })
end

-- ── detecção de carta nas posições de deck/descarte ─────────

local function findPileAt(worldPos)
    -- pcall envolvendo TUDO — o erro 'owned by different scripts'
    -- acontecia dentro do próprio Physics.cast (ou ao acessar
    -- hit_object logo em seguida), não nas chamadas de ação que
    -- vêm depois. Sem isso, o pcall dos chamadores nunca chegava
    -- a rodar, porque a falha já tinha ocorrido aqui dentro.
    local ok, result = pcall(function()
        -- Caixa ampla (mesma tolerância do diagnóstico findPileWide
        -- em solis-global.lua) — a busca estreita anterior (1x1x1,
        -- alcance 1) perdia o deck sempre que ele assentava um pouco
        -- fora do ponto exato depois de embaralhar/física, mesmo com
        -- as cartas genuinamente ali. O diagnóstico usava tolerância
        -- maior e sempre encontrava — inconsistência entre o que o
        -- diagnóstico via e o que o jogo realmente conseguia detectar.
        local hits = Physics.cast({
            origin       = { worldPos.x, worldPos.y + 3, worldPos.z },
            direction    = { 0, -1, 0 },
            type         = 2,
            size         = { 3, 6, 3 },
            max_distance = 6,
        })
        for _, hit in ipairs(hits) do
            local obj = hit.hit_object
            if obj.type == "Deck" or obj.type == "Card" then return obj end
        end
        return nil
    end)

    if not ok then return nil end
    return result
end

-- ── comprar (vai para a zona de mão física) ──────────────────

function drawToHandZone(corp, count, playerColor)
    if isBusy() then
        if playerColor then
            broadcastToColor("Aguarde a mesa terminar de carregar/organizar antes de comprar.", playerColor, { 1, 0.8, 0.2 })
        end
        return
    end

    local pos      = Global.call("getCorpPositions", corp)
    local handBase = pos.hand

    local function drawOne(i, retriesLeft)
        retriesLeft = retriesLeft or 3
        local pile = findPileAt(pos.deck)

        if pile == nil then
            local discard = findPileAt(pos.discard)
            if discard == nil then
                if playerColor then
                    broadcastToColor("Nenhuma carta disponível para comprar.", playerColor, { 1, 0.4, 0.4 })
                end
                return
            end
            discard.setPositionSmooth(pos.deck, false, true)
            discard.setRotationSmooth({ 0, discard.getRotation().y, 0 }, false, true)
            Wait.time(function() drawOne(i, retriesLeft) end, 0.7)
            return
        end

        local targetPos = {
            x = handBase.x + (i * 0.06),
            y = handBase.y + (i * 0.18),
            z = handBase.z,
        }

        -- pcall: logo após um reload da mesa salva, os objetos
        -- (inclusive cartas) podem ainda estar terminando de
        -- inicializar internamente por um instante, mesmo depois
        -- de 'Loading complete' aparecer — uma ação bem nesse
        -- momento pode disparar 'owned by different scripts'.
        -- Em vez de propagar o erro, tenta de novo automaticamente
        -- após um pequeno delay, até 3 vezes.
        local ok, err = pcall(function()
            if pile.type == "Deck" then
                -- rotation explícita: sem isso, a carta sai com a
                -- mesma orientação do deck (verso pra cima). Face
                -- pra cima = rotY=180 (leitura correta), rotZ=0.
                pile.takeObject({ position = targetPos, rotation = { 0, 180, 0 }, smooth = true })
            else
                pile.setPositionSmooth(targetPos, false, true)
                pile.setRotationSmooth({ 0, 180, 0 }, false, true)
            end
        end)

        if not ok then
            if retriesLeft > 0 then
                Wait.time(function() drawOne(i, retriesLeft - 1) end, 0.5)
            elseif playerColor then
                broadcastToColor("A mesa ainda está organizando os objetos — tente comprar novamente em instantes.", playerColor, { 1, 0.6, 0.2 })
            end
        end
    end

    for i = 1, count do
        Wait.time(function() drawOne(i) end, (i - 1) * 0.18)
    end
end

-- ── descartar mão inteira ────────────────────────────────────

function discardHand(corp, playerColor)
    if isBusy() then
        if playerColor then
            broadcastToColor("Aguarde a mesa terminar de carregar/organizar antes de descartar.", playerColor, { 1, 0.8, 0.2 })
        end
        return
    end

    if playerColor == nil then return end
    local player = Player[playerColor]
    if player == nil then return end

    local pos = Global.call("getCorpPositions", corp)
    local ok = pcall(function()
        for _, card in ipairs(player.getHandObjects()) do
            card.setPosition(pos.discard)
        end
    end)

    if not ok and playerColor then
        broadcastToColor("A mesa ainda está organizando os objetos — tente novamente em instantes.", playerColor, { 1, 0.6, 0.2 })
    end
end

-- ── refazer deck: descarte inteiro → deck, embaralha tudo ────

function rebuildDeck(corp, playerColor)
    if isBusy() then
        if playerColor then
            broadcastToColor("Aguarde a mesa terminar de carregar/organizar antes de refazer o deck.", playerColor, { 1, 0.8, 0.2 })
        end
        return
    end

    local pos = Global.call("getCorpPositions", corp)
    local discard = findPileAt(pos.discard)
    if discard == nil then
        if playerColor then
            broadcastToColor("Nada no descarte para refazer o deck.", playerColor, { 1, 0.6, 0.2 })
        end
        return
    end

    -- pcall: mesma proteção de drawToHandZone — evita propagar
    -- 'owned by different scripts' se a mesa ainda estiver
    -- terminando de assentar objetos logo após um reload.
    local ok = pcall(function()
        discard.setPositionSmooth(pos.deck, false, true)
        discard.setRotationSmooth({ 0, discard.getRotation().y, 0 }, false, true)
    end)

    if not ok then
        if playerColor then
            broadcastToColor("A mesa ainda está organizando os objetos — tente novamente em instantes.", playerColor, { 1, 0.6, 0.2 })
        end
        return
    end

    Wait.time(function()
        local pile = findPileAt(pos.deck)
        if pile ~= nil and pile.shuffle then pile.shuffle() end
    end, 0.6)
end
