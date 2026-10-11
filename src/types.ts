/** Narrow no-break space */
export const NNBSP = "\u202F";
/** No-break space */
export const NBSP = "\u00A0";
/** Ellipsis */
export const ELLIPSIS = "\u2026";
/** Em dash */
export const EM_DASH = "\u2014";
/** En dash */
export const EN_DASH = "\u2013";
/** Typographic apostrophe */
export const APO = "\u2019";
/** Soft hyphen */
export const SOFT_HYPHEN = "\u00AD";
/** Non-breaking hyphen */
export const NB_HYPHEN = "\u2011";
/** Minus sign */
export const MINUS = "\u2212";

export type InvisibleKind =
	| "nbsp"
	| "nnbsp"
	| "em"
	| "en"
	| "trailing"
	| "softHyphen"
	| "nbHyphen"
	| "tab";

export interface InvisibleStyle {
	bg: string;
	glyph: string;
}

export type NestedQuotesStyle = "english" | "guillemets";

export interface RuleFlags {
	cleanup: boolean;
	apostrophe: boolean;
	punctuation: boolean;
	quotesDialogue: boolean;
	dashes: boolean;
	numbersUnits: boolean;
	timeDate: boolean;
	abbreviations: boolean;
	notes: boolean;
	phoneFr: boolean;
	minusSign: boolean;
	nbHyphen: boolean;
}

export interface Profile {
	id: string;
	name: string;
	rules: RuleFlags;
	nestedQuotes: NestedQuotesStyle;
}

export interface Whitelists {
	units: string[];
	exponents: Array<{ from: string; to: string }>;
	ordinals: Array<{ from: string; to: string }>;
	linkedWords: string[];
	months: string[];
	abbreviations: string[];
	nbHyphenCompounds: string[];
}

export interface PreprintSettings {
	invisiblesEnabled: boolean;
	showGlyphs: boolean;
	bgOpacity: number;
	invisibleStyles: Record<InvisibleKind, InvisibleStyle>;
	showTabs: boolean;
	activeProfileId: string;
	profiles: Profile[];
	whitelists: Whitelists;
	maskMath: boolean;
	maskWikilinks: boolean;
	previewLimit: number;
	dialogueDash: "em" | "en";
}

export interface TextChange {
	from: number;
	to: number;
	insert: string;
	ruleId: string;
	label: string;
	before: string;
	after: string;
}

export interface RuleContext {
	whitelists: Whitelists;
	nestedQuotes: NestedQuotesStyle;
	dialogueDash: string;
}

export interface TypoRule {
	id: keyof RuleFlags;
	label: string;
	description: string;
	apply: (text: string, ctx: RuleContext) => TextChange[];
}

export interface ConformStats {
	total: number;
	byRule: Record<string, number>;
}
