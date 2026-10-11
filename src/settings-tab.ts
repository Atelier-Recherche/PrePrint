import { App, PluginSettingTab, Setting } from "obsidian";
import type PreprintPlugin from "./main";
import {
	formatList,
	formatPairList,
	parseListText,
	parsePairList,
	resetInvisibleStyles,
	resetWhitelists,
} from "./settings";
import type { InvisibleKind } from "./types";
import { DEFAULT_PROFILES } from "./profiles/defaults";

const INVISIBLE_LABELS: Record<InvisibleKind, string> = {
	nbsp: "Espace insécable (NBSP)",
	nnbsp: "Espace fine insécable (NNBSP)",
	em: "Espace cadratin",
	en: "Espace demi-cadratin",
	trailing: "Espace en fin de ligne",
	softHyphen: "Trait d'union conditionnel",
	nbHyphen: "Trait d'union insécable",
	tab: "Tabulation",
};

export class PreprintSettingTab extends PluginSettingTab {
	plugin: PreprintPlugin;

	constructor(app: App, plugin: PreprintPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl("h2", { text: "Preprint" });

		this.sectionInvisibles(containerEl);
		this.sectionWhitelists(containerEl);
		this.sectionProfiles(containerEl);
		this.sectionMisc(containerEl);
	}

	private sectionInvisibles(containerEl: HTMLElement): void {
		containerEl.createEl("h3", { text: "Révélateur d'invisibles" });

		new Setting(containerEl)
			.setName("Activer le révélateur")
			.setDesc("Surbrille les espaces spéciaux sans modifier le document.")
			.addToggle((tg) =>
				tg.setValue(this.plugin.settings.invisiblesEnabled).onChange(async (v) => {
					this.plugin.settings.invisiblesEnabled = v;
					await this.plugin.saveSettings();
					this.plugin.refreshInvisiblesEverywhere();
				})
			);

		new Setting(containerEl)
			.setName("Afficher les glyphes")
			.setDesc("Symbole discret (·, ▭…) en plus du fond coloré.")
			.addToggle((tg) =>
				tg.setValue(this.plugin.settings.showGlyphs).onChange(async (v) => {
					this.plugin.settings.showGlyphs = v;
					await this.plugin.saveSettings();
					this.plugin.applyTheme();
				})
			);

		new Setting(containerEl)
			.setName("Révéler les tabulations")
			.addToggle((tg) =>
				tg.setValue(this.plugin.settings.showTabs).onChange(async (v) => {
					this.plugin.settings.showTabs = v;
					await this.plugin.saveSettings();
					this.plugin.refreshInvisiblesEverywhere();
				})
			);

		new Setting(containerEl)
			.setName("Opacité du fond")
			.setDesc(`${this.plugin.settings.bgOpacity} %`)
			.addSlider((sl) =>
				sl
					.setLimits(10, 100, 5)
					.setValue(this.plugin.settings.bgOpacity)
					.setDynamicTooltip()
					.onChange(async (v) => {
						this.plugin.settings.bgOpacity = v;
						await this.plugin.saveSettings();
						this.plugin.applyTheme();
						this.display();
					})
			);

		const kinds = Object.keys(INVISIBLE_LABELS) as InvisibleKind[];
		for (const kind of kinds) {
			const style = this.plugin.settings.invisibleStyles[kind];
			const row = new Setting(containerEl).setName(INVISIBLE_LABELS[kind]);

			row.addText((txt) => {
				txt.setPlaceholder("#rrggbb");
				txt.setValue(style.bg);
				txt.inputEl.type = "text";
				txt.onChange(async (v) => {
					this.plugin.settings.invisibleStyles[kind].bg = v.trim() || style.bg;
					await this.plugin.saveSettings();
					this.plugin.applyTheme();
				});
			});

			row.addText((txt) => {
				txt.setPlaceholder("Glyphe");
				txt.setValue(style.glyph);
				txt.inputEl.style.width = "3em";
				txt.onChange(async (v) => {
					this.plugin.settings.invisibleStyles[kind].glyph = v || "·";
					await this.plugin.saveSettings();
					this.plugin.applyTheme();
				});
			});

			// Color picker
			const color = row.controlEl.createEl("input", { type: "color" });
			color.value = style.bg.startsWith("#") ? style.bg : "#7eb6ff";
			color.addEventListener("input", async () => {
				this.plugin.settings.invisibleStyles[kind].bg = color.value;
				await this.plugin.saveSettings();
				this.plugin.applyTheme();
				this.display();
			});
		}

		new Setting(containerEl).addButton((btn) =>
			btn.setButtonText("Réinitialiser l'apparence").onClick(async () => {
				this.plugin.settings.invisibleStyles = resetInvisibleStyles();
				this.plugin.settings.bgOpacity = 45;
				this.plugin.settings.showGlyphs = true;
				await this.plugin.saveSettings();
				this.plugin.applyTheme();
				this.display();
			})
		);
	}

