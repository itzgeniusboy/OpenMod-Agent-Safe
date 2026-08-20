import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

export async function generateELFReport(elfJsonPath, outputHtmlPath, logCallback = console.log) {
    try {
        logCallback(chalk.cyan(`[Report Generator] Generating ELF HTML Report from ${elfJsonPath}...`));
        
        if (!fs.existsSync(elfJsonPath)) {
            throw new Error(`File not found: ${elfJsonPath}`);
        }
        
        const elfData = JSON.parse(fs.readFileSync(elfJsonPath, 'utf-8'));
        
        // Basic CSS for dark theme and SVG charts
        const css = `
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #1e1e1e; color: #d4d4d4; margin: 0; padding: 20px; }
            h1, h2 { color: #00f0ff; }
            .container { max-width: 1200px; margin: 0 auto; }
            .card { background-color: #252526; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #3e3e42; }
            th { background-color: #2d2d30; color: #00f0ff; }
            tr:hover { background-color: #2a2d2e; }
            .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; background-color: #007acc; color: white; font-size: 12px; }
            .chart-container { display: flex; justify-content: center; margin: 20px 0; }
        `;
        
        // Create rows for symbols
        let symbolRows = '';
        if (elfData.symbols && Array.isArray(elfData.symbols)) {
            elfData.symbols.slice(0, 100).forEach(sym => { // Limit to 100 for UI performance
                symbolRows += `
                <tr>
                    <td>${sym.name || 'Unknown'}</td>
                    <td><span class="badge">${sym.type || 'FUNC'}</span></td>
                    <td>${sym.fileOffset || '0x0'}</td>
                    <td>${sym.size || '0'}</td>
                </tr>`;
            });
        }
        
        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ELF Analysis Report</title>
            <style>${css}</style>
        </head>
        <body>
            <div class="container">
                <h1>ELF Static Analysis Report</h1>
                
                <div class="card">
                    <h2>Metadata</h2>
                    <p><strong>File:</strong> ${elfData.filename || 'Unknown'}</p>
                    <p><strong>Architecture:</strong> ${elfData.architecture || 'ARM64'}</p>
                    <p><strong>Total Symbols:</strong> ${elfData.symbols ? elfData.symbols.length : 0}</p>
                </div>
                
                <div class="card">
                    <h2>Symbol Table (Top 100)</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Symbol Name</th>
                                <th>Type</th>
                                <th>File Offset</th>
                                <th>Size</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${symbolRows}
                        </tbody>
                    </table>
                </div>
            </div>
        </body>
        </html>
        `;
        
        const outDir = path.dirname(outputHtmlPath);
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
        }
        
        fs.writeFileSync(outputHtmlPath, html);
        logCallback(chalk.green(`[Report Generator] HTML report saved to ${outputHtmlPath}`));
        
        return `ELF HTML Report generated successfully at ${outputHtmlPath}`;
    } catch (error) {
        throw new Error(`Failed to generate ELF report: ${error.message}`);
    }
}

export async function generatePAKReport(pakJsonPath, outputHtmlPath, logCallback = console.log) {
    try {
        logCallback(chalk.cyan(`[Report Generator] Generating PAK HTML Report from ${pakJsonPath}...`));
        
        if (!fs.existsSync(pakJsonPath)) {
            throw new Error(`File not found: ${pakJsonPath}`);
        }
        
        const pakData = JSON.parse(fs.readFileSync(pakJsonPath, 'utf-8'));
        
        const css = `
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #1e1e1e; color: #d4d4d4; margin: 0; padding: 20px; }
            h1, h2 { color: #00f0ff; }
            .container { max-width: 1200px; margin: 0 auto; }
            .card { background-color: #252526; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
            .tree-view { list-style-type: none; padding-left: 20px; }
            .tree-view li { margin: 5px 0; position: relative; }
            .tree-view li::before { content: "├─"; position: absolute; left: -15px; color: #555; }
            .tree-view li:last-child::before { content: "└─"; }
            .file-item { display: flex; justify-content: space-between; padding: 4px 8px; background-color: #2d2d30; border-radius: 4px; }
            .file-size { color: #4ec9b0; font-size: 0.9em; }
        `;
        
        let fileItems = '';
        if (pakData.files && Array.isArray(pakData.files)) {
            pakData.files.slice(0, 200).forEach(file => { // Limit for UI performance
                fileItems += `
                <li>
                    <div class="file-item">
                        <span>📄 ${file.name || 'Unknown'}</span>
                        <span class="file-size">${file.size || 0} bytes (Offset: ${file.offset || '0x0'})</span>
                    </div>
                </li>`;
            });
        }
        
        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>PAK Structure Report</title>
            <style>${css}</style>
        </head>
        <body>
            <div class="container">
                <h1>PAK Structure Inspector Report</h1>
                
                <div class="card">
                    <h2>Header Metadata</h2>
                    <p><strong>Magic:</strong> ${pakData.magic || 'Unknown'}</p>
                    <p><strong>Version:</strong> ${pakData.version || 'Unknown'}</p>
                    <p><strong>Mount Point:</strong> ${pakData.mountPoint || '/'}</p>
                    <p><strong>Total Files:</strong> ${pakData.files ? pakData.files.length : 0}</p>
                </div>
                
                <div class="card">
                    <h2>File Listing (Top 200)</h2>
                    <ul class="tree-view">
                        ${fileItems}
                    </ul>
                </div>
            </div>
        </body>
        </html>
        `;
        
        const outDir = path.dirname(outputHtmlPath);
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
        }
        
        fs.writeFileSync(outputHtmlPath, html);
        logCallback(chalk.green(`[Report Generator] HTML report saved to ${outputHtmlPath}`));
        
        return `PAK HTML Report generated successfully at ${outputHtmlPath}`;
    } catch (error) {
        throw new Error(`Failed to generate PAK report: ${error.message}`);
    }
}
