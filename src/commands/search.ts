import { AxiError } from "axi-sdk-js";
import { parseArgs, getString, getNumber, getFlag } from "../lib/args.js";
import { search, type ExaCategory } from "../lib/exa.js";
import { VALID_CATEGORIES } from "./advanced.js";
import { renderSearchList, renderSearchDetail, renderHelp } from "../lib/format.js";
import { mapApiError } from "../lib/errors.js";

export const SEARCH_HELP = `usage: exa-axi search <query> [flags]
description: Search the web using Exa AI. Returns clean text content from top results.
flags:
  -n/--num <N>          Number of results (default: 10)
  -m/--max-chars <N>    Max chars per snippet (default: 200, set 0 for no truncation)
  --category <CAT>      Filter by: company, research paper, news, pdf, personal site, people, financial report
  --type <TYPE>         Search type: auto (default), fast
  --full                Show full detail for all results (not just list view)
examples:
  exa-axi search "React vs Vue performance"
  exa-axi search "category:people software engineer" --category people
  exa-axi search "AI startups" -n 5 --category company
  exa-axi search "Rust async" -m 0 --full
`;

export async function searchCommand(argv: string[]): Promise<string> {
  const { positional, flags } = parseArgs(argv);

  const rawQuery = positional.join(" ").trim();
  if (!rawQuery) {
    throw new AxiError("Search query is required", "VALIDATION_ERROR", [
      'Run `exa-axi search "<query>"` to search the web',
    ]);
  }

  const flagCategory = getString(flags, "category") as ExaCategory | undefined;
  if (flagCategory && !VALID_CATEGORIES.includes(flagCategory)) {
    throw new AxiError(
      `Invalid category: ${flagCategory}`,
      "VALIDATION_ERROR",
      [`Valid categories: ${VALID_CATEGORIES.join(", ")}`],
    );
  }

  // Extract inline category: prefix from query (e.g., "category:people John Doe")
  const categoryMatch = rawQuery.match(/\bcategory:(company|research\s*paper|news|pdf|personal\s*site|people|financial\s*report)\b/i);
  let cleanedQuery = rawQuery;
  let inlineCategory: ExaCategory | undefined;
  if (categoryMatch) {
    inlineCategory = categoryMatch[1]!.toLowerCase().replace(/\s+/g, " ") as ExaCategory;
    cleanedQuery = rawQuery.replace(categoryMatch[0], "").replace(/\s+/g, " ").trim();
  }

  const category = flagCategory ?? inlineCategory;

  const numResults = getNumber(flags, "n", "num") ?? 10;
  if (numResults < 1 || numResults > 100) {
    throw new AxiError("Number of results must be between 1 and 100", "VALIDATION_ERROR", [
      'Run `exa-axi search "<query>" -n <N>` with N between 1 and 100',
    ]);
  }
  const maxChars = getNumber(flags, "m", "max-chars") ?? 200;
  const typeStr = getString(flags, "type") ?? "auto";
  if (typeStr !== "auto" && typeStr !== "fast") {
    throw new AxiError(`Invalid type: ${typeStr}. Must be auto or fast`, "VALIDATION_ERROR", [
      'Run `exa-axi search "<query>" --type auto` or `--type fast`',
    ]);
  }
  const type = typeStr as "auto" | "fast";
  const full = getFlag(flags, "full") === true;

  let results;
  try {
    results = await search({
      query: cleanedQuery,
      numResults,
      type,
      category,
    });
  } catch (error) {
    throw mapApiError(error);
  }

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
      'Run `exa-axi fetch <url>` to read a result in full',
      ...(full ? [] : ['Run `exa-axi search "<query>" --full` for detailed view']),
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
