import { recursiveRead, readFile } from './file.js';
import { callLLM } from '../llm.js';
import path from 'path';

export async function summarizeFolder(dirPath, logCallback = console.log) {
    try {
        logCallback(`[Folder Summarizer] Scanning directory: ${dirPath}...`);
        
        const allFiles = await recursiveRead(dirPath);
        
        let luaCount = 0;
        let jsonCount = 0;
        let cppCount = 0;
        let otherCount = 0;
        
        let sampleContent = "";
        const maxSamples = 5;
        let sampledCount = 0;
        
        const interestingVars = new Set();

        for (const file of allFiles) {
            const ext = path.extname(file).toLowerCase();
            if (ext === '.lua') luaCount++;
            else if (ext === '.json') jsonCount++;
            else if (ext === '.cpp' || ext === '.h') cppCount++;
            else otherCount++;
            
            // Read some sample files for LLM analysis
            if ((ext === '.lua' || ext === '.json') && sampledCount < maxSamples) {
                try {
                    const content = await readFile(file);
                    // Basic regex to find interesting variables without executing
                    const varMatches = content.match(/(health|ammo|player|transform|world)/gi);
                    if (varMatches) {
                        varMatches.forEach(v => interestingVars.add(v.toLowerCase()));
                        sampleContent += `\n--- File: ${path.basename(file)} ---\n`;
                        // Take only first 200 chars to avoid blowing up LLM context
                        sampleContent += content.substring(0, 200) + '...\n';
                        sampledCount++;
                    }
                } catch (e) {
                    // ignore read errors on individual files
                }
            }
        }

        const varsArray = Array.from(interestingVars);
        const statsSummary = `Folder contains: ${luaCount} .lua files, ${jsonCount} .json files, ${cppCount} C++ files, and ${otherCount} other files.`;
        
        logCallback(`[Folder Summarizer] Stats: ${statsSummary}`);
        logCallback(`[Folder Summarizer] Requesting AI analysis on samples...`);

        const llmPrompt = `
        You are a technical assistant. I have scanned an unpacked game folder.
        ${statsSummary}
        
        I found these interesting variable keywords in the code: ${varsArray.length > 0 ? varsArray.join(', ') : 'None'}.
        
        Here is a small snippet of the files:
        ${sampleContent}
        
        Write a concise 2-sentence summary in Hindi/Hinglish of what this folder contains and what key variables were found. 
        Example format: "Maine 50 .lua files dekhi... aur inme health/ammo variables hain."
        `;

        const llmSummary = await callLLM(llmPrompt, logCallback);
        
        return `[Analysis Result]\n${statsSummary}\n\nAI Summary:\n${llmSummary}`;

    } catch (error) {
        throw new Error(`Folder summary failed: ${error.message}`);
    }
}
