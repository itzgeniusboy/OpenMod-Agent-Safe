import { autoBuild } from './build.js';
import chalk from 'chalk';
import path from 'path';

export async function buildArm64(sourceDir, mainFile, logCallback = console.log) {
    logCallback(chalk.cyan(`[Build Wrapper] Preparing ARM64 Android build for ${mainFile}...`));
    
    const outName = path.basename(mainFile, '.cpp');
    const customCmd = `clang++ -std=c++17 ${mainFile} -o ${outName}.out -lm`;
    
    logCallback(chalk.cyan(`[Build Wrapper] Command: ${customCmd}`));
    
    // Note: The LLM fallback loop is handled by smartFix.js (fullFixLoop),
    // which calls this buildArm64 function and catches errors.
    return await autoBuild(sourceDir, mainFile, customCmd, logCallback);
}
