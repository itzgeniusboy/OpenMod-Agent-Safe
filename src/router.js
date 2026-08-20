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
    if (lower.includes('diff nikaal') || lower.includes('compare binaries')) {
        return [
            { action: 'binary_diff', file1: 'old.so', file2: 'new.so' }
        ];
    }
    if (lower.includes('sdk generate') || lower.includes('generate sdk')) {
        return [
            { action: 'sdk_gen', file: 'libUE4.so', outDir: './SDK' }
        ];
    }
    if (lower.includes('strings dump') || lower.includes('dump strings')) {
        return [
            { action: 'dat_dump', file: 'libUE4.so', outFile: 'ue4_classes.json' }
        ];
    }
    if (lower.includes('logs capture') || lower.includes('watch logs')) {
        return [
            { action: 'watch_logs', package: 'com.pubg.imobile', duration: 10000 }
        ];
    }
    if (lower.includes('template load') || lower.includes('load template')) {
        return [
            { action: 'load_template', name: 'diagnostic_overlay.cpp' }
        ];
    }
    if (lower.includes('patch plan') || lower.includes('generate patch')) {
        return [
            { action: 'patch_plan', instructions: [{ offset: '0x1000', patch: '00', description: 'bypass' }], outFile: 'patch_plan.txt' }
        ];
    }
    if (lower.includes('hook doc') || lower.includes('frida script bana')) {
        return [
            { action: 'hook_doc', targetClass: 'UWorld', targetMethod: 'GetWorld', outFile: 'hook_guide.md' }
        ];
    }
    if (lower.includes('source fix') || lower.includes('fix kar')) {
        return [
            { action: 'source_fix', dir: '.', file: 'main.cpp' }
        ];
    }
    if (lower.includes('code analyze') || lower.includes('analyze kar')) {
        return [
            { action: 'code_analyze', file: 'main.cpp' }
        ];
    }
    if (lower.includes('change apply') || lower.includes('rename kar')) {
        return [
            { action: 'apply_change', file: 'main.cpp', description: 'Rename variable' }
        ];
    }
    
    return [{ action: 'chat', reply: 'Could not determine workflow. Please be specific.' }];
}
