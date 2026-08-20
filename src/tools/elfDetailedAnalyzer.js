import { execSync } from 'child_process';
import fs from 'fs';

export function analyzeELFDetailed(elfPath) {
    if (!fs.existsSync(elfPath)) {
        throw new Error(`ELF file not found: ${elfPath}`);
    }

    console.log(`[ELF Analyzer] Starting detailed offline analysis for ${elfPath}...`);
    const report = {
        file: elfPath,
        timestamp: new Date().toISOString(),
        sections: [],
        exported_functions: [],
        vtable_heuristics: [],
        arm64_instructions: []
    };

    try {
        // 1. Sections
        const sectionsOut = execSync(`readelf -S "${elfPath}" 2>/dev/null || true`).toString();
        const sectionLines = sectionsOut.split('\n');
        for (const line of sectionLines) {
            if (line.includes(' .text ') || line.includes(' .rodata ') || line.includes(' .data ')) {
                report.sections.push(line.trim());
            }
        }

        // 2. Exported Functions (Symbols)
        const symbolsOut = execSync(`readelf -s "${elfPath}" 2>/dev/null || true`).toString();
        const symLines = symbolsOut.split('\n');
        let funcCount = 0;
        for (const line of symLines) {
            if (line.includes(' FUNC ') && line.includes(' GLOBAL ') && !line.includes(' UND ')) {
                if (funcCount < 50) { // Limit to 50 for report size
                    const parts = line.trim().split(/\s+/);
                    if (parts.length >= 8) {
                        report.exported_functions.push({
                            value: parts[1],
                            size: parts[2],
                            name: parts[7]
                        });
                    }
                }
                funcCount++;
            }
        }
        report.total_exported_functions = funcCount;

        // 3. VTable Heuristics (Looking for _ZTV symbols - C++ vtables)
        let vtableCount = 0;
        for (const line of symLines) {
            if (line.includes(' OBJECT ') && line.includes('_ZTV')) {
                if (vtableCount < 20) {
                    const parts = line.trim().split(/\s+/);
                    if (parts.length >= 8) {
                        report.vtable_heuristics.push({
                            value: parts[1],
                            name: parts[7]
                        });
                    }
                }
                vtableCount++;
            }
        }
        report.total_vtables_found = vtableCount;

        // 4. ARM64 Disassembly Sample (just the first 100 instructions of .text)
        try {
            const disasmOut = execSync(`objdump -d -j .text "${elfPath}" | head -n 100 2>/dev/null || true`).toString();
            report.arm64_instructions = disasmOut.split('\n').filter(l => l.trim().length > 0);
        } catch (e) {
            report.arm64_instructions = ["Disassembly not available or objdump failed."];
        }

        const outPath = `detailed_elf_report.json`;
        fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
        console.log(`[ELF Analyzer] Analysis complete. Report saved to ${outPath}`);
        return `Detailed ELF report generated at ${outPath}`;

    } catch (error) {
        throw new Error(`Detailed ELF analysis failed: ${error.message}`);
    }
}
