import { NNBSP, type RuleContext, type TextChange } from "../types";
import { overlapsProtected, type ProtectedRange } from "../engine/masker";
import { change } from "./helpers";

/**
 * Conservative note callouts: ensure a thin NBSP before superscript-like markers
 * when an accidental regular space is present. Does not insert if glued already.
 */
export function applyNotes(
	text: string,
	_ctx: RuleContext,
	ranges: ProtectedRange[]
): TextChange[] {
	const out: TextChange[] = [];

	// word[1] or word [1] → word + NNBSP + [1]  (only when space present — normalize)
	{
		const re = /(\S)[ \t]+(\[\d+\])/g;
		let m: RegExpExecArray | null;
		while ((m = re.exec(text)) !== null) {
			const from = m.index + 1;
			const to = m.index + m[0].length;
			if (overlapsProtected(m.index, to, ranges)) continue;
			const insert = `${NNBSP}${m[2]}`;
			out.push(change(from, to, insert, "notes", "appel de note", text));
		}
	}

	// word * or word * when footnote asterisk with space
	{
		const re = /(\w)[ \t]+([*†‡]|[¹²³⁴⁵⁶⁷⁸⁹])\b/g;
		let m: RegExpExecArray | null;
		while ((m = re.exec(text)) !== null) {
			const from = m.index + 1;
			const to = m.index + m[0].length;
			if (overlapsProtected(m.index, to, ranges)) continue;
			const insert = `${NNBSP}${m[2]}`;
			out.push(change(from, to, insert, "notes", "appel de note", text));
		}
	}

	return out;
}
