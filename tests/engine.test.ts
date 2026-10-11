import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { findProtectedRanges, isProtected } from "../src/engine/masker";
import { previewConform } from "../src/engine/conform";
import { DEFAULT_SETTINGS } from "../src/settings";
import { NBSP, NNBSP, ELLIPSIS, APO, EM_DASH } from "../src/types";
import { shouldSkipThousands } from "../src/rules/numbers-units";
import type { PreprintSettings } from "../src/types";
import { PROFILE_EDITION_FR } from "../src/profiles/defaults";

function settingsWithAll(): PreprintSettings {
	return {
		...structuredClone(DEFAULT_SETTINGS),
		activeProfileId: PROFILE_EDITION_FR.id,
		profiles: [structuredClone(PROFILE_EDITION_FR)],
	};
}

describe("masker", () => {
	it("protects frontmatter, code, urls", () => {
		const text = `---
title: test: value
---

Hello: world

\`inline: code\`

\`\`\`
block: code!
\`\`\`

See https://example.com/path?x=1
`;
		const ranges = findProtectedRanges(text, {
			maskMath: true,
			maskWikilinks: true,
		});
		const idxHello = text.indexOf("Hello");
		assert.equal(isProtected(idxHello, ranges), false);
		const idxInline = text.indexOf("inline:");
		assert.equal(isProtected(idxInline, ranges), true);
		const idxBlock = text.indexOf("block:");
		assert.equal(isProtected(idxBlock, ranges), true);
		const idxUrl = text.indexOf("https://");
		assert.equal(isProtected(idxUrl, ranges), true);
		const idxFm = text.indexOf("title:");
		assert.equal(isProtected(idxFm, ranges), true);
	});

	it("protects math and wikilinks", () => {
		const text = `A $a: b$ and $$c: d$$ and [[Note: link]]`;
		const ranges = findProtectedRanges(text, {
			maskMath: true,
			maskWikilinks: true,
		});
		assert.equal(isProtected(text.indexOf("a:"), ranges), true);
		assert.equal(isProtected(text.indexOf("c:"), ranges), true);
		assert.equal(isProtected(text.indexOf("Note:"), ranges), true);
	});
});

describe("cleanup & punctuation", () => {
	it("converts ellipsis and double spaces", () => {
		const s = settingsWithAll();
		const r = previewConform("Bonjour...  monde   ", s);
		assert.ok(r.textAfter.includes(ELLIPSIS));
		assert.ok(!r.textAfter.includes("  "));
	});

	it("adds NBSP before colon and NNBSP before !", () => {
		const s = settingsWithAll();
		const r = previewConform("Attention: stop!", s);
		assert.ok(r.textAfter.includes(`Attention${NBSP}:`));
		assert.ok(r.textAfter.includes(`stop${NNBSP}!`));
	});

	it("skips colon in times HH:MM", () => {
		const s = settingsWithAll();
		const r = previewConform("Il est 18:30 demain.", s);
		assert.ok(r.textAfter.includes("18:30"));
	});
});

describe("apostrophe quotes", () => {
	it("converts apostrophe", () => {
		const s = settingsWithAll();
		const r = previewConform("l'été", s);
		assert.equal(r.textAfter, `l${APO}été`);
	});

	it("converts straight quotes to guillemets", () => {
		const s = settingsWithAll();
		const r = previewConform(`Il dit "bonjour".`, s);
		assert.ok(r.textAfter.includes(`«${NBSP}bonjour${NBSP}»`));
	});
});

describe("numbers", () => {
	it("groups thousands with NNBSP", () => {
		const s = settingsWithAll();
		const r = previewConform("Il y a 10000 habitants.", s);
		assert.ok(r.textAfter.includes(`10${NNBSP}000`));
	});

	it("skips years", () => {
		assert.equal(shouldSkipThousands("En 2024 voici", 3, 7, "2024"), true);
	});

	it("links number and unit", () => {
		const s = settingsWithAll();
		const r = previewConform("Distance 100 km.", s);
		assert.ok(r.textAfter.includes(`100${NNBSP}km`));
	});
});

describe("time date", () => {
	it("normalizes hours", () => {
		const s = settingsWithAll();
		const r = previewConform("Rendez-vous a 18h30.", s);
		assert.ok(r.textAfter.includes(`18${NNBSP}h${NNBSP}30`));
	});

	it("links day and month", () => {
		const s = settingsWithAll();
		const r = previewConform("Le 27 juillet 1924.", s);
		assert.ok(r.textAfter.includes(`27${NBSP}juillet`));
	});
});

describe("dialogue", () => {
	it("normalizes dialogue dash", () => {
		const s = settingsWithAll();
		const r = previewConform("- Bonjour dit-il.", s);
		assert.ok(r.textAfter.startsWith(`${EM_DASH}${NBSP}Bonjour`));
	});
});

describe("does not touch code", () => {
	it("leaves fenced code alone", () => {
		const s = settingsWithAll();
		const text = "Avant: ok\n\n```\ncode: stay!\n```\n\nApres: ok";
		const r = previewConform(text, s);
		assert.ok(r.textAfter.includes("code: stay!"));
		assert.ok(r.textAfter.includes(`Avant${NBSP}:`));
	});
});
