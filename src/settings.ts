import type {
	InvisibleKind,
	InvisibleStyle,
	PreprintSettings,
	Profile,
	RuleFlags,
	Whitelists,
} from "./types";
import {
	DEFAULT_PROFILES,
	DEFAULT_WHITELISTS,
	PROFILE_EDITION_FR,
} from "./profiles/defaults";

export const DEFAULT_INVISIBLE_STYLES: Record<InvisibleKind, InvisibleStyle> = {
	nbsp: { bg: "#7eb6ff", glyph: "·" },
	nnbsp: { bg: "#c9a0ff", glyph: "·" },
	em: { bg: "#a0a0a0", glyph: "▭" },
	en: { bg: "#b8b8b8", glyph: "▭" },
	trailing: { bg: "#ff6b6b", glyph: "·" },
	softHyphen: { bg: "#ffa94d", glyph: "¬" },
	nbHyphen: { bg: "#69db7c", glyph: "‑" },
	tab: { bg: "#ffd43b", glyph: "→" },
};

export const DEFAULT_SETTINGS: PreprintSettings = {
	invisiblesEnabled: true,
	showGlyphs: true,
	bgOpacity: 45,
	invisibleStyles: { ...DEFAULT_INVISIBLE_STYLES },
	showTabs: false,
	activeProfileId: PROFILE_EDITION_FR.id,
	profiles: DEFAULT_PROFILES.map((p) => structuredClone(p)),
	whitelists: structuredClone(DEFAULT_WHITELISTS),
	maskMath: true,
	maskWikilinks: true,
	previewLimit: 500,
	dialogueDash: "em",
};

export function getActiveProfile(settings: PreprintSettings): Profile {
	return (
		settings.profiles.find((p) => p.id === settings.activeProfileId) ??
		settings.profiles[0] ??
		structuredClone(PROFILE_EDITION_FR)
	);
}

export function parseListText(raw: string): string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const line of raw.split(/[\n,]+/)) {
		const t = line.trim();
		if (!t || t.startsWith("#")) continue;
		const key = t.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(t);
	}
	return out;
}

export function parsePairList(raw: string): Array<{ from: string; to: string }> {
	const seen = new Set<string>();
	const out: Array<{ from: string; to: string }> = [];
	for (const line of raw.split(/[\n,]+/)) {
		const t = line.trim();
		if (!t || t.startsWith("#")) continue;
		const sep = t.includes("→") ? "→" : t.includes("->") ? "->" : null;
		if (!sep) continue;
		const [fromRaw, toRaw] = t.split(sep);
		const from = fromRaw?.trim() ?? "";
		const to = toRaw?.trim() ?? "";
		if (!from || !to) continue;
		const key = from.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		out.push({ from, to });
	}
	return out;
}

export function formatList(items: string[]): string {
	return items.join("\n");
}

export function formatPairList(
	items: Array<{ from: string; to: string }>
): string {
	return items.map((i) => `${i.from}→${i.to}`).join("\n");
}

export function resetInvisibleStyles(): Record<InvisibleKind, InvisibleStyle> {
	return structuredClone(DEFAULT_INVISIBLE_STYLES);
}

export function resetWhitelists(): Whitelists {
	return structuredClone(DEFAULT_WHITELISTS);
}

export function cloneRuleFlags(flags: RuleFlags): RuleFlags {
	return { ...flags };
}
