import {
	Editor,
	MarkdownView,
	Notice,
	Plugin,
	WorkspaceLeaf,
} from "obsidian";
import { DEFAULT_SETTINGS } from "./settings";
import type { PreprintSettings, TextChange } from "./types";
import { PreprintSettingTab } from "./settings-tab";
import { createInvisiblesExtension } from "./invisibles/extension";
import {
	applyInvisiblesTheme,
	removeInvisiblesTheme,
} from "./invisibles/theme";
import {
	PREPRINT_VIEW_TYPE,
	PreprintView,
} from "./ui/preprint-view";
import { previewConform } from "./engine/conform";
import { applyChangesToText } from "./engine/stats";

export default class PreprintPlugin extends Plugin {
	settings!: PreprintSettings;
	/** Hint for CM6 view plugin to rebuild decorations */
	_invisiblesDirty = false;
	private statusEl: HTMLElement | null = null;

	async onload(): Promise<void> {
		await this.loadSettings();
		this.applyTheme();

		this.registerEditorExtension(createInvisiblesExtension(this));

		this.registerView(
			PREPRINT_VIEW_TYPE,
			(leaf) => new PreprintView(leaf, this)
		);

		this.addRibbonIcon("baseline", "Ouvrir Preprint", () => {
			void this.activateView();
		});

		this.statusEl = this.addStatusBarItem();
		this.statusEl.addClass("preprint-status");
		this.statusEl.style.cursor = "pointer";
		this.statusEl.onclick = () => {
			void this.toggleInvisibles();
		};
		this.updateStatusBar();

		this.addCommand({
			id: "toggle-invisibles",
			name: "Basculer le révélateur d'invisibles",
			callback: () => {
				void this.toggleInvisibles();
			},
		});

		this.addCommand({
			id: "open-preprint-panel",
			name: "Ouvrir le panneau Preprint",
			callback: () => {
				void this.activateView();
			},
		});

		this.addCommand({
			id: "conform-active-note",
			name: "Conformer la note active (profil actuel)",
			editorCallback: (editor) => {
				this.conformEditor(editor, false);
			},
		});

		this.addCommand({
			id: "conform-selection",
			name: "Conformer la sélection (profil actuel)",
			editorCallback: (editor) => {
				this.conformEditor(editor, true);
			},
		});

		this.addSettingTab(new PreprintSettingTab(this.app, this));
	}

	onunload(): void {
		removeInvisiblesTheme();
	}

	async loadSettings(): Promise<void> {
		const data = (await this.loadData()) as Partial<PreprintSettings> | null;
		this.settings = {
			...DEFAULT_SETTINGS,
			...data,
			invisibleStyles: {
				...DEFAULT_SETTINGS.invisibleStyles,
				...(data?.invisibleStyles ?? {}),
			},
			whitelists: {
				...DEFAULT_SETTINGS.whitelists,
				...(data?.whitelists ?? {}),
			},
			profiles:
				data?.profiles && data.profiles.length > 0
					? data.profiles
					: DEFAULT_SETTINGS.profiles.map((p) => structuredClone(p)),
		};
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		this.applyTheme();
		this.updateStatusBar();
	}

	applyTheme(): void {
		applyInvisiblesTheme(this.settings);
	}

	refreshInvisiblesEverywhere(): void {
		this._invisiblesDirty = true;
		this.app.workspace.iterateAllLeaves((leaf) => {
			const view = leaf.view;
			if (view instanceof MarkdownView) {
				// Trigger CM6 update by a no-op transaction if possible
				const cm = (view.editor as unknown as { cm?: { dispatch?: (t: unknown) => void } }).cm;
				if (cm?.dispatch) {
					try {
						cm.dispatch({});
					} catch {
						/* ignore */
					}
				}
			}
		});
		this.updateStatusBar();
	}

	async toggleInvisibles(): Promise<void> {
		this.settings.invisiblesEnabled = !this.settings.invisiblesEnabled;
		await this.saveSettings();
		this.refreshInvisiblesEverywhere();
		new Notice(
			this.settings.invisiblesEnabled
				? "Preprint : révélateur activé"
				: "Preprint : révélateur désactivé"
		);
	}

	updateStatusBar(): void {
		if (!this.statusEl) return;
		const on = this.settings.invisiblesEnabled;
		this.statusEl.setText(on ? "Preprint ·" : "Preprint");
		this.statusEl.toggleClass("preprint-status-on", on);
		this.statusEl.toggleClass("preprint-status-off", !on);
		this.statusEl.setAttr(
			"aria-label",
			on ? "Révélateur Preprint activé" : "Révélateur Preprint désactivé"
		);
	}

	async activateView(): Promise<void> {
		const { workspace } = this.app;
		const existing = workspace.getLeavesOfType(PREPRINT_VIEW_TYPE);
		if (existing.length > 0) {
			const leaf = existing[0]!;
			if (leaf.isDeferred) await leaf.loadIfDeferred();
			workspace.revealLeaf(leaf);
			return;
		}

		const leaf = await workspace.ensureSideLeaf(PREPRINT_VIEW_TYPE, "right", {
			active: true,
		});
		if (leaf.isDeferred) await leaf.loadIfDeferred();
		workspace.revealLeaf(leaf);
	}

	conformEditor(editor: Editor, selectionOnly: boolean): void {
		let text: string;
		let from = 0;
		let to = 0;
		if (selectionOnly) {
			const f = editor.getCursor("from");
			const t = editor.getCursor("to");
			from = editor.posToOffset(f);
			to = editor.posToOffset(t);
			if (from === to) {
				new Notice("Aucune sélection.");
				return;
			}
			text = editor.getRange(f, t);
		} else {
			text = editor.getValue();
			to = text.length;
		}

		const result = previewConform(text, this.settings);
		if (result.changes.length === 0) {
			new Notice("Preprint : aucune modification.");
			return;
		}

		const shifted = result.changes.map((c) => ({
			...c,
			from: c.from + from,
			to: c.to + from,
		}));
		this.applyChangesToEditor(editor, shifted, selectionOnly ? { from, to, text } : null);
		new Notice(`Preprint : ${result.summary}`);
	}

	applyChangesToActiveEditor(changes: TextChange[]): void {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) {
			new Notice("Ouvrez une note Markdown.");
			return;
		}
		this.applyChangesToEditor(view.editor, changes, null);
	}

	/**
	 * Apply changes as a single replace when possible for clean undo.
	 * If changes cover a known slice, replace that slice; else whole document.
	 */
	applyChangesToEditor(
		editor: Editor,
		changes: TextChange[],
		slice: { from: number; to: number; text: string } | null
	): void {
		if (changes.length === 0) return;

		if (slice) {
			const local = changes.map((c) => ({
				...c,
				from: c.from - slice.from,
				to: c.to - slice.from,
			}));
			const next = applyChangesToText(slice.text, local);
			const fromPos = editor.offsetToPos(slice.from);
			const toPos = editor.offsetToPos(slice.to);
			editor.replaceRange(next, fromPos, toPos);
			return;
		}

		const full = editor.getValue();
		const next = applyChangesToText(full, changes);
		const start = editor.offsetToPos(0);
		const end = editor.offsetToPos(full.length);
		editor.replaceRange(next, start, end);
	}
}
