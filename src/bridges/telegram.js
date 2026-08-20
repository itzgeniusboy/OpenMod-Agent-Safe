import { Bot } from 'grammy';
import chalk from 'chalk';
import dotenv from 'dotenv';
dotenv.config();

export function startTelegramBot(orchestrateCallback) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token || token === 'your_telegram_token_here') {
        console.log(chalk.yellow('[Telegram] TELEGRAM_BOT_TOKEN not configured. Bot disabled.'));
        return;
    }

    const bot = new Bot(token);

    bot.command('start', (ctx) => {
        ctx.reply('Welcome to OpenMod Telegram Bridge! Send natural language commands.');
    });

    bot.on('message:text', async (ctx) => {
        const prompt = ctx.message.text;
        const chatId = ctx.chat.id;
        
        console.log(chalk.blue(`[Telegram] Received command: "${prompt}"`));
        
        const msg = await ctx.reply('⏳ Processing your request...');
        
        let logs = "";
        const logCallback = async (logText) => {
            console.log(chalk.gray(`[Telegram-Sync] ${logText}`));
            logs += logText + "\\n";
        };

        try {
            const finalResult = await orchestrateCallback(prompt, logCallback);
            await ctx.api.editMessageText(chatId, msg.message_id, `✅ **Execution Complete**\\n\\n\`\`\`\\n${finalResult}\\n\`\`\``, { parse_mode: 'Markdown' });
        } catch (error) {
            await ctx.api.editMessageText(chatId, msg.message_id, `❌ **Execution Failed**\\n\\n\`\`\`\\n${error.message}\\n\`\`\``, { parse_mode: 'Markdown' });
        }
    });

    bot.catch((err) => {
        console.error(chalk.red(`[Telegram Error] ${err.message}`));
    });

    bot.start();
    console.log(chalk.green('[Telegram] Bot is running in the background.'));
}
