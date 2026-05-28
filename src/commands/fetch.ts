import { AxiError } from "axi-sdk-js";
import { parseArgs, getNumber } from "../lib/args.js";
import { fetchPages } from "../lib/exa.js";
import { renderFetchResults, renderHelp } from "../lib/format.js";
import { mapApiError } from "../lib/errors.js";

export const FETCH_HELP = `usage: exa-axi fetch <url> [url2 ...] [flags]
description: Read webpage content as clean markdown. Batch multiple URLs in one call.
flags:
  -m/--max-chars <N>    Maximum characters to extract per page (default: 3000)
examples:
  exa-axi fetch https://example.com
  exa-axi fetch https://a.com https://b.com -m 5000
`;

export async function fetchCommand(argv: string[]): Promise<string> {
  const { positional, flags } = parseArgs(argv);

  const urls = positional.filter((a) => a.startsWith("http"));
  if (urls.length === 0) {
    throw new AxiError("At least one URL is required", "VALIDATION_ERROR", [
      'Run `exa-axi fetch <url>` to read a webpage',
    ]);
  }

  const maxCharacters = getNumber(flags, "m", "max-chars") ?? 3000;

  let results;
  try {
    results = await fetchPages({ urls, maxCharacters });
  } catch (error) {
    throw mapApiError(error);
  }
  const errors: string[] = [];

  const blocks: string[] = [renderFetchResults(results, errors)];

  if (results.length > 0) {
    const truncated = results.some((r) => r.text && r.text.includes("(truncated,"));
    blocks.push(renderHelp([
      ...(truncated ? ['Run `exa-axi fetch <url> -m <N>` to increase content length'] : []),
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
