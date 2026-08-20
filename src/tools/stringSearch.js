import { runCommand } from '../bridges/termux.js';
import chalk from 'chalk';
import fs from 'fs/promises';

export async function searchStringsInBinary(filePath, keywordsArray, logCallback = console.log) {
    try {
        logCallback(chalk.cyan(`[String Search] Searching for keywords: [${keywordsArray.join(', ')}] in ${filePath}...`));
        
        // Ensure file exists
        await fs.access(filePath);

        let finalReport = `=== String Search Results for ${filePath} ===\n\n`;
        let totalMatches = 0;

        for (const keyword of keywordsArray) {
            logCallback(chalk.gray(`[String Search] Running: strings ${filePath} | grep -i ${keyword}`));
            try {
                // We use shell pipe here, so we run via sh -c
                const cmd = `strings ${filePath} | grep -i "${keyword}" | head -n 50`; 
                const output = await runCommand(cmd, [], process.cwd(), () => {}); // silence raw output stream
                
                const lines = output.split('\n').filter(l => l.trim().length > 0);
                finalReport += `--- Keyword: "${keyword}" (${lines.length} matches shown) ---\n`;
                
                if (lines.length === 0) {
                    finalReport += `No matches found.\n\n`;
                } else {
                    finalReport += lines.join('\n') + '\n\n';
                    totalMatches += lines.length;
                }
            } catch (grepError) {
                // grep returns exit code 1 if no matches are found, handle gracefully
                finalReport += `--- Keyword: "${keyword}" ---\nNo matches found.\n\n`;
            }
        }

        const reportPath = `${filePath}_strings.txt`;
        await fs.writeFile(reportPath, finalReport, 'utf-8');
        
        logCallback(chalk.green(`[String Search] Completed. Found ${totalMatches} sample matches. Saved to ${reportPath}`));
        return `String search complete. Results saved to ${reportPath}\n\nPreview:\n${finalReport.substring(0, 500)}...`;

    } catch (error) {
        throw new Error(`String search failed: ${error.message}`);
    }
}
