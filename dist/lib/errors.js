import { AxiError } from "axi-sdk-js";
const patterns = [
    {
        pattern: /invalid\s+api\s+key/i,
        code: "AUTH_ERROR",
        message: () => "Invalid Exa API key",
        suggestions: () => [
            "Check your EXA_API_KEY environment variable",
            "Get a new key at https://dashboard.exa.ai/api-keys",
        ],
    },
    {
        pattern: /unauthorized/i,
        code: "AUTH_ERROR",
        message: () => "Exa API unauthorized — check your API key",
        suggestions: () => [
            "Verify EXA_API_KEY is set correctly",
            "Get a new key at https://dashboard.exa.ai/api-keys",
        ],
    },
    {
        pattern: /rate\s*limit/i,
        code: "RATE_LIMITED",
        message: () => "Exa API rate limit exceeded",
        suggestions: () => [
            "Wait a moment and retry",
            "Reduce -n to request fewer results",
        ],
    },
    {
        pattern: /quota/i,
        code: "QUOTA_EXCEEDED",
        message: () => "Exa API quota exceeded",
        suggestions: () => [
            "Check your usage at https://dashboard.exa.ai",
            "Upgrade your plan or wait for quota reset",
        ],
    },
];
export function mapApiError(error) {
    const message = error instanceof Error ? error.message : String(error);
    for (const { pattern, code, message: msgFn, suggestions } of patterns) {
        const match = message.match(pattern);
        if (match) {
            return new AxiError(msgFn(match), code, suggestions(match));
        }
    }
    return new AxiError(message, "API_ERROR", [
        "Check your query and try again",
        "Run `exa-axi --help` for usage information",
    ]);
}
