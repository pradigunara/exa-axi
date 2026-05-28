import { Exa } from "exa-js";
export function getExaClient() {
    const apiKey = process.env.EXA_API_KEY;
    if (!apiKey) {
        throw new Error("EXA_API_KEY environment variable is required");
    }
    return new Exa(apiKey);
}
export async function search(opts) {
    const exa = getExaClient();
    const response = await exa.searchAndContents(opts.query, {
        type: opts.type ?? "auto",
        numResults: opts.numResults ?? 10,
        ...(opts.category && { category: opts.category }),
        contents: {
            highlights: true,
        },
    });
    if (!response?.results)
        return [];
    return response.results.map((r) => ({
        title: r.title ?? null,
        url: r.url,
        publishedDate: r.publishedDate ?? null,
        author: r.author ?? null,
        highlights: r.highlights ?? null,
        text: r.text ?? null,
        summary: r.summary ?? null,
        score: r.score ?? null,
    }));
}
export async function fetchPages(opts) {
    const exa = getExaClient();
    const response = await exa.getContents(opts.urls, {
        text: { maxCharacters: opts.maxCharacters ?? 3000 },
    });
    if (!response?.results)
        return [];
    return response.results.map((r) => ({
        title: r.title ?? null,
        url: r.url,
        publishedDate: r.publishedDate ?? null,
        author: r.author ?? null,
        text: r.text ?? null,
    }));
}
export async function advancedSearch(opts) {
    const exa = getExaClient();
    const contents = {
        text: opts.textMaxCharacters ? { maxCharacters: opts.textMaxCharacters } : true,
        ...(opts.enableSummary && {
            summary: opts.summaryQuery ? { query: opts.summaryQuery } : true,
        }),
        ...(opts.enableHighlights && {
            highlights: {
                ...(opts.highlightsMaxCharacters && { maxCharacters: opts.highlightsMaxCharacters }),
                ...(opts.highlightsQuery && { query: opts.highlightsQuery }),
            },
        }),
    };
    const request = {
        query: opts.query,
        type: opts.type ?? "auto",
        numResults: opts.numResults ?? 10,
        contents,
        ...(opts.category && { category: opts.category }),
        ...(opts.includeDomains?.length && { includeDomains: opts.includeDomains }),
        ...(opts.excludeDomains?.length && { excludeDomains: opts.excludeDomains }),
        ...(opts.startPublishedDate && { startPublishedDate: opts.startPublishedDate }),
        ...(opts.endPublishedDate && { endPublishedDate: opts.endPublishedDate }),
        ...(opts.startCrawlDate && { startCrawlDate: opts.startCrawlDate }),
        ...(opts.endCrawlDate && { endCrawlDate: opts.endCrawlDate }),
        ...(opts.includeText?.length && { includeText: opts.includeText }),
        ...(opts.excludeText?.length && { excludeText: opts.excludeText }),
        ...(opts.subpages && { subpages: opts.subpages }),
        ...(opts.subpageTarget?.length && { subpageTarget: opts.subpageTarget }),
    };
    const response = await exa.searchAndContents(opts.query, request);
    if (!response?.results)
        return [];
    return response.results.map((r) => ({
        title: r.title ?? null,
        url: r.url,
        publishedDate: r.publishedDate ?? null,
        author: r.author ?? null,
        highlights: r.highlights ?? null,
        text: r.text ?? null,
        summary: r.summary ?? null,
        score: r.score ?? null,
    }));
}
