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
-- Zona de deck — 1 botão: "Comprar até 5"
--   Verifica quantas cartas o jogador tem na mão (contagem própria,
--   rastreada internamente — ver nota abaixo) e compra só a
--   diferença necessária para chegar a 5. Se já tem 5+, avisa.
-- Zona de descarte — 2 botões:
--   "Descartar Mão" e "Refazer Deck" (descarte inteiro → deck,
--   embaralha tudo)
--
-- SOBRE A CONTAGEM DE MÃO: como a mão é uma zona física na mesa
-- (não a mão oculta do TTS), não existe um jeito 100% confiável
-- de detectar fisicamente quantas cartas soltas estão lá — testado
-- com Physics.cast (instável, hits inconsistentes) e getObjects()+
-- distância (também não bateu). A solução robusta adotada foi
-- RASTREAR a contagem internamente: handCounts[corp] incrementa
-- a cada compra, zera ao descartar a mão. Isso é determinístico e
-- sempre correto DESDE QUE o jogador use os botões — se alguém
-- arrastar uma carta manualmente para fora da mão sem descartar
-- pelo botão, a contagem interna pode ficar desatualizada.
--
-- IMPORTANTE: createButton() chama click_function com
-- (objeto, cor_do_jogador, clique_alternativo) — NÃO existe um
-- parâmetro de id. Cada botão usa uma função global ÚNICA gerada
-- dinamicamente por corp+ação (mesmo padrão de market-manager.lua).
-- ============================================================

local BELOW_OFFSET = 2.8 -- botões ficam abaixo (Z) de cada zona

local handCounts = {} -- corpId -> nº de cartas rastreadas na mão
local isReady    = false

-- ── ciclo de vida ──────────────────────────────────────────

function onLoad(savedData)
    if savedData ~= nil and savedData ~= "" then
        local ok, decoded = pcall(JSON.decode, savedData)
        if ok and decoded then handCounts = decoded end
    end

    local corpIds = Global.call("getAllCorpIds")
    for _, corp in ipairs(corpIds) do
        if handCounts[corp] == nil then
            handCounts[corp] = 0
        end

        registerHandlersForCorp(corp)

        local pos = Global.call("getCorpPositions", corp)
        createDeckZone(corp, pos.deck)
        createDiscardZone(corp, pos.discard)
    end

    Wait.time(function() isReady = true end, 4)
end

function onSave()
    return JSON.encode(handCounts)
end

local function isBusy()
    if not isReady then return true end
    return Global.call("isSetupRunning")
end

-- Trava: só o jogador sentado na cor da corp pode usar os botões
-- daquela corp.
local function blockIfWrongCorp(corp, playerColor)
    if playerColor == nil then return true end
    local ownerCorp = Global.call("getCorpForColor", playerColor)
    if ownerCorp ~= corp then
        broadcastToColor("Esses botões pertencem a outra corporação — só quem está sentado nela pode usá-los.", playerColor, { 1, 0.4, 0.4 })
        return true
    end
    return false
end

local function playerName(playerColor)
    local player = Player[playerColor]
    return (player ~= nil and player.steam_name) or playerColor
end

-- ── registro de handlers únicos por corp ─────────────────────

function registerHandlersForCorp(corp)
    _G["onDraw5_" .. corp] = function(_, playerColor)
        if blockIfWrongCorp(corp, playerColor) then return end
        if isBusy() then
            broadcastToColor("Aguarde a mesa terminar de carregar/organizar antes de comprar.", playerColor, { 1, 0.8, 0.2 })
            return
        end

        local current = handCounts[corp] or 0
        if current >= 5 then
            broadcastToColor("Você já tem 5 cartas, " .. playerName(playerColor) .. ".", playerColor, { 1, 0.8, 0.2 })
            return
        end

        local needed = 5 - current
        drawToHandZone(corp, needed, playerColor)
    end

    _G["onDiscardHand_" .. corp] = function(_, playerColor)
        if blockIfWrongCorp(corp, playerColor) then return end
        discardHand(corp, playerColor)
    end

    _G["onRebuildDeck_" .. corp] = function(_, playerColor)
        if blockIfWrongCorp(corp, playerColor) then return end
        rebuildDeck(corp, playerColor)
    end
