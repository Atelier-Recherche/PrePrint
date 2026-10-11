import type { RuleContext, RuleFlags, TextChange, TypoRule } from "../types";
import type { ProtectedRange } from "../engine/masker";
import { applyCleanup } from "./cleanup";
import { applyApostrophe } from "./apostrophe";
import { applyPunctuation } from "./punctuation";
import { applyQuotesDialogue } from "./quotes-dialogue";
import { applyDashes } from "./dashes";
import {
	applyMinusSign,
	applyNbHyphen,
	applyNumbersUnits,
	applyPhoneFr,
} from "./numbers-units";
import { applyTimeDate } from "./time-date";
import { applyAbbreviations } from "./abbreviations";
import { applyNotes } from "./notes";

type Runner = (
	text: string,
	ctx: RuleContext,
	ranges: ProtectedRange[]
) => TextChange[];

interface RuleDef {
	id: keyof RuleFlags;
	label: string;
	description: string;
	run: Runner;
}

export const RULE_DEFS: RuleDef[] = [
	{
		id: "cleanup",
		label: "Nettoyage",
		description: "Espaces doubles, fin de ligne, points de suspension",
		run: applyCleanup,
	},
	{
		id: "apostrophe",
		label: "Apostrophe",
		description: "Apostrophe typographique ’",
		run: applyApostrophe,
	},
	{
		id: "punctuation",
		label: "Ponctuation double",
		description: "Espaces insécables devant : ; ! ?",
		run: applyPunctuation,
	},
	{
		id: "quotesDialogue",
		label: "Guillemets & dialogue",
		description: "Guillemets français et tirets de réplique",
		run: applyQuotesDialogue,
	},
	{
		id: "dashes",
		label: "Tirets d'incise",
		description: "Tirets cadratins pour les incises",
		run: applyDashes,
	},
	{
		id: "numbersUnits",
		label: "Nombres & unités",
		description: "Milliers, unités, exposants, ordinaux",
		run: applyNumbersUnits,
	},
	{
		id: "timeDate",
		label: "Heures & dates",
		description: "Liaisons 18 h 30 et 27 juillet",
		run: applyTimeDate,
	},
	{
		id: "abbreviations",
		label: "Abréviations",
		description: "p. ex., n°, etc.",
		run: applyAbbreviations,
	},
	{
		id: "notes",
		label: "Appels de note",
		description: "Espace fine avant les appels",
		run: applyNotes,
	},
	{
		id: "phoneFr",
		label: "Téléphones FR",
		description: "Groupes 01 23 45 67 89",
		run: applyPhoneFr,
	},
	{
		id: "minusSign",
		label: "Signe moins",
		description: "Moins typographique −",
		run: applyMinusSign,
	},
	{
		id: "nbHyphen",
		label: "Traits d'union insécables",
		description: "Composés de la liste blanche",
		run: applyNbHyphen,
	},
];

export const RULE_LABELS: Record<string, string> = Object.fromEntries(
	RULE_DEFS.map((r) => [r.id, r.label])
);

export function getEnabledRunners(flags: RuleFlags): RuleDef[] {
	return RULE_DEFS.filter((r) => flags[r.id]);
}

export const RULES_AS_TYPO: TypoRule[] = RULE_DEFS.map((r) => ({
	id: r.id,
	label: r.label,
	description: r.description,
	apply: (text, ctx) => r.run(text, ctx, []),
}));
