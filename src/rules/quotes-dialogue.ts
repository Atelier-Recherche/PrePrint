import {
	EM_DASH,
	EN_DASH,
	NBSP,
	type RuleContext,
	type TextChange,
} from "../types";
import { overlapsProtected, type ProtectedRange } from "../engine/masker";
import { change, collectRegexChanges } from "./helpers";

export function applyQuotesDialogue(
	text: string,
	ctx: RuleContext,
	ranges: ProtectedRange[]
): TextChange[] {
	const out: TextChange[] = [];
	const dash = ctx.dialogueDash;

	// Dialogue lines: start with - / – / — optionally after list marker indentation
	{
		const re = /(^|\n)([ \t]*)([-–—])([ \t\u00A0\u202F]*)(?=\S)/g;
		let m: RegExpExecArray | null;
		while ((m = re.exec(text)) !== null) {
			const lineStart = m.index + (m[1]?.length ?? 0);
			const indent = m[2] ?? "";
			const spaces = m[4] ?? "";
			const from = lineStart;
			const to = lineStart + indent.length + 1 + spaces.length;
			if (overlapsProtected(from, to, ranges)) continue;
			const insert = `${indent}${dash}${NBSP}`;
			const current = text.slice(from, to);
			if (current === insert) continue;
			out.push(change(from, to, insert, "quotesDialogue", "tiret de dialogue", text));
		}
	}

	// Convert straight/curly double quotes pairs to French guillemets
	out.push(...convertDoubleQuotes(text, ctx, ranges));

	return out;
}

function convertDoubleQuotes(
	text: string,
	ctx: RuleContext,
	ranges: ProtectedRange[]
): TextChange[] {
	const out: TextChange[] = [];
	let depth = 0;
	let i = 0;
	while (i < text.length) {
		if (overlapsProtected(i, i + 1, ranges)) {
			i++;
			continue;
		}
		const ch = text[i]!;
		const isOpenCurly = ch === "“";
		const isCloseCurly = ch === "”";
		const isStraight = ch === '"';

		if (!isOpenCurly && !isCloseCurly && !isStraight) {
			i++;
			continue;
		}

		const opening = isOpenCurly || (isStraight && depth % 2 === 0);
		if (opening) {
			depth++;
			const level = depth;
			const insert =
				level === 1
					? `«${NBSP}`
					: ctx.nestedQuotes === "guillemets"
						? `‹${NBSP}`
						: "“";
			out.push(
				change(i, i + 1, insert, "quotesDialogue", "guillemet ouvrant", text)
			);
		} else {
			const level = depth;
			depth = Math.max(0, depth - 1);
			const insert =
				level <= 1
					? `${NBSP}»`
					: ctx.nestedQuotes === "guillemets"
						? `${NBSP}›`
						: "”";
			out.push(
				change(i, i + 1, insert, "quotesDialogue", "guillemet fermant", text)
			);
		}
		i++;
	}

	// Normalize existing « » spacing
	out.push(
		...collectRegexChanges(
			text,
			/«[ \t\u00A0\u202F]*/g,
			"quotesDialogue",
			"espace après «",
			() => `«${NBSP}`,
			ranges
		)
	);
	out.push(
		...collectRegexChanges(
			text,
			/[ \t\u00A0\u202F]*»/g,
			"quotesDialogue",
			"espace avant »",
			() => `${NBSP}»`,
			ranges
		)
	);

	return out;
}

export { EM_DASH, EN_DASH };
