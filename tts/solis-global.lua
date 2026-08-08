-- ============================================================
-- Solis — Script Global (posições + menu de setup + import)
-- Cole este conteúdo no Global Script da partida
-- (Objects → Scripting → Global). É o ÚNICO script global —
-- ele já contém as posições E o menu, não precisa de mais nada
-- além disto e dos scripts por objeto (player-deck-manager,
-- market-manager).
-- ============================================================

-- ── posições da mesa ─────────────────────────────────────────

CORP_COLOR = {
    tabajara = "Red",
    zenite   = "White",
    atomic   = "Green",
    atto     = "Blue",
    core     = "Purple",
}

COLOR_CORP = {}
for corp, color in pairs(CORP_COLOR) do COLOR_CORP[color] = corp end

POSITIONS = {
    corp = {
        atto = {
            deck    = { x = -66.98, y = 1.69, z = -41.40 },
            discard = { x = -45.46, y = 1.69, z = -41.63 },
            hand    = { x = -55.39, y = 5.00, z = -61.31 },
        },
        atomic = {
            deck    = { x = -39.89, y = 1.69, z = -41.57 },
            discard = { x = -18.33, y = 1.69, z = -41.32 },
            hand    = { x = -28.28, y = 5.20, z = -61.33 },
        },
        core = {
            deck    = { x = -12.28, y = 1.69, z = -41.52 },
            discard = { x = 9.35,   y = 1.69, z = -41.49 },
            hand    = { x = -1.15,  y = 5.27, z = -61.26 },
        },
        tabajara = {
            deck    = { x = 14.83, y = 1.69, z = -41.04 },
            discard = { x = 36.56, y = 1.69, z = -40.93 },
            hand    = { x = 25.56, y = 5.20, z = -61.28 },
        },
        zenite = {
            deck    = { x = 44.61, y = 1.69, z = -40.85 },
            discard = { x = 66.24, y = 1.69, z = -40.75 },
            hand    = { x = 55.10, y = 5.00, z = -61.31 },
        },
    },

    market = {
        deck    = { x = -12.40, y = 1.69, z = -13.28 },
        discard = { x = 10.83,  y = 1.69, z = -13.24 },
        slots = {
            { x = -9.11, y = 1.69, z = -13.28 },
            { x = -5.65, y = 1.69, z = -13.18 },
            { x = -2.37, y = 1.69, z = -13.12 },
            { x = 0.91,  y = 1.69, z = -13.15 },
            { x = 4.23,  y = 1.69, z = -13.25 },
            { x = 7.58,  y = 1.69, z = -13.25 },
        },
    },
}

function getCorpForColor(color)     return COLOR_CORP[color] end
function getColorForCorp(corp)      return CORP_COLOR[corp] end
function getCorpPositions(corp)     return POSITIONS.corp[corp] end
function getMarketPositions()       return POSITIONS.market end
function getAllCorpIds()
    local ids = {}
    for corp, _ in pairs(CORP_COLOR) do table.insert(ids, corp) end
    return ids
end

-- ============================================================
-- MENU DE SETUP
-- ============================================================

-- URL do bucket público do Supabase Storage
local STORAGE_BASE = "https://pnsolmogjbsqepbisxqy.supabase.co/storage/v1/object/public/cards"

local CARD_BACK_URL = "https://pnsolmogjbsqepbisxqy.supabase.co/storage/v1/object/public/cards/card%20back.png"

local MANIFEST_URL = {
    pt = STORAGE_BASE .. "/manifest.json",
    en = STORAGE_BASE .. "/manifest-en.json",
    es = STORAGE_BASE .. "/manifest-es.json",
    fr = STORAGE_BASE .. "/manifest-fr.json",
    de = STORAGE_BASE .. "/manifest-de.json",
    zh = STORAGE_BASE .. "/manifest-zh.json",
}

local setupState = {
    players = 5,
    locale  = "pt",
    mode    = "auto", -- "auto" | "manual"
}

local panelOpen = true

-- ── ciclo de vida ──────────────────────────────────────────
-- O painel em si vive na aba UI do Global (solis-setup-ui.xml).
-- O TTS carrega esse XML automaticamente — nenhuma chamada de
-- Global.UI.setXml() é necessária aqui.

