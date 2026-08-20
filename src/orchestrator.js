import { callLLM } from './llm.js';
import { runCommand } from './bridges/termux.js';
import { cloneRepo, commitChanges, pushBranch } from './bridges/github.js';
import { unpackPak } from './tools/pak.js';
import { generateLuaBindings } from './tools/luaGen.js';
import { autoBuild } from './tools/build.js';
import { getExports, generateOffsetsHeader } from './tools/disasm.js';
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
                        stepResult = await autoBuild(step.dir, step.file, logCallback);
                        break;
                    case 'disasm':
                        const exports = await getExports(step.file);
                        stepResult = await generateOffsetsHeader(exports, step.outFile);
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
