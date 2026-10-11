import { EM_DASH, NBSP, type RuleContext, type TextChange } from "../types";
import type { ProtectedRange } from "../engine/masker";
import { collectRegexChanges } from "./helpers";

/**
 * Normalize dash-separated asides: "texte - incise - suite" → em dashes with NBSP.
 */
export function applyDashes(
	text: string,
	_ctx: RuleContext,
	ranges: ProtectedRange[]
): TextChange[] {
	const out: TextChange[] = [];

	// Pattern: space + (-|–|—) + space  → NBSP + — + NBSP  (incise markers)
	out.push(
		...collectRegexChanges(
			text,
			/[ \t\u00A0\u202F]+([-–—])[ \t\u00A0\u202F]+/g,
			"dashes",
			"tiret d'incise",
			() => `${NBSP}${EM_DASH}${NBSP}`,
			ranges
		)
	);

	return out;
}
