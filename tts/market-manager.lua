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
local BUTTON_GAP_MULT  = 0.015 -- botão bem próximo da borda da zona

local zones         = {} -- slotIndex -> objeto LayoutZone
local marketLocked  = false

-- ── criação das zonas + botões ──────────────────────────────

-- Cria uma LayoutZone genérica (5% maior que uma carta), usada
-- tanto pelas zonas de compra quanto pela zona de descarte.
-- Cria uma LayoutZone genérica (5% maior que uma carta), usada
-- tanto pelas zonas de compra quanto pela zona de descarte.
--
-- Usa callback_function do próprio spawnObject — a API específica
-- .LayoutZone só fica disponível depois que o objeto termina de
-- inicializar, o que não é garantido no mesmo frame do spawn.
-- Chamar zone.LayoutZone.setOptions() direto (sem esperar o
-- callback) pode falhar silenciosamente e travar o resto do
-- onLoad, impedindo qualquer zona/botão seguinte de ser criado.
local function createZone(name, pos, onReady)
    local zoneWidth  = CARD_WIDTH  * ZONE_SCALE_MULT
    local zoneLength = CARD_LENGTH * ZONE_SCALE_MULT

    spawnObject({
        type     = "LayoutZone",
        -- Mesma altura das cartas (pos.y + 0.3, igual usado em
        -- refillSlotIfEmpty) — zona e botão ficam rente ao nível
        -- real das cartas na mesa, não flutuando nem embaixo dela.
        position = { pos.x, pos.y + 0.3, pos.z },
        -- Y de escala reduzido de 2 para 0.5 — volume vertical
        -- menor o suficiente para detectar cartas, mas evita que
        -- deslocamentos locais no botão sejam amplificados pela
        -- escala do objeto (era a causa do botão parar embaixo
        -- da mesa com um offset negativo maior).
        scale    = { zoneWidth, 0.5, zoneLength },
        callback_function = function(zone)
            zone.setName(name)
            zone.LayoutZone.setOptions({
                max_objects_per_group = 1,
                combine_into_decks    = false,
                trigger_for_face_down = true,
                trigger_for_face_up   = true,
                instant_refill        = false,
            })
            if onReady then onReady(zone, zoneLength, zoneWidth) end
        end,
    })
end

local function createMarketZone(slotIndex, slotPos)
    createZone("Mercado " .. slotIndex, slotPos, function(zone, zoneLength)
        -- Botão de compra fixo na zona (não na carta) — não precisa
        -- ser recriado quando a carta muda, já que fica anexado à
        -- zona, que nunca se move.
        --
        -- Y local = 0: a zona já nasce na mesma altura das cartas
        -- IMPORTANTE: createButton usa posição LOCAL ao objeto pai,
        -- e essa posição é AMPLIFICADA pela escala do pai (a zona
        -- tem scale ≈ {2.31, 0.5, 3.31}, não {1,1,1}). Um offset de
        -- mundo desejado precisa ser DIVIDIDO pela escala do eixo
        -- correspondente para virar o offset local correto:
        --   local = (mundo_desejado - mundo_da_zona) / escala_da_zona
        --
        -- Posição absoluta de mesa desejada: Z = -15.78
        -- Zona fica em z = -13.28 (mundo) → offset mundo = -2.50
        -- Escala Z da zona (zoneLength) ≈ 3.3075
        -- local Z = -2.50 / 3.3075 ≈ -0.756
        local buttonZOffset = -0.756
        zone.createButton({
            click_function = "onBuyClick_" .. slotIndex,
            function_owner = self,
            label          = "Comprar",
            position       = { 0, 0, buttonZOffset },
            rotation       = { 0, 180, 0 }, -- mesma convenção legível usada nos outros scripts
            width          = 612,  -- 720 - 15%
            height         = 190,  -- 224 - 15%
            font_size      = 95,   -- 112 - 15%
            color          = { 0.15, 0.4, 0.2 },
            font_color     = { 1, 1, 1 },
        })

        zones[slotIndex] = zone
    end)
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
    -- com o botão 'Limpar mercado' à direita dela (deslocamento
    -- no eixo X local, não no Z — não é um botão de compra abaixo).
    createZone("Descarte do Mercado", market.discard, function(zone, zoneLength, zoneWidth)
        -- Mesma correção de escala explicada em createMarketZone.
        -- Zona de descarte fica em mundo {10.83, 1.99, -13.24}
        -- (y = 1.69 + 0.3, ver createZone). Posição absoluta
        -- desejada: {14.28, 2.18, -13.32}.
        --
        -- offset mundo = desejado - zona = {3.45, 0.19, -0.08}
        -- escala da zona = {zoneWidth≈2.31, 0.5, zoneLength≈3.31}
        -- local = offset mundo / escala:
        --   x = 3.45 / 2.31  ≈ 1.494
        --   y = 0.19 / 0.5   = 0.380
        --   z = -0.08 / 3.31 ≈ -0.024
        local buttonXOffset = 1.494
        local buttonYOffset = 0.380
        local buttonZOffset = -0.024
        zone.createButton({
            click_function = "onClearMarketClick",
            function_owner = self,
            label          = "Limpar\nmercado",
            position       = { buttonXOffset, buttonYOffset, buttonZOffset },
            rotation       = { 0, 180, 0 },
            width          = 612,
            height         = 350,
            font_size      = 90,
            color          = { 0.45, 0.12, 0.12 },
            font_color     = { 1, 1, 1 },
        })
    end)

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
        -- Puxar cartas do topo acumula um pequeno torque físico no
        -- deck restante (fica torto/"tilt"). Corrige a rotação do
        -- deck do mercado logo depois de cada extração.
        Wait.time(function()
            local remaining = findMarketDeck()
            if remaining ~= nil and remaining.type == "Deck" then
                remaining.setRotationSmooth({ 0, 180, 180 }, false, true)
            end
        end, 0.5)
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

