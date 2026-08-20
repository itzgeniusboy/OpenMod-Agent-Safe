import fs from 'fs/promises';
import chalk from 'chalk';

export async function dumpStrings(soPath, outputJson, logCallback = console.log) {
    try {
        logCallback(chalk.cyan(`[String Dumper] Parsing ELF and dumping .rodata strings from ${soPath}...`));
        
        const fd = await fs.open(soPath, 'r');
        const stats = await fd.stat();
        const fileSize = stats.size;
        
        // To avoid memory exhaustion on massive .so files, we chunk read
        const chunkSize = 1024 * 1024 * 10; // 10MB chunks
        const classes = new Set();
        const functions = new Set();
        
        // Regex for UE4 naming conventions
        const classRegex = /(U[A-Z][a-zA-Z0-9_]+|A[A-Z][a-zA-Z0-9_]+|F[A-Z][a-zA-Z0-9_]+)/g;

        logCallback(chalk.cyan(`[String Dumper] Scanning chunks...`));
        
        let position = 0;
        let leftover = Buffer.alloc(0);

        while (position < fileSize) {
            const sizeToRead = Math.min(chunkSize, fileSize - position);
            const buf = Buffer.alloc(sizeToRead);
            await fd.read(buf, 0, sizeToRead, position);
            
            const combined = Buffer.concat([leftover, buf]);
            let lastNull = 0;
            
            for (let i = 0; i < combined.length; i++) {
                if (combined[i] === 0) {
                    if (i - lastNull > 3) {
                        const str = combined.subarray(lastNull, i).toString('ascii');
                        if (/^[a-zA-Z0-9_]+$/.test(str)) {
                            const matches = str.match(classRegex);
                            if (matches) {
                                matches.forEach(m => classes.add(m));
                            }
                        }
                    }
                    lastNull = i + 1;
                }
            }
            
            leftover = combined.subarray(lastNull);
            position += sizeToRead;
        }
        
        await fd.close();

        const report = {
            metadata: {
                file: soPath,
                timestamp: new Date().toISOString()
            },
            classes: Array.from(classes).sort()
        };

        await fs.writeFile(outputJson, JSON.stringify(report, null, 2));
        logCallback(chalk.green(`[String Dumper] Successfully extracted ${classes.size} class names to ${outputJson}`));
        
        return `String dump complete. Extracted ${classes.size} class names. Saved to ${outputJson}`;

    } catch (error) {
        throw new Error(`String dump failed: ${error.message}`);
    }
}
