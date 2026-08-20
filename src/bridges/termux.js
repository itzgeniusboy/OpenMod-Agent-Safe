import { spawn } from 'child_process';
import chalk from 'chalk';

export async function runCommand(command, args = [], cwd = process.cwd(), logCallback = console.log) {
    return new Promise((resolve, reject) => {
        // Strict allowlist for safety - block destructive/unauthorized commands
        const unsafeCommands = ['rm -rf /', 'mkfs', 'su -c', 'dd if=/dev/zero'];
        const fullCmd = `${command} ${args.join(' ')}`;
        
        if (unsafeCommands.some(cmd => fullCmd.includes(cmd))) {
            return reject(new Error('Security Block: Unsafe command detected.'));
        }

        logCallback(chalk.gray(`[Termux] Executing: ${fullCmd} in ${cwd}`));
        
        const child = spawn(command, args, { shell: true, cwd });
        
        let output = '';
        let errorOutput = '';

        child.stdout.on('data', (data) => {
            const str = data.toString();
            output += str;
            process.stdout.write(chalk.green(str)); // Stream to terminal
        });

        child.stderr.on('data', (data) => {
            const str = data.toString();
            errorOutput += str;
            process.stdout.write(chalk.yellow(str)); // Stream to terminal
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve(output);
            } else {
                reject(new Error(`Command failed with code ${code}\\n${errorOutput}`));
            }
        });
        
        child.on('error', (err) => {
            reject(new Error(`Failed to start subprocess: ${err.message}`));
        });
    });
}
