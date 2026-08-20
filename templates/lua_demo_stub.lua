-- ========================================================================
-- MOCK LUA SCRIPT STUB
-- This file is generated for offline educational debugging purposes ONLY.
-- ========================================================================

print("--- Mock Lua Script Started ---")

local mock_player = {
    health = 100,
    ammo = 30,
    name = "Player1"
}

function printPlayerStatus(player)
    print("Player: " .. player.name .. " | Health: " .. player.health .. " | Ammo: " .. player.ammo)
end

printPlayerStatus(mock_player)
print("--- Script Finished ---")
