import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

const TASKS_FILE = path.join(process.cwd(), 'scheduler', 'tasks.json');

// Allowlist of safe commands
const ALLOWED_COMMANDS = ['logcat', 'analysis', 'build', 'npm run bgmi', 'npm start'];

function initScheduler() {
    const dir = path.dirname(TASKS_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(TASKS_FILE)) {
        fs.writeFileSync(TASKS_FILE, JSON.stringify([]));
    }
}

export async function scheduleTask(command, timeString, taskName, logCallback = console.log) {
    try {
        initScheduler();
        logCallback(chalk.cyan(`[Scheduler] Attempting to schedule task '${taskName}'...`));
        
        // Check allowlist
        const isAllowed = ALLOWED_COMMANDS.some(cmd => command.includes(cmd));
        if (!isAllowed) {
            throw new Error(`Command '${command}' is not in the allowlist. Only analysis, build, and logcat commands are permitted.`);
        }
        
        const tasks = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf-8'));
        
        // Check if exists
        const existingIndex = tasks.findIndex(t => t.name === taskName);
        const newTask = {
            name: taskName,
            command: command,
            schedule: timeString,
            created: new Date().toISOString()
        };
        
        if (existingIndex >= 0) {
            tasks[existingIndex] = newTask;
            logCallback(chalk.yellow(`[Scheduler] Updated existing task '${taskName}'.`));
        } else {
            tasks.push(newTask);
            logCallback(chalk.green(`[Scheduler] Created new task '${taskName}'.`));
        }
        
        fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
        
        // In a real Termux environment, we would write to crontab here.
        // For this bounded implementation, we manage the JSON list.
        logCallback(chalk.green(`[Scheduler] Task saved. Note: Termux cron daemon must be running to execute.`));
        
        return `Task '${taskName}' scheduled successfully for '${timeString}'.`;
    } catch (error) {
        throw new Error(`Failed to schedule task: ${error.message}`);
    }
}

export async function listTasks(logCallback = console.log) {
    try {
        initScheduler();
        const tasks = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf-8'));
        
        if (tasks.length === 0) {
            logCallback(chalk.cyan(`[Scheduler] No tasks scheduled.`));
            return "No scheduled tasks found.";
        }
        
        let output = "Scheduled Tasks:\\n";
        tasks.forEach((t, i) => {
            const line = `[${i+1}] ${t.name} -> '${t.command}' at '${t.schedule}'`;
            logCallback(chalk.cyan(line));
            output += line + "\\n";
        });
        
        return output;
    } catch (error) {
        throw new Error(`Failed to list tasks: ${error.message}`);
    }
}
