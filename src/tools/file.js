import fs from 'fs/promises';
import path from 'path';

export async function recursiveRead(dir) {
    let results = [];
    try {
        const list = await fs.readdir(dir);
        for (const file of list) {
            const filePath = path.resolve(dir, file);
            const stat = await fs.stat(filePath);
            if (stat && stat.isDirectory()) {
                results = results.concat(await recursiveRead(filePath));
            } else {
                results.push(filePath);
            }
        }
        return results;
    } catch (error) {
        throw new Error(`Recursive read failed on ${dir}: ${error.message}`);
    }
}

export async function readFile(filePath) {
    return await fs.readFile(filePath, 'utf-8');
}

export async function writeFile(filePath, content) {
    await fs.writeFile(filePath, content, 'utf-8');
    return `File written: ${filePath}`;
}

export async function appendFile(filePath, content) {
    await fs.appendFile(filePath, content, 'utf-8');
    return `File appended: ${filePath}`;
}

export async function deleteFile(filePath) {
    await fs.unlink(filePath);
    return `File deleted: ${filePath}`;
}

export async function copyFile(src, dest) {
    await fs.copyFile(src, dest);
    return `File copied from ${src} to ${dest}`;
}
