import inquirer from 'inquirer';
import chalk from 'chalk';
import { orchestrateTask } from '../orchestrator.js';

export async function startMenu(logCallback = console.log) {
    let running = true;
    
    while (running) {
        console.clear();
        console.log(chalk.cyan(`
   ____                   __  __           _ 
  / __ \\_ __  ___  _ __  |  \\/  | ___   __| |
 | |  | | '_ \\ / _ \\| '_ \\ | |\\/| |/ _ \\ / _\` |
 | |__| | |_) |  __/| | | || |  | | (_) | (_| |
  \\____/| .__/ \\___||_| |_||_|  |_|\\___/ \\__,_|
        |_|  Safe Offline Educational Edition
        `));
        
        const { category } = await inquirer.prompt([
            {
                type: 'list',
                name: 'category',
                message: 'Select a tool category:',
                choices: [
                    'Analysis Tools (ELF, PAK, Maps)',
                    'Build Tools (Compile, Fix, Test)',
                    'Automation (Scheduler, Logs)',
                    'Reports (Generate HTML)',
                    'Exit'
                ]
            }
        ]);
        
        let action = null;
        
        if (category.includes('Analysis Tools')) {
            const { tool } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'tool',
                    message: 'Select Analysis Tool:',
                    choices: ['Generic ELF Symbol Report', 'Raw PAK Inspector', 'Parse Maps (JSON)', 'Back']
                }
            ]);
            
            if (tool.includes('ELF')) action = "ELF analyze kar";
            else if (tool.includes('PAK')) action = "PAK inspect kar";
            else if (tool.includes('Maps')) action = "Maps parse kar";
            
        } else if (category.includes('Build Tools')) {
            const { tool } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'tool',
                    message: 'Select Build Tool:',
                    choices: ['Source Fix (Auto Loop)', 'Code Analyze (Generic Bugs)', 'Mock Overlay Compile', 'Back']
                }
            ]);
            
            if (tool.includes('Source Fix')) action = "Source fix kar";
            else if (tool.includes('Code Analyze')) action = "Code analyze kar";
            else if (tool.includes('Mock Overlay')) action = "Mock overlay compile kar";
            
        } else if (category.includes('Automation')) {
            const { tool } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'tool',
                    message: 'Select Automation Tool:',
                    choices: ['Schedule Logcat Task', 'List Scheduled Tasks', 'Back']
                }
            ]);
            
            if (tool.includes('Schedule')) action = "Schedule set kar";
            else if (tool.includes('List')) {
                const { listTasks } = await import('./scheduler.js');
                await listTasks(logCallback);
                await inquirer.prompt([{ type: 'input', name: 'cont', message: 'Press Enter to continue...' }]);
            }
            
        } else if (category.includes('Reports')) {
            const { tool } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'tool',
                    message: 'Select Report Type:',
                    choices: ['Generate ELF HTML Dashboard', 'Generate PAK HTML Dashboard', 'Back']
                }
            ]);
            
            if (tool.includes('ELF')) action = "Report bana elf";
            else if (tool.includes('PAK')) action = "Report bana pak";
            
        } else if (category === 'Exit') {
            running = false;
            console.log(chalk.green('Exiting TUI Menu. Returning to standard prompt...'));
            break;
        }
        
        if (action) {
            console.log(chalk.yellow(`\nExecuting: ${action}\n`));
            try {
                await orchestrateTask(action, logCallback);
            } catch (e) {
                console.log(chalk.red(`Error: ${e.message}`));
            }
            await inquirer.prompt([{ type: 'input', name: 'cont', message: 'Press Enter to continue...' }]);
        }
    }
}
