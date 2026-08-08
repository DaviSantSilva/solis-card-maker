-- ============================================================
-- Solis — Gerenciador de Deck do Jogador (por corporação)
--
-- Como instalar:
-- 1. Cole solis-global.lua no Global Script da partida ANTES deste.
-- 2. Crie um objeto discreto (marcador/tile fino) perto da zona
--    de descarte de cada corporação (5 no total).
-- 3. Cole este script em cada um desses 5 objetos.
-- 4. No campo "Description" do objeto (botão direito → Notes),
--    escreva exatamente o id da corporação: tabajara, zenite,
--    atomic, atto ou core. O script lê esse campo para saber
--    a quais posições da tabela Global ele se refere.
--
-- Este único script serve para as 5 corporações — só muda a
-- Description de cada objeto.
-- ============================================================

local corpId = self.getDescription()

local settings = {
    drawCount = 5, -- valor do botão de compra ajustável
}

local DEBUG = false

-- ── ciclo de vida ──────────────────────────────────────────

function onLoad(savedData)
    if savedData ~= nil and savedData ~= "" then
        local ok, decoded = pcall(JSON.decode, savedData)
        if ok and decoded then settings = decoded end
    end

    if corpId == nil or corpId == "" then
        print("[Solis] AVISO: objeto sem Description definida (deve ser tabajara/zenite/atomic/atto/core).")
        return
    end

    createButtons()
end

function onSave()
    return JSON.encode(settings)
end

-- ── posições (via Global) ───────────────────────────────────

local function positions()
    return Global.call("getCorpPositions", corpId)
end

-- Retorna o Deck/Card encontrado numa posição ABSOLUTA da mesa.
local function findPileAt(worldPos)
    local hits = Physics.cast({
        origin       = worldPos,
        direction    = { 0, -1, 0 },
        type         = 2, -- box cast
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

local function findDrawPile()    return findPileAt(positions().deck) end
local function findDiscardPile() return findPileAt(positions().discard) end

-- ── botões ────────────────────────────────────────────────

function createButtons()
    -- botão fixo: comprar até 5
    self.createButton({
        click_function = "onDrawFixedClick",
        function_owner = self,
        label          = "Comprar até 5",
        position       = { 0, 0.3, 0.9 },
        rotation       = { 0, 180, 0 },
        width          = 1100,
        height         = 300,
        font_size      = 150,
        color          = { 0.15, 0.15, 0.18 },
        font_color     = { 1, 1, 1 },
    })

    -- botões de quantidade ajustável: [-] [Comprar até X] [+]
    self.createButton({
        click_function = "onDrawMinusClick",
        function_owner = self,
        label          = "-",
        position       = { -1.0, 0.3, 1.35 },
        rotation       = { 0, 180, 0 },
        width          = 300,
        height         = 300,
        font_size      = 180,
        color          = { 0.2, 0.2, 0.24 },
        font_color     = { 1, 1, 1 },
    })

    self.createButton({
        click_function = "onDrawAdjustableClick",
        function_owner = self,
        label          = "Comprar até " .. settings.drawCount,
        position       = { 0, 0.3, 1.35 },
        rotation       = { 0, 180, 0 },
        width          = 1100,
        height         = 300,
        font_size      = 140,
        color          = { 0.15, 0.15, 0.18 },
        font_color     = { 1, 1, 1 },
    })

    self.createButton({
        click_function = "onDrawPlusClick",
        function_owner = self,
        label          = "+",
        position       = { 1.0, 0.3, 1.35 },
        rotation       = { 0, 180, 0 },
        width          = 300,
        height         = 300,
        font_size      = 180,
        color          = { 0.2, 0.2, 0.24 },
        font_color     = { 1, 1, 1 },
    })

    -- botão na zona de descarte: reconstruir deck
    self.createButton({
        click_function = "onRebuildClick",
        function_owner = self,
        label          = "Reconstruir deck",
        position       = { 0, 0.3, 1.8 },
        rotation       = { 0, 180, 0 },
        width          = 1100,
        height         = 300,
        font_size      = 130,
        color          = { 0.15, 0.32, 0.5 },
        font_color     = { 1, 1, 1 },
    })
end

local function refreshAdjustableLabel()
    self.editButton({ index = 2, label = "Comprar até " .. settings.drawCount })
end

function onDrawMinusClick()
    settings.drawCount = math.max(1, settings.drawCount - 1)
    refreshAdjustableLabel()
end

function onDrawPlusClick()
    settings.drawCount = settings.drawCount + 1
    refreshAdjustableLabel()
end

-- ── compra — cartas vão para a ZONA DE MÃO física, não a mão oculta do TTS ──

function onDrawFixedClick(_, playerColor)
    drawToHandZone(5, playerColor)
end

function onDrawAdjustableClick(_, playerColor)
    drawToHandZone(settings.drawCount, playerColor)
end

-- Move até `count` cartas do topo do deck para a zona de mão da corporação,
-- com leve deslocamento entre cada uma para não empilhar perfeitamente.
-- Reembaralha o descarte automaticamente se o deck acabar no meio da compra.
function drawToHandZone(count, playerColor)
    local pos = positions()
    local handBase = pos.hand

    local function drawOne(i)
        local pile = findDrawPile()

        if pile == nil then
            -- deck vazio: tenta reembaralhar o descarte e continuar
            local discard = findDiscardPile()
            if discard == nil then
                if playerColor then
                    broadcastToColor("Nenhuma carta disponível para comprar.", playerColor, { 1, 0.4, 0.4 })
                end
                return
            end
            discard.setPositionSmooth(pos.deck, false, true)
            discard.setRotationSmooth({ 0, discard.getRotation().y, 0 }, false, true)
            Wait.time(function() drawOne(i) end, 0.7)
            return
        end

        local targetPos = {
            x = handBase.x + (i * 0.06),
            y = handBase.y + (i * 0.18),
            z = handBase.z,
        }

        if pile.type == "Deck" then
            pile.takeObject({ position = targetPos, smooth = true })
        else
            pile.setPositionSmooth(targetPos, false, true)
        end
    end

    for i = 1, count do
        Wait.time(function() drawOne(i) end, (i - 1) * 0.18)
    end
end

-- ── reconstruir deck a partir do descarte ──────────────────

function onRebuildClick(_, playerColor)
    local pos = positions()
    local discard = findDiscardPile()

    if discard == nil then
        if playerColor then
            broadcastToColor("Nada no descarte para reconstruir.", playerColor, { 1, 0.6, 0.2 })
        end
        return
    end

    discard.setPositionSmooth(pos.deck, false, true)
    discard.setRotationSmooth({ 0, discard.getRotation().y, 0 }, false, true)

    Wait.time(function()
        local pile = findDrawPile()
        if pile ~= nil and pile.shuffle then pile.shuffle() end
    end, 0.6)
end
