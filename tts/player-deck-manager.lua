-- ============================================================
-- Solis — Gerenciador de Deck do Jogador
-- Script autoral, sem dependências externas, sem replicação.
--
-- Como usar:
-- 1. Coloque um objeto discreto (ex: um marcador ou bloco fino)
--    na área de jogo de cada jogador.
-- 2. Cole este script nesse objeto (botão direito → Scripting).
-- 3. Ajuste drawPos/discardPos abaixo — são posições RELATIVAS
--    a este objeto (não coordenadas absolutas da mesa).
-- 4. Posicione o monte de compra do jogador em cima de drawPos
--    e deixe discardPos livre para receber o descarte.
-- ============================================================

-- posições relativas ao objeto (x, y, z) — ajuste conforme o layout da mesa
local drawPos    = { x = 0.7,  y = 1, z = 0 }  -- onde o monte de compra fica
local discardPos = { x = -0.7, y = 1, z = 0 }  -- onde o descarte se acumula

-- configurações persistidas entre sessões
local settings = {
    drawCount   = 5,     -- quantas cartas o botão "Comprar" busca na mão
    autoShuffle = true,  -- reembaralha o descarte automaticamente quando o monte acaba
}

local DEBUG = false

-- ── ciclo de vida ──────────────────────────────────────────

function onLoad(savedData)
    if savedData ~= nil and savedData ~= "" then
        local ok, decoded = pcall(JSON.decode, savedData)
        if ok and decoded then settings = decoded end
    end
    createButtons()
end

function onSave()
    return JSON.encode(settings)
end

-- ── botões na face do objeto ──────────────────────────────

function createButtons()
    self.createButton({
        click_function = "onDrawClick",
        function_owner = self,
        label          = "Comprar " .. settings.drawCount,
        position       = { 0, 0.3, 0.9 },
        rotation       = { 0, 180, 0 },
        width          = 900,
        height         = 300,
        font_size      = 160,
        color          = { 0.15, 0.15, 0.18 },
        font_color     = { 1, 1, 1 },
    })

    self.createButton({
        click_function = "onDiscardHandClick",
        function_owner = self,
        label          = "Descartar mão",
        position       = { 0, 0.3, 1.35 },
        rotation       = { 0, 180, 0 },
        width          = 900,
        height         = 300,
        font_size      = 140,
        color          = { 0.45, 0.12, 0.12 },
        font_color     = { 1, 1, 1 },
    })

    self.createButton({
        click_function = "onShuffleClick",
        function_owner = self,
        label          = "Reembaralhar",
        position       = { 0, 0.3, 1.8 },
        rotation       = { 0, 180, 0 },
        width          = 900,
        height         = 300,
        font_size      = 140,
        color          = { 0.15, 0.32, 0.5 },
        font_color     = { 1, 1, 1 },
    })
end

-- ── localização dos montes ────────────────────────────────

-- Retorna o Deck/Card encontrado numa posição relativa a este objeto.
local function findPileAt(relativePos)
    local worldPos = self.positionToWorld(relativePos)

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
        if obj ~= self and (obj.type == "Deck" or obj.type == "Card") then
            return obj
        end
    end
    return nil
end

local function findDrawPile()    return findPileAt(drawPos) end
local function findDiscardPile() return findPileAt(discardPos) end

-- ── reembaralhar ───────────────────────────────────────────

function onShuffleClick(_, playerColor)
    reshuffleDiscardIntoDraw(playerColor)
end

function reshuffleDiscardIntoDraw(playerColor)
    local discard = findDiscardPile()
    if discard == nil then
        if playerColor then
            broadcastToColor("Nada no descarte para reembaralhar.", playerColor, { 1, 0.6, 0.2 })
        end
        return
    end

    discard.setPositionSmooth(self.positionToWorld(drawPos), false, true)
    discard.setRotationSmooth({ 0, self.getRotation().y, 0 }, false, true)

    Wait.time(function()
        local pile = findDrawPile()
        if pile ~= nil and pile.shuffle then pile.shuffle() end
    end, 0.6)
end

-- ── comprar ────────────────────────────────────────────────

function onDrawClick(_, playerColor)
    drawCardsToPlayer(playerColor, settings.drawCount)
end

-- Compra até `targetCount` cartas na mão do jogador.
-- Se o monte de compra acabar no meio do processo, reembaralha
-- o descarte automaticamente (quando autoShuffle = true) e completa.
function drawCardsToPlayer(playerColor, targetCount)
    local player = Player[playerColor]
    if player == nil then return end

    local handCount = #player.getHandObjects()
    local needed = targetCount - handCount
    if needed <= 0 then return end

    local pile = findDrawPile()

    if pile == nil then
        if not settings.autoShuffle then
            broadcastToColor("Monte de compra vazio.", playerColor, { 1, 0.4, 0.4 })
            return
        end
        reshuffleDiscardIntoDraw(playerColor)
        Wait.time(function()
            local newPile = findDrawPile()
            if newPile ~= nil then
                dealFromPile(newPile, playerColor, needed)
            else
                broadcastToColor("Nenhuma carta disponível para comprar.", playerColor, { 1, 0.4, 0.4 })
            end
        end, 0.8)
        return
    end

    dealFromPile(pile, playerColor, needed)
end

function dealFromPile(pile, playerColor, count)
    local available = (pile.type == "Deck") and pile.getQuantity() or 1

    if available >= count then
        pile.deal(count, playerColor)
        return
    end

    -- monte tem menos cartas do que o necessário:
    -- compra o disponível, reembaralha o descarte e completa o restante
    pile.deal(available, playerColor)
    local remaining = count - available

    if settings.autoShuffle and remaining > 0 then
        Wait.time(function()
            reshuffleDiscardIntoDraw(playerColor)
            Wait.time(function()
                local newPile = findDrawPile()
                if newPile ~= nil then
                    local newAvailable = (newPile.type == "Deck") and newPile.getQuantity() or 1
                    newPile.deal(math.min(remaining, newAvailable), playerColor)
                end
            end, 0.8)
        end, 0.3)
    end
end

-- ── descartar ──────────────────────────────────────────────

function onDiscardHandClick(_, playerColor)
    local player = Player[playerColor]
    if player == nil then return end

    for _, card in ipairs(player.getHandObjects()) do
        card.setPosition(self.positionToWorld(discardPos))
    end
end
