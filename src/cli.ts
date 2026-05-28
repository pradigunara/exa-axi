import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runAxiCli, type AxiCliCommand } from "axi-sdk-js";
import { encode } from "@toon-format/toon";
import { renderError } from "./lib/format.js";
import { HOME_HELP } from "./commands/home.js";
import { searchCommand, SEARCH_HELP } from "./commands/search.js";
import { fetchCommand, FETCH_HELP } from "./commands/fetch.js";
import { advancedCommand, ADVANCED_HELP } from "./commands/advanced.js";

const DESCRIPTION = "AXI-compliant Exa search CLI. Web search, fetch, and advanced search with token-efficient TOON output.";

const VERSION = readPackageVersion();

const TOP_HELP = `usage: exa-axi [command] [args] [flags]
commands[4]:
  (none)=dashboard, search, fetch, advanced
flags[2]:
  --help, -v/--version
examples:
  exa-axi
  exa-axi search "latest AI research"
  exa-axi fetch https://example.com
  exa-axi advanced "AI startups" --category company
`;

const COMMAND_HELP: Record<string, string> = {
  search: SEARCH_HELP,
  fetch: FETCH_HELP,
  advanced: ADVANCED_HELP,
};

const COMMANDS: Record<string, AxiCliCommand<undefined>> = {
  search: async (args) => searchCommand(args),
  fetch: async (args) => fetchCommand(args),
  advanced: async (args) => advancedCommand(args),
};

async function homeCommand(): Promise<string> {
  const blocks: string[] = [];

  blocks.push(encode({
    search: "ready",
    api_key: process.env.EXA_API_KEY ? "configured" : "missing",
  }));

  if (!process.env.EXA_API_KEY) {
    blocks.push(encode({
      error: "EXA_API_KEY is not set",
      help: "Export EXA_API_KEY or set it in your shell profile",
    }));
  }

  return blocks.join("\n");
}

function readPackageVersion(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  for (const candidate of [
    join(here, "..", "package.json"),
    join(here, "..", "..", "package.json"),
  ]) {
    if (!existsSync(candidate)) continue;
    const parsed = JSON.parse(readFileSync(candidate, "utf-8"));
    if (typeof parsed.version === "string" && parsed.version.length > 0) {
      return parsed.version;
    }
  }
  return "0.0.0";
}

export async function main(options: { argv?: string[]; stdout?: { write: (s: string) => void } } = {}) {
  await runAxiCli({
    ...(options.argv ? { argv: options.argv } : {}),
    description: DESCRIPTION,
    version: VERSION,
    topLevelHelp: TOP_HELP,
    home: async () => homeCommand() as any,
    commands: {
      search: async (args) => searchCommand(args),
      fetch: async (args) => fetchCommand(args),
      advanced: async (args) => advancedCommand(args),
    },
    getCommandHelp: (command) => COMMAND_HELP[command],
    ...(options.stdout ? { stdout: options.stdout } : {}),
    renderUnknownCommand: (cmd) => renderError(`Unknown command: ${cmd}`, "VALIDATION_ERROR", [
      "Run `exa-axi --help` to see available commands",
    ]) + "\n",
    hooks: process.env.EXA_AXI_DISABLE_HOOKS === "1" ? false : undefined,
  });
}
