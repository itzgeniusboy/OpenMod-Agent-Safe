import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { runCommand } from '../bridges/termux.js';

export async function generateSDK(soPath, outputDir, logCallback = console.log) {
    try {
        logCallback(chalk.cyan(`[SDK Generator] Starting static analysis on ${soPath}...`));
        await fs.access(soPath);
        
        // Ensure output directory exists
        await fs.mkdir(outputDir, { recursive: true });

        // Parse ELF Header using Node.js Buffer (64-bit ELF)
        const fd = await fs.open(soPath, 'r');
        const headerBuf = Buffer.alloc(64);
        await fd.read(headerBuf, 0, 64, 0);
        
        // Magic number check
        if (headerBuf.readUInt32BE(0) !== 0x7F454C46) {
            await fd.close();
            throw new Error("Invalid ELF file magic number.");
        }

        // We use readelf as a robust fallback for symbol extraction, 
        // as parsing the entire ELF .symtab manually in pure JS is error-prone 
        // and often fails on stripped or packed Android .so files.
        logCallback(chalk.cyan(`[SDK Generator] Extracting symbols using readelf fallback...`));
        const readelfOutput = await runCommand('readelf', ['-s', soPath], process.cwd(), () => {});
        
        const symbols = [];
        const lines = readelfOutput.split('\\n');
        for (const line of lines) {
            if (line.includes('FUNC') || line.includes('OBJECT')) {
                const parts = line.trim().split(/\\s+/);
                if (parts.length >= 8) {
                    const offset = parts[1];
                    const name = parts[7];
                    if (name && offset && offset !== '0000000000000000') {
                        symbols.push({ name, offset });
                    }
                }
            }
        }
        await fd.close();

        logCallback(chalk.cyan(`[SDK Generator] Found ${symbols.length} symbols. Generating headers...`));

        // Generate UWorld.h
        let uworldContent = `#pragma once\n// Auto-generated UWorld Header\n\n`;
        const worldSym = symbols.find(s => s.name.includes('GWorld') || s.name.includes('UWorld'));
        uworldContent += `#define OFFSET_GWORLD 0x${worldSym ? worldSym.offset : '00000000'}\n`;
        await fs.writeFile(path.join(outputDir, 'UWorld.h'), uworldContent);

        // Generate AActor.h
        let aactorContent = `#pragma once\n// Auto-generated AActor Header\n\n`;
        const actorSym = symbols.find(s => s.name.includes('AActor'));
        aactorContent += `#define OFFSET_AACTOR 0x${actorSym ? actorSym.offset : '00000000'}\n`;
        await fs.writeFile(path.join(outputDir, 'AActor.h'), aactorContent);

        logCallback(chalk.green(`[SDK Generator] SDK headers generated successfully in ${outputDir}`));
        return `SDK generation complete. Headers saved to ${outputDir}`;

    } catch (error) {
        throw new Error(`SDK Generation failed: ${error.message}`);
    }
}
