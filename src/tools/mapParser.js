import fs from 'fs';
import chalk from 'chalk';
import path from 'path';

export async function parseMaps(pid, logCallback = console.log) {
    try {
        logCallback(chalk.cyan(`[Map Parser] Reading /proc/${pid}/maps (Offline Mode)...`));
        
        const mapsPath = `/proc/${pid}/maps`;
        if (!fs.existsSync(mapsPath)) {
            throw new Error(`Cannot find ${mapsPath}. Are you sure the PID is correct and you have read permissions?`);
        }
        
        const content = fs.readFileSync(mapsPath, 'utf-8');
        const lines = content.split('\n');
        
        const regions = [];
        
        for (const line of lines) {
            if (!line.trim()) continue;
            
            // Format: address perms offset dev inode pathname
            // Example: 7f8c000000-7f8c001000 r-xp 00000000 08:01 12345 /path/to/lib.so
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 5) {
                const addressRange = parts[0];
                const perms = parts[1];
                const offset = parts[2];
                const pathname = parts.length > 5 ? parts.slice(5).join(' ') : '[anonymous]';
                
                regions.push({
                    addressRange,
                    permissions: perms,
                    offset,
                    pathname
                });
            }
        }
        
        const outPath = path.join(process.cwd(), `maps_${pid}.json`);
        fs.writeFileSync(outPath, JSON.stringify(regions, null, 2));
        
        logCallback(chalk.green(`[Map Parser] Successfully parsed ${regions.length} memory regions.`));
        logCallback(chalk.green(`[Map Parser] Report saved to ${outPath}`));
        
        return `Maps parsed successfully. Saved to ${outPath}`;
    } catch (error) {
        throw new Error(`Failed to parse maps: ${error.message}`);
    }
}
