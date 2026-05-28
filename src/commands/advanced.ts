import { AxiError } from "axi-sdk-js";
import { parseArgs, getString, getNumber, getFlag } from "../lib/args.js";
import { advancedSearch, type AdvancedSearchOptions, type ExaCategory } from "../lib/exa.js";
import { renderSearchList, renderSearchDetail, renderHelp } from "../lib/format.js";
import { mapApiError } from "../lib/errors.js";

export const VALID_CATEGORIES: readonly ExaCategory[] = ["company", "research paper", "news", "pdf", "personal site", "people", "financial report"];

export const ADVANCED_HELP = `usage: exa-axi advanced <query> [flags]
description: Advanced search with full control over filters, domains, dates, and content options.
flags:
  -n/--num <N>                Number of results (default: 10, max: 100)
  -m/--max-chars <N>          Max chars per snippet/detail (default: 500, set 0 for no truncation)
  --category <CAT>            Filter by: company, research paper, news, pdf, personal site, people, financial report
  --type <TYPE>               Search type: auto (default), fast, instant
  --include-domains <D,..>    Comma-separated domains to include (e.g., arxiv.org,github.com)
  --exclude-domains <D,..>    Comma-separated domains to exclude
  --start-date <YYYY-MM-DD>   Only results published after this date
  --end-date <YYYY-MM-DD>     Only results published before this date
  --include-text <TEXT>       Only results containing this text
  --exclude-text <TEXT>       Exclude results containing this text
  --text-max-chars <N>        Max characters returned by Exa API per result
  --summary                   Enable summary generation
  --summary-query <QUERY>     Focus query for summaries
  --highlights                Enable highlights
  --highlights-query <QUERY>  Focus query for highlights
  --full                      Show full detail for all results
examples:
  exa-axi advanced "AI safety" --category "research paper" --start-date 2024-01-01
  exa-axi advanced "Stripe" --category company -n 5 --summary
  exa-axi advanced "Rust async" --include-domains blog.rust-lang.org --highlights
  exa-axi advanced "long topic" -m 0 --full
`;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseCsv(val: string | undefined): string[] | undefined {
  if (!val) return undefined;
  return val.split(",").map((s) => s.trim()).filter(Boolean);
}

function validateDate(val: string | undefined, flagName: string): string | undefined {
  if (!val) return undefined;
  if (!DATE_RE.test(val)) {
    throw new AxiError(
      `Invalid date format for ${flagName}: ${val}. Must be YYYY-MM-DD`,
      "VALIDATION_ERROR",
      [`Example: --${flagName} 2025-01-15`],
    );
  }
  return val;
}

export async function advancedCommand(argv: string[]): Promise<string> {
  const { positional, flags } = parseArgs(argv);

  const rawQuery = positional.join(" ").trim();
  if (!rawQuery) {
    throw new AxiError("Search query is required", "VALIDATION_ERROR", [
      'Run `exa-axi advanced "<query>"` to search with advanced filters',
    ]);
  }

  const category = getString(flags, "category") as ExaCategory | undefined;
  if (category && !VALID_CATEGORIES.includes(category)) {
    throw new AxiError(
      `Invalid category: ${category}`,
      "VALIDATION_ERROR",
      [`Valid categories: ${VALID_CATEGORIES.join(", ")}`],
    );
  }

  const typeStr = getString(flags, "type") ?? "auto";
  if (typeStr !== "auto" && typeStr !== "fast" && typeStr !== "instant") {
    throw new AxiError(`Invalid type: ${typeStr}. Must be auto, fast, or instant`, "VALIDATION_ERROR", [
      'Run `exa-axi advanced "<query>" --type auto` or `--type fast` or `--type instant`',
    ]);
  }

  const numResults = getNumber(flags, "n", "num") ?? 10;
  if (numResults < 1 || numResults > 100) {
    throw new AxiError("Number of results must be between 1 and 100", "VALIDATION_ERROR", [
      'Run `exa-axi advanced "<query>" -n <N>` with N between 1 and 100',
    ]);
  }

  const enableSummary = getFlag(flags, "summary") === true;

  const opts: AdvancedSearchOptions = {
    query: rawQuery,
    numResults,
    type: typeStr as "auto" | "fast" | "instant",
    category,
    includeDomains: parseCsv(getString(flags, "include-domains")),
    excludeDomains: parseCsv(getString(flags, "exclude-domains")),
    startPublishedDate: validateDate(getString(flags, "start-date"), "start-date"),
    endPublishedDate: validateDate(getString(flags, "end-date"), "end-date"),
    includeText: getString(flags, "include-text") ? [getString(flags, "include-text")!] : undefined,
    excludeText: getString(flags, "exclude-text") ? [getString(flags, "exclude-text")!] : undefined,
    textMaxCharacters: getNumber(flags, "text-max-chars") ?? 1000,
    enableSummary,
    summaryQuery: getString(flags, "summary-query"),
    enableHighlights: getFlag(flags, "highlights") === true,
    highlightsQuery: getString(flags, "highlights-query"),
  };

  let results;
  try {
    results = await advancedSearch(opts);
  } catch (error) {
    throw mapApiError(error);
  }
  const full = getFlag(flags, "full") === true;
  const maxChars = getNumber(flags, "m", "max-chars") ?? 500;
  const truncLen = maxChars === 0 ? Infinity : maxChars;

  const blocks: string[] = [];

  if (full && results.length > 0) {
    for (let i = 0; i < results.length; i++) {
      blocks.push(renderSearchDetail(results[i]!, i, truncLen));
    }
  } else {
    blocks.push(renderSearchList(results, rawQuery, truncLen, enableSummary));
  }

  if (results.length > 0) {
    blocks.push(renderHelp([
      'Run `exa-axi fetch <url>` to read a result in full',
      ...(full ? [] : ['Run `exa-axi advanced "<query>" --full` for full details']),
      ...(!enableSummary ? ['Run `exa-axi advanced "<query>" --summary` to add summaries'] : []),
    ]));
  } else {
    blocks.push(renderHelp([
      'Try broadening your query or removing filters',
      'Run `exa-axi search "<query>"` for a simpler search',
    ]));
  }

  return blocks.join("\n");
}
