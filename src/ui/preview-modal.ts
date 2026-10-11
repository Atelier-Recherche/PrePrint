import { App, Modal, Setting } from "obsidian";
import type { TextChange } from "../types";

export class StepByStepModal extends Modal {
	private changes: TextChange[];
	private index = 0;
	private accepted: TextChange[] = [];
	private onDone: (accepted: TextChange[]) => void;
	private statusEl!: HTMLElement;
	private sampleEl!: HTMLElement;

	constructor(
		app: App,
		changes: TextChange[],
		onDone: (accepted: TextChange[]) => void
	) {
		super(app);
		this.changes = changes;
		this.onDone = onDone;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl("h2", { text: "Preprint — pas à pas" });
		this.statusEl = contentEl.createDiv({ cls: "pp-stats" });
		this.sampleEl = contentEl.createDiv({ cls: "pp-change-sample" });

		new Setting(contentEl)
			.addButton((btn) =>
				btn.setButtonText("Accepter").setCta().onClick(() => {
					const cur = this.changes[this.index];
					if (cur) this.accepted.push(cur);
					this.next();
				})
			)
			.addButton((btn) =>
				btn.setButtonText("Ignorer").onClick(() => this.next())
			)
			.addButton((btn) =>
				btn.setButtonText("Tout accepter").onClick(() => {
					this.accepted.push(...this.changes.slice(this.index));
					this.finish();
				})
			)
			.addButton((btn) =>
				btn.setButtonText("Annuler").onClick(() => {
					this.accepted = [];
					this.close();
				})
			);

		this.render();
	}

	private render(): void {
		const cur = this.changes[this.index];
		if (!cur) {
			this.finish();
			return;
		}
		this.statusEl.setText(
			`${this.index + 1} / ${this.changes.length} — ${cur.label} (${cur.ruleId})`
		);
		this.sampleEl.empty();
		this.sampleEl.createDiv({ text: `Avant : « ${cur.before} »` });
		this.sampleEl.createDiv({ text: `Après : « ${cur.after} »` });
	}

	private next(): void {
		this.index++;
		if (this.index >= this.changes.length) this.finish();
		else this.render();
	}

	private finish(): void {
		this.onDone(this.accepted);
		this.close();
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
