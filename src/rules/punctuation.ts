import { NBSP, NNBSP, type RuleContext, type TextChange } from "../types";
import type { ProtectedRange } from "../engine/masker";
import { spaceBeforePunct } from "./helpers";

export function applyPunctuation(
	text: string,
	_ctx: RuleContext,
	ranges: ProtectedRange[]
): TextChange[] {
	return [
		...spaceBeforePunct(text, ":", NBSP, "punctuation", "espace avant :", ranges),
		...spaceBeforePunct(text, ";!?", NNBSP, "punctuation", "espace fine avant ;!?", ranges),
	];
}
