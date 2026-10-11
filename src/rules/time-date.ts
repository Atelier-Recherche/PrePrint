import { NBSP, NNBSP, type RuleContext, type TextChange } from "../types";
import type { ProtectedRange } from "../engine/masker";
import { collectRegexChanges } from "./helpers";

function escapeRe(s: string): string {
	return s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
}

export function applyTimeDate(
	text: string,
	ctx: RuleContext,
	ranges: ProtectedRange[]
): TextChange[] {
	const out: TextChange[] = [];

	// Hours: 18h30, 18 h 30, 8h, 8 h
	out.push(
		...collectRegexChanges(
			text,
			/\b(\d{1,2})[ \t\u00A0\u202F]*[hH][ \t\u00A0\u202F]*(\d{2})?\b/g,
			"timeDate",
			"heure",
			(m) => {
				const h = m[1]!;
				const min = m[2];
				return min ? `${h}${NNBSP}h${NNBSP}${min}` : `${h}${NNBSP}h`;
			},
			ranges
		)
	);

	// Dates: 27 juillet 1924
	if (ctx.whitelists.months.length > 0) {
		const months = [...ctx.whitelists.months]
			.sort((a, b) => b.length - a.length)
			.map(escapeRe)
			.join("|");
		const re = new RegExp(
			`\\b(\\d{1,2})[ \\t\\u00A0\\u202F]+(${months})\\b`,
			"gi"
		);
		out.push(
			...collectRegexChanges(
				text,
				re,
				"timeDate",
				"date",
				(m) => `${m[1]}${NBSP}${m[2]}`,
				ranges
			)
		);
	}

	return out;
}
