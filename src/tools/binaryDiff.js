import fs from 'fs/promises';
import chalk from 'chalk';
import path from 'path';

export async function compareBinaries(file1, file2, logCallback = console.log) {
    try {
        logCallback(chalk.cyan(`[Binary Diff] Comparing ${path.basename(file1)} and ${path.basename(file2)}...`));
        
        // Ensure both files exist
        await fs.access(file1);
        await fs.access(file2);

        const buf1 = await fs.readFile(file1);
        const buf2 = await fs.readFile(file2);

        let report = `=== Binary Diff Report ===\n`;
        report += `File 1: ${file1} (${buf1.length} bytes)\n`;
        report += `File 2: ${file2} (${buf2.length} bytes)\n\n`;

        if (buf1.length !== buf2.length) {
            report += `WARNING: File sizes are different! Diff might be massive due to shifting.\n\n`;
        }

        const minLen = Math.min(buf1.length, buf2.length);
        let diffCount = 0;
        const maxDiffsToReport = 100; // Limit to prevent giant files
        
        report += `Offset     | File 1 | File 2\n`;
        report += `-----------------------------\n`;

        for (let i = 0; i < minLen; i++) {
            if (buf1[i] !== buf2[i]) {
                diffCount++;
                if (diffCount <= maxDiffsToReport) {
                    const offsetHex = '0x' + i.toString(16).padStart(8, '0').toUpperCase();
                    const b1Hex = buf1[i].toString(16).padStart(2, '0').toUpperCase();
                    const b2Hex = buf2[i].toString(16).padStart(2, '0').toUpperCase();
                    report += `${offsetHex} |   ${b1Hex}   |   ${b2Hex}\n`;
                }
            }
        }

        if (diffCount > maxDiffsToReport) {
            report += `\n... and ${diffCount - maxDiffsToReport} more differences omitted for brevity.\n`;
        }

        report += `\nTotal differing bytes: ${diffCount}\n`;

        const reportPath = `./binary_diff_report.txt`;
        await fs.writeFile(reportPath, report, 'utf-8');
        
        logCallback(chalk.green(`[Binary Diff] Comparison complete. Found ${diffCount} differences.`));
        return `Binary diff complete. Found ${diffCount} differences. Report saved to ${reportPath}`;

    } catch (error) {
        throw new Error(`Binary diff failed: ${error.message}`);
    }
}
