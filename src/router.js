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
    
    return [{ action: 'chat', reply: 'Could not determine workflow. Please be specific.' }];
}
