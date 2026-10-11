import { Annotation, RangeSetBuilder } from "@codemirror/state";
import {
	Decoration,
	DecorationSet,
	EditorView,
	ViewPlugin,
	ViewUpdate,
} from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import type PreprintPlugin from "../main";
import { classForKind, scanInvisibles } from "./glyphs";

export const invisiblesRefreshAnno = Annotation.define<boolean>();

function isInProtectedNode(view: EditorView, from: number, to: number): boolean {
	let protectedHit = false;
	syntaxTree(view.state).iterate({
		from,
		to,
		enter(node: { type: { name: string } }) {
			const name = node.type.name;
			if (
				/code|Code|math|Math|comment|url|URL|hmd-codeblock|HyperMD-codeblock|inline-code|HyperMD-math/i.test(
					name
				)
			) {
				protectedHit = true;
				return false;
			}
			return true;
		},
	});
	return protectedHit;
}

function buildDecos(view: EditorView, plugin: PreprintPlugin): DecorationSet {
	if (!plugin.settings.invisiblesEnabled) return Decoration.none;

	const builder = new RangeSetBuilder<Decoration>();
	const showTabs = plugin.settings.showTabs;

	for (const { from, to } of view.visibleRanges) {
		const slice = view.state.doc.sliceString(from, to);
		const matches = scanInvisibles(slice, from, showTabs);
		for (const m of matches) {
			if (isInProtectedNode(view, m.from, m.to)) continue;
			builder.add(
				m.from,
				m.to,
				Decoration.mark({
					class: `pp-invisible ${classForKind(m.kind)}`,
					attributes: { "data-pp-kind": m.kind },
				})
			);
		}
	}

	return builder.finish();
}

export function createInvisiblesExtension(plugin: PreprintPlugin) {
	return ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;

			constructor(view: EditorView) {
				this.decorations = buildDecos(view, plugin);
			}

			update(update: ViewUpdate) {
				if (
					update.docChanged ||
					update.viewportChanged ||
					plugin._invisiblesDirty ||
					update.transactions.some((tr) => tr.annotation(invisiblesRefreshAnno))
				) {
					this.decorations = buildDecos(update.view, plugin);
					plugin._invisiblesDirty = false;
				}
			}
		},
		{
			decorations: (v) => v.decorations,
		}
	);
}

export function refreshInvisibles(view: EditorView): void {
	view.dispatch({ annotations: invisiblesRefreshAnno.of(true) });
}
