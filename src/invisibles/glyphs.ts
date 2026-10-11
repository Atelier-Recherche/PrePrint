import type { InvisibleKind } from "../types";
import { NB_HYPHEN, NBSP, NNBSP, SOFT_HYPHEN } from "../types";

export interface InvisibleMatch {
	from: number;
	to: number;
	kind: InvisibleKind;
}

const KIND_CLASS: Record<InvisibleKind, string> = {
	nbsp: "pp-nbsp",
	nnbsp: "pp-nnbsp",
	em: "pp-em",
	en: "pp-en",
	trailing: "pp-trailing",
	softHyphen: "pp-soft-hyphen",
	nbHyphen: "pp-nb-hyphen",
	tab: "pp-tab",
};

export function classForKind(kind: InvisibleKind): string {
	return KIND_CLASS[kind];
}

/** Scan a document slice; `base` is the absolute offset of `slice` in the document. */
export function scanInvisibles(
	slice: string,
	base: number,
	showTabs: boolean
): InvisibleMatch[] {
	const out: InvisibleMatch[] = [];

	for (let i = 0; i < slice.length; i++) {
		const abs = base + i;
		const ch = slice[i]!;
		if (ch === NBSP) out.push({ from: abs, to: abs + 1, kind: "nbsp" });
		else if (ch === NNBSP) out.push({ from: abs, to: abs + 1, kind: "nnbsp" });
		else if (ch === "\u2003") out.push({ from: abs, to: abs + 1, kind: "em" });
		else if (ch === "\u2002") out.push({ from: abs, to: abs + 1, kind: "en" });
		else if (ch === SOFT_HYPHEN)
			out.push({ from: abs, to: abs + 1, kind: "softHyphen" });
		else if (ch === NB_HYPHEN)
			out.push({ from: abs, to: abs + 1, kind: "nbHyphen" });
		else if (showTabs && ch === "\t")
			out.push({ from: abs, to: abs + 1, kind: "tab" });
	}

	let lineStart = 0;
	for (let i = 0; i <= slice.length; i++) {
		const atEnd = i === slice.length;
		const ch = atEnd ? "" : slice[i]!;
		const isNl = ch === "\n";
		if (atEnd || isNl) {
			let end = i;
			if (end > 0 && slice[end - 1] === "\r") end--;
			let j = end - 1;
			while (j >= lineStart && (slice[j] === " " || slice[j] === "\t")) {
				j--;
			}
			const trailFrom = base + j + 1;
			const trailTo = base + end;
			if (trailTo > trailFrom) {
				out.push({ from: trailFrom, to: trailTo, kind: "trailing" });
			}
			lineStart = i + 1;
		}
	}

	return out.sort((a, b) => a.from - b.from);
}

export { KIND_CLASS };
