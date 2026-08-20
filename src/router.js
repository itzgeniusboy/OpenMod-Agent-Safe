export function fallbackRouter(prompt) {
    const lower = prompt.toLowerCase();
    
    if (lower.includes('unpack') && lower.includes('lua')) {
        return [
            { action: 'unpack_pak', file: 'target.pak', outDir: './extracted' },
            { action: 'gen_lua', dir: './extracted', outFile: 'auto_bind.lua' }
        ];
    }
    if (lower.includes('clone') && lower.includes('build')) {
        return [
            { action: 'github_clone', repo: 'target_repo' },
            { action: 'build_cpp', dir: '.', file: 'main.cpp' }
        ];
    }
    if (lower.includes('disasm') || lower.includes('readelf')) {
        return [
            { action: 'disasm', file: 'libtarget.so', outFile: 'Offsets.h' }
        ];
    }
    if (lower.includes('elf analyze') || lower.includes('elf analyzer')) {
        return [
            { action: 'elf_analyze', file: 'libUE4.so' }
        ];
    }
    if (lower.includes('pak inspect') || lower.includes('inspect pak')) {
        return [
            { action: 'pak_inspect', file: 'target.pak' }
        ];
    }
    if (lower.includes('mock overlay compile') || lower.includes('compile mock overlay')) {
        return [
            { action: 'termux', cmd: 'cp', args: ['templates/diagnostic_overlay.cpp', './diagnostic_overlay.cpp'] },
            { action: 'build_arm64', dir: '.', file: 'diagnostic_overlay.cpp' }
        ];
    }
    if (lower.includes('unpacked folder') && lower.includes('summary')) {
        return [
            { action: 'summarize_folder', dir: './extracted' }
        ];
    }
    if (lower.includes('lua script chahiye') || lower.includes('generate lua')) {
        return [
            { action: 'generate_lua_prompt', prompt: prompt, outFile: 'script.lua' }
        ];
    }
    if (lower.includes('saari strings') || lower.includes('strings dhoondh')) {
        return [
            { action: 'search_strings', file: 'libUE4.so', keywords: ['health', 'ammo'] }
        ];
    }
    
    return [{ action: 'chat', reply: 'Could not determine workflow. Please be specific.' }];
}
