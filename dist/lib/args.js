export function parseArgs(argv) {
    const positional = [];
    const flags = {};
    let i = 0;
    while (i < argv.length) {
        const arg = argv[i];
        if (arg === "--") {
            positional.push(...argv.slice(i + 1));
            break;
        }
        if (arg.startsWith("--")) {
            const key = arg.slice(2);
            const eqIdx = key.indexOf("=");
            if (eqIdx !== -1) {
                flags[key.slice(0, eqIdx)] = key.slice(eqIdx + 1);
            }
            else if (i + 1 < argv.length && !argv[i + 1].startsWith("-")) {
                flags[key] = argv[i + 1];
                i++;
            }
            else {
                flags[key] = true;
            }
        }
        else if (arg.startsWith("-") && arg.length === 2) {
            const key = arg.slice(1);
            if (i + 1 < argv.length && !argv[i + 1].startsWith("-")) {
                flags[key] = argv[i + 1];
                i++;
            }
            else {
                flags[key] = true;
            }
        }
        else {
            positional.push(arg);
        }
        i++;
    }
    return { positional, flags };
}
export function getFlag(flags, ...names) {
    for (const name of names) {
        if (flags[name] !== undefined)
            return flags[name];
    }
    return undefined;
}
export function getString(flags, ...names) {
    const val = getFlag(flags, ...names);
    if (typeof val === "string")
        return val;
    return undefined;
}
export function getNumber(flags, ...names) {
    const val = getString(flags, ...names);
    if (val !== undefined) {
        const n = parseInt(val, 10);
        return isNaN(n) ? undefined : n;
    }
    return undefined;
}
