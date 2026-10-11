import { ELLIPSIS, type TextChange } from "../types";
import { overlapsProtected, type ProtectedRange } from "../engine/masker";
import { change, collectRegexChanges } from "./helpers";

export function applyCleanup(
	text: string,
	_ctx: unknown,
	ranges: ProtectedRange[]
): TextChange[] {
	const out: TextChange[] = [];

	out.push(
		...collectRegexChanges(
			text,
			/\.{3,}/g,
			"cleanup",
			"points de suspension",
			() => ELLIPSIS,
			ranges
		)
	);

	{
		const re = /[ \t\u00A0\u202F]+(?=\r?\n|$)/g;
		let m: RegExpExecArray | null;
		while ((m = re.exec(text)) !== null) {
			const from = m.index;
			const to = from + m[0].length;
			if (overlapsProtected(from, to, ranges)) continue;
			out.push(change(from, to, "", "cleanup", "espace en fin de ligne", text));
		}
	}

	out.push(
		...collectRegexChanges(
			text,
			/ {2,}/g,
			"cleanup",
			"espaces doubles",
			() => " ",
			ranges
		)
	);

	return out;
}
