# Phase 0: OCR Feasibility Spike — Findings

**Date**: 2025-02-08
**Decision**: GO — OCR is viable for v1

## Summary

Tesseract.js 7.0.0 running in Bun successfully extracts all 21 stat fields from hd2clans.com player card images with 100% accuracy across 2 test cards.

## Test Results

| Card | Player | Stats Found | By Label | By Position | Accuracy | Time |
|------|--------|-------------|----------|-------------|----------|------|
| 1    | THUPER | 21/21       | 21       | 0           | 100%     | 2.2s |
| 2    | GAMBLE | 21/21       | 20       | 1           | 100%     | 3.2s |

## Card Image Format

- **Source**: `https://d2abtd9l41og8f.cloudfront.net/generated_cards/stamped/{hash}.png`
- **Dimensions**: 2000x2000 PNG
- **Size**: ~2.4-2.6 MB
- **Layout**: Player name + clan at top, character model on left, stats table on right
- **Stats**: 21 rows of `LABEL  VALUE  #CLAN_RANK  #GLOBAL_RANK`
- **Text**: White labels, yellow values, dark background

## Parsing Strategy

### Two-phase approach:

1. **Preprocessing**: Strip noise from character model overlay
   - Strip trailing `|` from lines
   - Split at last `|` separator (character model noise is always left of this)
   - Fallback: split at `[` when OCR misreads `|` as `[`

2. **Extraction**: Label match → positional fallback
   - **Primary**: Regex match stat label, extract first number after label position
   - **Fallback**: If label garbled, use known line position in stat table (stat table is always 21 rows in fixed order)

### OCR Noise Patterns Observed

| Issue | Example | Mitigation |
|-------|---------|------------|
| Character model overlay | `2 Sa— \| MELEE KILLS 37,014` | Strip before last `\|` |
| Label garbling | `GRENADEKILS` (missing L) | Lenient regex: `/GRENAD\w*\s*KIL\w*/i` |
| Label destruction | `[ORY TY (She 2,190,546` (SHOTS HIT) | Positional fallback |
| Mixed case | `sHOTS HIT`, `SHotsEReD` | Case-insensitive regex |
| Pipe misread | `[SHotsEReD` (`[` = misread `\|`) | `[` fallback in preprocessing |
| Tilde noise | `~~ 349,050` | Strip `~` in number extraction |
| Trailing pipe | `5,073,982 al v3 \|` | Strip trailing `\|` before split |

### Regex Patterns (working)

```typescript
/ENEMY\s*KILLS/i           // always clean
/TERMINID\s*KILLS/i        // sometimes no space
/AUTOMATON\s*KILLS/i
/ILLUMINATE\s*KILLS/i
/FRIENDLY\s*KILLS/i
/GRENAD\w*\s*KIL\w*/i      // handles GRENADEKILS
/MELEE\s*KILLS/i
/EAGLE\s*KILLS/i
/\bDEATHS\b/i
/SHOTS?\s*FIRED/i
/SHOTS?\s*HIT/i
/ORBITALS?\s*USED/i
/DEFEN\w*\s*STRATS?/i
/EAGLE\s*STRATS?/i
/SUPPLY\s*STRATS?/i
/OBJECTIVES?\s*DONE/i
/MISSIONS?\s*PLAYED/i
/MISSIONS?\s*WON/i
/TIME\s*PLAYED/i
/\bSAMPLES\b/i
/TOTAL\s*XP/i
```

### Number extraction: `/~*\s*([\d,]+)/` after label
### Time extraction: `/(\d+:\d{2}:\d{2})/` → hours*3600 + min*60 + sec

## Stat Table Position Map

Fixed order in every card (for positional fallback):

| Position | Stat Key | Label on Card |
|----------|----------|---------------|
| 0  | enemyKills | ENEMY KILLS |
| 1  | terminidKills | TERMINID KILLS |
| 2  | automatonKills | AUTOMATON KILLS |
| 3  | illuminateKills | ILLUMINATE KILLS |
| 4  | friendlyKills | FRIENDLY KILLS |
| 5  | grenadeKills | GRENADE KILLS |
| 6  | meleeKills | MELEE KILLS |
| 7  | eagleKills | EAGLE KILLS |
| 8  | deaths | DEATHS |
| 9  | shotsFired | SHOTS FIRED |
| 10 | shotsHit | SHOTS HIT |
| 11 | orbitalsUsed | ORBITALS USED |
| 12 | defensiveStratagems | DEFENSIVE STRATS |
| 13 | eagleStratagems | EAGLE STRATS |
| 14 | supplyStratagems | SUPPLY STRATS |
| 15 | objectivesCompleted | OBJECTIVES DONE |
| 16 | missionsPlayed | MISSIONS PLAYED |
| 17 | missionsWon | MISSIONS WON |
| 18 | inMissionTimeSeconds | TIME PLAYED |
| 19 | samplesCollected | SAMPLES |
| 20 | totalXp | TOTAL XP |

## Confidence Scoring

Tesseract.js v7 `recognize()` does not expose word-level confidence via `result.data.words` (returned empty array). For the OcrReview UI, confidence should be based on:

1. **Extraction method**: Label match = high confidence, positional fallback = low confidence
2. **Value sanity**: Flag values that seem anomalous (e.g., 0 kills for a high-level player)

## Dependencies

- `tesseract.js@7.0.0` — 13 packages, 694ms install
- Blocked postinstall: `opencollective-postinstall` (donation prompt, not functional)
- No WASM manual setup needed — tesseract.js handles it internally

## Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Card layout changes | Low | Stat order is consistent across all cards; positional fallback handles garbled labels |
| New stats added to card | Low | Parser ignores unknown lines; add new patterns as needed |
| Different character models cause worse garbling | Medium | Positional fallback handles total label destruction |
| Large image upload time | Low | 2.4MB images, 5MB limit is generous |
| OCR speed on slower hardware | Medium | 2-4s on dev machine; Docker may be slower. Acceptable for single-upload workflow |

## Recommendation

**Proceed with OCR for v1.** The extraction is reliable enough with the two-phase approach (label match + positional fallback). The OcrReview UI is still essential — users must verify before saving, especially for positional-fallback values.

## Test Fixtures Saved

- `tests/fixtures/sample-player-card.png` — THUPER (104th Wolfdivers, Level 150)
- `tests/fixtures/sample-player-card-2.png` — GAMBLE (104th Wolfdivers, Level 150)
- `tests/fixtures/sample-ocr-output.txt` — Raw Tesseract output (card 1)
- `tests/fixtures/sample-ocr-output-2.txt` — Raw Tesseract output (card 2)
- `tests/fixtures/sample-extracted-stats.json` — Extracted stats (card 1)
- `tests/fixtures/sample-extracted-stats-2.json` — Extracted stats (card 2)
