import type { TextChange } from "../types";
import { overlapsProtected, type ProtectedRange } from "../engine/masker";

export function change(
	from: number,
	to: number,
	insert: string,
	ruleId: string,
	label: string,
	source: string
): TextChange {
	return {
		from,
		to,
		insert,
		ruleId,
		label,
		before: source.slice(from, to),
		after: insert,
	};
}

export function collectRegexChanges(
	text: string,
	re: RegExp,
	ruleId: string,
	label: string,
	replace: (match: RegExpExecArray) => string | null,
	protectedRanges: ProtectedRange[] = []
): TextChange[] {
	const flags = re.flags.includes("g") ? re.flags : re.flags + "g";
	const regex = new RegExp(re.source, flags);
	const out: TextChange[] = [];
	let m: RegExpExecArray | null;
	while ((m = regex.exec(text)) !== null) {
		if (m[0].length === 0) {
			regex.lastIndex++;
			continue;
		}
		const from = m.index;
		const to = from + m[0].length;
		if (overlapsProtected(from, to, protectedRanges)) continue;
		const insert = replace(m);
		if (insert === null || insert === m[0]) continue;
		out.push(change(from, to, insert, ruleId, label, text));
	}
	return out;
}

/** Normalize space before high punctuation marks on free text. */
export function spaceBeforePunct(
	text: string,
	marks: string,
	space: string,
	ruleId: string,
	label: string,
	protectedRanges: ProtectedRange[]
): TextChange[] {
	const escaped = marks.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
	const re = new RegExp(`([\\t \\u00A0\\u202F]*)([${escaped}])`, "g");
	return collectRegexChanges(
		text,
		re,
		ruleId,
		label,
		(m) => {
			const before = m[1] ?? "";
			const mark = m[2] ?? "";
			if (mark === ":") {
				const colonIdx = m.index + before.length;
				const p = text[colonIdx - 1];
				const n = text[colonIdx + 1];
				if (p && n && /\d/.test(p) && /\d/.test(n)) return null;
			}
			if (before === space) return null;
			return space + mark;
		},
		protectedRanges
	);
}
