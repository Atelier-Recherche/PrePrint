import type {
	ConformStats,
	PreprintSettings,
	RuleContext,
	TextChange,
} from "../types";
import { getActiveProfile } from "../settings";
import { EM_DASH, EN_DASH } from "../types";
import { findProtectedRanges } from "./masker";
import {
	aggregateStats,
	applyChangesToText,
	dedupeChanges,
	formatStats,
} from "./stats";
import { getEnabledRunners, RULE_LABELS } from "../rules";

export interface ConformResult {
	changes: TextChange[];
	stats: ConformStats;
	summary: string;
	textAfter: string;
}

export function buildRuleContext(settings: PreprintSettings): RuleContext {
	const profile = getActiveProfile(settings);
	return {
		whitelists: settings.whitelists,
		nestedQuotes: profile.nestedQuotes,
		dialogueDash: settings.dialogueDash === "en" ? EN_DASH : EM_DASH,
	};
}

/**
 * Preview all changes for the given text without writing.
 * Rules run sequentially on the original masked view; offsets refer to original text.
 * Sequential application on a working copy would shift offsets — we collect from original
 * with protected ranges, then dedupe overlaps (earlier rules win by RULE_DEFS order).
 */
export function previewConform(
	text: string,
	settings: PreprintSettings
): ConformResult {
	const profile = getActiveProfile(settings);
	const ctx = buildRuleContext(settings);
	const ranges = findProtectedRanges(text, {
		maskMath: settings.maskMath,
		maskWikilinks: settings.maskWikilinks,
	});

	const all: TextChange[] = [];
	for (const rule of getEnabledRunners(profile.rules)) {
		all.push(...rule.run(text, ctx, ranges));
	}

	const changes = dedupeChanges(all);
	const stats = aggregateStats(changes);
	const summary = formatStats(stats, RULE_LABELS);
	const textAfter = applyChangesToText(text, changes);

	return { changes, stats, summary, textAfter };
}

/**
 * Multi-pass: re-run until stable or max passes (handles dependencies lightly).
 */
export function previewConformMultipass(
	text: string,
	settings: PreprintSettings,
	maxPasses = 3
): ConformResult {
	let current = text;
	const merged: TextChange[] = [];
	// For editor application we need changes relative to the ORIGINAL text only.
	// So we do a single pass for apply; multipass only for preview of final text.
	let last = previewConform(current, settings);
	for (let i = 0; i < maxPasses; i++) {
		if (last.changes.length === 0) break;
		if (i === 0) merged.push(...last.changes);
		current = last.textAfter;
		const next = previewConform(current, settings);
		if (next.changes.length === 0) {
			last = {
				changes: merged,
				stats: aggregateStats(merged),
				summary: formatStats(aggregateStats(merged), RULE_LABELS),
				textAfter: current,
			};
			break;
		}
		// Further passes only refine textAfter for display; editor apply uses first-pass offsets
		current = next.textAfter;
		last = {
			changes: merged,
			stats: aggregateStats(merged),
			summary: formatStats(aggregateStats(merged), RULE_LABELS),
			textAfter: current,
		};
	}
	return last;
}

export { RULE_LABELS, applyChangesToText };