end

-- ── criação das âncoras de botão ──────────────────────────────

local function createButtonAnchor(worldPos, buttons, onReady)
    spawnObject({
        type     = "LayoutZone",
        position = worldPos,
        scale    = { 1, 1, 1 },
        callback_function = function(anchor)
            -- Desativa qualquer trigger/gerenciamento — a âncora é
            -- só um suporte de botão, não deve interagir com cartas.
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
    })
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
            position       = { 0, 0, -1.3 },
            rotation       = { 0, 180, 0 },
            width          = 1700,
            height         = 700,
            font_size      = 200,
            color          = { 0.086, 0.086, 0.086 },
            font_color     = { 0.8, 0.8, 0.8 },
        },
    })
end

-- ── detecção de carta no deck/descarte (não na mão) ──────────

local function findPileAt(worldPos)
    -- pcall envolvendo TUDO — 'owned by different scripts' podia
    -- acontecer dentro do próprio Physics.cast, não só nas ações
    -- que vêm depois.
    local ok, result = pcall(function()
        -- Caixa ampla (mesma tolerância usada no diagnóstico do
        -- Global) — busca estreita perdia o deck quando ele
        -- assentava um pouco fora do ponto exato após física normal.
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
    local pos      = Global.call("getCorpPositions", corp)
    local handBase = pos.hand
    local drawnSoFar = 0

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

        local ok = pcall(function()
            if pile.type == "Deck" then
                -- rotY=180 (leitura correta), rotZ=0 (face pra cima)
                pile.takeObject({ position = targetPos, rotation = { 0, 180, 0 }, smooth = true })
            else
                pile.setPositionSmooth(targetPos, false, true)
                pile.setRotationSmooth({ 0, 180, 0 }, false, true)
            end
        end)

        if ok then
            drawnSoFar = drawnSoFar + 1
            handCounts[corp] = (handCounts[corp] or 0) + 1
        elseif retriesLeft > 0 then
            Wait.time(function() drawOne(i, retriesLeft - 1) end, 0.5)
        elseif playerColor then
            broadcastToColor("A mesa ainda está organizando os objetos — tente comprar novamente em instantes.", playerColor, { 1, 0.6, 0.2 })
        end
    end

    for i = 1, count do
        Wait.time(function() drawOne(i) end, (i - 1) * 0.18)
    end
end

-- ── descartar mão inteira ────────────────────────────────────
-- IMPORTANTE: player.getHandObjects() é a mão OCULTA do TTS —
-- nosso sistema nunca usa isso, as cartas ficam numa zona física
-- na mesa. Precisa localizar as cartas de verdade por proximidade
-- da posição de mão, não pela API de mão do jogador.

function discardHand(corp, playerColor)
    if isBusy() then
        if playerColor then
            broadcastToColor("Aguarde a mesa terminar de carregar/organizar antes de descartar.", playerColor, { 1, 0.8, 0.2 })
        end
        return
    end

    local pos     = Global.call("getCorpPositions", corp)
    local handPos = pos.hand

    local cardsToDiscard = {}
    for _, obj in ipairs(getObjects()) do
        if obj.type == "Card" or obj.type == "Deck" then
            local objPos = obj.getPosition()
            local dx = objPos.x - handPos.x
            local dz = objPos.z - handPos.z
            if math.sqrt(dx * dx + dz * dz) < 1.5 then
                table.insert(cardsToDiscard, obj)
            end
        end
    end

    if #cardsToDiscard == 0 then
        if playerColor then
            broadcastToColor("Sua mão já está vazia.", playerColor, { 1, 0.8, 0.2 })
        end
        return
    end

    local ok = pcall(function()
        for _, card in ipairs(cardsToDiscard) do
            card.setPosition(pos.discard)
        end
    end)

    if ok then
        handCounts[corp] = 0
    elseif playerColor then
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

    local ok = pcall(function()
        discard.setPositionSmooth(pos.deck, false, true)
        -- rotY=180 (leitura correta), rotZ=180 (verso visível)
        discard.setRotationSmooth({ 0, 180, 180 }, false, true)
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
