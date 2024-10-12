import type { MatchResult } from "../types";

export function match(incomingPath: string, storedPaths: string[]): MatchResult | null {
    const incomingParts = incomingPath.split('/').filter(part => part !== '');

    // Sort paths by specificity (more static parts first) and then by reverse order
    const sortedPaths = storedPaths.sort((a, b) => {
        const aStaticParts = a.split('/').filter(part => !part.startsWith(':') && part !== '').length;
        const bStaticParts = b.split('/').filter(part => !part.startsWith(':') && part !== '').length;
        if (aStaticParts !== bStaticParts) {
            return bStaticParts - aStaticParts; // More static parts first
        }
        return storedPaths.indexOf(b) - storedPaths.indexOf(a); // Maintain reverse order for equal specificity
    });

    for (const storedPath of sortedPaths) {
        const storedParts = storedPath.split('/').filter(part => part !== '');
        if (storedParts.length !== incomingParts.length) continue;

        const params: Array<{ name: string; value: string }> = [];
        let isMatch = true;

        for (let i = 0; i < storedParts.length; i++) {
            if (storedParts[i].startsWith(':')) {
                params.push({ name: storedParts[i].slice(1), value: incomingParts[i] });
            } else if (storedParts[i] !== incomingParts[i]) {
                isMatch = false;
                break;
            }
        }

        if (isMatch) {
            return { path: storedPath, params };
        }
    }

    return null;
}
