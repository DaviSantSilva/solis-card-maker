-- ============================================================
-- Solis — Gerenciador do Mercado de Cartas
--
-- Como instalar:
-- 1. Cole solis-global.lua no Global Script da partida ANTES deste.
-- 2. Crie um objeto discreto perto do descarte do mercado.
-- 3. Cole este script nesse objeto.
--
-- Funcionamento:
-- - As 6 zonas de compra ficam preenchidas automaticamente a
--   partir do deck principal do mercado.
-- - Cada carta numa zona ganha um botão "Comprar" — ao clicar,
--   vai direto para o descarte do jogador que clicou.
-- - Zona vazia (por compra individual) é reabastecida
--   automaticamente com a carta do topo do deck do mercado.
-- - Botão "Limpar mercado" (fim de rodada) funciona como esteira:
--     1. Descarta as posições 5 e 6 (SEM reposição automática nelas)
--     2. Avança: 4→6, 3→5, 2→4, 1→3
--     3. Preenche 1 e 2 (agora vagos) com cartas novas do deck
-- ============================================================

local DEBUG = false
local marketLocked = false -- true durante a transição da esteira

-- ── ciclo de vida ──────────────────────────────────────────

function onLoad()
    self.createButton({
        click_function = "onClearMarketClick",
        function_owner = self,
        label          = "Limpar mercado",
        position       = { 0, 0.3, 0.7 },
        rotation       = { 0, 180, 0 },
        width          = 1300,
        height         = 320,
        font_size      = 150,
        color          = { 0.45, 0.12, 0.12 },
        font_color     = { 1, 1, 1 },
    })

    -- registra as 6 funções de compra, uma por slot
    for i = 1, 6 do
        _G["onBuyClick_" .. i] = function(_, playerColor)
            handleBuy(i, playerColor)
        end
    end

    -- preenche o mercado ao carregar (dá tempo dos decks serem posicionados)
    Wait.time(function() fillAllSlots() end, 2)
end

-- ── posições (via Global) ───────────────────────────────────

local function findObjAt(worldPos)
    local hits = Physics.cast({
        origin       = worldPos,
        direction    = { 0, -1, 0 },
        type         = 2,
        size         = { 1, 1, 1 },
        max_distance = 1,
        debug        = DEBUG,
    })

    for _, hit in ipairs(hits) do
        local obj = hit.hit_object
        if obj.type == "Deck" or obj.type == "Card" then
            return obj
        end
    end
    return nil
end

-- ── botão de compra por carta ────────────────────────────────

-- Remove o botão antigo (se houver) e anexa um novo referenciando
-- o slotIndex atual — necessário sempre que a carta muda de posição
-- na esteira, senão o botão continuaria disparando a compra do
-- slot antigo.
function attachBuyButton(card, slotIndex)
    if card == nil then return end
    card.clearButtons()
    card.createButton({
        click_function = "onBuyClick_" .. slotIndex,
        function_owner = self,
        label          = "Comprar",
        position       = { 0, 0.3, 1.05 }, -- deslocado para baixo da carta, não em cima
        rotation       = { 0, 0, 0 },
        width          = 900,
        height         = 280,
        font_size      = 140,
        color          = { 0.15, 0.4, 0.2 },
        font_color     = { 1, 1, 1 },
    })
end

-- ── preenchimento das zonas de compra ────────────────────────

function fillAllSlots()
    local market = Global.call("getMarketPositions")
    for i, slotPos in ipairs(market.slots) do
        refillSlotIfEmpty(i, slotPos)
    end
end

function refillSlotIfEmpty(slotIndex, slotPos)
    local existing = findObjAt(slotPos)
    if existing ~= nil then
        attachBuyButton(existing, slotIndex)
        return
    end

    local market = Global.call("getMarketPositions")
    local deckPile = findObjAt(market.deck)
    if deckPile == nil then
        return -- deck do mercado vazio, nada a repor
    end

    local newCard
    if deckPile.type == "Deck" then
        newCard = deckPile.takeObject({
            position = slotPos,
            rotation = { 0, 180, 0 },
            smooth   = true,
        })
    else
        deckPile.setPositionSmooth(slotPos, false, true)
        deckPile.setRotationSmooth({ 0, 180, 0 }, false, true)
        newCard = deckPile
    end

    Wait.time(function() attachBuyButton(newCard, slotIndex) end, 0.5)
end

-- ── compra individual ────────────────────────────────────────

function handleBuy(slotIndex, playerColor)
    if marketLocked then
        broadcastToColor("Aguarde o mercado avançar.", playerColor, { 1, 0.8, 0.2 })
        return
    end

    local corp = Global.call("getCorpForColor", playerColor)
    if corp == nil then
        broadcastToColor("Sente-se em uma cor de corporação para comprar no mercado.", playerColor, { 1, 0.4, 0.4 })
        return
    end

    local market = Global.call("getMarketPositions")
    local slotPos = market.slots[slotIndex]
    local card = findObjAt(slotPos)
    if card == nil then return end

    local corpPositions = Global.call("getCorpPositions", corp)
    card.setPositionSmooth(corpPositions.discard, false, true)

    Wait.time(function()
        refillSlotIfEmpty(slotIndex, slotPos)
    end, 0.6)
end

-- ── limpar mercado — esteira (fim de rodada) ────────────────

-- Move a carta de fromSlot para o local de toSlot e reindexa o
-- botão dela para o novo slotIndex (toSlotIndex).
local function shiftCard(market, fromSlotIndex, toSlotIndex)
    local card = findObjAt(market.slots[fromSlotIndex])
    if card == nil then return end
    card.setPositionSmooth(market.slots[toSlotIndex], false, true)
    Wait.time(function()
        attachBuyButton(card, toSlotIndex)
    end, 0.3)
end

function onClearMarketClick()
    if marketLocked then return end
    marketLocked = true

    local market = Global.call("getMarketPositions")

    -- 1. Descarta as posições 5 e 6 — SEM reposição automática aqui,
    --    elas serão preenchidas pela esteira (passo 2)
    for _, idx in ipairs({ 5, 6 }) do
        local card = findObjAt(market.slots[idx])
        if card ~= nil then
            card.clearButtons()
            card.setPositionSmooth(market.discard, false, true)
        end
    end

    -- 2. Avança a esteira da direita para a esquerda, para nunca
    --    sobrescrever uma carta que ainda não se moveu:
    --    4→6, 3→5, 2→4, 1→3
    Wait.time(function() shiftCard(market, 4, 6) end, 0.6)
    Wait.time(function() shiftCard(market, 3, 5) end, 1.1)
    Wait.time(function() shiftCard(market, 2, 4) end, 1.6)
    Wait.time(function() shiftCard(market, 1, 3) end, 2.1)

    -- 3. Slots 1 e 2 ficaram vagos pela esteira — só eles recebem
    --    cartas novas do deck do mercado
    Wait.time(function()
        refillSlotIfEmpty(1, market.slots[1])
        refillSlotIfEmpty(2, market.slots[2])
        marketLocked = false
    end, 2.8)
end
