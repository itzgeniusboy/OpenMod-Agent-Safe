import { runCommand } from '../bridges/termux.js';
import fs from 'fs/promises';

export async function analyzeElf(soPath, logCallback = console.log) {
    try {
        logCallback(`[ELF Analyzer] Starting offline static analysis on ${soPath}...`);
        
        // Ensure file exists
        await fs.access(soPath);

        // 1. Get exports using readelf
        logCallback(`[ELF Analyzer] Extracting exported symbols...`);
        const readelfOutput = await runCommand('readelf', ['-s', soPath], process.cwd(), logCallback);
        const lines = readelfOutput.split('\\n');
        
        const exports = [];
        for (const line of lines) {
            if (line.includes('FUNC') && line.includes('GLOBAL')) {
                const parts = line.trim().split(/\\s+/);
                if (parts.length >= 8) {
                    exports.push({
                        offset: parts[1],
                        size: parts[2],
                        name: parts[7]
                    });
                }
            }
        }

        // 2. Get sections
        logCallback(`[ELF Analyzer] Extracting section headers...`);
        const sectionsOutput = await runCommand('readelf', ['-S', soPath], process.cwd(), logCallback);
        const sectionLines = sectionsOutput.split('\\n');
        const sections = [];
        for (const line of sectionLines) {
            if (line.includes('] .')) {
                const parts = line.trim().split(/\\s+/);
                sections.push({
                    name: parts[1] || parts[2],
                    type: parts[2] || parts[3],
                    address: parts[3] || parts[4],
                    offset: parts[4] || parts[5]
                });
            }
        }

        // 3. Search for common ARM64 patterns (Offline only)
        // e.g., ADRP instructions commonly used for global pointers
        logCallback(`[ELF Analyzer] Scanning for common ARM64 global pointer patterns...`);
        const objdumpOutput = await runCommand('objdump', ['-d', soPath], process.cwd(), logCallback);
        const objLines = objdumpOutput.split('\\n');
        
        const adrpMatches = [];
        let matchCount = 0;
        for (const line of objLines) {
            if (line.includes('adrp') && matchCount < 20) { // Limit to first 20 for brevity
                adrpMatches.push(line.trim());
                matchCount++;
            }
        }

        const report = {
            targetFile: soPath,
            timestamp: new Date().toISOString(),
            summary: {
                totalExportsFound: exports.length,
                totalSectionsFound: sections.length,
            },
            sampleExports: exports.slice(0, 10), // Only show first 10
            sections: sections,
            sampleAdrpInstructions: adrpMatches
        };

        const reportPath = `${soPath}_analysis.json`;
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');
        
        logCallback(`[ELF Analyzer] Analysis complete. Saved to ${reportPath}`);
        return `Offline ELF Analysis generated successfully at ${reportPath}`;

    } catch (error) {
        throw new Error(`ELF Analysis failed: ${error.message}`);
    }
}
