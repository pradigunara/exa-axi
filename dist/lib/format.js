import { encode } from "@toon-format/toon";
export const DEFAULT_TRUNCATE_LEN = 200;
export const DEFAULT_DETAIL_TRUNCATE_LEN = 500;
function cleanHighlights(text) {
    return text.replace(/\n?\[\.\.\.\]\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
export function truncate(text, max = DEFAULT_TRUNCATE_LEN) {
    if (!text)
        return null;
    if (max === Infinity || text.length <= max)
        return text;
    return text.slice(0, max) + `... (${text.length} chars total, use -m 0 for full)`;
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
function displayTitle(title) {
    if (!title || title.trim() === "")
        return "(untitled)";
    return title;
}
export function renderSearchList(results, query, truncateLen = DEFAULT_TRUNCATE_LEN, showSummary = false) {
    if (results.length === 0) {
        return encode({ results: "0 results found", query });
    }
    const items = results.map((r) => {
        const rawSnippet = r.highlights?.map(cleanHighlights).join(" ... ") ?? r.text ?? null;
        const entry = {
            title: displayTitle(r.title),
            url: r.url,
            date: formatDate(r.publishedDate),
            author: r.author ?? "unknown",
            snippet: truncate(rawSnippet, truncateLen) ?? "",
        };
        if (showSummary && r.summary) {
            entry.summary = truncate(r.summary, truncateLen);
        }
        return entry;
    });
    return encode({
        count: items.length,
        query,
        results: items,
    });
}
export function renderSearchDetail(result, index, truncateLen = DEFAULT_DETAIL_TRUNCATE_LEN) {
    const detail = {
        title: displayTitle(result.title),
        url: result.url,
        date: formatDate(result.publishedDate),
        author: result.author ?? "unknown",
        score: result.score,
    };
    if (result.highlights?.length) {
        const joined = cleanHighlights(result.highlights.join("\n"));
        detail.highlights = truncate(joined, truncateLen);
    }
    if (result.summary) {
        detail.summary = truncate(result.summary, truncateLen);
    }
    if (result.text) {
        detail.text = truncate(result.text, truncateLen);
    }
    return encode({ result: detail });
}
export function renderFetchResults(results, failedUrls, truncateLen = DEFAULT_TRUNCATE_LEN) {
    if (results.length === 0 && failedUrls.length === 0) {
        return encode({ count: 0, pages: "0 pages fetched" });
    }
    const items = results.map((r) => ({
        title: displayTitle(r.title),
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
    if (failedUrls.length > 0) {
        blocks.push(encode({ failed: failedUrls }));
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
