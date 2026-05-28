import { Exa } from "exa-js";

export interface SearchResult {
  title: string | null;
  url: string;
  publishedDate: string | null;
  author: string | null;
  highlights: string[] | null;
  text: string | null;
  summary: string | null;
  score: number | null;
}

export interface FetchResult {
  title: string | null;
  url: string;
  publishedDate: string | null;
  author: string | null;
  text: string | null;
}

export function getExaClient(): Exa {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) {
    throw new Error("EXA_API_KEY environment variable is required");
  }
  return new Exa(apiKey);
}

export type ExaCategory = "company" | "research paper" | "news" | "pdf" | "personal site" | "people" | "financial report";

export interface SearchOptions {
  query: string;
  numResults?: number;
  type?: "auto" | "fast";
  category?: ExaCategory;
}

export async function search(opts: SearchOptions): Promise<SearchResult[]> {
  const exa = getExaClient();
  const response = await exa.searchAndContents(opts.query, {
    type: opts.type ?? "auto",
    numResults: opts.numResults ?? 10,
    ...(opts.category && { category: opts.category }),
    contents: {
      highlights: true,
    },
  });

  if (!response?.results) return [];

  return response.results.map((r: any) => ({
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

export interface FetchOptions {
  urls: string[];
  maxCharacters?: number;
}

export async function fetchPages(opts: FetchOptions): Promise<FetchResult[]> {
  const exa = getExaClient();
  const response = await exa.getContents(opts.urls, {
    text: { maxCharacters: opts.maxCharacters ?? 3000 },
  });

  if (!response?.results) return [];

  return response.results.map((r: any) => ({
    title: r.title ?? null,
    url: r.url,
    publishedDate: r.publishedDate ?? null,
    author: r.author ?? null,
    text: r.text ?? null,
  }));
}

export interface AdvancedSearchOptions {
  query: string;
  numResults?: number;
  type?: "auto" | "fast" | "instant";
  category?: ExaCategory;
  includeDomains?: string[];
  excludeDomains?: string[];
  startPublishedDate?: string;
  endPublishedDate?: string;
  startCrawlDate?: string;
  endCrawlDate?: string;
  includeText?: string[];
  excludeText?: string[];
  textMaxCharacters?: number;
  enableSummary?: boolean;
  summaryQuery?: string;
  enableHighlights?: boolean;
  highlightsMaxCharacters?: number;
  highlightsQuery?: string;
  subpages?: number;
  subpageTarget?: string[];
}

export async function advancedSearch(opts: AdvancedSearchOptions): Promise<SearchResult[]> {
  const exa = getExaClient();
  const contents: any = {
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

  const request: any = {
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

  if (!response?.results) return [];

  return response.results.map((r: any) => ({
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
