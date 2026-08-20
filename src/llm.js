import fetch from 'node-fetch';
import chalk from 'chalk';
import dotenv from 'dotenv';
dotenv.config();

// Extract keys from env by prefix
const getKeys = (prefix) => {
    return Object.keys(process.env)
        .filter(key => key.startsWith(prefix) && process.env[key])
        .map(key => process.env[key]);
};

const providers = {
    OpenAI: {
        url: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-4o-mini',
        keys: getKeys('OPENAI_API_KEY_'),
        currentKeyIndex: 0,
        formatRequest: (prompt, model) => JSON.stringify({ model, messages: [{ role: 'user', content: prompt }] }),
        formatResponse: (data) => data.choices[0].message.content,
        getHeaders: (key) => ({ 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' })
    },
    Groq: {
        url: 'https://api.groq.com/openai/v1/chat/completions',
        model: 'llama3-8b-8192',
        keys: getKeys('GROQ_API_KEY_'),
        currentKeyIndex: 0,
        formatRequest: (prompt, model) => JSON.stringify({ model, messages: [{ role: 'user', content: prompt }] }),
        formatResponse: (data) => data.choices[0].message.content,
        getHeaders: (key) => ({ 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' })
    },
    Gemini: {
        url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
        model: 'gemini-1.5-flash',
        keys: getKeys('GEMINI_API_KEY_'),
        currentKeyIndex: 0,
        formatRequest: (prompt) => JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        formatResponse: (data) => data.candidates[0].content.parts[0].text,
        getHeaders: () => ({ 'Content-Type': 'application/json' }),
        buildUrl: (url, key) => `${url}?key=${key}`
    },
    Anthropic: {
        url: 'https://api.anthropic.com/v1/messages',
        model: 'claude-3-haiku-20240307',
        keys: getKeys('ANTHROPIC_API_KEY_'),
        currentKeyIndex: 0,
        formatRequest: (prompt, model) => JSON.stringify({ model, max_tokens: 1024, messages: [{ role: 'user', content: prompt }] }),
        formatResponse: (data) => data.content[0].text,
        getHeaders: (key) => ({ 'x-api-key': key, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' })
    }
};

const providerOrder = ['OpenAI', 'Groq', 'Gemini', 'Anthropic'];

export async function callLLM(prompt, logCallback = console.log) {
    let lastError = null;

    for (const providerName of providerOrder) {
        const provider = providers[providerName];
        if (provider.keys.length === 0) continue;

        let keysAttempted = 0;
        while (keysAttempted < provider.keys.length) {
            const currentKey = provider.keys[provider.currentKeyIndex];
            
            try {
                logCallback(chalk.gray(`[LLM] Routing to ${providerName} (Key Index: ${provider.currentKeyIndex})...`));
                
                const url = provider.buildUrl ? provider.buildUrl(provider.url, currentKey) : provider.url;
                const headers = provider.getHeaders(currentKey);
                const body = provider.formatRequest(prompt, provider.model);

                const response = await fetch(url, { method: 'POST', headers, body, timeout: 15000 });
                
                if (!response.ok) {
                    const status = response.status;
                    throw new Error(`HTTP Error: ${status}`);
                }

                const data = await response.json();
                
                // Rotate key on success (Round-Robin)
                provider.currentKeyIndex = (provider.currentKeyIndex + 1) % provider.keys.length;
                return provider.formatResponse(data);

            } catch (error) {
                lastError = error;
                const errMsg = error.message;
                logCallback(chalk.yellow(`[LLM] ${providerName} Key ${provider.currentKeyIndex} failed (${errMsg}).`));
                
                if (errMsg.includes('429') || errMsg.includes('500') || errMsg.includes('timeout') || errMsg.includes('network')) {
                    provider.currentKeyIndex = (provider.currentKeyIndex + 1) % provider.keys.length;
                    keysAttempted++;
                } else {
                    logCallback(chalk.red(`[LLM] Fatal error for ${providerName}. Skipping provider.`));
                    break;
                }
            }
        }
        logCallback(chalk.red(`[LLM] Exhausted all keys for ${providerName}. Failing over...`));
    }

    throw new Error(`All LLM providers failed. Last error: ${lastError ? lastError.message : 'No keys configured.'}`);
}
