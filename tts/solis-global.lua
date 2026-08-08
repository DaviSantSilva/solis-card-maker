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

-- TODO: ajustar após o deploy do Card Maker na Vercel
local CARD_BACK_URL = "https://SEU-DOMINIO-AQUI.vercel.app/card-back.png"

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

-- ── ciclo de vida ──────────────────────────────────────────

function onLoad()
    Global.UI.setXml(buildSetupPanelXml())
end

local function isHost(playerColor)
    local p = Player[playerColor]
    return p ~= nil and p.host == true
end

-- ── XML do painel ────────────────────────────────────────────

function buildSetupPanelXml()
    return [[
<Panel id="solisSetupPanel" position="0 250 0" width="820" height="640"
       color="#12141aee" outline="#2a2f3a" outlineSize="2 2" padding="24 24 24 24">

  <Text text="SOLIS — Configuração de Mesa" fontSize="30" color="#eceef3"
        alignment="MiddleCenter" height="44"/>

  <Text text="Jogadores" fontSize="18" color="#8892a4" height="26"/>
  <HorizontalLayout spacing="8" height="70">
    <ToggleGroup id="playersGroup">
      <Toggle id="players_1" text="1" onValueChanged="onPlayersToggle" fontSize="22"/>
      <Toggle id="players_2" text="2" onValueChanged="onPlayersToggle" fontSize="22"/>
      <Toggle id="players_3" text="3" onValueChanged="onPlayersToggle" fontSize="22"/>
      <Toggle id="players_4" text="4" onValueChanged="onPlayersToggle" fontSize="22"/>
      <Toggle id="players_5" text="5" onValueChanged="onPlayersToggle" fontSize="22" isOn="true"/>
    </ToggleGroup>
  </HorizontalLayout>

  <Text text="Idioma" fontSize="18" color="#8892a4" height="26"/>
  <GridLayout cellSize="120 60" spacing="8 8" constraintCount="3" height="140">
    <ToggleGroup id="localeGroup">
      <Toggle id="locale_pt" text="PT" onValueChanged="onLocaleToggle" fontSize="20" isOn="true"/>
      <Toggle id="locale_en" text="EN" onValueChanged="onLocaleToggle" fontSize="20"/>
      <Toggle id="locale_es" text="ES" onValueChanged="onLocaleToggle" fontSize="20"/>
      <Toggle id="locale_fr" text="FR" onValueChanged="onLocaleToggle" fontSize="20"/>
      <Toggle id="locale_de" text="DE" onValueChanged="onLocaleToggle" fontSize="20"/>
      <Toggle id="locale_zh" text="ZH" onValueChanged="onLocaleToggle" fontSize="20"/>
    </ToggleGroup>
  </GridLayout>

  <Text text="Modo de Setup" fontSize="18" color="#8892a4" height="26"/>
  <HorizontalLayout spacing="8" height="70">
    <ToggleGroup id="modeGroup">
      <Toggle id="mode_auto"   text="Automático" onValueChanged="onModeToggle" fontSize="20" isOn="true"/>
      <Toggle id="mode_manual" text="Manual"     onValueChanged="onModeToggle" fontSize="20"/>
    </ToggleGroup>
  </HorizontalLayout>

  <Text id="setupStatusText" text="" fontSize="16" color="#f59e0b" height="30" alignment="MiddleCenter"/>

  <Button id="startSetupButton" text="INICIAR SETUP" onClick="onStartSetupClick"
          height="64" fontSize="24" color="#3b82f6" textColor="#ffffff"/>
</Panel>
]]
end

-- ── handlers dos toggles — travados para não-host ────────────
-- Não-host consegue ver e clicar no painel, mas qualquer ação
-- é revertida e ignorada. Não há como TTS desabilitar visualmente
-- um painel global só para alguns jogadores (é compartilhado),
-- então a trava real acontece aqui no código.

function onPlayersToggle(playerColor, value, id)
    if not isHost(playerColor) then
        Global.UI.setAttribute(id, "isOn", value ~= "True")
        return
    end
    if value ~= "True" then return end
    setupState.players = tonumber(id:match("players_(%d)"))
end

function onLocaleToggle(playerColor, value, id)
    if not isHost(playerColor) then
        Global.UI.setAttribute(id, "isOn", value ~= "True")
        return
    end
    if value ~= "True" then return end
    setupState.locale = id:match("locale_(%a+)")
end

function onModeToggle(playerColor, value, id)
    if not isHost(playerColor) then
        Global.UI.setAttribute(id, "isOn", value ~= "True")
        return
    end
    if value ~= "True" then return end
    setupState.mode = id:match("mode_(%a+)")
end

function onStartSetupClick(playerColor)
    if not isHost(playerColor) then
        Global.UI.setValue("setupStatusText", "Apenas o host pode iniciar o setup.")
        return
    end
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
            return
        end

        local ok, manifest = pcall(JSON.decode, request.text)
        if not ok or manifest == nil then
            Global.UI.setValue("setupStatusText", "Manifest inválido.")
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

    Global.UI.setValue("setupStatusText", "Gerando cartas…")
    spawnAllDecks(mainDeckCards, corpDeckCards)
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

function spawnAllDecks(mainDeckCards, corpDeckCards)
    spawnQueue = {}
    decksByPositionKey = {}

    enqueueDeck(mainDeckCards, POSITIONS.market.deck)
    for corp, cards in pairs(corpDeckCards) do
        enqueueDeck(cards, POSITIONS.corp[corp].deck)
    end

    Global.UI.setValue("setupStatusText", "Gerando " .. #spawnQueue .. " cartas…")
    processSpawnQueue(1)
end

function processSpawnQueue(index)
    if index > #spawnQueue then
        Wait.time(function() mergeAllPendingDecks() end, 0.6)
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
            rotX = 0, rotY = 180, rotZ = 0,
            scaleX = 1, scaleY = 1, scaleZ = 1,
        },
        Nickname   = item.name,
        CardID     = cardId,
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
end
