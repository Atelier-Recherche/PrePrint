import {
	ItemView,
	MarkdownView,
	Notice,
	Setting,
	WorkspaceLeaf,
} from "obsidian";
import type PreprintPlugin from "../main";
import { getActiveProfile } from "../settings";
import { RULE_DEFS } from "../rules";
import { previewConform } from "../engine/conform";
import type { RuleFlags, TextChange } from "../types";
import { StepByStepModal } from "./preview-modal";

export const PREPRINT_VIEW_TYPE = "preprint-view";

export class PreprintView extends ItemView {
	plugin: PreprintPlugin;
	private statsEl!: HTMLElement;
	private listEl!: HTMLElement;
	private pending: TextChange[] = [];
	private applyScope: "document" | "selection" = "document";

	constructor(leaf: WorkspaceLeaf, plugin: PreprintPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return PREPRINT_VIEW_TYPE;
	}

	getDisplayText(): string {
		return "Preprint";
	}

	getIcon(): string {
		return "baseline";
	}

	async onOpen(): Promise<void> {
		this.render();
	}

	async onClose(): Promise<void> {
		this.contentEl.empty();
	}

	render(): void {
		const root = this.contentEl;
		root.empty();
		root.addClass("preprint-view");

		root.createEl("h3", { text: "Preprint" });

		const profile = getActiveProfile(this.plugin.settings);

		new Setting(root)
			.setName("Profil")
			.addDropdown((dd) => {
				for (const p of this.plugin.settings.profiles) {
					dd.addOption(p.id, p.name);
				}
				dd.setValue(profile.id);
				dd.onChange(async (id) => {
					this.plugin.settings.activeProfileId = id;
					await this.plugin.saveSettings();
					this.render();
				});
			});

		new Setting(root)
			.setName("Portée")
			.addDropdown((dd) => {
				dd.addOption("document", "Document entier");
				dd.addOption("selection", "Sélection");
				dd.setValue(this.applyScope);
				dd.onChange((v) => {
					this.applyScope = v as "document" | "selection";
				});
			});

		root.createEl("h4", { text: "Règles actives" });
		for (const rule of RULE_DEFS) {
			new Setting(root)
				.setName(rule.label)
				.setDesc(rule.description)
				.addToggle((tg) => {
					tg.setValue(profile.rules[rule.id]);
					tg.onChange(async (val) => {
						const p = getActiveProfile(this.plugin.settings);
						p.rules[rule.id as keyof RuleFlags] = val;
						await this.plugin.saveSettings();
					});
				});
		}

		const actions = root.createDiv({ cls: "pp-actions" });
		new Setting(actions)
			.addButton((btn) =>
				btn.setButtonText("Prévisualiser").onClick(() => this.runPreview())
			)
			.addButton((btn) =>
				btn
					.setButtonText("Tout appliquer")
					.setCta()
					.onClick(() => this.applyAll())
			)
			.addButton((btn) =>
				btn.setButtonText("Pas à pas").onClick(() => this.runStepByStep())
			);

		this.statsEl = root.createDiv({ cls: "pp-stats" });
		this.statsEl.setText("Aucune prévisualisation.");
		this.listEl = root.createDiv({ cls: "pp-change-list" });

		const about = root.createDiv({ cls: "preprint-about" });
		about.setText(
			"Hors périmètre : césure automatique, mise en page, ligatures, conversion Typst. Ces aspects relèvent du moteur de composition (Typst)."
		);
	}

	private getEditorText(): { text: string; from: number; view: MarkdownView } | null {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) {
			new Notice("Ouvrez une note Markdown.");
			return null;
		}
		const editor = view.editor;
		if (this.applyScope === "selection") {
			const from = editor.posToOffset(editor.getCursor("from"));
			const to = editor.posToOffset(editor.getCursor("to"));
			if (from === to) {
				new Notice("Aucune sélection.");
				return null;
			}
			return { text: editor.getRange(editor.getCursor("from"), editor.getCursor("to")), from, view };
		}
		return { text: editor.getValue(), from: 0, view };
	}

	private runPreview(): void {
		const ctx = this.getEditorText();
		if (!ctx) return;
		const result = previewConform(ctx.text, this.plugin.settings);
		this.pending = result.changes.map((c) => ({
			...c,
			from: c.from + ctx.from,
			to: c.to + ctx.from,
		}));
		this.statsEl.setText(result.summary);
		this.renderChangeList(result.changes.slice(0, this.plugin.settings.previewLimit));
	}

	private renderChangeList(changes: TextChange[]): void {
		this.listEl.empty();
		if (changes.length === 0) {
			this.listEl.createDiv({ text: "Rien à signaler." });
			return;
		}
		for (const ch of changes) {
			const item = this.listEl.createDiv({ cls: "pp-change-item" });
			item.createDiv({
				cls: "pp-change-meta",
				text: `${ch.label} (${ch.ruleId})`,
			});
			item.createDiv({
				cls: "pp-change-sample",
				text: `« ${ch.before} » → « ${ch.after} »`,
			});
		}
	}

	private applyAll(): void {
		if (this.pending.length === 0) this.runPreview();
		if (this.pending.length === 0) {
			new Notice("Aucune modification.");
			return;
		}
		this.plugin.applyChangesToActiveEditor(this.pending);
		new Notice(this.statsEl.getText() || "Modifications appliquées.");
		this.pending = [];
		this.runPreview();
	}

	private runStepByStep(): void {
		const ctx = this.getEditorText();
		if (!ctx) return;
		const result = previewConform(ctx.text, this.plugin.settings);
		if (result.changes.length === 0) {
			new Notice("Aucune modification.");
			return;
		}
		const limited = result.changes.slice(0, this.plugin.settings.previewLimit);
		new StepByStepModal(this.app, limited, (accepted) => {
			const shifted = accepted.map((c) => ({
				...c,
				from: c.from + ctx.from,
				to: c.to + ctx.from,
			}));
			this.plugin.applyChangesToActiveEditor(shifted);
			new Notice(`${shifted.length} modification(s) acceptée(s).`);
			this.pending = [];
			this.render();
		}).open();
	}
}
