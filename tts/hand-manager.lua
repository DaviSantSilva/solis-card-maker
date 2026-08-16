-- ============================================================
-- Solis — Gerenciador de Deck/Jogo/Descarte do Jogador
--
-- Cria automaticamente, por corporação (5 no total):
--   • zona de DECK      → botão "Comprar até 5"
--   • zona de JOGO      → área onde o jogador baixa as cartas
--                          que está jogando no turno
--   • zona de DESCARTE  → botões "Descartar" e "Refazer Deck"
--
-- Como instalar:
-- 1. Cole solis-global.lua no Global Script da partida ANTES deste.
-- 2. Crie UM único objeto discreto em qualquer lugar da mesa.
-- 3. Cole este script na aba SCRIPT desse objeto.
-- Tudo nasce automaticamente ao carregar.
--
-- Fluxo pretendido:
--   Comprar até 5 → cartas vão para a mão
--   Jogador baixa cartas da mão na ZONA DE JOGO
--   "Descartar" → move tudo da zona de jogo para o descarte
--   "Refazer Deck" → descarte inteiro volta ao deck, embaralhado
--
-- IMPORTANTE: createButton() chama click_function com
-- (objeto, cor_do_jogador, clique_alternativo) — NÃO existe um
-- parâmetro de id. Cada botão usa uma função global ÚNICA gerada
-- dinamicamente por corp+ação (mesmo padrão de market-manager.lua).
-- ============================================================

local BELOW_OFFSET = 2.8 -- botões ficam abaixo (Z) de cada zona
local PLAY_RADIUS  = 3.0 -- raio de varredura da zona de jogo

local playZones = {} -- corpId -> ScriptingTrigger da área de jogo
local isReady   = false

-- ── ciclo de vida ──────────────────────────────────────────

function onLoad()
    local corpIds = Global.call("getAllCorpIds")
    for _, corp in ipairs(corpIds) do
        registerHandlersForCorp(corp)

        local pos = Global.call("getCorpPositions", corp)
        createDeckZone(corp, pos.deck)
        createPlayZone(corp)
        createDiscardZone(corp, pos.discard)
    end

    Wait.time(function() isReady = true end, 4)
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

-- Conta as cartas na mão do jogador.
-- Usa player.getHandObjects() — as posições de "mão" fornecidas
-- são Hand Zones do TTS, então essa é a API autoritativa (cartas
-- ali ficam presas à zona e não são detectáveis de forma confiável
-- por varredura física, o que causou contagens erradas antes).
local function countHand(playerColor)
    local player = Player[playerColor]
    if player == nil then return 0 end
    return #player.getHandObjects()
end

-- ── registro de handlers únicos por corp ─────────────────────

function registerHandlersForCorp(corp)
    _G["onDraw5_" .. corp] = function(_, playerColor)
        if blockIfWrongCorp(corp, playerColor) then return end
        if isBusy() then
            broadcastToColor("Aguarde a mesa terminar de carregar/organizar antes de comprar.", playerColor, { 1, 0.8, 0.2 })
            return
        end

        local current = countHand(playerColor)
        if current >= 5 then
            broadcastToColor("Você já tem 5 cartas, " .. playerName(playerColor) .. ".", playerColor, { 1, 0.8, 0.2 })
            return
        end

        drawToHandZone(corp, 5 - current, playerColor)
    end

    _G["onDiscardPlay_" .. corp] = function(_, playerColor)
        if blockIfWrongCorp(corp, playerColor) then return end
        discardPlayArea(corp, playerColor)
    end

    _G["onRebuildDeck_" .. corp] = function(_, playerColor)
        if blockIfWrongCorp(corp, playerColor) then return end
        rebuildDeck(corp, playerColor)
    end
end

-- ── criação das âncoras de botão ──────────────────────────────

local function createButtonAnchor(worldPos, buttons)
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
        end,
    })
end

function createDeckZone(corp, deckPos)
    createButtonAnchor({ deckPos.x, deckPos.y + 0.3, deckPos.z - BELOW_OFFSET }, {
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

-- Área de JOGO: ScriptingTrigger (não LayoutZone) — detecta o que
-- está dentro dela sem gerenciar/mover os objetos. LayoutZone
-- causaria os mesmos problemas de "carta presa" já enfrentados.
function createPlayZone(corp)
    local playPos = Global.call("getCorpPlayPosition", corp)
    if playPos == nil then return end

    spawnObject({
        type     = "ScriptingTrigger",
        position = { playPos.x, playPos.y + 0.5, playPos.z },
        scale    = { 6, 3, 4 },
        callback_function = function(zone)
            zone.setName("Área de Jogo — " .. corp)
            playZones[corp] = zone
        end,
    })
end

function createDiscardZone(corp, discardPos)
    createButtonAnchor({ discardPos.x, discardPos.y + 0.3, discardPos.z - BELOW_OFFSET }, {
        {
            click_function = "onDiscardPlay_" .. corp,
            function_owner = self,
            label          = "Descartar",
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

-- ── detecção de carta no deck/descarte ───────────────────────

local function findPileAt(worldPos)
    local ok, result = pcall(function()
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

-- ── comprar (vai para a mão do jogador) ─────────────────────

function drawToHandZone(corp, count, playerColor)
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
            discard.setRotationSmooth({ 0, 180, 180 }, false, true)
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

-- ── descartar a ÁREA DE JOGO ─────────────────────────────────

function discardPlayArea(corp, playerColor)
    if isBusy() then
        if playerColor then
            broadcastToColor("Aguarde a mesa terminar de carregar/organizar antes de descartar.", playerColor, { 1, 0.8, 0.2 })
        end
        return
    end

    local pos      = Global.call("getCorpPositions", corp)
    local zone     = playZones[corp]
    local playPos  = Global.call("getCorpPlayPosition", corp)
    local toDiscard = {}

    -- Preferência: o próprio ScriptingTrigger (autoritativo sobre
    -- o que está dentro dele). Fallback: varredura por distância,
    -- caso a zona ainda não esteja pronta.
    if zone ~= nil then
        local ok, objs = pcall(function() return zone.getObjects() end)
        if ok and objs ~= nil then
            for _, obj in ipairs(objs) do
                if obj.type == "Card" or obj.type == "Deck" then
                    table.insert(toDiscard, obj)
                end
            end
        end
    end

    if #toDiscard == 0 and playPos ~= nil then
        for _, obj in ipairs(getObjects()) do
            if obj.type == "Card" or obj.type == "Deck" then
                local p  = obj.getPosition()
                local dx = p.x - playPos.x
                local dz = p.z - playPos.z
                if math.sqrt(dx * dx + dz * dz) < PLAY_RADIUS then
                    table.insert(toDiscard, obj)
                end
            end
        end
    end

    if #toDiscard == 0 then
        if playerColor then
            broadcastToColor("Não há cartas na sua área de jogo para descartar.", playerColor, { 1, 0.8, 0.2 })
        end
        return
    end

    local ok = pcall(function()
        for _, card in ipairs(toDiscard) do
            card.setPositionSmooth(pos.discard, false, true)
            card.setRotationSmooth({ 0, 180, 0 }, false, true)
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
