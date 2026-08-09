-- ============================================================
-- Solis — Gerenciador do Mercado de Cartas (v2 — Layout Zones)
--
-- Reescrito para usar LayoutZone nativas do TTS em vez de
-- Physics.cast. Cada uma das 6 posições do mercado ganha uma
-- zona de layout gerada automaticamente, com um botão de compra
-- fixo logo abaixo dela.
--
-- Como instalar:
-- 1. Cole solis-global.lua no Global Script da partida ANTES deste.
-- 2. Crie um objeto discreto perto do descarte do mercado.
-- 3. Cole este script nesse objeto.
-- As 6 zonas são criadas automaticamente ao carregar — não é
-- preciso desenhá-las manualmente no F3. Elas usam as coordenadas
-- de POSITIONS.market.slots (já alinhadas lateralmente ao deck).
-- ============================================================

-- Dimensões padrão de uma carta no TTS (unidades do mundo).
-- Ajuste CARD_WIDTH/CARD_LENGTH se sua arte tiver outra proporção.
local CARD_WIDTH       = 2.2
local CARD_LENGTH      = 3.15
local ZONE_SCALE_MULT  = 1.05 -- zonas 5% maiores que a carta
local BUTTON_GAP_MULT  = 0.05 -- botão 5% abaixo da borda da zona

local zones         = {} -- slotIndex -> objeto LayoutZone
local marketLocked  = false

-- ── criação das zonas + botões ──────────────────────────────

-- Cria uma LayoutZone genérica (5% maior que uma carta), usada
-- tanto pelas zonas de compra quanto pela zona de descarte.
local function createZone(name, pos)
    local zoneWidth  = CARD_WIDTH  * ZONE_SCALE_MULT
    local zoneLength = CARD_LENGTH * ZONE_SCALE_MULT

    local zone = spawnObject({
        type     = "LayoutZone",
        position = { pos.x, pos.y + 0.5, pos.z },
        scale    = { zoneWidth, 2, zoneLength },
    })
    zone.setName(name)

    zone.LayoutZone.setOptions({
        max_objects_per_group = 1,
        combine_into_decks    = false,
        trigger_for_face_down = true,
        trigger_for_face_up   = true,
        instant_refill        = false,
    })

    return zone, zoneLength
end

local function createMarketZone(slotIndex, slotPos)
    local zone, zoneLength = createZone("Mercado " .. slotIndex, slotPos)

    -- Botão de compra fixo na zona (não na carta) — não precisa
    -- ser recriado quando a carta muda, já que fica anexado à
    -- zona, que nunca se move.
    --
    -- Y local negativo compensa a elevação da zona (spawnada em
    -- pos.y + 0.5) para o botão ficar rente à mesa, não flutuando.
    -- Z local negativo posiciona o botão do lado de baixo da zona
    -- (positivo ficava do lado de cima, invertido do esperado).
    local buttonZOffset = -((zoneLength / 2) + (zoneLength * BUTTON_GAP_MULT))
    zone.createButton({
        click_function = "onBuyClick_" .. slotIndex,
        function_owner = self,
        label          = "Comprar",
        position       = { 0, -0.45, buttonZOffset },
        rotation       = { 0, 0, 0 },
        width          = 720,  -- 900 - 20%
        height         = 224,  -- 280 - 20%
        font_size      = 112,  -- 140 - 20%
        color          = { 0.15, 0.4, 0.2 },
        font_color     = { 1, 1, 1 },
    })

    zones[slotIndex] = zone
end

function onLoad()
    local market = Global.call("getMarketPositions")

    for i, slotPos in ipairs(market.slots) do
        _G["onBuyClick_" .. i] = function(_, playerColor)
            handleBuy(i, playerColor)
        end
        createMarketZone(i, slotPos)
    end

    -- Zona do descarte — mesmo padrão das zonas de compra
    -- (5% maior que uma carta, alinhada lateralmente ao deck),
    -- mas sem botão de compra.
    createZone("Descarte do Mercado", market.discard)

    -- preenche o mercado ao carregar (dá tempo dos decks serem posicionados)
    Wait.time(function() fillAllSlots() end, 2)
