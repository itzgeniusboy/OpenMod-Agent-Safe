import fs from 'fs/promises';
import path from 'path';
import { recursiveRead } from './file.js';

export async function generateLuaBindings(extractedDir, outputFilePath) {
    try {
        const allFiles = await recursiveRead(extractedDir);
        
        let luaContent = `-- Auto-Generated Lua Debug Hooks by OpenMod\n`;
        luaContent += `-- Generated at: ${new Date().toISOString()}\n\n`;
        luaContent += `local DebugBridge = {}\n\n`;

        const detectedEntities = new Set();
        
        for (const file of allFiles) {
            const name = path.basename(file, path.extname(file)).toLowerCase();
            if (name.includes('health')) detectedEntities.add('Health');
            if (name.includes('ammo') || name.includes('weapon')) detectedEntities.add('Ammo');
            if (name.includes('transform') || name.includes('world')) detectedEntities.add('Transform');
            if (name.includes('player') || name.includes('character')) detectedEntities.add('Player');
        }

        if (detectedEntities.size === 0) {
            luaContent += `-- No recognizable entities found in ${extractedDir}.\n`;
        }

        for (const entity of detectedEntities) {
            luaContent += `-- Debug Bindings for ${entity}\n`;
            luaContent += `function DebugBridge:Get${entity}()\n`;
            luaContent += `    -- [!] Insert native memory read logic here\n`;
            luaContent += `    return nil\n`;
            luaContent += `end\n\n`;
            
            luaContent += `function DebugBridge:Set${entity}(value)\n`;
            luaContent += `    -- [!] Insert native memory write logic here\n`;
            luaContent += `    print("[Debug] Set ${entity} to " .. tostring(value))\n`;
            luaContent += `end\n\n`;
        }

        luaContent += `return DebugBridge\n`;

        await fs.writeFile(outputFilePath, luaContent, 'utf-8');
        return `Successfully generated Lua debug script at ${outputFilePath}`;

    } catch (error) {
        throw new Error(`Lua Auto-Generation failed: ${error.message}`);
    }
}