-- No XmlUI (onValueChanged/onClick), o TTS passa o OBJETO Player
-- diretamente como primeiro argumento — não uma string de cor.
-- (Isso é diferente de createButton, onde o 2º argumento É a cor.)
local function isHost(player)
    return player ~= nil and player.host == true
end

-- ── handlers dos toggles — travados para não-host ────────────
-- Não-host consegue ver e clicar no painel, mas qualquer ação
-- é revertida e ignorada. Não há como TTS desabilitar visualmente
-- um painel global só para alguns jogadores (é compartilhado),
-- então a trava real acontece aqui no código.
--
-- Exclusividade manual (radio-like) em vez de <ToggleGroup>:
-- o componente nativo do TTS apresentou comportamento instável,
-- então cada grupo desmarca os irmãos via código ao marcar um.

local PLAYERS_IDS = { "players_1", "players_2", "players_3", "players_4", "players_5" }
local LOCALE_IDS  = { "locale_pt", "locale_en", "locale_es", "locale_fr", "locale_de", "locale_zh" }
local MODE_IDS    = { "mode_auto", "mode_manual" }

-- Marca `selectedId` como true e todos os outros do grupo como false.
local function enforceSingleSelection(allIds, selectedId)
    for _, id in ipairs(allIds) do
        Global.UI.setAttribute(id, "isOn", tostring(id == selectedId))
    end
end

function onPlayersToggle(player, value, id)
    if not isHost(player) then
        Global.UI.setAttribute(id, "isOn", tostring(value ~= "True"))
        return
    end

    if value ~= "True" then
        Global.UI.setAttribute(id, "isOn", "true")
        return
    end

    enforceSingleSelection(PLAYERS_IDS, id)
    setupState.players = tonumber(id:match("players_(%d)"))
end

function onLocaleToggle(player, value, id)
    if not isHost(player) then
        Global.UI.setAttribute(id, "isOn", tostring(value ~= "True"))
        return
    end

    if value ~= "True" then
        Global.UI.setAttribute(id, "isOn", "true")
        return
    end

    enforceSingleSelection(LOCALE_IDS, id)
    setupState.locale = id:match("locale_(%a+)")
end

function onModeToggle(player, value, id)
    if not isHost(player) then
        Global.UI.setAttribute(id, "isOn", tostring(value ~= "True"))
        return
    end

    if value ~= "True" then
        Global.UI.setAttribute(id, "isOn", "true")
        return
    end

    enforceSingleSelection(MODE_IDS, id)
    setupState.mode = id:match("mode_(%a+)")
end

function onCloseClick()
    panelOpen = false
    Global.UI.setAttribute("solisSetupPanel", "active", "false")
    Global.UI.setAttribute("reopenPanelButton", "active", "true")
end

function onReopenClick()
    panelOpen = true
    Global.UI.setAttribute("solisSetupPanel", "active", "true")
    Global.UI.setAttribute("reopenPanelButton", "active", "false")
end

-- Comando de emergência via console (~), caso o botão de fechar
-- não responda por qualquer motivo visual: digite /fecharsolis
function onChat(message, sender)
    if message == "/fecharsolis" then
        onCloseClick()
        return false
    end
end

local isSpawning = false

function onStartSetupClick(player)
    if not isHost(player) then
        Global.UI.setValue("setupStatusText", "Apenas o host pode iniciar o setup.")
        return
    end
    if isSpawning then
        Global.UI.setValue("setupStatusText", "Setup já em andamento, aguarde…")
        return
    end
    isSpawning = true
    Global.UI.setAttribute("startSetupButton", "interactable", "false")
    Global.UI.setValue("setupStatusText", "Buscando cartas…")
    fetchManifestAndSpawn()
end

-- ============================================================
-- IMPORT — busca o manifest e gera as cartas na mesa
-- ============================================================

