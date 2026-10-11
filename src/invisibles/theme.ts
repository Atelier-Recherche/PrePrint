import type { InvisibleKind, InvisibleStyle, PreprintSettings } from "../types";

const STYLE_ID = "preprint-invisibles-vars";

function hexToRgba(hex: string, opacityPct: number): string {
	const raw = hex.replace("#", "").trim();
	const full =
		raw.length === 3
			? raw
					.split("")
					.map((c) => c + c)
					.join("")
			: raw;
	if (!/^[0-9a-fA-F]{6}$/.test(full)) return hex;
	const r = parseInt(full.slice(0, 2), 16);
	const g = parseInt(full.slice(2, 4), 16);
	const b = parseInt(full.slice(4, 6), 16);
	const a = Math.max(0, Math.min(100, opacityPct)) / 100;
	return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function applyInvisiblesTheme(settings: PreprintSettings): void {
	let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
	if (!el) {
		el = document.createElement("style");
		el.id = STYLE_ID;
		document.head.appendChild(el);
	}

	const lines: string[] = [":root {"];
	const kinds = Object.keys(settings.invisibleStyles) as InvisibleKind[];
	for (const kind of kinds) {
		const style = settings.invisibleStyles[kind] as InvisibleStyle;
		lines.push(`  --pp-${kind}-bg: ${hexToRgba(style.bg, settings.bgOpacity)};`);
		lines.push(`  --pp-${kind}-glyph: "${style.glyph}";`);
	}
	lines.push(`  --pp-show-glyphs: ${settings.showGlyphs ? "1" : "0"};`);
	lines.push("}");
	el.textContent = lines.join("\n");
}

export function removeInvisiblesTheme(): void {
	document.getElementById(STYLE_ID)?.remove();
}
