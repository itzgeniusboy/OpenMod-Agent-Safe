import { runCommand } from '../bridges/termux.js';
import { readFile, writeFile } from './file.js';
import chalk from 'chalk';
import path from 'path';

export async function autoBuild(sourceDir, mainFile, customCmd = null, logCallback = console.log) {
    const buildCmd = customCmd || `clang++ ${mainFile} -o ${path.basename(mainFile, '.cpp')}.out`;
    const maxRetries = 5;
    let retries = 0;
    
    while (retries < maxRetries) {
        try {
            logCallback(chalk.cyan(`[Build] Attempt ${retries + 1}: Executing "${buildCmd}" in ${sourceDir}`));
            const output = await runCommand(buildCmd, [], sourceDir, logCallback);
            return `Compilation successful on attempt ${retries + 1}.`;
        } catch (error) {
            retries++;
            const errorLog = error.message;
            logCallback(chalk.yellow(`[Build] Compilation failed. Parsing error log...`));
            
            if (retries >= maxRetries) {
                throw new Error(`Build failed after ${maxRetries} attempts. Final Log:\\n${errorLog}`);
            }

            // Parse clang/gcc error format: "filename:line:column: error: message"
            const errorRegex = /([^:]+\\.(?:cpp|c|h|hpp)):(\\d+):\\d+:\\s*error:\\s*(.*)/g;
            let match;
            let fixedSomething = false;

            while ((match = errorRegex.exec(errorLog)) !== null) {
                const file = path.resolve(sourceDir, match[1]);
                const line = parseInt(match[2], 10);
                const msg = match[3];

                logCallback(chalk.blue(`[Auto-Fix] Detected error in ${match[1]} at line ${line}: ${msg}`));

                try {
                    const content = await readFile(file);
                    const lines = content.split('\\n');
                    
                    if (line > 0 && line <= lines.length) {
                        // Basic auto-fix: Missing semicolon
                        if (msg.includes("expected ';'") || msg.includes("expected ';' after expression")) {
                            lines[line - 1] = lines[line - 1] + ';';
                            await writeFile(file, lines.join('\\n'));
                            logCallback(chalk.green(`[Auto-Fix] Fixed missing semicolon in ${match[1]}`));
                            fixedSomething = true;
                        }
                        // Basic auto-fix: Missing include for standard types (example)
                        else if (msg.includes("use of undeclared identifier 'std'")) {
                            lines.unshift('#include <iostream>');
                            await writeFile(file, lines.join('\\n'));
                            logCallback(chalk.green(`[Auto-Fix] Added #include <iostream> to ${match[1]}`));
                            fixedSomething = true;
                        }
                    }
                } catch (fixErr) {
                    logCallback(chalk.red(`[Auto-Fix] Failed to apply fix: ${fixErr.message}`));
                }
            }

            if (!fixedSomething) {
                logCallback(chalk.red(`[Build] Could not auto-resolve errors. Retrying...`));
            }
            
            await new Promise(res => setTimeout(res, 1000));
        }
    }
}
