-- ============================================================
-- Solis — Script Global (posições + menu de setup + import)
-- Cole este conteúdo no Global Script da partida
-- (Objects → Scripting → Global). É o ÚNICO script global —
-- ele já contém as posições E o menu, não precisa de nada mais
-- além disto e dos scripts por objeto (player-deck-manager,
-- market-manager).
-- ============================================================

function onLoad()
    math.randomseed(os.time())
end

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
local positionByKey = {} -- key -> posição real usada neste run (necessário pois o modo Manual desloca as corps)
local BATCH_DELAY = 0.08 -- segundos entre cada spawn

local function posKey(pos)
    return string.format("%.2f_%.2f_%.2f", pos.x, pos.y, pos.z)
end

-- Busca ampla reutilizável — mesma lógica usada em clearPileAt,
-- no diagnóstico e agora também no embaralhamento/preenchimento do mercado.
local function findPileWide(worldPos)
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
end

local function enqueueDeck(cardList, targetPos)
    positionByKey[posKey(targetPos)] = targetPos
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

-- ── atribuição jogador ↔ corporação (modo automático) ────────
--
-- Prioridade, seguindo exatamente as diretrizes definidas:
-- 1. Cores já sentadas → cada uma reivindica sua corp
-- 2. Jogadores na sala SEM cor → forçados a sentar nas corps
--    restantes, até completar o nº de jogadores selecionado
-- 3. Ainda faltando (sem mais ninguém na sala) → sorteia entre
--    as corps realmente não reivindicadas
--
-- Retorna uma lista com exatamente setupState.players corpIds.
local function assignCorpsToPlayers()
    local allCorps = { "tabajara", "zenite", "atomic", "atto", "core" }
    local assigned = {}
    local assignments = {}

    local allPlayers = Player.getPlayers()

    -- 1. Cores já sentadas
    for _, player in ipairs(allPlayers) do
        if player.seated then
            local corp = COLOR_CORP[player.color]
            if corp ~= nil and not assigned[corp] then
                assigned[corp] = true
                table.insert(assignments, corp)
            end
        end
    end

    -- 2. Jogadores sem cor na sala → força sentar nas corps restantes
    if #assignments < setupState.players then
        local unseated = {}
        for _, player in ipairs(allPlayers) do
            if not player.seated then table.insert(unseated, player) end
        end

        local remaining = {}
        for _, corp in ipairs(allCorps) do
            if not assigned[corp] then table.insert(remaining, corp) end
        end

        local ui = 1
        for _, corp in ipairs(remaining) do
            if #assignments >= setupState.players then break end
            if unseated[ui] ~= nil then
                unseated[ui].changeColor(CORP_COLOR[corp])
                assigned[corp] = true
                table.insert(assignments, corp)
                ui = ui + 1
            end
        end
    end

    -- 3. Ainda falta? sorteia entre as corps realmente não reivindicadas
    if #assignments < setupState.players then
        local remaining = {}
        for _, corp in ipairs(allCorps) do
            if not assigned[corp] then table.insert(remaining, corp) end
        end
        -- embaralha (Fisher-Yates)
        for i = #remaining, 2, -1 do
            local j = math.random(i)
            remaining[i], remaining[j] = remaining[j], remaining[i]
        end
        for _, corp in ipairs(remaining) do
            if #assignments >= setupState.players then break end
            assigned[corp] = true
            table.insert(assignments, corp)
        end
    end

    return assignments
end

