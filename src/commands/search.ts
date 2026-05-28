import { AxiError } from "axi-sdk-js";
import { parseArgs, getString, getNumber, getFlag } from "../lib/args.js";
import { search, type SearchOptions, type ExaCategory } from "../lib/exa.js";
import { renderSearchList, renderSearchDetail, renderHelp, renderError } from "../lib/format.js";

export const SEARCH_HELP = `usage: exa-axi search <query> [flags]
description: Search the web using Exa AI. Returns clean text content from top results.
flags:
  -n/--num <N>          Number of results (default: 10)
  -m/--max-chars <N>    Max chars per snippet/detail (default: 500, set 0 for no truncation)
  --category <CAT>      Filter by: company, research paper, news, pdf, personal site, people, financial report
  --type <TYPE>         Search type: auto (default), fast
  --full                Show full detail for all results (not just list view)
examples:
  exa-axi search "React vs Vue performance"
  exa-axi search "category:people software engineer" --category people
  exa-axi search "AI startups" -n 5 --category company
  exa-axi search "Rust async" -m 2000 --full
`;

export async function searchCommand(argv: string[]): Promise<string> {
  const { positional, flags } = parseArgs(argv);

  const query = positional.join(" ");
  if (!query) {
    throw new AxiError("Search query is required", "VALIDATION_ERROR", [
      'Run `exa-axi search "<query>"` to search the web',
    ]);
  }

  // Extract inline category: prefix from query (e.g., "category:people John Doe")
  const categoryMatch = query.match(/\bcategory:(company|research\s*paper|news|pdf|personal\s*site|people|financial\s*report)\b/i);
  let cleanedQuery = query;
  let inlineCategory: ExaCategory | undefined;
  if (categoryMatch) {
    const cat = categoryMatch[1]!.toLowerCase().replace(/\s+/g, " ") as ExaCategory;
    inlineCategory = cat;
    cleanedQuery = query.replace(categoryMatch[0], "").replace(/\s+/g, " ").trim();
  }

  const flagCategory = getString(flags, "category") as ExaCategory | undefined;
  const category = flagCategory ?? inlineCategory;

  const numResults = getNumber(flags, "n", "num") ?? 10;
  const maxChars = getNumber(flags, "m", "max-chars") ?? 500;
  const type = (getString(flags, "type") as "auto" | "fast") ?? "auto";
  const full = getFlag(flags, "full") === true;

  const results = await search({
    query: cleanedQuery,
    numResults,
    type,
    category,
  });

  const truncLen = maxChars === 0 ? Infinity : maxChars;

  const blocks: string[] = [];

  if (full && results.length > 0) {
    for (let i = 0; i < results.length; i++) {
      blocks.push(renderSearchDetail(results[i]!, i, truncLen));
    }
  } else {
    blocks.push(renderSearchList(results, cleanedQuery, truncLen));
  }

  if (results.length > 0) {
    blocks.push(renderHelp([
      'Run `exa-axi fetch <url>` to read a specific result in full',
      'Run `exa-axi search "<query>" --full` to see full details for all results',
      ...(results.length >= numResults ? ['Run `exa-axi search "<query>" -n <N>` to get more results'] : []),
    ]));
  } else {
    blocks.push(renderHelp([
      'Try a different query or adjust filters',
      'Run `exa-axi advanced "<query>"` for more filter options',
    ]));
  }

  return blocks.join("\n");
}
