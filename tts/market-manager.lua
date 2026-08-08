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
-- - Zona vazia é reabastecida automaticamente com a carta do
--   topo do deck do mercado.
-- - Botão "Limpar mercado" move as cartas das zonas 5 e 6 para
--   o descarte do mercado (usado ao final de cada rodada).
-- ============================================================

local DEBUG = false

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

function attachBuyButton(card, slotIndex)
    if card == nil then return end
    card.createButton({
        click_function = "onBuyClick_" .. slotIndex,
        function_owner = self,
        label          = "Comprar",
        position       = { 0, 0.3, 0 },
        rotation       = { 0, 0, 0 },
        width          = 900,
        height         = 280,
        font_size      = 140,
        color          = { 0.15, 0.4, 0.2 },
        font_color     = { 1, 1, 1 },
    })
end

-- ── compra ────────────────────────────────────────────────

function handleBuy(slotIndex, playerColor)
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

-- ── limpar mercado (fim de rodada) ──────────────────────────

function onClearMarketClick()
    local market = Global.call("getMarketPositions")

    for _, idx in ipairs({ 5, 6 }) do
        local slotPos = market.slots[idx]
        local card = findObjAt(slotPos)
        if card ~= nil then
            card.setPositionSmooth(market.discard, false, true)
        end
    end

    Wait.time(function()
        refillSlotIfEmpty(5, market.slots[5])
        refillSlotIfEmpty(6, market.slots[6])
    end, 0.8)
end
