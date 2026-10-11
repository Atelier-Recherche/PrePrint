import type { ConformStats, TextChange } from "../types";

export function aggregateStats(changes: TextChange[]): ConformStats {
	const byRule: Record<string, number> = {};
	for (const c of changes) {
		byRule[c.ruleId] = (byRule[c.ruleId] ?? 0) + 1;
	}
	return { total: changes.length, byRule };
}

export function formatStats(stats: ConformStats, labels: Record<string, string>): string {
	if (stats.total === 0) return "Aucune modification";
	const parts = Object.entries(stats.byRule).map(([id, n]) => {
		const label = labels[id] ?? id;
		return `${n} ${label}`;
	});
	return `${stats.total} modification${stats.total > 1 ? "s" : ""} : ${parts.join(" · ")}`;
}

/**
 * Apply changes from end to start so offsets stay valid.
 * Changes must not overlap; overlapping ones are filtered (keep first by from).
 */
export function applyChangesToText(text: string, changes: TextChange[]): string {
	const sorted = [...changes].sort((a, b) => b.from - a.from || b.to - a.to);
	const used: Array<{ from: number; to: number }> = [];
	let result = text;
	for (const ch of sorted) {
		if (used.some((u) => ch.from < u.to && ch.to > u.from)) continue;
		result = result.slice(0, ch.from) + ch.insert + result.slice(ch.to);
		used.push({ from: ch.from, to: ch.to });
	}
	return result;
}

/** Deduplicate overlapping changes preferring earlier rules / earlier positions. */
export function dedupeChanges(changes: TextChange[]): TextChange[] {
	const sorted = [...changes].sort((a, b) => a.from - b.from || a.to - b.to);
	const out: TextChange[] = [];
	for (const ch of sorted) {
		if (out.some((u) => ch.from < u.to && ch.to > u.from)) continue;
		out.push(ch);
	}
	return out;
}
