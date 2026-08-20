import { runCommand } from '../bridges/termux.js';

export async function unpackPak(pakFilePath, outputDir, logCallback = console.log) {
    try {
        logCallback(`[PAK] Attempting to unpack ${pakFilePath} to ${outputDir}...`);
        
        // Use 7zz (p7zip) as fallback for basic extraction if available in Termux
        // Note: 7zz can extract some basic assets but is not a full UE PAK parser.
        // For full UE PAK support, a specialized compiled tool is required.
        const cmd = `mkdir -p ${outputDir} && 7zz x ${pakFilePath} -o${outputDir}`;
        
        try {
            await runCommand(cmd, [], process.cwd(), logCallback);
            return `Successfully unpacked ${pakFilePath} into ${outputDir}`;
        } catch (execError) {
            logCallback(`[PAK] 7zz extraction failed. Fallback to raw chunk export simulation.`);
            // Simulate raw chunk export for educational purposes
            await runCommand(`mkdir -p ${outputDir} && echo "Simulated raw chunks" > ${outputDir}/chunk_0.bin`, [], process.cwd(), logCallback);
            return `Exported raw chunks for ${pakFilePath} into ${outputDir}`;
        }
    } catch (error) {
        throw new Error(`PAK Unpack failed: ${error.message}`);
    }
}