function onClearMarketClick()
    if marketLocked then return end
    marketLocked = true

    local market = Global.call("getMarketPositions")

    -- Captura TODAS as referências de carta das 6 zonas de uma vez,
    -- ANTES de mover qualquer coisa. Reconsultar zone.getObjects()
    -- a cada passo (como era antes) falhava: a carta descartada de
    -- 5/6 ainda estava em pleno voo (setPositionSmooth) quando o
    -- passo seguinte tentava ler a zona de novo, confundindo a
    -- detecção e fazendo a esteira "sumir" — só o refill de 1 e 2
    -- (que não depende dessa releitura) parecia funcionar.
    local captured = {}
    for i = 1, 6 do
        local zone = zones[i]
        local objs = zone and zone.getObjects()
        captured[i] = (objs ~= nil and #objs > 0) and objs[1] or nil
    end

    local function moveCapturedTo(card, toIndex)
        if card == nil then return end
        local pos = market.slots[toIndex]
        card.setPositionSmooth({ pos.x, pos.y + 0.3, pos.z }, false, true)
    end

    -- 1. Descarta as cartas que JÁ ESTAVAM capturadas em 5 e 6 —
    --    sem reposição automática aqui, elas serão preenchidas
    --    pela esteira (passo 2)
    if captured[5] ~= nil then captured[5].setPositionSmooth(market.discard, false, true) end
    if captured[6] ~= nil then captured[6].setPositionSmooth(market.discard, false, true) end

    -- 2. Avança a esteira usando as referências já capturadas —
    --    4→6, 3→5, 2→4, 1→3. Não depende de reconsultar a zona,
    --    então não corre risco de conflito com nenhuma animação
    --    ainda em andamento.
    Wait.time(function() moveCapturedTo(captured[4], 6) end, 0.7)
    Wait.time(function() moveCapturedTo(captured[3], 5) end, 1.3)
    Wait.time(function() moveCapturedTo(captured[2], 4) end, 1.9)
    Wait.time(function() moveCapturedTo(captured[1], 3) end, 2.5)

    -- 3. Slots 1 e 2 ficaram vagos pela esteira — só eles recebem
    --    cartas novas do deck do mercado
    Wait.time(function()
        refillSlotIfEmpty(1)
        refillSlotIfEmpty(2)
        marketLocked = false
    end, 3.2)
end
