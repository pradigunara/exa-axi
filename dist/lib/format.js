import { encode } from "@toon-format/toon";
export const DEFAULT_TRUNCATE_LEN = 500;
export const DEFAULT_DETAIL_TRUNCATE_LEN = 1000;
export function truncate(text, max = DEFAULT_TRUNCATE_LEN) {
    if (!text)
        return null;
    if (text.length <= max)
        return text;
    return text.slice(0, max) + `... (truncated, ${text.length} chars total)`;
}
export function formatDate(iso) {
    if (!iso)
        return "unknown";
    try {
        return new Date(iso).toISOString().split("T")[0];
    }
    catch {
        return "unknown";
    }
}
export function renderSearchList(results, query, truncateLen = DEFAULT_TRUNCATE_LEN) {
    if (results.length === 0) {
        return encode({ results: "0 results found", query });
    }
    const items = results.map((r) => ({
        title: r.title ?? "(untitled)",
        url: r.url,
        date: formatDate(r.publishedDate),
        author: r.author ?? "unknown",
        snippet: truncate(r.highlights?.join(" ... ") ?? r.text ?? null, truncateLen) ?? "",
    }));
    const blocks = [];
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
export function renderSearchDetail(result, index, truncateLen = DEFAULT_DETAIL_TRUNCATE_LEN) {
    const detail = {
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
        detail.summary = truncate(result.summary, truncateLen);
    }
    if (result.text) {
        detail.text = truncate(result.text, truncateLen);
    }
    return encode({ result: detail });
}
export function renderFetchResults(results, errors, truncateLen = DEFAULT_TRUNCATE_LEN) {
    if (results.length === 0 && errors.length === 0) {
        return encode({ pages: "0 pages fetched" });
    }
    const items = results.map((r) => ({
        title: r.title ?? "(untitled)",
        url: r.url,
        date: formatDate(r.publishedDate),
        author: r.author ?? "unknown",
        text: truncate(r.text, truncateLen) ?? "(no content)",
    }));
    const blocks = [];
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
export function renderHelp(lines) {
    if (lines.length === 0)
        return "";
    return `help[${lines.length}]:\n${lines.map((l) => `  ${l}`).join("\n")}`;
}
export function renderError(message, code, suggestions = []) {
    const blocks = [encode({ error: message, code })];
    if (suggestions.length > 0) {
        blocks.push(renderHelp(suggestions));
    }
    return blocks.join("\n");
}
