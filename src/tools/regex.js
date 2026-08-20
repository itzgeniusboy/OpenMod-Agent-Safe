import fs from 'fs/promises';
import path from 'path';
import { recursiveRead } from './file.js';

export async function batchReplace(folderPath, regexPattern, replacement) {
    try {
        const regex = new RegExp(regexPattern, 'g');
        const files = await recursiveRead(folderPath);
        const targetExts = ['.cpp', '.lua', '.json', '.txt', '.h'];
        let modifiedCount = 0;

        for (const file of files) {
            const ext = path.extname(file).toLowerCase();
            if (targetExts.includes(ext)) {
                const content = await fs.readFile(file, 'utf-8');
                if (regex.test(content)) {
                    const newContent = content.replace(regex, replacement);
                    await fs.writeFile(file, newContent, 'utf-8');
                    modifiedCount++;
                }
            }
        }
        return `Successfully replaced pattern in ${modifiedCount} files within ${folderPath}.`;
    } catch (error) {
        throw new Error(`Regex batch replace failed: ${error.message}`);
    }
}
