import { AxiError } from "axi-sdk-js";
import { parseArgs, getString, getNumber, getFlag } from "../lib/args.js";
import { advancedSearch } from "../lib/exa.js";
import { renderSearchList, renderSearchDetail, renderHelp } from "../lib/format.js";
const VALID_CATEGORIES = ["company", "research paper", "news", "pdf", "personal site", "people", "financial report"];
export const ADVANCED_HELP = `usage: exa-axi advanced <query> [flags]
description: Advanced search with full control over filters, domains, dates, and content options.
flags:
  -n/--num <N>                Number of results (default: 10, max: 100)
  --category <CAT>            Filter by: company, research paper, news, pdf, github, personal site, people, financial report
  --type <TYPE>               Search type: auto (default), fast, instant
  --include-domains <D,..>    Comma-separated domains to include (e.g., arxiv.org,github.com)
  --exclude-domains <D,..>    Comma-separated domains to exclude
  --start-date <YYYY-MM-DD>   Only results published after this date
  --end-date <YYYY-MM-DD>     Only results published before this date
  --start-crawl <YYYY-MM-DD>  Only results crawled after this date
  --end-crawl <YYYY-MM-DD>    Only results crawled before this date
  --include-text <TEXT>       Only results containing this text
  --exclude-text <TEXT>       Exclude results containing this text
  --text-max-chars <N>        Max characters per result (default: 1000)
  --summary                   Enable summary generation
  --summary-query <QUERY>     Focus query for summaries
  --highlights                Enable highlights
  --highlights-query <QUERY>  Focus query for highlights
  --full                      Show full detail for all results
examples:
  exa-axi advanced "AI safety research" --category "research paper" --start-date 2024-01-01
  exa-axi advanced "Stripe" --category company -n 5 --summary
  exa-axi advanced "Rust async" --include-domains blog.rust-lang.org --highlights
`;
function parseCsv(val) {
    if (!val)
        return undefined;
    return val.split(",").map((s) => s.trim()).filter(Boolean);
}
export async function advancedCommand(argv) {
    const { positional, flags } = parseArgs(argv);
    const query = positional.join(" ");
    if (!query) {
        throw new AxiError("Search query is required", "VALIDATION_ERROR", [
            'Run `exa-axi advanced "<query>"` to search with advanced filters',
        ]);
    }
    const category = getString(flags, "category");
    if (category && !VALID_CATEGORIES.includes(category)) {
        throw new AxiError(`Invalid category: ${category}`, "VALIDATION_ERROR", [`Valid categories: ${VALID_CATEGORIES.join(", ")}`]);
    }
    const opts = {
        query,
        numResults: getNumber(flags, "n", "num") ?? 10,
        type: getString(flags, "type") ?? "auto",
        category,
        includeDomains: parseCsv(getString(flags, "include-domains")),
        excludeDomains: parseCsv(getString(flags, "exclude-domains")),
        startPublishedDate: getString(flags, "start-date"),
        endPublishedDate: getString(flags, "end-date"),
        startCrawlDate: getString(flags, "start-crawl"),
        endCrawlDate: getString(flags, "end-crawl"),
        includeText: getString(flags, "include-text") ? [getString(flags, "include-text")] : undefined,
        excludeText: getString(flags, "exclude-text") ? [getString(flags, "exclude-text")] : undefined,
        textMaxCharacters: getNumber(flags, "text-max-chars") ?? 1000,
        enableSummary: getFlag(flags, "summary") === true,
        summaryQuery: getString(flags, "summary-query"),
        enableHighlights: getFlag(flags, "highlights") === true,
        highlightsQuery: getString(flags, "highlights-query"),
    };
    const results = await advancedSearch(opts);
    const full = getFlag(flags, "full") === true;
    const blocks = [];
    if (full && results.length > 0) {
        for (let i = 0; i < results.length; i++) {
            blocks.push(renderSearchDetail(results[i], i));
        }
    }
    else {
        blocks.push(renderSearchList(results, query));
    }
    if (results.length > 0) {
        blocks.push(renderHelp([
            'Run `exa-axi fetch <url>` to read a result in full',
            'Run `exa-axi advanced "<query>" --full` for full details',
            ...(opts.enableSummary ? [] : ['Run `exa-axi advanced "<query>" --summary` to add summaries']),
        ]));
    }
    else {
        blocks.push(renderHelp([
            'Try broadening your query or removing filters',
            'Run `exa-axi search "<query>"` for a simpler search',
        ]));
    }
    return blocks.join("\n");
}
