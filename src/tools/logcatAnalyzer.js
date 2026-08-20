import { spawn } from 'child_process';
import fs from 'fs';

export function analyzeLogcat(durationSeconds = 5, filterKeyword = "CRASH") {
    console.log(`[Logcat Analyzer] Capturing logs for ${durationSeconds} seconds...`);
    
    return new Promise((resolve, reject) => {
        const logFile = `crash_analysis_${Date.now()}.txt`;
        const logcat = spawn('logcat', ['-d']); // -d dumps and exits, but in Termux it might just dump current buffer
        
        let logData = "";
        
        logcat.stdout.on('data', (data) => {
            logData += data.toString();
        });
        
        logcat.stderr.on('data', (data) => {
            console.error(`[Logcat Error] ${data}`);
        });
        
        logcat.on('close', (code) => {
            console.log(`[Logcat Analyzer] Dump complete. Filtering for '${filterKeyword}'...`);
            const lines = logData.split('\n');
            const filtered = lines.filter(line => 
                line.toLowerCase().includes(filterKeyword.toLowerCase()) || 
                line.includes('Fatal signal') ||
                line.includes('DEBUG')
            );
            
            const report = `=== Logcat Crash Analysis ===\nTotal lines captured: ${lines.length}\nFiltered lines: ${filtered.length}\n\n` + filtered.join('\n');
            fs.writeFileSync(logFile, report);
            
            resolve(`Logcat analysis saved to ${logFile}`);
        });
        
        // Failsafe timeout
        setTimeout(() => {
            logcat.kill();
        }, durationSeconds * 1000);
    });
}
