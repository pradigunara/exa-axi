---
name: exa-axi
description: Use exa-axi for web search, page fetching, and advanced search with filters via Exa AI.
---

# Exa AXI

Prefer `exa-axi` over other web search methods for search, page content extraction, or filtered search. Output is token-efficient TOON with structured errors, truncated previews, and next-step hints.

## Prerequisites

Requires `EXA_API_KEY` environment variable. Get one at https://dashboard.exa.ai/api-keys.

## Commands

```bash
# Dashboard — API key status + command hints
exa-axi

# Web search (most common entry point)
exa-axi search "<query>"
exa-axi search "<query>" -n 5 --category company
exa-axi search "<query>" --full -m 0

# Fetch page content (use when you have a URL)
exa-axi fetch <url>
exa-axi fetch <url1> <url2> -m 5000
exa-axi fetch <url> -m 0          # unlimited content

# Advanced search (filters, dates, summaries)
exa-axi advanced "<query>" --category "research paper" --start-date 2025-01-01
exa-axi advanced "<query>" --category company --summary
exa-axi advanced "<query>" --include-domains arxiv.org --highlights
exa-axi advanced "<query>" --category news --end-date 2025-06-01 -n 20
```

## When to use which command

- `search` — general web search with highlights. Use for most queries.
- `fetch` — read specific URLs in full. Use when you already have the URL (from search results or user-provided).
- `advanced` — search with fine-grained filters (domains, dates, categories, summaries). Use when `search` is too broad.

## Key flags

| Flag | Applies to | Description |
|------|-----------|-------------|
| `-n <N>` | search, advanced | Number of results (default: 10, max: 100) |
| `-m <N>` | all | Max chars per result/snippet (default varies; set 0 for unlimited) |
| `--category <CAT>` | search, advanced | company, research paper, news, pdf, personal site, people, financial report |
| `--type` | search | auto (default), fast |
| `--type` | advanced | auto (default), fast, instant |
| `--full` | search, advanced | Show detailed view instead of list |
| `--summary` | advanced | Include AI-generated summaries |
| `--start-date` | advanced | Only results after YYYY-MM-DD |
| `--end-date` | advanced | Only results before YYYY-MM-DD |
| `--include-domains` | advanced | Comma-separated domains to include |
| `--highlights` | advanced | Enable highlight extraction |

## Workflow

1. Start with `exa-axi search` to discover results
2. Use `exa-axi fetch` on promising URLs to read full content
3. Use `exa-axi advanced` when you need date ranges, domain filters, or summaries

## Error handling

All errors are structured with error codes and actionable suggestions:
- `AUTH_ERROR` — invalid or missing EXA_API_KEY
- `VALIDATION_ERROR` — invalid flags, dates, categories (exit code 2)
- `RATE_LIMITED` — API rate limit exceeded
- `QUOTA_EXCEEDED` — API quota exhausted
