import fs from 'fs/promises';
import chalk from 'chalk';
import path from 'path';
import { callLLM } from '../llm.js';

export async function analyzeAndSuggest(filePath, logCallback = console.log) {
    try {
        logCallback(chalk.cyan(`[Code Analyzer] Running static bug analysis on ${filePath}...`));
        const sourceCode = await fs.readFile(filePath, 'utf-8');
        
        let promptTemplate = await fs.readFile('templates/prompts/analyze_prompt.txt', 'utf-8').catch(() => 
            "Find generic bugs (null checks, leaks, type errors) and suggest fixes. Output as JSON array of suggestions."
        );
        
        const fullPrompt = `${promptTemplate}\n\nSource:\n${sourceCode}\n\nReturn ONLY a JSON array of objects with keys: line, issue, suggestion.`;
        
        const llmResponse = await callLLM(fullPrompt, logCallback);
        
        // Extract JSON array
        const jsonMatch = llmResponse.match(/\[.*\]/s);
        let suggestions = [];
        if (jsonMatch) {
            suggestions = JSON.parse(jsonMatch[0]);
        } else {
            throw new Error("LLM did not return a valid JSON array.");
        }
        
        const report = {
            file: filePath,
            timestamp: new Date().toISOString(),
            suggestions: suggestions
        };
        
        const outPath = path.join(process.cwd(), 'audit_report.json');
        await fs.writeFile(outPath, JSON.stringify(report, null, 2));
        
        logCallback(chalk.green(`[Code Analyzer] Analysis complete. Found ${suggestions.length} potential issues. Saved to ${outPath}`));
        return `Code analysis complete. Report saved to ${outPath}`;
    } catch (error) {
        throw new Error(`Code analysis failed: ${error.message}`);
    }
}
