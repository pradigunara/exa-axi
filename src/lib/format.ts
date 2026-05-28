import { encode } from "@toon-format/toon";
import type { SearchResult, FetchResult } from "./exa.js";

const TRUNCATE_LEN = 500;

function truncate(text: string | null, max = TRUNCATE_LEN): string | null {
  if (!text) return null;
  if (text.length <= max) return text;
  return text.slice(0, max) + `... (truncated, ${text.length} chars total)`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return "unknown";
  try {
    return new Date(iso).toISOString().split("T")[0]!;
  } catch {
    return "unknown";
  }
}

export function renderSearchList(results: SearchResult[], query: string): string {
  if (results.length === 0) {
    return encode({ results: "0 results found", query });
  }

  const items = results.map((r) => ({
    title: r.title ?? "(untitled)",
    url: r.url,
    date: formatDate(r.publishedDate),
    author: r.author ?? "unknown",
    snippet: truncate(r.highlights?.join(" ... ") ?? r.text ?? null) ?? "",
  }));

  const blocks: string[] = [];
  blocks.push(encode({
    count: items.length,
    query,
    results: items.map(({ title, url, date, author }) => ({ title, url, date, author })),
  }));

  const snippets = items
    .filter((i) => i.snippet)
    .map((i) => `  ${i.url}: ${i.snippet}`)
    .join("\n");

  if (snippets) {
    blocks.push(`snippets:\n${snippets}`);
  }

  return blocks.join("\n");
}

export function renderSearchDetail(result: SearchResult, index: number): string {
  const detail: Record<string, any> = {
    title: result.title ?? "(untitled)",
    url: result.url,
    date: formatDate(result.publishedDate),
    author: result.author ?? "unknown",
    score: result.score,
  };

  if (result.highlights?.length) {
    detail.highlights = result.highlights;
  }

  if (result.summary) {
    detail.summary = truncate(result.summary, 1000);
  }

  if (result.text) {
    detail.text = truncate(result.text, 1000);
  }

  return encode({ result: detail });
}

export function renderFetchResults(results: FetchResult[], errors: string[]): string {
  if (results.length === 0 && errors.length === 0) {
    return encode({ pages: "0 pages fetched" });
  }

  const items = results.map((r) => ({
    title: r.title ?? "(untitled)",
    url: r.url,
    date: formatDate(r.publishedDate),
    author: r.author ?? "unknown",
    text: truncate(r.text) ?? "(no content)",
  }));

  const blocks: string[] = [];
  blocks.push(encode({
    count: items.length,
    pages: items.map(({ title, url, date, author }) => ({ title, url, date, author })),
  }));

  for (const item of items) {
    blocks.push(`\n--- ${item.url} ---\n${item.text}`);
  }

  if (errors.length > 0) {
    blocks.push(encode({ errors }));
  }

  return blocks.join("\n");
}

export function renderHelp(lines: string[]): string {
  if (lines.length === 0) return "";
  return `help[${lines.length}]:\n${lines.map((l) => `  ${l}`).join("\n")}`;
}

export function renderError(message: string, code: string, suggestions: string[] = []): string {
  const blocks = [encode({ error: message, code })];
  if (suggestions.length > 0) {
    blocks.push(renderHelp(suggestions));
  }
  return blocks.join("\n");
}