end

-- ── localizar o deck do mercado (única busca que ainda usa Physics.cast,
--    já que o próprio deck não fica dentro de nenhuma zona de compra) ──

local function findMarketDeck()
    local market = Global.call("getMarketPositions")
    local hits = Physics.cast({
        origin       = { market.deck.x, market.deck.y + 3, market.deck.z },
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
end

-- ── preenchimento das zonas ──────────────────────────────────

function fillAllSlots()
    for i, _ in ipairs(zones) do
        refillSlotIfEmpty(i)
    end
end

function refillSlotIfEmpty(slotIndex)
    local zone = zones[slotIndex]
    if zone == nil then return end

    local existing = zone.getObjects()
    if existing ~= nil and #existing > 0 then return end -- já tem carta

    local deckPile = findMarketDeck()
    if deckPile == nil then return end

    local market  = Global.call("getMarketPositions")
    local slotPos = market.slots[slotIndex]
    local target  = { slotPos.x, slotPos.y + 0.3, slotPos.z }

    if deckPile.type == "Deck" then
        deckPile.takeObject({
            position = target,
            rotation = { 0, 180, 0 }, -- face para cima
            smooth   = true,
        })
    else
        deckPile.setPositionSmooth(target, false, true)
        deckPile.setRotationSmooth({ 0, 180, 0 }, false, true)
    end
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

    local zone = zones[slotIndex]
    if zone == nil then return end

    local objs = zone.getObjects()
    if objs == nil or #objs == 0 then return end
    local card = objs[1]

    local corpPositions = Global.call("getCorpPositions", corp)
    card.setPositionSmooth(corpPositions.discard, false, true)

    Wait.time(function()
        refillSlotIfEmpty(slotIndex)
    end, 0.6)
end

-- ── limpar mercado — esteira (fim de rodada) ────────────────
-- Sem Physics.cast e sem reindexar botão nenhum: o botão pertence
-- à zona (fixo), então mover a carta entre zonas não exige
-- recriar nada — só mover o objeto mesmo.

local function shiftCardToZone(fromIndex, toIndex)
    local fromZone = zones[fromIndex]
    local toZone   = zones[toIndex]
    if fromZone == nil or toZone == nil then return end

    local objs = fromZone.getObjects()
    if objs == nil or #objs == 0 then return end
    local card = objs[1]

    local market = Global.call("getMarketPositions")
    local toPos  = market.slots[toIndex]
    card.setPositionSmooth({ toPos.x, toPos.y + 0.3, toPos.z }, false, true)
end

function onClearMarketClick()
    if marketLocked then return end
    marketLocked = true

    local market = Global.call("getMarketPositions")

    -- 1. Descarta as posições 5 e 6 — SEM reposição automática aqui,
    --    elas serão preenchidas pela esteira (passo 2)
    for _, idx in ipairs({ 5, 6 }) do
        local zone = zones[idx]
        local objs = zone and zone.getObjects()
        if objs ~= nil and #objs > 0 then
            objs[1].setPositionSmooth(market.discard, false, true)
        end
    end

    -- 2. Avança a esteira da direita para a esquerda, para nunca
    --    sobrescrever uma carta que ainda não se moveu:
    --    4→6, 3→5, 2→4, 1→3
    Wait.time(function() shiftCardToZone(4, 6) end, 0.6)
    Wait.time(function() shiftCardToZone(3, 5) end, 1.1)
    Wait.time(function() shiftCardToZone(2, 4) end, 1.6)
    Wait.time(function() shiftCardToZone(1, 3) end, 2.1)

    -- 3. Slots 1 e 2 ficaram vagos pela esteira — só eles recebem
    --    cartas novas do deck do mercado
    Wait.time(function()
        refillSlotIfEmpty(1)
        refillSlotIfEmpty(2)
        marketLocked = false
    end, 2.8)
end
