import { runCommand } from '../bridges/termux.js';
import fs from 'fs/promises';

export async function getExports(soPath) {
    try {
        const output = await runCommand('readelf', ['-s', soPath]);
        const lines = output.split('\\n');
        const exports = [];
        
        for (const line of lines) {
            // Example readelf -s line: "   12: 0000000000123456    42 FUNC    GLOBAL DEFAULT   12 MyFunction"
            if (line.includes('FUNC') && line.includes('GLOBAL')) {
                const parts = line.trim().split(/\\s+/);
                if (parts.length >= 8) {
                    const offset = parts[1];
                    const name = parts[7];
                    exports.push({ name, offset });
                }
            }
        }
        return exports;
    } catch (error) {
        throw new Error(`Failed to get exports: ${error.message}`);
    }
}

export async function findPattern(soPath, assemblyPattern) {
    try {
        // Very basic objdump wrapper
        const output = await runCommand('objdump', ['-d', soPath]);
        const lines = output.split('\\n');
        const matches = [];
        
        for (const line of lines) {
            if (line.includes(assemblyPattern)) {
                matches.push(line.trim());
            }
        }
        return matches;
    } catch (error) {
        throw new Error(`Failed to find pattern: ${error.message}`);
    }
}

export async function generateOffsetsHeader(exportList, outputPath) {
    try {
        let header = `#pragma once\n\n// Auto-generated Offsets Header\n\n`;
        
        for (const exp of exportList) {
            // Clean up name for C++ macro
            const cleanName = exp.name.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();
            header += `#define OFFSET_${cleanName} 0x${exp.offset}\n`;
        }
        
        await fs.writeFile(outputPath, header, 'utf-8');
        return `Successfully generated offsets header at ${outputPath}`;
    } catch (error) {
        throw new Error(`Failed to generate offsets header: ${error.message}`);
    }
}
