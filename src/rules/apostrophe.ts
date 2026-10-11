import { APO, type RuleContext, type TextChange } from "../types";
import type { ProtectedRange } from "../engine/masker";
import { collectRegexChanges } from "./helpers";

export function applyApostrophe(
	text: string,
	_ctx: RuleContext,
	ranges: ProtectedRange[]
): TextChange[] {
	return collectRegexChanges(
		text,
		/['‘]/g,
		"apostrophe",
		"apostrophe typographique",
		() => APO,
		ranges
	);
}
