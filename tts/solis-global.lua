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

local panelOpen = true

-- ── ciclo de vida ──────────────────────────────────────────

function onLoad()
    Global.UI.setXml(buildSetupPanelXml())
end

local function isHost(playerColor)
    local p = Player[playerColor]
    return p ~= nil and p.host == true
end

-- ── XML do painel — paleta idêntica ao Card Maker web ────────
-- bg-base #0c0d0f · bg-surface #131518 · bg-raised #1a1d22
-- bg-overlay #20242b · border #252930 · text-1 #eceef3
-- text-2 #8892a4 · text-3 #4a5168 · accent #3b82f6

function buildSetupPanelXml()
    return [[
<Defaults>
  <Panel class="section" color="#1a1d22" outline="#252930" outlineSize="1 1"/>
  <Text class="heading" color="#eceef3" fontSize="17" fontStyle="bold" alignment="MiddleLeft"/>
  <Text class="label" color="#8892a4" fontSize="13" alignment="MiddleLeft"/>
  <Toggle class="pill" colors="#1a1d22|#252930|#3b82f6|#131518" textColor="#8892a4" fontSize="16"/>
</Defaults>

<Panel id="solisSetupPanel" position="0 260 0" width="760" height="700"
       color="#0c0d0fee" outline="#252930" outlineSize="2 2"
       allowDragging="true" returnToOriginalPositionWhenReleased="false">

  <VerticalLayout padding="0 0 0 0" spacing="0">

    <!-- cabeçalho -->
    <Panel color="#131518" height="86" outline="#252930" outlineSize="0 1">
      <VerticalLayout padding="24 24 14 14" spacing="2">
        <Text text="SOLIS" fontSize="30" fontStyle="bold" color="#eceef3" alignment="MiddleLeft" height="36"/>
        <Text text="Configuração de mesa" fontSize="14" color="#4a5168" alignment="MiddleLeft" height="20"/>
      </VerticalLayout>
      <Button id="closePanelButton" text="✕" onClick="onCloseClick"
              position="350 0 0" width="40" height="40"
              color="#00000000" textColor="#4a5168" fontSize="20"/>
    </Panel>

    <VerticalLayout padding="28 28 20 20" spacing="22">

      <!-- jogadores -->
      <VerticalLayout spacing="10">
        <Text class="heading" text="Jogadores" height="22"/>
        <HorizontalLayout spacing="8" height="56">
          <ToggleGroup id="playersGroup">
            <Toggle class="pill" id="players_1" text="1" onValueChanged="onPlayersToggle"/>
            <Toggle class="pill" id="players_2" text="2" onValueChanged="onPlayersToggle"/>
            <Toggle class="pill" id="players_3" text="3" onValueChanged="onPlayersToggle"/>
            <Toggle class="pill" id="players_4" text="4" onValueChanged="onPlayersToggle"/>
            <Toggle class="pill" id="players_5" text="5" onValueChanged="onPlayersToggle" isOn="true"/>
          </ToggleGroup>
        </HorizontalLayout>
      </VerticalLayout>

      <!-- separador -->
      <Panel color="#1c1f26" height="1"/>

      <!-- idioma -->
      <VerticalLayout spacing="10">
        <Text class="heading" text="Idioma" height="22"/>
        <GridLayout cellSize="106 52" spacing="8 8" constraintCount="6" height="52">
          <ToggleGroup id="localeGroup">
            <Toggle class="pill" id="locale_pt" text="PT" onValueChanged="onLocaleToggle" isOn="true"/>
            <Toggle class="pill" id="locale_en" text="EN" onValueChanged="onLocaleToggle"/>
            <Toggle class="pill" id="locale_es" text="ES" onValueChanged="onLocaleToggle"/>
            <Toggle class="pill" id="locale_fr" text="FR" onValueChanged="onLocaleToggle"/>
            <Toggle class="pill" id="locale_de" text="DE" onValueChanged="onLocaleToggle"/>
            <Toggle class="pill" id="locale_zh" text="ZH" onValueChanged="onLocaleToggle"/>
          </ToggleGroup>
        </GridLayout>
      </VerticalLayout>

      <Panel color="#1c1f26" height="1"/>

      <!-- modo -->
      <VerticalLayout spacing="10">
        <Text class="heading" text="Modo de setup" height="22"/>
        <HorizontalLayout spacing="8" height="56">
          <ToggleGroup id="modeGroup">
            <Toggle class="pill" id="mode_auto"   text="Automático" onValueChanged="onModeToggle" isOn="true"/>
            <Toggle class="pill" id="mode_manual" text="Manual"     onValueChanged="onModeToggle"/>
          </ToggleGroup>
        </HorizontalLayout>
        <Text class="label" text="Automático: entrega os decks direto aos jogadores sentados. Manual: empilha tudo fora da mesa." height="34"/>
      </VerticalLayout>

      <!-- status -->
      <Text id="setupStatusText" text="" fontSize="14" color="#f59e0b" height="24" alignment="MiddleCenter"/>

      <!-- ação -->
      <Button id="startSetupButton" text="INICIAR SETUP" onClick="onStartSetupClick"
              height="58" fontSize="20" fontStyle="bold"
              colors="#3b82f6|#2563eb|#1d4ed8|#1a1d22" textColor="#ffffff"/>

    </VerticalLayout>
  </VerticalLayout>
</Panel>

<!-- botão discreto para reabrir o painel depois de fechado -->
<Button id="reopenPanelButton" text="⚙ Configurar Mesa" onClick="onReopenClick"
        position="0 -430 0" width="220" height="46"
        color="#131518" textColor="#8892a4" fontSize="15" active="false"/>
]]
end

-- ── handlers dos toggles — travados para não-host ────────────
-- Não-host consegue ver e clicar no painel, mas qualquer ação
-- é revertida e ignorada. Não há como TTS desabilitar visualmente
-- um painel global só para alguns jogadores (é compartilhado),
-- então a trava real acontece aqui no código.

function onPlayersToggle(playerColor, value, id)
    if not isHost(playerColor) then
        Global.UI.setAttribute(id, "isOn", tostring(value ~= "True"))
        return
    end
    if value ~= "True" then return end
    setupState.players = tonumber(id:match("players_(%d)"))
end

function onLocaleToggle(playerColor, value, id)
    if not isHost(playerColor) then
        Global.UI.setAttribute(id, "isOn", tostring(value ~= "True"))
        return
    end
    if value ~= "True" then return end
    setupState.locale = id:match("locale_(%a+)")
end

function onModeToggle(playerColor, value, id)
    if not isHost(playerColor) then
        Global.UI.setAttribute(id, "isOn", tostring(value ~= "True"))
        return
    end
    if value ~= "True" then return end
    setupState.mode = id:match("mode_(%a+)")
end

-- ── abrir/fechar painel ──────────────────────────────────────

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
