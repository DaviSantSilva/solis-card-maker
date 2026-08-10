-- ============================================================
-- Solis — Gerenciador do DECK do Jogador (por corporação)
--
-- Um dos dois objetos que compõem o gerenciamento de deck do
-- jogador — este cuida do lado do DECK (compra/reembaralhar).
-- O par complementar é discard-manager.lua, que cuida do
-- descarte (descartar mão / N aleatórias).
--
-- Como instalar:
-- 1. Cole solis-global.lua no Global Script da partida ANTES deste.
-- 2. Crie um objeto discreto à ESQUERDA do tabuleiro de cada
--    jogador (perto da posição do deck da corp) — 5 no total.
-- 3. Cole este script na aba SCRIPT e o conteúdo de
--    deck-manager-ui.xml na aba UI de cada um dos 5 objetos.
-- 4. Em cada objeto, defina a Description (botão direito → Notes)
--    com o id da corporação: tabajara, zenite, atomic, atto ou core.
-- ============================================================

local corpId = self.getDescription()

local settings = {
    drawCount = 5, -- valor do botão "Comprar até X"
}

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

    Wait.frames(function() updateUI() end, 10)
end

function onSave()
    return JSON.encode(settings)
end

-- ── posições (via Global) ───────────────────────────────────

local function positions()
    return Global.call("getCorpPositions", corpId)
end

local function findPileAt(worldPos)
    local hits = Physics.cast({
        origin       = worldPos,
        direction    = { 0, -1, 0 },
        type         = 2,
        size         = { 1, 1, 1 },
        max_distance = 1,
    })
    for _, hit in ipairs(hits) do
        local obj = hit.hit_object
        if obj.type == "Deck" or obj.type == "Card" then return obj end
    end
    return nil
end

local function findDrawPile()    return findPileAt(positions().deck) end
local function findDiscardPile() return findPileAt(positions().discard) end

-- ── UI ────────────────────────────────────────────────────

function updateUI()
    self.UI.setValue("txt_drawMid", "Comprar até " .. settings.drawCount)
end

-- ── reembaralhar ──────────────────────────────────────────

function onShuffleClick(player)
    reshuffleDiscardIntoDraw(player and player.color)
end

function reshuffleDiscardIntoDraw(playerColor)
    local pos = positions()
    local discard = findDiscardPile()
    if discard == nil then
        if playerColor then
            broadcastToColor("Nada no descarte para reembaralhar.", playerColor, { 1, 0.6, 0.2 })
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

-- ── mover deck para o descarte (utilitário manual) ──────────

function onDiscardDeckClick()
    local pos  = positions()
    local deck = findDrawPile()
    if deck == nil then return end

    deck.setPositionSmooth(pos.discard, false, true)
    deck.setRotationSmooth({ 0, deck.getRotation().y, 0 }, false, true)
end

-- ── comprar (ajustável) — vai para a zona de mão física ─────

function onDrawLeftClick()
    settings.drawCount = math.max(1, settings.drawCount - 1)
    updateUI()
end

function onDrawRightClick()
    settings.drawCount = settings.drawCount + 1
    updateUI()
end

function onDrawMidClick(player)
    drawToHandZone(settings.drawCount, player and player.color)
end

-- Move até `count` cartas do topo do deck para a zona de mão da
-- corporação, com leve deslocamento entre cada uma. Reembaralha
-- o descarte automaticamente se o deck acabar no meio da compra.
function drawToHandZone(count, playerColor)
    local pos      = positions()
    local handBase = pos.hand

    local function drawOne(i)
        local pile = findDrawPile()

        if pile == nil then
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