	private sectionWhitelists(containerEl: HTMLElement): void {
		containerEl.createEl("h3", { text: "Listes blanches" });
		containerEl.createEl("p", {
			text: "Une entrée par ligne. Les lignes # sont ignorées. Les listes sont globales (tous profils).",
			cls: "setting-item-description",
		});

		const wl = this.plugin.settings.whitelists;

		this.textAreaSetting(
			containerEl,
			"Unités / symboles",
			formatList(wl.units),
			async (raw) => {
				wl.units = parseListText(raw);
				await this.plugin.saveSettings();
			}
		);

		this.textAreaSetting(
			containerEl,
			"Exposants (source→cible)",
			formatPairList(wl.exponents),
			async (raw) => {
				wl.exponents = parsePairList(raw);
				await this.plugin.saveSettings();
			}
		);

		this.textAreaSetting(
			containerEl,
			"Ordinaux (source→cible)",
			formatPairList(wl.ordinals),
			async (raw) => {
				wl.ordinals = parsePairList(raw);
				await this.plugin.saveSettings();
			}
		);

		this.textAreaSetting(
			containerEl,
			"Mots liés après nombre",
			formatList(wl.linkedWords),
			async (raw) => {
				wl.linkedWords = parseListText(raw);
				await this.plugin.saveSettings();
			}
		);

		this.textAreaSetting(
			containerEl,
			"Mois (dates)",
			formatList(wl.months),
			async (raw) => {
				wl.months = parseListText(raw);
				await this.plugin.saveSettings();
			}
		);

		this.textAreaSetting(
			containerEl,
			"Abréviations liées",
			formatList(wl.abbreviations),
			async (raw) => {
				wl.abbreviations = parseListText(raw);
				await this.plugin.saveSettings();
			}
		);

		this.textAreaSetting(
			containerEl,
			"Composés à trait d'union insécable",
			formatList(wl.nbHyphenCompounds),
			async (raw) => {
				wl.nbHyphenCompounds = parseListText(raw);
				await this.plugin.saveSettings();
			}
		);

		new Setting(containerEl).addButton((btn) =>
			btn.setButtonText("Réinitialiser les listes").onClick(async () => {
				this.plugin.settings.whitelists = resetWhitelists();
				await this.plugin.saveSettings();
				this.display();
			})
		);
	}

	private sectionProfiles(containerEl: HTMLElement): void {
		containerEl.createEl("h3", { text: "Profils" });

		new Setting(containerEl)
			.setName("Profil actif")
			.addDropdown((dd) => {
				for (const p of this.plugin.settings.profiles) {
					dd.addOption(p.id, p.name);
				}
				dd.setValue(this.plugin.settings.activeProfileId);
				dd.onChange(async (id) => {
					this.plugin.settings.activeProfileId = id;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Dupliquer le profil actif")
			.addButton((btn) =>
				btn.setButtonText("Dupliquer").onClick(async () => {
					const src =
						this.plugin.settings.profiles.find(
							(p) => p.id === this.plugin.settings.activeProfileId
						) ?? this.plugin.settings.profiles[0];
					if (!src) return;
					const id = `custom-${Date.now()}`;
					this.plugin.settings.profiles.push({
						...structuredClone(src),
						id,
						name: `${src.name} (copie)`,
					});
					this.plugin.settings.activeProfileId = id;
					await this.plugin.saveSettings();
					this.display();
				})
			);

		new Setting(containerEl)
			.setName("Réinitialiser les profils par défaut")
			.addButton((btn) =>
				btn.setWarning().setButtonText("Réinitialiser").onClick(async () => {
					this.plugin.settings.profiles = DEFAULT_PROFILES.map((p) =>
						structuredClone(p)
					);
					this.plugin.settings.activeProfileId = DEFAULT_PROFILES[0]!.id;
					await this.plugin.saveSettings();
					this.display();
				})
			);
	}

	private sectionMisc(containerEl: HTMLElement): void {
		containerEl.createEl("h3", { text: "Autres options" });

		new Setting(containerEl)
			.setName("Masquer le math")
			.setDesc("Ne pas conformer le contenu $...$ / $$...$$.")
			.addToggle((tg) =>
				tg.setValue(this.plugin.settings.maskMath).onChange(async (v) => {
					this.plugin.settings.maskMath = v;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Masquer les wikilinks")
			.addToggle((tg) =>
				tg.setValue(this.plugin.settings.maskWikilinks).onChange(async (v) => {
					this.plugin.settings.maskWikilinks = v;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Tiret de dialogue")
			.addDropdown((dd) => {
				dd.addOption("em", "Cadratin —");
				dd.addOption("en", "Demi-cadratin –");
				dd.setValue(this.plugin.settings.dialogueDash);
				dd.onChange(async (v) => {
					this.plugin.settings.dialogueDash = v as "em" | "en";
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Plafond de prévisualisation")
			.addText((txt) => {
				txt.setValue(String(this.plugin.settings.previewLimit));
				txt.onChange(async (v) => {
					const n = parseInt(v, 10);
					if (!Number.isFinite(n) || n < 10) return;
					this.plugin.settings.previewLimit = n;
					await this.plugin.saveSettings();
				});
			});
	}

	private textAreaSetting(
		containerEl: HTMLElement,
		name: string,
		value: string,
		onChange: (raw: string) => Promise<void>
	): void {
		new Setting(containerEl)
			.setName(name)
			.setClass("preprint-whitelist")
			.addTextArea((ta) => {
				ta.setValue(value);
				ta.inputEl.rows = 5;
				ta.inputEl.style.width = "100%";
				ta.onChange((v) => {
					void onChange(v);
				});
			});
	}
}
