import { NBSP, type RuleContext, type TextChange } from "../types";
import { overlapsProtected, type ProtectedRange } from "../engine/masker";
import { change } from "./helpers";

function escapeRe(s: string): string {
	return s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
}

/**
 * Normalize known abbreviations with proper NBSP where spaces exist.
 * Patterns in whitelist like "p. ex." become "p." + NBSP + "ex."
 */
export function applyAbbreviations(
	text: string,
	ctx: RuleContext,
	ranges: ProtectedRange[]
): TextChange[] {
	const out: TextChange[] = [];

	for (const abbr of [...ctx.whitelists.abbreviations].sort(
		(a, b) => b.length - a.length
	)) {
		if (!abbr.includes(" ")) {
			// n° / nº followed by number → n° + NBSP + number
			if (/^n[°º]$/i.test(abbr)) {
				const re = new RegExp(`(${escapeRe(abbr)})[ \\t]*(?=\\d)`, "gi");
				let m: RegExpExecArray | null;
				const regex = new RegExp(re.source, re.flags);
				while ((m = regex.exec(text)) !== null) {
					const from = m.index;
					const to = from + m[0].length;
					if (overlapsProtected(from, to, ranges)) continue;
					const insert = `${m[1]}${NBSP}`;
					if (m[0] === insert) continue;
					out.push(change(from, to, insert, "abbreviations", "abréviation", text));
				}
			}
			continue;
		}

		// Build flexible regex: spaces can be regular/NBSP
		const parts = abbr.split(/\s+/).map(escapeRe);
		const flex = parts.join("[ \\t\\u00A0\\u202F]+");
		const re = new RegExp(`\\b${flex}`, "gi");
		let m: RegExpExecArray | null;
		const regex = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
		while ((m = regex.exec(text)) !== null) {
			const from = m.index;
			const to = from + m[0].length;
			if (overlapsProtected(from, to, ranges)) continue;
			const insert = abbr.split(/\s+/).join(NBSP);
			if (m[0] === insert) continue;
			out.push(change(from, to, insert, "abbreviations", "abréviation", text));
		}
	}

	// etc. preceded by space → NBSP before etc. when after comma context loosely
	{
		const re = /,[ \t]+etc\./gi;
		let m: RegExpExecArray | null;
		while ((m = re.exec(text)) !== null) {
			const from = m.index;
			const to = from + m[0].length;
			if (overlapsProtected(from, to, ranges)) continue;
			const insert = `,${NBSP}etc.`;
			if (m[0] === insert) continue;
			out.push(change(from, to, insert, "abbreviations", "etc.", text));
		}
	}

	return out;
}
