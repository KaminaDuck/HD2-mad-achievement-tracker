import type { StatKey } from "@/shared/schemas/stats.ts";
import type { Confidence, ParseResult } from "@/shared/schemas/ocr.ts";

interface StatPattern {
  key: StatKey;
  label: RegExp;
  position: number;
  isTime: boolean;
}

/** Stat patterns in card order. Regex is OCR-tolerant (flexible spacing, partial labels).
 *  Career page labels use full English (e.g. "Objectives Completed", "In-Mission Time")
 *  while player card labels are abbreviated ("OBJECTIVES DONE", "TIME PLAYED"). */
const PATTERNS: StatPattern[] = [
  { key: "enemyKills", label: /ENEM\w*\s*KIL\w*/i, position: 0, isTime: false },
  { key: "terminidKills", label: /TERM\w*\s*KIL\w*/i, position: 1, isTime: false },
  { key: "automatonKills", label: /AUTO\w*\s*KIL\w*/i, position: 2, isTime: false },
  { key: "illuminateKills", label: /[TI]?L+U\w*\s*KIL\w*/i, position: 3, isTime: false },
  { key: "friendlyKills", label: /FRIE\w*\s*KIL\w*/i, position: 4, isTime: false },
  { key: "grenadeKills", label: /GREN\w*\s*[KR]IL\w*/i, position: 5, isTime: false },
  { key: "meleeKills", label: /MELE\w*\s*KIL\w*/i, position: 6, isTime: false },
  { key: "eagleKills", label: /EAGLE\s*KIL\w*/i, position: 7, isTime: false },
  { key: "deaths", label: /\bDEAT\w*/i, position: 8, isTime: false },
  { key: "shotsFired", label: /SHOT\w*\s*FIR\w*/i, position: 9, isTime: false },
  { key: "shotsHit", label: /SHOT\w*\s*HIT/i, position: 10, isTime: false },
  { key: "orbitalsUsed", label: /ORBI\w*\s*USE\w*/i, position: 11, isTime: false },
  { key: "defensiveStratagems", label: /DEFEN\w*\s*STRA\w*/i, position: 12, isTime: false },
  { key: "eagleStratagems", label: /EAGLE\s*STRA\w*/i, position: 13, isTime: false },
  { key: "supplyStratagems", label: /SUPP\w*\s*STRA\w*/i, position: 14, isTime: false },
  { key: "reinforceStratagems", label: /REINFOR\w*\s*STRA\w*/i, position: -1, isTime: false },
  { key: "totalStratagems", label: /TOTAL\s*STRA\w*/i, position: -1, isTime: false },
  { key: "objectivesCompleted", label: /OBJEC\w*\s*(?:DON|COMP)\w*/i, position: 15, isTime: false },
  { key: "missionsPlayed", label: /MISS\w*\s*PLAY\w*/i, position: 16, isTime: false },
  { key: "missionsWon", label: /MISS\w*\s*WON/i, position: 17, isTime: false },
  { key: "inMissionTimeSeconds", label: /(?:TIME\s*PLAY\w*|IN.?MISS\w*\s*TIME)/i, position: 18, isTime: true },
  { key: "samplesCollected", label: /\bSAMP\w*/i, position: 19, isTime: false },
  { key: "totalXp", label: /TOTA\w*\s*XP/i, position: 20, isTime: false },
];

/** Strip character model noise from a line by taking content after the last pipe separator. */
export function preprocessLine(line: string): string {
  // Strip trailing pipe
  let cleaned = line.replace(/\|\s*$/, "").trim();

  // Find last | separator — content after it is the stat
  const lastPipe = cleaned.lastIndexOf("|");
  if (lastPipe >= 0) {
    return cleaned.slice(lastPipe + 1).trim();
  }

  // Fallback: some garbled lines use [ instead of |
  const lastBracket = cleaned.lastIndexOf("[");
  if (lastBracket >= 0 && lastBracket < cleaned.length / 2) {
    return cleaned.slice(lastBracket + 1).trim();
  }

  return cleaned;
}

/** Extract a comma-separated number from text, handling tilde noise. */
export function extractNumber(text: string): number | null {
  const match = text.match(/~*\s*([\d,]+)/);
  if (!match?.[1]) return null;
  return parseInt(match[1].replace(/,/g, ""), 10);
}

