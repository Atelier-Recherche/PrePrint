export interface ProtectedRange {
	from: number;
	to: number;
}

export interface MaskerOptions {
	maskMath: boolean;
	maskWikilinks: boolean;
}

/**
 * Collect protected Markdown ranges so typography rules skip them.
 * Ranges are half-open [from, to).
 */
export function findProtectedRanges(
	text: string,
	options: MaskerOptions
): ProtectedRange[] {
	const ranges: ProtectedRange[] = [];

	const push = (from: number, to: number) => {
		if (to > from) ranges.push({ from, to });
	};

	// Frontmatter
	if (text.startsWith("---")) {
		const end = text.indexOf("\n---", 3);
		if (end !== -1) {
			const close = end + 4;
			push(0, Math.min(close, text.length));
		}
	}

	// Fenced code blocks
	{
		const re = /^(`{3,}|~{3,}).*$/gm;
		let open: RegExpExecArray | null;
		while ((open = re.exec(text)) !== null) {
			const marker = open[1] ?? "```";
			const start = open.index;
			const after = open.index + open[0].length;
			const closeRe = new RegExp(`^${marker[0]}{${marker.length},}\\s*$`, "m");
			const rest = text.slice(after);
			const closeMatch = closeRe.exec(rest);
			const end = closeMatch
				? after + closeMatch.index + closeMatch[0].length
				: text.length;
			push(start, end);
			re.lastIndex = end;
		}
	}

	// Inline code
	{
		const re = /`[^`\n]+`/g;
		let m: RegExpExecArray | null;
		while ((m = re.exec(text)) !== null) {
			push(m.index, m.index + m[0].length);
		}
	}

	// HTML tags
	{
		const re = /<\/?[A-Za-z][^>\n]*>/g;
		let m: RegExpExecArray | null;
		while ((m = re.exec(text)) !== null) {
			push(m.index, m.index + m[0].length);
		}
	}

	// Autolinks <http...>
	{
		const re = /<https?:\/\/[^>\s]+>/gi;
		let m: RegExpExecArray | null;
		while ((m = re.exec(text)) !== null) {
			push(m.index, m.index + m[0].length);
		}
	}

	// Markdown links [text](url) — protect URL part primarily, and full for safety on url
	{
		const re = /\[[^\]]*\]\(([^)]+)\)/g;
		let m: RegExpExecArray | null;
		while ((m = re.exec(text)) !== null) {
			push(m.index, m.index + m[0].length);
		}
	}

	// Bare URLs
	{
		const re = /https?:\/\/[^\s<>)\]}"']+/gi;
		let m: RegExpExecArray | null;
		while ((m = re.exec(text)) !== null) {
			push(m.index, m.index + m[0].length);
		}
	}

	if (options.maskMath) {
		// Display math $$...$$
		{
			const re = /\$\$[\s\S]*?\$\$/g;
			let m: RegExpExecArray | null;
			while ((m = re.exec(text)) !== null) {
				push(m.index, m.index + m[0].length);
			}
		}
		// Inline math $...$ (simple, non-greedy, no newlines)
		{
			const re = /(?<!\$)\$(?!\$)([^$\n]+)\$(?!\$)/g;
			let m: RegExpExecArray | null;
			while ((m = re.exec(text)) !== null) {
				push(m.index, m.index + m[0].length);
			}
		}
	}

	if (options.maskWikilinks) {
		const re = /\[\[[^\]]+\]\]/g;
		let m: RegExpExecArray | null;
		while ((m = re.exec(text)) !== null) {
			push(m.index, m.index + m[0].length);
		}
	}

	return mergeRanges(ranges);
}

export function mergeRanges(ranges: ProtectedRange[]): ProtectedRange[] {
	if (ranges.length === 0) return [];
	const sorted = [...ranges].sort((a, b) => a.from - b.from || a.to - b.to);
	const out: ProtectedRange[] = [];
	let cur = { ...sorted[0]! };
	for (let i = 1; i < sorted.length; i++) {
		const r = sorted[i]!;
		if (r.from <= cur.to) {
			cur.to = Math.max(cur.to, r.to);
		} else {
			out.push(cur);
			cur = { ...r };
		}
	}
	out.push(cur);
	return out;
}

export function isProtected(
	index: number,
	ranges: ProtectedRange[]
): boolean {
	// binary search
	let lo = 0;
	let hi = ranges.length - 1;
	while (lo <= hi) {
		const mid = (lo + hi) >> 1;
		const r = ranges[mid]!;
		if (index < r.from) hi = mid - 1;
		else if (index >= r.to) lo = mid + 1;
		else return true;
	}
	return false;
}

export function overlapsProtected(
	from: number,
	to: number,
	ranges: ProtectedRange[]
): boolean {
	for (const r of ranges) {
		if (r.from >= to) break;
		if (r.to > from && r.from < to) return true;
	}
	return false;
}

/** Replace protected ranges with spaces so regex can run safely, then map back. */
export function maskText(
	text: string,
	ranges: ProtectedRange[]
): string {
	if (ranges.length === 0) return text;
	const chars = text.split("");
	for (const r of ranges) {
		for (let i = r.from; i < r.to && i < chars.length; i++) {
			const ch = chars[i]!;
			chars[i] = ch === "\n" || ch === "\r" ? ch : " ";
		}
	}
	return chars.join("");
}
