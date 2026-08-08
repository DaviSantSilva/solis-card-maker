-- ============================================================
-- Solis — Script Global
-- Cole este conteúdo no Global Script da partida (Objects → Scripting → Global).
--
-- Centraliza todas as posições da mesa e o mapeamento corp↔cor.
-- Outros objetos acessam via Global.call("nomeDaFuncao", args).
-- ============================================================

CORP_COLOR = {
    tabajara = "Red",
    zenite   = "White",
    atomic   = "Green",
    atto     = "Blue",
    core     = "Purple",
}

-- mapeamento inverso: cor → corp
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
            { x = -9.11, y = 1.69, z = -13.28 }, -- 1
            { x = -5.65, y = 1.69, z = -13.18 }, -- 2
            { x = -2.37, y = 1.69, z = -13.12 }, -- 3
            { x = 0.91,  y = 1.69, z = -13.15 }, -- 4
            { x = 4.23,  y = 1.69, z = -13.25 }, -- 5
            { x = 7.58,  y = 1.69, z = -13.25 }, -- 6
        },
    },
}

-- ── funções expostas via Global.call() ──────────────────────

function getCorpForColor(color)
    return COLOR_CORP[color]
end

function getColorForCorp(corp)
    return CORP_COLOR[corp]
end

function getCorpPositions(corp)
    return POSITIONS.corp[corp]
end

function getMarketPositions()
    return POSITIONS.market
end

function getAllCorpIds()
    local ids = {}
    for corp, _ in pairs(CORP_COLOR) do table.insert(ids, corp) end
    return ids
end
