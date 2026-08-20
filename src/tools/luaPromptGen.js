import { callLLM } from '../llm.js';
import { writeFile } from './file.js';
import { runCommand } from '../bridges/termux.js';
import chalk from 'chalk';

export async function generateAndTestLua(promptText, outputFilePath, logCallback = console.log) {
    try {
        logCallback(chalk.cyan(`[Lua Generator] Requesting AI to generate Lua script for: "${promptText}"`));
        
        const llmPrompt = `
        You are a Lua expert. The user wants a Lua script based on this request: "${promptText}"
        Write ONLY valid Lua code. Do not include markdown blocks, explanations, or any other text.
        The code should be safe and executable by a standard Lua interpreter.
        `;

        let luaCode = await callLLM(llmPrompt, logCallback);
        
        // Clean up markdown if LLM still outputs it
        luaCode = luaCode.replace(/```lua/g, '').replace(/```/g, '').trim();
        
        logCallback(chalk.cyan(`[Lua Generator] Saving script to ${outputFilePath}...`));
        await writeFile(outputFilePath, luaCode);
        
        logCallback(chalk.cyan(`[Lua Generator] Attempting to test script locally...`));
        try {
            const output = await runCommand('lua', [outputFilePath], process.cwd(), logCallback);
            return `[Lua Generator Success] Script saved to ${outputFilePath}.\\n\\nTest Output:\\n${output}`;
        } catch (execError) {
            logCallback(chalk.yellow(`[Lua Generator] Local test failed or Lua is not installed.`));
            return `[Lua Generator Warning] Script saved to ${outputFilePath}, but could not be tested locally.\\nEnsure 'lua' is installed (pkg install lua).\\nError: ${execError.message}`;
        }

    } catch (error) {
        throw new Error(`Lua Prompt Generation failed: ${error.message}`);
    }
}