function spawnAllDecks(mainDeckCards, corpDeckCards)
    spawnQueue = {}
    decksByPositionKey = {}
    positionByKey = {}

    clearAllTargetPositions()

    enqueueDeck(mainDeckCards, POSITIONS.market.deck)

    if setupState.mode == "auto" then
        -- Automático: só as corps atribuídas aos N jogadores selecionados,
        -- direto na posição de mesa de cada uma (já é a área do jogador)
        local corpsToSpawn = assignCorpsToPlayers()
        for _, corp in ipairs(corpsToSpawn) do
            enqueueDeck(corpDeckCards[corp], POSITIONS.corp[corp].deck)
        end
    else
        -- Manual: todas as 5, deslocadas para fora da mesa principal,
        -- para o host distribuir manualmente
        for corp, cards in pairs(corpDeckCards) do
            local base = POSITIONS.corp[corp].deck
            local staging = { x = base.x, y = base.y, z = base.z - 25 }
            enqueueDeck(cards, staging)
        end
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
            -- rotY=180: mantém a orientação de leitura correta (era o valor original)
            -- rotZ=180: vira a carta para mostrar o verso — girar em Y só gira
            -- no próprio plano (como ponteiro de relógio), não troca qual lado
            -- fica visível; quem troca face/verso é o eixo Z
            rotX = 0, rotY = 180, rotZ = 180,
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

-- Vira as N cartas do topo do deck do mercado (uma por zona de
-- compra) para as posições de slot, com a face para cima. Chamado
-- uma única vez, ao final do setup, depois de embaralhar tudo.
local function fillMarketSlotsFromDeck()
    for i, slotPos in ipairs(POSITIONS.market.slots) do
        Wait.time(function()
            local deckPile = findPileWide(POSITIONS.market.deck)
            if deckPile == nil then return end

            if deckPile.type == "Deck" then
                deckPile.takeObject({
                    position = slotPos,
                    rotation = { 0, 180, 0 }, -- face para cima (rotY=180, rotZ=0)
                    smooth   = true,
                })
            else
                deckPile.setPositionSmooth(slotPos, false, true)
                deckPile.setRotationSmooth({ 0, 180, 0 }, false, true)
            end
        end, (i - 1) * 0.25)
    end

    -- Puxar cartas repetidamente do topo acumula um pequeno torque
    -- físico no deck restante (fica torto/"tilt"). Corrige a rotação
    -- do deck do mercado depois que todas as extrações terminam.
    Wait.time(function()
        local remaining = findPileWide(POSITIONS.market.deck)
        if remaining ~= nil then
            remaining.setRotationSmooth({ 0, 180, 180 }, false, true)
        end
    end, #POSITIONS.market.slots * 0.25 + 0.4)
end

-- Embaralha todo deck encontrado em cada posição realmente usada
-- neste run (via positionByKey — cobre tanto o modo Automático
-- quanto o Manual, cujas posições de corp são deslocadas).
local function shuffleAllDecks()
    for _, pos in pairs(positionByKey) do
        local obj = findPileWide(pos)
        if obj ~= nil and obj.type == "Deck" and obj.shuffle then
            obj.shuffle()
        end
    end
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

    -- 1. Embaralha todos os decks recém-formados
    Wait.time(function()
        shuffleAllDecks()

        -- 2. Distribui o topo do mercado para as 6 zonas de compra
        Wait.time(function()
            fillMarketSlotsFromDeck()

            -- 3. Diagnóstico (só no console, para debug) + mensagem
            --    amigável na UI + fecha o painel automaticamente
            Wait.time(function()
                local function countAt(pos)
                    local obj = findPileWide(pos)
                    if obj == nil then return 0 end
                    if obj.type == "Deck" then return obj.getQuantity() end
                    return 1
                end

                local report = "Na mesa — mercado: " .. countAt(POSITIONS.market.deck)
                for _, corp in ipairs({ "tabajara", "zenite", "atomic", "atto", "core" }) do
                    report = report .. " | " .. corp .. ": " .. countAt(POSITIONS.corp[corp].deck)
                end
                print("[Solis] " .. report) -- mantido só no console, para debug futuro

                Global.UI.setValue("setupStatusText", "Aproveite o jogo, boa sorte!")

                Wait.time(function()
                    onCloseClick()
                end, 5)
            end, 2)
        end, 1)
    end, 0.6)
end
