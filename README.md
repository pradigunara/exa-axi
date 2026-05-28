# exa-axi

AXI-compliant CLI for [Exa](https://exa.ai) web search. Token-efficient TOON output designed for autonomous agents.

## Install

```bash
# Bun (recommended)
bun install -g pradigunara/exa-axi

# npm
npm install -g pradigunara/exa-axi
```

## Setup

```bash
export EXA_API_KEY="your-key"    # get one at https://dashboard.exa.ai/api-keys
```

## Usage

```bash
# Dashboard
exa-axi

# Web search
exa-axi search "latest AI research"
exa-axi search "category:people software engineer" --category people
exa-axi search "AI startups" -n 5 --category company

# Fetch page content
exa-axi fetch https://example.com
exa-axi fetch https://a.com https://b.com -m 5000

# Advanced search with filters
exa-axi advanced "AI safety" --category "research paper" --start-date 2025-01-01
exa-axi advanced "Stripe" --category company --summary
exa-axi advanced "Rust async" --include-domains blog.rust-lang.org --highlights
```

## Commands

| Command | Description |
|---------|-------------|
| `exa-axi` | Dashboard — shows API key status |
| `exa-axi search <query>` | Web search with highlights |
| `exa-axi fetch <url>...` | Read webpage content as markdown |
| `exa-axi advanced <query>` | Advanced search with filters, domains, dates, summaries |

## Flags

### search
- `-n/--num <N>` — Number of results (default: 10)
- `--category <CAT>` — company, research paper, news, pdf, personal site, people, financial report
- `--type <TYPE>` — auto (default), fast
- `--full` — Show full details for all results

### fetch
- `-m/--max-chars <N>` — Max characters per page (default: 3000)

### advanced
- All search flags, plus:
- `--start-date <YYYY-MM-DD>` / `--end-date <YYYY-MM-DD>` — Date filters
- `--include-domains <D,..>` / `--exclude-domains <D,..>` — Domain filters
- `--include-text <TEXT>` / `--exclude-text <TEXT>` — Text filters
- `--summary` — Enable summaries
- `--highlights` — Enable highlights
- `--type` — auto, fast, instant

## Install from source

```bash
git clone https://github.com/pradigunara/exa-axi.git
cd exa-axi
npm install
npm run build
npm link
```

## Install skill (for agents)

```bash
npx skills add pradigunara/exa-axi
```

## License

MIT
