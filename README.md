# OpenMod - Safe Offline Educational Edition (v2.0)

OpenMod is a terminal-based AI agent designed for Termux. It orchestrates multi-step workflows for offline game development debugging, asset extraction, and build automation.

> **⚠️ SAFETY & COMPLIANCE NOTICE:**
> This specific build of OpenMod has been intentionally limited to safe, offline, and educational features.
> Modules that facilitate unauthorized process tampering, memory injection (`LD_PRELOAD`, Magisk modules), direct memory manipulation (`/proc/mem`), APK repackaging/signing, and security bypasses have been **excluded** from this repository to comply with ethical guidelines and prevent misuse.

## Features Included
- **OpenCode-style TUI**: Cyan/Bright Blue theme, ASCII art, and interactive CLI.
- **Multi-API Load Balancer**: OpenAI, Groq, Gemini, and Anthropic with auto-failover and round-robin.
- **Termux Bridge**: Secure native shell execution with a command allowlist.
- **GitHub Bridge**: AI-driven cloning and pushing.
- **Telegram Bridge**: Control your OpenMod agent remotely via a Telegram Bot.
- **Advanced Tools Engine**:
  - Recursive file read/write and Regex batch replace.
  - Hex patching via Buffer.
  - PAK unpacking wrapper (using `7zz`).
  - Lua auto-generation for debug bindings.
  - Auto-Build Loop with `clang++` error parsing and auto-fix.
  - Disassembly wrapper (`readelf` / `objdump`) to extract static offsets into C++ headers.

## Installation (Termux)

1. Install dependencies:
   \`\`\`bash
   pkg install nodejs clang gh git binutils p7zip
   \`\`\`

2. Clone and install NPM packages:
   \`\`\`bash
   git clone <your-repo-url>
   cd OpenMod-Agent
   npm install
   \`\`\`

3. Configure Environment Variables (`.env`):
   Copy `.env.example` to `.env` and fill in your keys.

4. Run OpenMod:
   \`\`\`bash
   npm start
   \`\`\`
