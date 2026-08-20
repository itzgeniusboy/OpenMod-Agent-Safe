import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

export async function listTemplates(logCallback = console.log) {
    try {
        const templateDir = path.join(process.cwd(), 'templates');
        const files = await fs.readdir(templateDir);
        logCallback(chalk.cyan(`[Template Manager] Available templates:`));
        files.forEach(f => logCallback(chalk.gray(` - ${f}`)));
        return `Available templates: ${files.join(', ')}`;
    } catch (error) {
        throw new Error(`Failed to list templates: ${error.message}`);
    }
}

export async function loadTemplate(templateName, logCallback = console.log) {
    try {
        const templatePath = path.join(process.cwd(), 'templates', templateName);
        await fs.access(templatePath);
        
        const content = await fs.readFile(templatePath, 'utf-8');
        logCallback(chalk.green(`[Template Manager] Loaded template: ${templateName}`));
        
        // Save a copy to current dir
        const outPath = path.join(process.cwd(), templateName);
        await fs.writeFile(outPath, content);
        
        return `Template ${templateName} loaded and copied to current directory.`;
    } catch (error) {
        throw new Error(`Failed to load template: ${error.message}`);
    }
}

export async function applyOffsetsToTemplate(templateName, offsetsObj, logCallback = console.log) {
    try {
        const templatePath = path.join(process.cwd(), 'templates', templateName);
        let content = await fs.readFile(templatePath, 'utf-8');
        
        for (const [key, value] of Object.entries(offsetsObj)) {
            const placeholder = `{{${key}}}`;
            content = content.split(placeholder).join(value);
        }
        
        const outPath = path.join(process.cwd(), `patched_${templateName}`);
        await fs.writeFile(outPath, content);
        logCallback(chalk.green(`[Template Manager] Applied offsets and saved to patched_${templateName}`));
        
        return `Offsets applied successfully.`;
    } catch (error) {
        throw new Error(`Failed to apply offsets: ${error.message}`);
    }
}
