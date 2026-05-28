---
name: exa-axi
description: Use exa-axi for web search, page fetching, and advanced search with filters via Exa AI.
---

# Exa AXI

Use `exa-axi` when the task is web search, page content extraction, or filtered search. Output is token-efficient TOON with structured errors, truncated previews, and next-step hints.

## Prerequisites

Requires `EXA_API_KEY` environment variable. Get one at <https://dashboard.exa.ai/api-keys>.

## Commands

```bash
# Dashboard — check API key status
exa-axi

# Web search
exa-axi search "latest AI research"
exa-axi search "category:people software engineer" --category people
exa-axi search "AI startups" -n 5 --category company
exa-axi search "Rust async runtime" --full

# Fetch page content
exa-axi fetch https://example.com
exa-axi fetch https://a.com https://b.com -m 5000

# Advanced search with filters
exa-axi advanced "AI safety" --category "research paper" --start-date 2025-01-01
exa-axi advanced "Stripe" --category company --summary
exa-axi advanced "Rust async" --include-domains blog.rust-lang.org --highlights
exa-axi advanced "openai" --category news --end-date 2025-06-01 -n 20
```

## When to use which command

- `search` — general web search with highlights. Use for most queries.
- `fetch` — read specific URLs in full. Use when you already have the URL (from search results or user-provided).
- `advanced` — search with fine-grained filters (domains, dates, categories, summaries). Use when `search` is too broad.

## Categories

All search commands accept `--category`:

- `company` — company homepages, metadata (headcount, funding, revenue)
- `research paper` — academic papers, arXiv, OpenReview
- `news` — press coverage, announcements
- `pdf` — PDF documents
- `personal site` — personal blogs, portfolio sites
- `people` — LinkedIn profiles, public bios
- `financial report` — SEC filings, earnings reports

## Output format

- Search results default to compact list view (title, url, date, author + snippet)
- Use `--full` for detailed view with highlights and text content
- Long content is truncated with char count; use `exa-axi fetch <url> -m <N>` to read in full
- Errors include actionable suggestions referencing exa-axi commands

## Workflow

1. Start with `exa-axi search` to discover results
2. Use `exa-axi fetch` on promising URLs to read full content
3. Use `exa-axi advanced` when you need date ranges, domain filters, or summaries
