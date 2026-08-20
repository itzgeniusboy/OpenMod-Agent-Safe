import chalk from 'chalk';
import readline from 'readline';
import ora from 'ora';
import { orchestrateTask } from './src/orchestrator.js';
import { startTelegramBot } from './src/bridges/telegram.js';

const asciiArt = `
${chalk.cyan('  ____                   __  __           _ ')}
${chalk.cyan(' / __ \\                 |  \\/  |         | |')}
${chalk.cyan('| |  | |_ __   ___ _ __ | \\  / | ___   __| |')}
${chalk.cyan('| |  | | \'_ \\ / _ \\ \'_ \\| |\\/| |/ _ \\ / _` |')}
${chalk.cyan('| |__| | |_) |  __/ | | | |  | | (_) | (_| |')}
${chalk.cyan(' \\____/| .__/ \\___|_| |_|_|  |_|\\___/ \\__,_|')}
${chalk.cyan('       | |                                  ')}
${chalk.cyan('       |_|                                  ')}
${chalk.blueBright('           v2.0 - Safe Offline Educational Edition')}
`;

console.log(asciiArt);

// Start Telegram Bot
startTelegramBot(orchestrateTask);

// Start Local CLI
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.cyan('➜ ') + chalk.blueBright('OpenMod > ')
});

rl.prompt();

rl.on('line', async (line) => {
    const input = line.trim();
    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
        console.log(chalk.cyan('OpenMod: System shutting down. Goodbye!'));
        process.exit(0);
    }
    
    if (input) {
        const spinner = ora({ text: chalk.cyan('Processing...'), spinner: 'dots' }).start();
        
        const logCallback = (logText) => {
            spinner.stop();
            console.log(chalk.gray(logText));
            spinner.start();
        };
        
        const result = await orchestrateTask(input, logCallback);
        spinner.succeed(chalk.green(`Workflow Result:\\n${result}`));
    }
    rl.prompt();
}).on('close', () => {
    console.log(chalk.cyan('\\nOpenMod: System shutting down. Goodbye!'));
    process.exit(0);
});
