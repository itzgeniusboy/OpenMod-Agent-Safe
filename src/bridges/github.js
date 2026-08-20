import { runCommand } from './termux.js';
import chalk from 'chalk';

export async function cloneRepo(url, logCallback = console.log) {
    logCallback(chalk.cyan(`[GitHub] Cloning ${url}...`));
    try {
        await runCommand('gh', ['repo', 'clone', url], process.cwd(), logCallback);
        return `Successfully cloned ${url}`;
    } catch (error) {
        throw new Error(`Clone failed: ${error.message}`);
    }
}

export async function commitChanges(message, logCallback = console.log) {
    logCallback(chalk.cyan(`[GitHub] Committing changes: "${message}"`));
    try {
        await runCommand('git', ['add', '.'], process.cwd(), logCallback);
        await runCommand('git', ['commit', '-m', `"${message}"`], process.cwd(), logCallback);
        return 'Successfully committed changes.';
    } catch (error) {
        throw new Error(`Commit failed: ${error.message}`);
    }
}

export async function pushBranch(branch = 'main', logCallback = console.log) {
    logCallback(chalk.cyan(`[GitHub] Pushing to branch ${branch}...`));
    try {
        await runCommand('git', ['push', 'origin', branch], process.cwd(), logCallback);
        return `Successfully pushed to ${branch}.`;
    } catch (error) {
        throw new Error(`Push failed: ${error.message}`);
    }
}

export async function createPR(title, body, logCallback = console.log) {
    logCallback(chalk.cyan(`[GitHub] Creating PR: "${title}"`));
    try {
        await runCommand('gh', ['pr', 'create', '--title', `"${title}"`, '--body', `"${body}"`], process.cwd(), logCallback);
        return 'Successfully created Pull Request.';
    } catch (error) {
        throw new Error(`PR creation failed: ${error.message}`);
    }
}