function fetchManifestAndSpawn()
    local url = MANIFEST_URL[setupState.locale] or MANIFEST_URL.pt

    WebRequest.get(url, function(request)
        if request.is_error or request.response_code ~= 200 then
            Global.UI.setValue("setupStatusText", "Erro ao buscar manifest: " .. tostring(request.error))
            isSpawning = false
            Global.UI.setAttribute("startSetupButton", "interactable", "true")
            return
        end

        local ok, manifest = pcall(JSON.decode, request.text)
        if not ok or manifest == nil then
            Global.UI.setValue("setupStatusText", "Manifest inválido.")
            isSpawning = false
            Global.UI.setAttribute("startSetupButton", "interactable", "true")
            return
        end

        buildDeckLists(manifest)
    end)
end

-- Separa as cartas do manifest em: baralho principal (mercado)
-- e os 5 baralhos de corporação (rarity == "inicial").
-- A quantidade de cada carta vem direto do manifest (meta.quantity),
-- então não há números de jogo hardcoded aqui — se você mudar a
-- quantidade no Card Maker, o TTS já respeita automaticamente.
function buildDeckLists(manifest)
    local mainDeckCards = {}
    local corpDeckCards = { tabajara = {}, zenite = {}, atomic = {}, atto = {}, core = {} }

    for slug, faceUrl in pairs(manifest.cards) do
        local meta = manifest.meta and manifest.meta[slug]
        if meta ~= nil then
            local qty = meta.quantity or 1
            local entry = { faceUrl = faceUrl, quantity = qty, name = manifest.names[slug] or slug }

            if meta.rarity == "inicial" and corpDeckCards[meta.companyId] ~= nil then
                table.insert(corpDeckCards[meta.companyId], entry)
            else
                table.insert(mainDeckCards, entry)
            end
        end
    end

    -- DIAGNÓSTICO: mostra os totais calculados a partir do manifest,
    -- ANTES de qualquer spawn. Isola se o problema está na leitura/
    -- classificação dos dados ou na geração das cartas na mesa.
    local function sumQty(list)
        local s = 0
        for _, c in ipairs(list) do s = s + c.quantity end
        return s
    end

    local diag = string.format("Mercado: %d cópias (%d designs)", sumQty(mainDeckCards), #mainDeckCards)
    for _, corp in ipairs({ "tabajara", "zenite", "atomic", "atto", "core" }) do
        diag = diag .. string.format(" | %s: %d (%d designs)", corp, sumQty(corpDeckCards[corp]), #corpDeckCards[corp])
    end
    print("[Solis] " .. diag)
    Global.UI.setValue("setupStatusText", diag)
    Wait.time(function()
        Global.UI.setValue("setupStatusText", "Gerando cartas…")
        spawnAllDecks(mainDeckCards, corpDeckCards)
    end, 3) -- pausa para dar tempo de ler o diagnóstico antes de continuar
end

-- ── geração das cartas na mesa (em lotes, para não sobrecarregar) ──

local nextCustomDeckKey = 1
local spawnQueue = {}
local decksByPositionKey = {}
local BATCH_DELAY = 0.08 -- segundos entre cada spawn

local function posKey(pos)
    return string.format("%.2f_%.2f_%.2f", pos.x, pos.y, pos.z)
end

local function enqueueDeck(cardList, targetPos)
    for _, card in ipairs(cardList) do
        for i = 1, card.quantity do
            table.insert(spawnQueue, { faceUrl = card.faceUrl, name = card.name, position = targetPos })
        end
    end
end

-- Remove qualquer Deck/Carta já existente nas posições de destino
-- antes de gerar as novas. Torna 'Começar' idempotente — clicar
-- de novo nunca acumula cartas duplicadas por cima das anteriores.
-- Busca numa área mais ampla (não só o ponto exato) para pegar
-- cartas que tenham ficado espalhadas de tentativas anteriores.
local function clearPileAt(worldPos)
    local hits = Physics.cast({
        origin       = { worldPos.x, worldPos.y + 3, worldPos.z },
        direction    = { 0, -1, 0 },
        type         = 2,
        size         = { 3, 6, 3 }, -- área ampla o suficiente para pegar cartas dispersas
        max_distance = 6,
    })

    local destroyed = {}
    for _, hit in ipairs(hits) do
        local obj = hit.hit_object
        if (obj.type == "Deck" or obj.type == "Card") and not destroyed[obj.getGUID()] then
            destroyed[obj.getGUID()] = true
            obj.destruct()
        end
    end
end

local function clearAllTargetPositions()
    clearPileAt(POSITIONS.market.deck)
    for _, pos in pairs(POSITIONS.corp) do
        clearPileAt(pos.deck)
    end
end

function spawnAllDecks(mainDeckCards, corpDeckCards)
    spawnQueue = {}
    decksByPositionKey = {}

    clearAllTargetPositions()

    enqueueDeck(mainDeckCards, POSITIONS.market.deck)
    for corp, cards in pairs(corpDeckCards) do
        enqueueDeck(cards, POSITIONS.corp[corp].deck)
    end

    Global.UI.setValue("setupStatusText", "Gerando " .. #spawnQueue .. " cartas…")
    processSpawnQueue(1)
end

function processSpawnQueue(index)
    if index > #spawnQueue then
        Wait.time(function()
            mergeAllPendingDecks()
            isSpawning = false
            Global.UI.setAttribute("startSetupButton", "interactable", "true")
        end, 0.6)
        Global.UI.setValue("setupStatusText", "Setup pronto!")
        return
    end

    local item = spawnQueue[index]
    local key = posKey(item.position)

    nextCustomDeckKey = nextCustomDeckKey + 1
    local deckKey = nextCustomDeckKey
    local cardId = deckKey * 100

    local objState = {
        Name      = "CardCustom",
        Transform = {
            posX = item.position.x, posY = item.position.y + 0.3, posZ = item.position.z,
            rotX = 0, rotY = 0, rotZ = 0, -- rotY=0: verso para cima (face escondida, como um deck normal)
            scaleX = 1, scaleY = 1, scaleZ = 1,
        },
        Nickname   = item.name,
        CardID     = cardId,
        Locked     = false, -- sem isso o TTS trava o objeto: sem gravidade, sem colisão
        CustomDeck = {
            [tostring(deckKey)] = {
                FaceURL      = item.faceUrl,
                BackURL      = CARD_BACK_URL,
                NumWidth     = 1,
                NumHeight    = 1,
                BackIsHidden = true,
                UniqueBack   = false,
                Type         = 0,
            },
        },
    }

    spawnObjectData({
        data = objState,
        callback_function = function(obj)
            decksByPositionKey[key] = decksByPositionKey[key] or {}
            table.insert(decksByPositionKey[key], obj)
        end,
    })

    Wait.time(function() processSpawnQueue(index + 1) end, BATCH_DELAY)
end

-- Combina os objetos que caíram na mesma posição num único Deck.
-- Se group() não se comportar como esperado na sua versão do TTS,
-- a alternativa é encadear obj.putObject(proximoObj) manualmente.
function mergeAllPendingDecks()
    for _, objs in pairs(decksByPositionKey) do
        if #objs > 1 then
            group(objs)
        end
    end
    decksByPositionKey = {}

    -- DIAGNÓSTICO PÓS-SPAWN: conta o que REALMENTE existe em cada
    -- posição depois de tudo pronto — compara contra o diagnóstico
    -- pré-spawn para confirmar se a duplicação acontece antes ou
    -- depois da geração das cartas.
    Wait.time(function()
        local function countAt(pos)
            local hits = Physics.cast({
                origin = { pos.x, pos.y + 3, pos.z }, direction = { 0, -1, 0 },
                type = 2, size = { 3, 6, 3 }, max_distance = 6,
            })
            for _, hit in ipairs(hits) do
                local obj = hit.hit_object
                if obj.type == "Deck" then return obj.getQuantity() end
                if obj.type == "Card" then return 1 end
            end
            return 0
        end

        local report = "Na mesa — mercado: " .. countAt(POSITIONS.market.deck)
        for _, corp in ipairs({ "tabajara", "zenite", "atomic", "atto", "core" }) do
            report = report .. " | " .. corp .. ": " .. countAt(POSITIONS.corp[corp].deck)
        end
        print("[Solis] " .. report)
        Global.UI.setValue("setupStatusText", report)
    end, 1)
end
