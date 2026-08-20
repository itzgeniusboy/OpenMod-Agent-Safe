import { exec } from 'child_process';
import chalk from 'chalk';
import readline from 'readline';

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

function runExec(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(stderr || error.message));
            } else {
                resolve(stdout);
            }
        });
    });
}

export async function signAndInstall(apkPath, keystorePath, logCallback = console.log) {
    try {
        logCallback(chalk.cyan(`[APK Dev] Preparing to sign and install ${apkPath}...`));
        
        const approved = await askConfirmation(`Are you sure you want to sign and install ${apkPath}?`);
        if (!approved) {
            logCallback(chalk.red(`[APK Dev] Operation cancelled by user.`));
            return "APK deployment cancelled.";
        }
        
        logCallback(chalk.cyan(`[APK Dev] Checking for apksigner...`));
        try {
            await runExec('apksigner --version');
        } catch (e) {
            throw new Error("apksigner is not installed. Please run: pkg install apksigner");
        }
        
        logCallback(chalk.cyan(`[APK Dev] Signing APK...`));
        // Assuming default keystore password for educational automation. 
        // In a real scenario, you'd prompt for it.
        const signCmd = `apksigner sign --ks ${keystorePath} --ks-pass pass:android ${apkPath}`;
        await runExec(signCmd);
        logCallback(chalk.green(`[APK Dev] APK signed successfully.`));
        
        logCallback(chalk.cyan(`[APK Dev] Installing APK via pm install...`));
        // Using pm install for Termux environment
        const installCmd = `pm install -r ${apkPath}`;
        await runExec(installCmd);
        
        logCallback(chalk.green(`[APK Dev] APK installed successfully.`));
        return "APK signed and installed successfully.";
        
    } catch (error) {
        throw new Error(`APK deployment failed: ${error.message}`);
    }
}
