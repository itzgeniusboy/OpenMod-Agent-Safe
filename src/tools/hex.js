import fs from 'fs/promises';

export async function readBinary(filePath) {
    try {
        return await fs.readFile(filePath);
    } catch (error) {
        throw new Error(`Failed to read binary file: ${error.message}`);
    }
}

export async function patchHex(filePath, offsetHex, hexString) {
    try {
        const offset = parseInt(offsetHex, 16);
        if (isNaN(offset)) throw new Error('Invalid offset format. Use hex (e.g. 0x1A4).');

        const patchBuffer = Buffer.from(hexString, 'hex');
        const fileBuffer = await fs.readFile(filePath);
        
        if (offset + patchBuffer.length > fileBuffer.length) {
            throw new Error('Offset and patch size exceed file length.');
        }

        patchBuffer.copy(fileBuffer, offset);
        await fs.writeFile(filePath, fileBuffer);
        
        return `Successfully patched ${filePath} at offset ${offsetHex}.`;
    } catch (error) {
        throw new Error(`Hex patch failed: ${error.message}`);
    }
}

export async function dumpHex(filePath, startHex, length) {
    try {
        const start = parseInt(startHex, 16);
        const fileBuffer = await fs.readFile(filePath);
        
        if (start >= fileBuffer.length) throw new Error('Start offset exceeds file length.');
        
        const end = Math.min(start + length, fileBuffer.length);
        const slice = fileBuffer.slice(start, end);
        
        let dump = `Hex Dump of ${filePath} [${startHex} - 0x${end.toString(16)}]:\\n`;
        for (let i = 0; i < slice.length; i += 16) {
            const chunk = slice.slice(i, i + 16);
            const hex = chunk.toString('hex').match(/.{1,2}/g).join(' ');
            dump += `0x${(start + i).toString(16).padStart(8, '0')} | ${hex}\\n`;
        }
        return dump;
    } catch (error) {
        throw new Error(`Hex dump failed: ${error.message}`);
    }
}
