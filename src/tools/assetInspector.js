import { runCommand } from '../bridges/termux.js';
import fs from 'fs/promises';

export async function inspectPak(pakPath, logCallback = console.log) {
    try {
        logCallback(`[Asset Inspector] Inspecting PAK header and tree for ${pakPath}...`);
        
        // Ensure file exists
        await fs.access(pakPath);

        // Check if 7zz is installed
        let use7zz = false;
        try {
            await runCommand('which', ['7zz'], process.cwd(), () => {});
            use7zz = true;
        } catch (e) {
            logCallback(`[Asset Inspector] 7zz not found. Falling back to basic file stat inspection.`);
        }

        let report = `=== PAK Inspection Report for ${pakPath} ===\\n`;
        report += `Timestamp: ${new Date().toISOString()}\\n\\n`;

        if (use7zz) {
            logCallback(`[Asset Inspector] Using 7zz to list contents...`);
            // Use 7zz l to LIST contents, NOT extract
            const listOutput = await runCommand('7zz', ['l', pakPath], process.cwd(), logCallback);
            
            // Extract file names and sizes
            const lines = listOutput.split('\\n');
            let isListing = false;
            let fileCount = 0;
            
            for (const line of lines) {
                if (line.includes('-------------------')) {
                    isListing = !isListing;
                    continue;
                }
                if (isListing && line.trim() !== '') {
                    // Typical 7zz output: Date Time Attr Size Compressed Name
                    const parts = line.trim().split(/\\s+/);
                    if (parts.length >= 6) {
                        const name = parts.slice(5).join(' ');
                        const size = parts[3];
                        report += `File: ${name} | Size: ${size} bytes\\n`;
                        fileCount++;
                    }
                }
            }
            report += `\\nTotal files inspected: ${fileCount}\\n`;
        } else {
            // Fallback: Just show file size and simulated header info
            const stats = await fs.stat(pakPath);
            report += `File Size: ${stats.size} bytes\\n`;
            report += `Status: Encrypted/Compressed chunk (Detailed listing requires 7zz)\\n`;
            report += `Note: Install p7zip in Termux for detailed tree inspection.\\n`;
        }

        const reportPath = `${pakPath}_inspector.txt`;
        await fs.writeFile(reportPath, report, 'utf-8');
        
        logCallback(`[Asset Inspector] Inspection complete. Saved to ${reportPath}`);
        return `PAK Inspection report generated successfully at ${reportPath}`;

    } catch (error) {
        throw new Error(`PAK Inspection failed: ${error.message}`);
    }
}
