-- ============================================================
-- Solis — Gerenciador do DESCARTE do Jogador (por corporação)
--
-- Um dos dois objetos que compõem o gerenciamento de deck do
-- jogador — este cuida do lado do DESCARTE (descartar mão / N
-- aleatórias). O par complementar é deck-manager.lua, que cuida
-- do deck (comprar/reembaralhar).
--
-- Como instalar:
-- 1. Cole solis-global.lua no Global Script da partida ANTES deste.
-- 2. Crie um objeto discreto à DIREITA do tabuleiro de cada
--    jogador (perto da posição do descarte da corp) — 5 no total.
-- 3. Cole este script na aba SCRIPT e o conteúdo de
--    discard-manager-ui.xml na aba UI de cada um dos 5 objetos.
-- 4. Em cada objeto, defina a Description (botão direito → Notes)
--    com o id da corporação: tabajara, zenite, atomic, atto ou core.
-- ============================================================

local corpId = self.getDescription()

local settings = {
    discardRandom = 1, -- valor do botão "Descartar N aleatórias"
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

-- ── UI ────────────────────────────────────────────────────

function updateUI()
    self.UI.setValue("txt_discardRandom", "Descartar " .. settings.discardRandom .. " aleatória(s)")
end

-- ── descartar mão inteira ────────────────────────────────────

function onDiscardHandClick(player)
    if player == nil then return end
    local pos = positions()
    for _, card in ipairs(player.getHandObjects()) do
        card.setPosition(pos.discard)
    end
end

-- ── descartar N cartas aleatórias da mão (ajustável) ─────────

function onDiscardRandomLeftClick()
    settings.discardRandom = math.max(0, settings.discardRandom - 1)
    updateUI()
end

function onDiscardRandomRightClick()
    settings.discardRandom = settings.discardRandom + 1
    updateUI()
end

function onDiscardRandomMidClick(player)
    if player == nil then return end
    local pos  = positions()
    local hand = player.getHandObjects()
    local count = math.min(settings.discardRandom, #hand)

    for i = 1, count do
        Wait.time(function()
            local currentHand = player.getHandObjects()
            if #currentHand == 0 then return end
            local rand = math.random(#currentHand)
            currentHand[rand].setPosition(pos.discard)
        end, (i - 1) * 0.3)
    end
end
