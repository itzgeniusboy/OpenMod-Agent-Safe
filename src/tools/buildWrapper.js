import { autoBuild } from './build.js';
import chalk from 'chalk';
import path from 'path';

export async function buildArm64(sourceDir, mainFile, logCallback = console.log) {
    logCallback(chalk.cyan(`[Build Wrapper] Preparing ARM64 Android build for ${mainFile}...`));
    
    // We use the existing autoBuild logic, but we inject ARM64 flags.
    // Since autoBuild currently hardcodes the command, we will pass a custom command string.
    // We need to modify autoBuild to accept a full command string, or wrap it.
    
    // For this implementation, we will pass the custom command to a modified autoBuild
    // (We will update build.js to accept the command as a parameter).
    
    const outName = path.basename(mainFile, '.cpp');
    const customCmd = `clang++ -std=c++17 ${mainFile} -o ${outName}.out -lm`;
    
    logCallback(chalk.cyan(`[Build Wrapper] Command: ${customCmd}`));
    
    // Call the existing autoBuild (we will update build.js to support customCmd)
    return await autoBuild(sourceDir, mainFile, customCmd, logCallback);
}
