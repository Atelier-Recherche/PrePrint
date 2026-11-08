<div align="center" id="head">

<table>
<tr>
<td><img src="readme-media/logo_preprint.png" alt="PrePrint" width="140" /></td>
<td align="left">
<h1 style="margin:0">PrePrint</h1>
<p style="margin:0.25em 0 0"><strong>French typography · Obsidian</strong><br/>Invisibles · Unicode conformation · Typst</p>
</td>
</tr>
</table>

<a href="https://atelier.atechnologie.fr/" title="l'Atelier – book-making and research tools association"><img src="https://raw.githubusercontent.com/Atelier-Recherche/.github/main/profile/logo.jpg" alt="l'Atelier" width="200" /></a>  
<sub>Developed by <a href="https://atelier.atechnologie.fr/">l'Atelier</a> — book-making and research tools (EHESS)</sub>

<p>
🇫🇷 <a href="README.md">Français</a> ·
🇬🇧 <a href="README.en.md"><b>English</b></a> ·
🇩🇪 <a href="README.de.md">Deutsch</a> ·
🇪🇸 <a href="README.es.md">Español</a>
</p>

<p>
<a href="https://atelier.atechnologie.fr/"><img src="https://img.shields.io/badge/🌐_l'Atelier-atelier.atechnologie.fr-2d5016?style=for-the-badge" alt="l'Atelier website" /></a>
<a href="https://github.com/Atelier-Recherche/PrePrint"><img src="https://img.shields.io/badge/📦_Repository-GitHub-181717?style=for-the-badge&logo=github" alt="GitHub repository" /></a>
<a href="https://obsidian.md/plugins?search=BRAT#"><img src="https://img.shields.io/badge/⬇️_Obsidian_Plugin-BRAT-7c3aed?style=for-the-badge&logo=obsidian&logoColor=white" alt="Install plugin via BRAT" /></a>
</p>

</div>

---

## 📸 Preview

| Invisibles | Panel |
| :---: | :---: |
| <img src="readme-media/screen1.jpg" alt="Invisibles" width="400" /> | <img src="readme-media/screen2.jpg" alt="Panel" width="400" /> |

---
## 📖 About

Obsidian plugin for French typographic preparation: invisible-character highlighter and Unicode conformation ready for editing / print (Typst, etc.).

**Prerequisite:** Obsidian ≥ 1.14.0

---

## ⬇️ Obsidian plugin (BRAT)

1. 🔌 Install **BRAT**: [Obsidian — BRAT](https://obsidian.md/plugins?search=BRAT#)
2. ➕ Add this repository with *« Add Beta plugin »*:  
   `https://github.com/Atelier-Recherche/PrePrint`

> 💡 Our plugins may be pending approval on the Obsidian catalog; BRAT lets you try them now. See also 🌐 [l’Atelier](https://atelier.atechnologie.fr/).

---

## ✨ Features

- **Invisible highlighter** — highlights non-breaking spaces, thin spaces, dashes, trailing spaces, special hyphens, tabs
- **Typo conformation** — applies a rule profile (whole note or selection)
- **Preprint panel** — preview changes before applying
- **Profiles** — FR Edition, Web, Minimal (rules on/off)
- **Allowlists** — units, months, abbreviations, compounds, etc.
- **Masking** — math and wikilinks protected during conformation

---

## 📐 Rules

| Rule | Effect |
| --- | --- |
| Cleanup | Double spaces, line endings, ellipses |
| Apostrophe | `'` → `’` |
| Double punctuation | Non-breaking spaces before `: ; ! ?` |
| Quotes & dialogue | French quotes, dialogue dashes |
| Parenthetical dashes | Em dashes for asides |
| Numbers & units | Thousands, units, exponents, ordinals |
| Times & dates | Joins such as `18 h 30`, `27 juillet` |
| Abbreviations | `p. ex.`, `n°`, `etc.`, … |
| Note calls | Thin space before note calls |
| FR phone numbers | Groups `01 23 45 67 89` (optional) |
| Minus sign | Typographic minus `−` (optional) |
| Non-breaking hyphens | Compounds from the allowlist (optional) |

---

## ⌨️ Commands

- Toggle invisible highlighter
- Open Preprint panel
- Conform active note (current profile)
- Conform selection (current profile)

Shortcuts: status bar (click to toggle invisibles) and ribbon icon.

---

## 🛠 Install from source (dev / local)

```powershell
npm install
npm run build
.\Deploy-LocalPlugin.ps1
```

By default the script copies the plugin to `D:\Notes\.obsidian\plugins\preprint`. Other vault:

```powershell
.\Deploy-LocalPlugin.ps1 -TargetPluginDir "C:\path\to\vault\.obsidian\plugins\preprint"
```

Without rebuild: `.\Deploy-LocalPlugin.ps1 -SkipBuild`

Then enable **Preprint** in Settings → Community plugins.

---

## 💻 Development

```bash
npm install
npm run dev      # watch esbuild
npm run build    # typecheck + production bundle
npm test
```

Useful structure:

```
src/
  engine/       # conformation, masking, stats
  invisibles/   # CodeMirror extension + theme
  rules/        # typographic rules
  profiles/     # default profiles
  ui/           # panel & preview
```

### Release

Clean Git tree, then:

```powershell
.\Release-Plugin.ps1              # bump patch
.\Release-Plugin.ps1 -BumpKind Minor
.\Release-Plugin.ps1 -BumpKind Major
```

Increments `package.json` / `manifest.json` / `versions.json`, builds, commits, tags and pushes (for the GitHub release Action).

---

## 📄 License

MIT

---

## 🌐 Links

- 🌐 [l’Atelier](https://atelier.atechnologie.fr/)
- 📦 [GitHub repository](https://github.com/Atelier-Recherche/PrePrint)
