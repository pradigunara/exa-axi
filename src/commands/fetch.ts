import { AxiError } from "axi-sdk-js";
import { parseArgs, getNumber } from "../lib/args.js";
import { fetchPages } from "../lib/exa.js";
import { renderFetchResults, renderHelp } from "../lib/format.js";
import { mapApiError } from "../lib/errors.js";

export const FETCH_HELP = `usage: exa-axi fetch <url> [url2 ...] [flags]
description: Read webpage content as clean markdown. Batch multiple URLs in one call.
flags:
  -m/--max-chars <N>    Maximum characters to extract per page (default: 3000, set 0 for unlimited)
examples:
  exa-axi fetch https://example.com
  exa-axi fetch https://a.com https://b.com -m 5000
  exa-axi fetch https://example.com -m 0
`;

export async function fetchCommand(argv: string[]): Promise<string> {
  const { positional, flags } = parseArgs(argv);

  const urls = positional.filter((a) => a.startsWith("http"));
  if (urls.length === 0) {
    throw new AxiError("At least one URL is required", "VALIDATION_ERROR", [
      'Run `exa-axi fetch <url>` to read a webpage',
    ]);
  }

  const maxCharsFlag = getNumber(flags, "m", "max-chars");
  const apiLimit = maxCharsFlag === 0 ? undefined : (maxCharsFlag ?? 3000);

  let results;
  try {
    results = await fetchPages({ urls, maxCharacters: apiLimit });
  } catch (error) {
    throw mapApiError(error);
  }

  const fetchedUrls = new Set(results.map((r) => r.url));
  const failedUrls = urls.filter((u) => !fetchedUrls.has(u));

  const blocks: string[] = [renderFetchResults(results, failedUrls, Infinity)];

  if (results.length > 0) {
    blocks.push(renderHelp([
      'Run `exa-axi search "<topic>"` to find more pages on a topic',
    ]));
  } else {
    blocks.push(renderHelp([
      'Check that the URL is accessible and publicly available',
      'Run `exa-axi search "<topic>"` to find alternative sources',
    ]));
  }

  return blocks.join("\n");
}