/** Extract HH:MM:SS time string and convert to total seconds. */
export function extractTime(text: string): number | null {
  const match = text.match(/(\d+):(\d{2}):(\d{2})/);
  if (!match) return null;
  const hours = parseInt(match[1]!, 10);
  const minutes = parseInt(match[2]!, 10);
  const seconds = parseInt(match[3]!, 10);
  return hours * 3600 + minutes * 60 + seconds;
}

/** Find the first line index that looks like a stat row (contains ENEMY KILLS or similar). */
function findStatTableStart(lines: string[]): number {
  for (let i = 0; i < lines.length; i++) {
    if (PATTERNS[0]!.label.test(lines[i]!)) return i;
  }
  return -1;
}

/** Extract player name from header lines (before stat table). */
function extractPlayerName(rawLines: string[]): string | null {
  // Career page format: "Ducky [808th MB] %" followed by "CAREER © | Level 67 | ..."
  for (let i = 0; i < Math.min(rawLines.length, 8); i++) {
    if (/CAREER\s*[©®]?\s*\|/i.test(rawLines[i]!)) {
      // The line before "CAREER ©" has the player name on career pages
      if (i > 0) {
        const nameLine = rawLines[i - 1]!.trim();
        // Format: "Ducky [808th MB] %" — take first word before bracket/special chars
        const nameMatch = nameLine.match(/^(\w[\w-]*)/);
        if (nameMatch?.[1] && nameMatch[1].length >= 2) return nameMatch[1];
      }
    }
  }

  // Player card format: "| THUPER al" or "| GAMBLE =1"
  for (const line of rawLines.slice(0, 5)) {
    const cleaned = preprocessLine(line);
    // Skip known headers
    if (/BATTALION|LEVEL|CLAN|GLOBAL|COMMANDO|LEADERSHIP/i.test(cleaned)) continue;
    // Player name is the first word; rest is OCR noise (e.g. "THUPER al", "GAMBLE =1")
    const firstWord = cleaned.split(/\s/)[0]?.replace(/[^A-Za-z0-9_-]/g, "");
    if (firstWord && firstWord.length >= 2) return firstWord;
  }
  return null;
}

/** Try to match a label pattern against a line and extract its value. */
function tryLabelMatch(
  line: string,
  pattern: StatPattern,
): number | null {
  const labelMatch = pattern.label.exec(line);
  if (!labelMatch) return null;
  const afterLabel = line.slice(labelMatch.index + labelMatch[0].length);
  return pattern.isTime ? extractTime(afterLabel) : extractNumber(afterLabel);
}

/** Parse raw OCR text into structured stats with confidence levels. */
export function parseOcrText(rawText: string): ParseResult {
  const rawLines = rawText.split("\n").filter((l) => l.trim().length > 0);
  const cleanedLines = rawLines.map(preprocessLine);
  // Keep trimmed raw lines for career page matching — preprocessLine can strip
  // useful data when pipes appear in character model noise (right side of career page)
  const trimmedLines = rawLines.map((l) => l.trim());

  const playerName = extractPlayerName(rawLines);
  const statStart = findStatTableStart(cleanedLines);

  const stats: Partial<Record<StatKey, number>> = {};
  const confidence: Partial<Record<StatKey, Confidence>> = {};

  for (const pattern of PATTERNS) {
    // Strategy 1: label match on preprocessed lines (high confidence — player card)
    let found = false;
    for (const line of cleanedLines) {
      const value = tryLabelMatch(line, pattern);
      if (value !== null) {
        stats[pattern.key] = value;
        confidence[pattern.key] = "label";
        found = true;
        break;
      }
      // If label matched but value extraction failed, still break to avoid false positives
      if (pattern.label.test(line)) break;
    }

    // Strategy 1b: label match on raw trimmed lines (career page fallback —
    // catches lines where preprocessLine stripped the stat after a pipe)
    if (!found) {
      for (const line of trimmedLines) {
        const value = tryLabelMatch(line, pattern);
        if (value !== null) {
          stats[pattern.key] = value;
          confidence[pattern.key] = "label";
          found = true;
          break;
        }
        if (pattern.label.test(line)) break;
      }
    }

    // Strategy 2: positional fallback (low confidence)
    if (!found && statStart >= 0 && pattern.position >= 0) {
      const lineIndex = statStart + pattern.position;
      if (lineIndex < cleanedLines.length) {
        const line = cleanedLines[lineIndex]!;
        const value = pattern.isTime ? extractTime(line) : extractNumber(line);

        if (value !== null) {
          stats[pattern.key] = value;
          confidence[pattern.key] = "position";
        }
      }
    }
  }

  return { stats, confidence, playerName };
}
