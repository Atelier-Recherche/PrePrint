<div align="center" id="head">

<table>
<tr>
<td><img src="readme-media/logo_preprint.png" alt="PrePrint" width="140" /></td>
<td align="left">
<h1 style="margin:0">PrePrint</h1>
<p style="margin:0.25em 0 0"><strong>Französische Typografie · Obsidian</strong><br/>Unsichtbare · Unicode-Konformation · Typst</p>
</td>
</tr>
</table>

<a href="https://atelier.atechnologie.fr/" title="l'Atelier – Verein für Buchherstellung und Forschungswerkzeuge"><img src="https://raw.githubusercontent.com/Atelier-Recherche/.github/main/profile/logo.jpg" alt="l'Atelier" width="200" /></a>  
<sub>Entwickelt von <a href="https://atelier.atechnologie.fr/">l'Atelier</a> — Buchherstellung und Forschungswerkzeuge (EHESS)</sub>

<p>
🇫🇷 <a href="README.md">Français</a> ·
🇬🇧 <a href="README.en.md">English</a> ·
🇩🇪 <a href="README.de.md"><b>Deutsch</b></a> ·
🇪🇸 <a href="README.es.md">Español</a>
</p>

<p>
<a href="https://atelier.atechnologie.fr/"><img src="https://img.shields.io/badge/🌐_l'Atelier-atelier.atechnologie.fr-2d5016?style=for-the-badge" alt="Website l'Atelier" /></a>
<a href="https://github.com/Atelier-Recherche/PrePrint"><img src="https://img.shields.io/badge/📦_Repository-GitHub-181717?style=for-the-badge&logo=github" alt="GitHub-Repository" /></a>
<a href="https://obsidian.md/plugins?search=BRAT#"><img src="https://img.shields.io/badge/⬇️_Obsidian_Plugin-BRAT-7c3aed?style=for-the-badge&logo=obsidian&logoColor=white" alt="Plugin über BRAT installieren" /></a>
</p>

</div>

---

## 📸 Vorschau

| Unsichtbare | Panel |
| :---: | :---: |
| <img src="readme-media/screen1.jpg" alt="Unsichtbare" width="400" /> | <img src="readme-media/screen2.jpg" alt="Panel" width="400" /> |

---
## 📖 Über

Obsidian-Plugin zur französischen typografischen Vorbereitung: Anzeige unsichtbarer Zeichen und Unicode-Konformation, bereit für Edition / Print (Typst usw.).

**Voraussetzung:** Obsidian ≥ 1.14.0

---

## ⬇️ Obsidian-Plugin (BRAT)

1. 🔌 **BRAT** installieren: [Obsidian — BRAT](https://obsidian.md/plugins?search=BRAT#)
2. ➕ Dieses Repository mit *« Add Beta plugin »* hinzufügen:  
   `https://github.com/Atelier-Recherche/PrePrint`

> 💡 Unsere Plugins können noch auf Freigabe im Obsidian-Katalog warten; BRAT ermöglicht Tests sofort. Siehe auch 🌐 [l’Atelier](https://atelier.atechnologie.fr/).

---

## ✨ Funktionen

- **Anzeige unsichtbarer Zeichen** — hebt geschützte Leerzeichen, schmale Leerzeichen, Bindestriche, Leerzeichen am Zeilenende, Sonderhyphens, Tabs hervor
- **Typo-Konformation** — wendet ein Regelprofil an (ganze Notiz oder Auswahl)
- **Preprint-Panel** — Vorschau der Änderungen vor dem Anwenden
- **Profile** — FR Edition, Web, Minimal (Regeln ein/aus)
- **Allowlists** — Einheiten, Monate, Abkürzungen, Komposita usw.
- **Maskierung** — Mathematik und Wikilinks während der Konformation geschützt

---

## 📐 Regeln

| Regel | Wirkung |
| --- | --- |
| Bereinigung | Doppelte Leerzeichen, Zeilenenden, Auslassungspunkte |
| Apostroph | `'` → `’` |
| Doppelte Interpunktion | Geschützte Leerzeichen vor `: ; ! ?` |
| Anführungszeichen & Dialog | Französische Anführungszeichen, Dialogstriche |
| Einschubstriche | Gevierte Striche für Einschübe |
| Zahlen & Einheiten | Tausender, Einheiten, Exponenten, Ordinalzahlen |
| Uhrzeiten & Daten | Verbindungen wie `18 h 30`, `27 juillet` |
| Abkürzungen | `p. ex.`, `n°`, `etc.`, … |
| Fußnotenverweise | Schmales Leerzeichen vor Verweisen |
| FR-Telefonnummern | Gruppen `01 23 45 67 89` (optional) |
| Minuszeichen | Typografisches Minus `−` (optional) |
| Geschützte Bindestriche | Komposita der Allowlist (optional) |

---

## ⌨️ Befehle

- Anzeige unsichtbarer Zeichen umschalten
- Preprint-Panel öffnen
- Aktive Notiz konformieren (aktuelles Profil)
- Auswahl konformieren (aktuelles Profil)

Shortcuts: Statusleiste (Klick zum Umschalten) und Ribbon-Icon.

---

## 🛠 Installation aus dem Quellcode (Dev / lokal)

```powershell
npm install
npm run build
.\Deploy-LocalPlugin.ps1
```

Standardmäßig kopiert das Skript das Plugin nach `D:\Notes\.obsidian\plugins\preprint`. Anderer Vault:

```powershell
.\Deploy-LocalPlugin.ps1 -TargetPluginDir "C:\pfad\zum\vault\.obsidian\plugins\preprint"
```

Ohne Rebuild: `.\Deploy-LocalPlugin.ps1 -SkipBuild`

Dann **Preprint** unter Einstellungen → Community-Plugins aktivieren.

---

## 💻 Entwicklung

```bash
npm install
npm run dev      # esbuild watch
npm run build    # Typecheck + Production-Bundle
npm test
```

Nützliche Struktur:

```
src/
  engine/       # Konformation, Maskierung, Stats
  invisibles/   # CodeMirror-Erweiterung + Theme
  rules/        # typografische Regeln
  profiles/     # Standardprofile
  ui/           # Panel & Vorschau
```

### Release

Sauberer Git-Baum, dann:

```powershell
.\Release-Plugin.ps1              # Patch erhöhen
.\Release-Plugin.ps1 -BumpKind Minor
.\Release-Plugin.ps1 -BumpKind Major
```

Erhöht `package.json` / `manifest.json` / `versions.json`, baut, commitet, taggt und pusht (für die GitHub-Release-Action).

---

## 📄 Lizenz

MIT

---

## 🌐 Links

- 🌐 [l’Atelier](https://atelier.atechnologie.fr/)
- 📦 [GitHub-Repository](https://github.com/Atelier-Recherche/PrePrint)
