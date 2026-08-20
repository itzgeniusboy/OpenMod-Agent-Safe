import fs from 'fs/promises';
import chalk from 'chalk';
import readline from 'readline';
import { callLLM } from '../llm.js';
import { buildArm64 } from './buildWrapper.js';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askConfirmation(query) {
    return new Promise(resolve => {
        rl.question(chalk.yellow(query + ' (y/n): '), answer => {
            resolve(answer.toLowerCase() === 'y');
        });
    });
}

export async function fixWithLLM(filePath, errorLog, logCallback = console.log) {
    try {
        logCallback(chalk.cyan(`[SmartFix] Analyzing compiler error with LLM for ${filePath}...`));
        const sourceCode = await fs.readFile(filePath, 'utf-8');
        
        let promptTemplate = await fs.readFile('templates/prompts/fix_prompt.txt', 'utf-8').catch(() => 
            "Fix this C++ error and return full code. Do not add cheat-specific logic."
        );
        
        const fullPrompt = `${promptTemplate}\n\nSource:\n${sourceCode}\n\nError:\n${errorLog}\n\nReturn ONLY the corrected code.`;
        
        const correctedCode = await callLLM(fullPrompt, logCallback);
        
        // Clean up markdown code blocks if LLM adds them
        const cleanCode = correctedCode.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '');
        
        logCallback(chalk.cyan(`[SmartFix] LLM generated a fix. Requesting user confirmation...`));
        const approved = await askConfirmation(`LLM suggests changes to ${filePath}. Apply fix?`);
        
        if (approved) {
            await fs.writeFile(filePath, cleanCode);
            logCallback(chalk.green(`[SmartFix] Fix applied to ${filePath}`));
            return true;
        } else {
            logCallback(chalk.red(`[SmartFix] Fix rejected by user.`));
            return false;
        }
    } catch (error) {
        logCallback(chalk.red(`[SmartFix] LLM fix failed: ${error.message}`));
        return false;
    }
}

export async function applyCustomChange(filePath, changeDescription, logCallback = console.log) {
    try {
        logCallback(chalk.cyan(`[SmartFix] Applying custom change: ${changeDescription}`));
        const sourceCode = await fs.readFile(filePath, 'utf-8');
        
        let promptTemplate = await fs.readFile('templates/prompts/change_prompt.txt', 'utf-8').catch(() => 
            "Apply this change and return full code."
        );
        
        const fullPrompt = `${promptTemplate}\n\nChange: ${changeDescription}\n\nSource:\n${sourceCode}\n\nReturn ONLY the modified code.`;
        
        const modifiedCode = await callLLM(fullPrompt, logCallback);
        const cleanCode = modifiedCode.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '');
        
        const approved = await askConfirmation(`LLM generated changes for: "${changeDescription}". Apply?`);
        
        if (approved) {
            await fs.writeFile(filePath, cleanCode);
            logCallback(chalk.green(`[SmartFix] Custom change applied.`));
            return `Change applied to ${filePath}`;
        } else {
            logCallback(chalk.red(`[SmartFix] Change rejected by user.`));
            return `Change rejected.`;
        }
    } catch (error) {
        throw new Error(`Failed to apply custom change: ${error.message}`);
    }
}

export async function fullFixLoop(dir, file, logCallback = console.log) {
    let attempts = 0;
    const maxAttempts = 5;
    const filePath = `${dir}/${file}`;
    
    logCallback(chalk.cyan(`[SmartFix] Starting full fix loop for ${filePath}`));
    
    while (attempts < maxAttempts) {
        attempts++;
        logCallback(chalk.cyan(`[SmartFix] Build Attempt ${attempts}/${maxAttempts}...`));
        
        try {
            const buildResult = await buildArm64(dir, file, logCallback);
            logCallback(chalk.green(`[SmartFix] Build succeeded on attempt ${attempts}!`));
            return `Build successful after ${attempts} attempts.`;
        } catch (error) {
            logCallback(chalk.yellow(`[SmartFix] Build failed. Triggering LLM fix...`));
            const fixed = await fixWithLLM(filePath, error.message, logCallback);
            if (!fixed) {
                return `Build loop aborted by user or LLM failure on attempt ${attempts}.`;
            }
        }
    }
    
    return `Build failed after ${maxAttempts} attempts. Please fix manually.`;
}
