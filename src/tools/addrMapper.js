import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { exec } from 'child_process';

function runExec(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(stderr || error.message));
            } else {
                resolve(stdout);
            }
        });
    });
}

export async function generateGenericELFReport(elfPath, outputJsonPath, logCallback = console.log) {
    try {
        logCallback(chalk.cyan(`[ELF Reporter] Generating generic symbol/offset report for ${elfPath}...`));
        
        if (!fs.existsSync(elfPath)) {
            throw new Error(`File not found: ${elfPath}`);
        }
        
        const report = {
            filename: path.basename(elfPath),
            architecture: "Unknown",
            symbols: []
        };
        
        // Try to get architecture using readelf -h
        try {
            const headerOutput = await runExec(`readelf -h ${elfPath}`);
            const machineMatch = headerOutput.match(/Machine:\s+(.+)/);
            if (machineMatch) {
                report.architecture = machineMatch[1].trim();
            }
        } catch (e) {
            logCallback(chalk.yellow(`[ELF Reporter] Could not read ELF header: ${e.message}`));
        }
        
        // Extract symbols using readelf -s
        logCallback(chalk.cyan(`[ELF Reporter] Extracting symbols using readelf...`));
        try {
            const symOutput = await runExec(`readelf -s ${elfPath}`);
            const lines = symOutput.split('\n');
            
            for (const line of lines) {
                // Example readelf line:
                // 123: 0000000001234560   100 FUNC    GLOBAL DEFAULT   12 MyFunction
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 8 && parts[3] === 'FUNC' || parts[3] === 'OBJECT') {
                    const value = parts[1]; // usually virtual address/offset in file
                    const size = parts[2];
                    const type = parts[3];
                    const name = parts.slice(7).join(' ');
                    
                    // Filter out empty or standard hidden symbols
                    if (name && !name.startsWith('$') && value !== '0000000000000000') {
                        report.symbols.push({
                            name: name,
                            type: type,
                            fileOffset: `0x${value}`,
                            size: parseInt(size, 10) || 0
                        });
                    }
                }
            }
        } catch (e) {
            logCallback(chalk.yellow(`[ELF Reporter] Failed to extract symbols: ${e.message}`));
        }
        
        const outDir = path.dirname(outputJsonPath);
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
        }
        
        fs.writeFileSync(outputJsonPath, JSON.stringify(report, null, 2));
        logCallback(chalk.green(`[ELF Reporter] Successfully extracted ${report.symbols.length} symbols.`));
        logCallback(chalk.green(`[ELF Reporter] Report saved to ${outputJsonPath}`));
        
        return `Generic ELF Report generated successfully at ${outputJsonPath}`;
    } catch (error) {
        throw new Error(`Failed to generate ELF report: ${error.message}`);
    }
}
