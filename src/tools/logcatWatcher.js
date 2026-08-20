import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

export async function watchLogs(packageName, durationMs = 10000, logCallback = console.log) {
    return new Promise((resolve, reject) => {
        try {
            logCallback(chalk.cyan(`[Logcat Watcher] Starting log capture for package: ${packageName} for ${durationMs/1000} seconds...`));
            
            const logDir = path.join(process.cwd(), 'logs');
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const logFile = path.join(logDir, `crash_${timestamp}.txt`);
            const writeStream = fs.createWriteStream(logFile);

            const logcat = spawn('logcat', ['-v', 'time']);
            let matchedLines = 0;

            logcat.stdout.on('data', (data) => {
                const lines = data.toString().split('\\n');
                for (const line of lines) {
                    if (line.includes(packageName)) {
                        writeStream.write(line + '\\n');
                        matchedLines++;
                    }
                }
            });

            logcat.stderr.on('data', (data) => {
                // ignore logcat stderr
            });

            setTimeout(() => {
                logcat.kill('SIGINT');
                writeStream.end();
                logCallback(chalk.green(`[Logcat Watcher] Capture complete. Found ${matchedLines} matching lines. Saved to ${logFile}`));
                resolve(`Log capture complete. Saved to ${logFile}`);
            }, durationMs);

            logcat.on('error', (err) => {
                reject(new Error(`Failed to start logcat: ${err.message}`));
            });

        } catch (error) {
            reject(new Error(`Logcat Watcher failed: ${error.message}`));
        }
    });
}
