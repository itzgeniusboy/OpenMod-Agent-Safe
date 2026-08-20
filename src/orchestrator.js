import { callLLM } from './llm.js';
import { runCommand } from './bridges/termux.js';
import { cloneRepo, commitChanges, pushBranch } from './bridges/github.js';
import { unpackPak } from './tools/pak.js';
import { generateLuaBindings } from './tools/luaGen.js';
import { autoBuild } from './tools/build.js';
import { getExports, generateOffsetsHeader } from './tools/disasm.js';
import { analyzeElf } from './tools/elfAnalyzer.js';
import { inspectPak } from './tools/assetInspector.js';
import { buildArm64 } from './tools/buildWrapper.js';
import { summarizeFolder } from './tools/folderSummarizer.js';
import { generateAndTestLua } from './tools/luaPromptGen.js';
import { searchStringsInBinary } from './tools/stringSearch.js';
import { compareBinaries } from './tools/binaryDiff.js';
import { generateSDK } from './tools/ue4SdkGen.js';
import { dumpStrings } from './tools/datDumper.js';
import { watchLogs } from './tools/logcatWatcher.js';
import { loadTemplate } from './tools/templateManager.js';
import { fallbackRouter } from './router.js';

export async function orchestrateTask(prompt, logCallback = console.log) {
    logCallback(`[Orchestrator] Analyzing intent...`);

    try {
        const llmPrompt = `
        You are the OpenMod Orchestrator. Analyze the prompt and break it down into a JSON array of sequential actions.
        Supported actions:
        - {"action": "termux", "cmd": "command", "args": ["arg1"]}
        - {"action": "github_clone", "repo": "url"}
        - {"action": "unpack_pak", "file": "path", "outDir": "path"}
        - {"action": "gen_lua", "dir": "extracted_pak_dir", "outFile": "path"}
        - {"action": "build_cpp", "dir": "src_dir", "file": "main.cpp"}
        - {"action": "disasm", "file": "lib.so", "outFile": "Offsets.h"}
        - {"action": "elf_analyze", "file": "lib.so"}
        - {"action": "pak_inspect", "file": "target.pak"}
        - {"action": "build_arm64", "dir": "src_dir", "file": "main.cpp"}
        - {"action": "summarize_folder", "dir": "folder_path"}
        - {"action": "generate_lua_prompt", "prompt": "user request", "outFile": "script.lua"}
        - {"action": "search_strings", "file": "lib.so", "keywords": ["word1", "word2"]}
        - {"action": "binary_diff", "file1": "path1.so", "file2": "path2.so"}
        - {"action": "sdk_gen", "file": "lib.so", "outDir": "./SDK"}
        - {"action": "dat_dump", "file": "lib.so", "outFile": "classes.json"}
        - {"action": "watch_logs", "package": "com.game", "duration": 10000}
        - {"action": "load_template", "name": "template.cpp"}
        - {"action": "chat", "reply": "message"}

        User Prompt: "${prompt}"
        Output ONLY a valid JSON array of objects.
        `;

        let plan;
        try {
            const llmResponse = await callLLM(llmPrompt, logCallback);
            const jsonMatch = llmResponse.match(/\\[.*\\]/s) || [llmResponse];
            plan = JSON.parse(jsonMatch[0]);
        } catch (e) {
            logCallback(`[Orchestrator] LLM JSON parsing failed. Using fallback router.`);
            plan = fallbackRouter(prompt);
        }

        logCallback(`[Orchestrator] Generated Execution Plan: ${plan.length} steps.`);
        let finalResult = "";

        for (let i = 0; i < plan.length; i++) {
            const step = plan[i];
            logCallback(`[Step ${i+1}/${plan.length}] Executing ${step.action}...`);
            
            try {
                let stepResult = "";
                switch (step.action) {
                    case 'termux':
                        stepResult = await runCommand(step.cmd, step.args, process.cwd(), logCallback);
                        break;
                    case 'github_clone':
                        stepResult = await cloneRepo(step.repo, logCallback);
                        break;
                    case 'unpack_pak':
                        stepResult = await unpackPak(step.file, step.outDir, logCallback);
                        break;
                    case 'gen_lua':
                        stepResult = await generateLuaBindings(step.dir, step.outFile);
                        break;
                    case 'build_cpp':
                        stepResult = await autoBuild(step.dir, step.file, null, logCallback);
                        break;
                    case 'disasm':
                        const exports = await getExports(step.file);
                        stepResult = await generateOffsetsHeader(exports, step.outFile);
                        break;
                    case 'elf_analyze':
                        stepResult = await analyzeElf(step.file, logCallback);
                        break;
                    case 'pak_inspect':
                        stepResult = await inspectPak(step.file, logCallback);
                        break;
                    case 'build_arm64':
                        stepResult = await buildArm64(step.dir, step.file, logCallback);
                        break;
                    case 'summarize_folder':
                        stepResult = await summarizeFolder(step.dir, logCallback);
                        break;
                    case 'generate_lua_prompt':
                        stepResult = await generateAndTestLua(step.prompt, step.outFile, logCallback);
                        break;
                    case 'search_strings':
                        stepResult = await searchStringsInBinary(step.file, step.keywords, logCallback);
                        break;
                    case 'binary_diff':
                        stepResult = await compareBinaries(step.file1, step.file2, logCallback);
                        break;
                    case 'sdk_gen':
                        stepResult = await generateSDK(step.file, step.outDir, logCallback);
                        break;
                    case 'dat_dump':
                        stepResult = await dumpStrings(step.file, step.outFile, logCallback);
                        break;
                    case 'watch_logs':
                        stepResult = await watchLogs(step.package, step.duration, logCallback);
                        break;
                    case 'load_template':
                        stepResult = await loadTemplate(step.name, logCallback);
                        break;
                    case 'chat':
                        stepResult = step.reply;
                        break;
                    default:
                        throw new Error(`Unknown action type: ${step.action}`);
                }
                
                logCallback(`[Step ${i+1} Success]`);
                finalResult += `Step ${i+1} (${step.action}): Success.\\n`;
                
            } catch (stepError) {
                logCallback(`[Step ${i+1} Failed] ${stepError.message}`);
                throw new Error(`Pipeline aborted at step ${i+1} (${step.action}): ${stepError.message}`);
            }
        }

        return `Workflow completed successfully.\\n${finalResult}`;

    } catch (error) {
        return `Workflow failed: ${error.message}`;
    }
}
