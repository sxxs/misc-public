# SOP: Captions & Hashtags generieren

## Wann

Nachdem ein Post gerendert ist und vor dem Upload auf die Plattformen.

## Prinzipien

- **Nicht raten, systematisch testen.** Nach 24-72h pruefen welche Variante besser performt.
- **Pro Plattform verschiedene Texte.** Gleiche Caption auf allen Plattformen ist suboptimal.
- **Suchintention statt Buzzwords.** "Was wuerde jemand eintippen, der dieses Video sehen will?"
- **3-5 praezise Hashtags.** Keine generischen Tags (#fyp, #viral).
- **Erste Zeile = klares Thema.** Nicht "Dieses Video musst du sehen!!!" sondern den Inhalt benennen.

## Plattform-Unterschiede

| Plattform | Fokus | Hashtags | Caption-Stil |
|-----------|-------|----------|-------------|
| **TikTok** | Trend- und suchnah | 3-5 thematisch passende, Creative Center pruefen | Kulturell, Hook-orientiert, Keywords im Text |
| **YouTube Shorts** | Suchorientiert | #Shorts + 2-3 Keywords | Klarer Titel, SEO-Description, Keyword-Match |
| **Instagram Reels** | Hook + Packaging | 3-5 thematische | Klarer Hook, thematische Keywords im Caption |

## Datenmodell in plan.json

```json
{
  "social": {
    "tiktok": {
      "caption": "Warum Uni-Formulare absurd sind...",
      "hashtags": "#informatik #unileben #buerokratie"
    },
    "youtube": {
      "title": "Uni-Formulare sind absurd — 3 Beispiele",
      "description": "Warum digitale Formulare im Hochschulalltag...",
      "hashtags": "#Shorts #Informatik #UniAlltag"
    },
    "instagram": {
      "caption": "PDF ausdrucken, unterschreiben, einscannen, mailen...",
      "hashtags": "#informatik #studium #bamberg"
    }
  }
}
```

## Workflow

### Schritt 1: Suchintention formulieren

Pro Post einen Satz: "Was wuerde jemand eintippen, der dieses Video sehen will?"

Beispiel fuer einen Passwort-Post:
- TikTok-Suche: "passwort sicherheit tipps", "it sicherheit studium"
- YouTube-Suche: "passwort zu lang problem", "informatik studieren"
- Instagram: eher Entdeckung als Suche, aber Keywords in Caption helfen

### Schritt 2: Plattform-Tools pruefen

- **TikTok Creative Center**: Trending Hashtags + Keywords nach Region
- **YouTube Autocomplete**: Suchleiste fuer Long-Tail-Ideen
- **Instagram Explore**: Thematische Relevanz

### Schritt 3: Captions generieren lassen

```bash
# Per Claude Code CLI:
claude -p "Generiere Captions und Hashtags fuer diesen Post.
Post-Inhalt: [S1/S2/S3 Text hier]
Kanal: @herdom.bamberg (IT-Sicherheit, Uni Bamberg, trocken-lakonisch)
Zielgruppe: Schueler 16-19 und Bachelor-Studis

Erstelle fuer jede Plattform:
- TikTok: Caption (max 150 Zeichen) + 3-5 Hashtags
- YouTube Shorts: Titel (max 70 Zeichen) + Description (2-3 Saetze) + 3 Hashtags
- Instagram: Caption (1-2 Saetze) + 3-5 Hashtags

Regeln:
- Erste Zeile = klares Thema, kein Clickbait
- Hashtags muessen thematisch zum Inhalt passen
- Keine generischen Tags (#fyp #viral)
- Suchintention bedenken: Was wuerde die Zielgruppe eintippen?"
```

### Schritt 4: In plan.json eintragen

Ueber die Pipeline-UI oder direkt in plan.json das `social`-Objekt befuellen.

### Schritt 5: Nach 24-72h pruefen

- Impressionen / Reach
- Durchschnittliche Wiedergabedauer
- Shares / Saves
- Gewinnerformulierung fuer aehnliche Posts wiederverwenden

## Was NICHT funktioniert

- Generische Tags (#fyp #viral #xyzbca)
- 15+ irrelevante Hashtags
- KI-generische Descriptions ohne Suchbezug
- Dieselbe Caption auf allen Plattformen 1:1
- Trends die nicht zum Thema passen

## Spaeter: Slash-Command

Wenn der Workflow stabil ist, als `/caption <post-id>` Slash-Command automatisieren:
- Liest Post-Content aus plan.json
- Generiert plattformspezifische Captions
- Schreibt direkt in plan.json social-Objekt zurueck
