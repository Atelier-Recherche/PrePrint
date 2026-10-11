import {
	MINUS,
	NB_HYPHEN,
	NBSP,
	NNBSP,
	type RuleContext,
	type TextChange,
} from "../types";
import { overlapsProtected, type ProtectedRange } from "../engine/masker";
import { change, collectRegexChanges } from "./helpers";

function escapeRe(s: string): string {
	return s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
}

export function applyNumbersUnits(
	text: string,
	ctx: RuleContext,
	ranges: ProtectedRange[]
): TextChange[] {
	const out: TextChange[] = [];

	// Exponents whitelist
	for (const pair of ctx.whitelists.exponents) {
		const re = new RegExp(escapeRe(pair.from), "g");
		out.push(
			...collectRegexChanges(
				text,
				re,
				"numbersUnits",
				"exposant",
				() => pair.to,
				ranges
			)
		);
	}

	// Ordinals after roman or arabic numerals: XIXe → XIXᵉ
	for (const pair of [...ctx.whitelists.ordinals].sort(
		(a, b) => b.from.length - a.from.length
	)) {
		const re = new RegExp(
			`(\\b(?:\\d+|[IVXLCDM]+))(${escapeRe(pair.from)})\\b`,
			"gi"
		);
		out.push(
			...collectRegexChanges(
				text,
				re,
				"numbersUnits",
				"ordinal",
				(m) => `${m[1]}${pair.to}`,
				ranges
			)
		);
	}

	// Linked words after number: 20e siècle already handled ordinal; "XIXᵉ siècle"
	if (ctx.whitelists.linkedWords.length > 0) {
		const words = ctx.whitelists.linkedWords.map(escapeRe).join("|");
		const re = new RegExp(
			`(\\d+|[IVXLCDM]+[ᵉᵉʳʳᵉᵐ]*)[ \\t]+(${words})\\b`,
			"gi"
		);
		out.push(
			...collectRegexChanges(
				text,
				re,
				"numbersUnits",
				"mot lié",
				(m) => `${m[1]}${NBSP}${m[2]}`,
				ranges
			)
		);
	}

	// Number + unit
	if (ctx.whitelists.units.length > 0) {
		const units = [...ctx.whitelists.units]
			.sort((a, b) => b.length - a.length)
			.map(escapeRe)
			.join("|");
		const re = new RegExp(
			`(\\d+(?:[.,]\\d+)?)([ \\t\\u00A0\\u202F]*)(${units})\\b`,
			"g"
		);
		out.push(
			...collectRegexChanges(
				text,
				re,
				"numbersUnits",
				"nombre–unité",
				(m) => {
					const n = m[1]!;
					const sp = m[2]!;
					const u = m[3]!;
					if (sp === NNBSP) return null;
					return `${n}${NNBSP}${u}`;
				},
				ranges
			)
		);
	}

	// Degrees like 15°C / 15 °C
	out.push(
		...collectRegexChanges(
			text,
			/(\d+)([ \t\u00A0\u202F]*)°([ \t\u00A0\u202F]*)([CF])\b/g,
			"numbersUnits",
			"degré",
			(m) => `${m[1]}${NNBSP}°${m[4]}`,
			ranges
		)
	);

	// Thousands separators
	out.push(...applyThousands(text, ranges));

	return out;
}

function applyThousands(text: string, ranges: ProtectedRange[]): TextChange[] {
	const out: TextChange[] = [];
	const re = /\b(\d{1,3}(?:[ \u00A0\u202F]?\d{3})+)\b/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(text)) !== null) {
		const from = m.index;
		const to = from + m[0].length;
		if (overlapsProtected(from, to, ranges)) continue;
		const raw = m[1]!;
		const digits = raw.replace(/[ \u00A0\u202F]/g, "");
		if (digits.length < 4) continue;
		if (shouldSkipThousands(text, from, to, digits)) continue;
		const grouped = groupThousands(digits);
		if (grouped === raw) continue;
		out.push(change(from, to, grouped, "numbersUnits", "milliers", text));
	}
	return out;
}

function groupThousands(digits: string): string {
	const rev = digits.split("").reverse();
	const parts: string[] = [];
	for (let i = 0; i < rev.length; i += 3) {
		parts.push(rev.slice(i, i + 3).reverse().join(""));
	}
	return parts.reverse().join(NNBSP);
}

/** Years, page refs, postal codes, street numbers */
export function shouldSkipThousands(
	text: string,
	from: number,
	to: number,
	digits: string
): boolean {
	// Isolated year 1000–2999
	if (/^[12]\d{3}$/.test(digits)) {
		const before = text.slice(Math.max(0, from - 12), from).toLowerCase();
		const after = text.slice(to, to + 20).toLowerCase();
		// If clearly a quantity with unit right after, allow grouping — rare for years
		if (!/\b(p\.|page|pages|vol\.|n[°º]|rue|avenue|bd\.?|boulevard)\s*$/i.test(before)) {
			// year-like if followed by month or nothing numeric
			if (!/^\s*\d/.test(after)) return true;
		}
	}

	// French postal code: exactly 5 digits
	if (/^\d{5}$/.test(digits)) {
		const after = text.slice(to, to + 40);
		if (/^\s+[A-ZÀÂÄÉÈÊËÎÏÔÖÙÛÜŸÇ]/.test(after)) return true;
	}

	const before = text.slice(Math.max(0, from - 20), from);
	// Page numbers
	if (/(?:^|[^\w])(?:p\.|pp\.|page|pages)\s*$/i.test(before)) return true;
	// Street numbers: digit after rue/avenue pattern is the number itself — skip grouping short ones already handled; for long street nums rare
	if (/(?:^|[^\w])(?:rue|av\.|avenue|bd\.|boulevard|impasse|chemin|place)\s+$/i.test(before))
		return true;

	return false;
}

export function applyPhoneFr(
	text: string,
	_ctx: RuleContext,
	ranges: ProtectedRange[]
): TextChange[] {
	return collectRegexChanges(
		text,
		/\b0(\d)(?:[ .\u00A0\u202F-]?\d{2}){4}\b/g,
		"phoneFr",
		"téléphone FR",
		(m) => {
			const digits = m[0]!.replace(/\D/g, "");
			if (digits.length !== 10) return null;
			const g = digits.match(/.{1,2}/g);
			return g ? g.join(NNBSP) : null;
		},
		ranges
	);
}

export function applyMinusSign(
	text: string,
	_ctx: RuleContext,
	ranges: ProtectedRange[]
): TextChange[] {
	return collectRegexChanges(
		text,
		/(?<![A-Za-zÀ-ÿ])-(?=\d)/g,
		"minusSign",
		"signe moins",
		() => MINUS,
		ranges
	);
}

export function applyNbHyphen(
	text: string,
	ctx: RuleContext,
	ranges: ProtectedRange[]
): TextChange[] {
	const out: TextChange[] = [];
	for (const compound of ctx.whitelists.nbHyphenCompounds) {
		if (!compound.includes("-")) continue;
		const target = compound.replace(/-/g, NB_HYPHEN);
		const re = new RegExp(escapeRe(compound), "gi");
		out.push(
			...collectRegexChanges(
				text,
				re,
				"nbHyphen",
				"trait d'union insécable",
				() => target,
				ranges
			)
		);
	}
	return out;
}
