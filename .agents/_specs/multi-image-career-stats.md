# Feature: Multi-Image Career Page Stats Capture

## Feature Description

The player card screenshot only shows 21 of 23 stats (`reinforceStratagems` and `totalStratagems` are missing). The in-game career page contains all stats but spans 2 screenshots. This feature allows users to upload either a single player card, multiple career page screenshots, or both — then merges the OCR results from all images into a single stat set for review.

## User Story

As a Helldiver tracking my achievements,
I want to upload my career page screenshots in addition to (or instead of) my player card,
So that all 23 stats are captured without manual entry.

## Problem Statement

The current upload flow only accepts a single image. The player card is missing `reinforceStratagems` and `totalStratagems`, which must be entered manually. The in-game career page has all stats but requires 2 screenshots to capture everything. There is no way to upload and merge multiple images.

## Solution Statement

Extend the upload system to accept 1-3 images in a single batch. Run OCR and parsing on each image independently, then merge the results — preferring higher-confidence matches when the same stat appears in multiple images. Present the merged result for review in the existing OcrReview flow. The parser will be extended with career page patterns once fixture analysis reveals the layout.

## Relevant Files

Use these files to implement the feature:

**Server — upload route (multi-file handling):**
- `src/server/routes/upload.ts` — Currently accepts a single `file` field. Must accept multiple files and return merged results.
- `src/server/services/ocr.ts` — `recognizeImage()` processes a single image. Called once per uploaded image.
- `src/server/services/parser.ts` — `parseOcrText()` parses a single OCR text blob. Called once per image. Needs career page patterns added after fixture analysis.

**Server — merge logic (new):**
- `src/server/services/parser.ts` — Add a `mergeResults()` function that combines multiple `ParseResult` objects, preferring `label` confidence over `position`.

**Client — upload flow (multi-image UI):**
- `src/client/routes/upload.tsx` — State machine needs to handle multiple images. Upload step should allow adding multiple files before submitting.
- `src/client/components/ImageUploader.tsx` — Currently handles a single file drop/select. Must support accumulating multiple files with previews and a remove button per image.
- `src/client/mutations/upload.ts` — `useUploadImage` sends a single file. Must send multiple files in one request (or one at a time with client-side merge).

**Shared schemas:**
- `src/shared/schemas/ocr.ts` — (Created in post-review-cleanup) `ParseResult` and `Confidence` types used across the merge boundary.

**Test fixtures (user will add):**
- `tests/fixtures/career-page-1.png` — First career page screenshot (user provides)
- `tests/fixtures/career-page-2.png` — Second career page screenshot (user provides)
- `tests/fixtures/career-page-ocr-1.txt` — OCR output from career page 1 (generated after running OCR on fixture)
- `tests/fixtures/career-page-ocr-2.txt` — OCR output from career page 2 (generated after running OCR on fixture)
- `tests/fixtures/career-page-expected-stats.json` — Expected merged stats from both career pages (user verifies)

### New Files
- `src/server/services/merger.ts` — `mergeParseResults()` function: takes an array of `ParseResult`, returns a single merged `ParseResult` with best-confidence values
- `src/client/lib/stat-fields.ts` — (Created in post-review-cleanup) Shared `STAT_GROUPS` used by the multi-image preview
- `tests/fixtures/career-page-*.{png,txt,json}` — Career page fixture files (user provides images, OCR output generated)

## Implementation Plan

### Phase 1: Foundation (fixtures + merge logic)
- User adds career page screenshots to `tests/fixtures/`
- Run OCR on each fixture, save raw text output to `tests/fixtures/career-page-ocr-{1,2}.txt`
- Analyze the OCR output to determine career page layout and stat labels
- Add career page stat patterns to `parser.ts` (or create a separate pattern set if the layout differs significantly)
- Build `mergeParseResults()` function in `merger.ts` with tests
- Merge strategy: for each `StatKey`, take the value with highest confidence (`label` > `position` > absent). If same confidence level, prefer the first image that found it.

### Phase 2: Core Implementation (server multi-upload)
- Modify `upload.ts` route to accept `file` as a single file OR `files` / `file[]` as multiple files
- Process each file through OCR + parser independently
- Merge all `ParseResult` objects using `mergeParseResults()`
- Return the merged result in the same response shape (stats, confidence, playerName)
- Player name: take from the first image that provides one

### Phase 3: Integration (client multi-image flow)
- Extend `ImageUploader` to accumulate multiple files with thumbnail previews
- Add per-image remove button and "Add another image" affordance
- Show count indicator (e.g., "2 of 3 images added")
- Upload all images in a single request when user clicks "Process"
- The rest of the flow (OcrReview, save) remains unchanged since the response shape is the same

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### Step 1: Generate career page OCR fixtures

**Prerequisite**: User has added career page screenshots to `tests/fixtures/`.

- Run OCR on each career page fixture image using the existing `recognizeImage()` function
- Save raw OCR text to `tests/fixtures/career-page-ocr-1.txt` and `career-page-ocr-2.txt`
- Analyze the output to determine:
  - What stat labels appear on each page
  - Whether the label format matches existing patterns or needs new ones
  - Whether the layout is tabular (label + value) like the player card or different
- Document findings in a comment at the top of the fixture text files

### Step 2: Add career page parser patterns

Based on the fixture analysis from Step 1:

- If the career page uses the same label/value format as the player card, the existing `PATTERNS` array may already match most stats. Verify each career page stat against existing patterns.
- Add any new patterns needed for career-page-specific labels (especially `reinforceStratagems` and `totalStratagems` which are not on the player card)
- If the career page layout is fundamentally different, create a separate `CAREER_PATTERNS` array with its own positional indices
- Add a `parseCareerPageText()` function if patterns differ significantly, or extend `parseOcrText()` to handle both formats
- The parser should auto-detect whether text is from a player card or career page based on header content or label patterns

### Step 3: Create merge logic with tests

- Create `src/server/services/merger.ts`:
  ```typescript
  import type { ParseResult } from "@/shared/schemas/ocr.ts";

  export function mergeParseResults(results: ParseResult[]): ParseResult
  ```
- Merge strategy:
  - For each `StatKey`, iterate through results in order
  - Take the first value found with `label` confidence
  - If no `label` match, take the first value with `position` confidence
  - If no match in any result, the stat remains absent
  - `playerName`: take from the first result that has a non-null `playerName`
  - `confidence`: set to the confidence level of the value that was chosen
- Create `src/server/services/merger.test.ts` with tests:
  - Merging empty array returns empty ParseResult
  - Single result returns unchanged
  - Two results: label confidence wins over position confidence for same stat
  - Two results: earlier result wins when same confidence level
  - Stats from different images combine (no overlap)
  - Player name from first image used when both have names
  - Player name from second image used when first is null

### Step 4: Update upload route for multi-file

- In `src/server/routes/upload.ts`:
  - Parse body for multiple file fields: `body["file"]` could be a single `File` or check for `body["files[]"]` / iterate `body` entries
  - For Hono multipart, the idiomatic way is to use `c.req.parseBody({ all: true })` which returns arrays for repeated field names
  - Validate each file (MIME type, size) — reject the entire request if any file is invalid
  - Cap at 3 files maximum (1 player card + 2 career pages)
  - Run OCR + parse on each file independently (can be parallelized with `Promise.all`)
  - Merge results using `mergeParseResults()`
  - Return the merged result with the same response shape:
    ```typescript
    { stats, confidence, playerName, rawText }
    ```
  - `rawText`: join all OCR texts with a separator for debugging
  - Maintain backward compatibility: a single file upload still works exactly as before

### Step 5: Update upload mutation

- In `src/client/mutations/upload.ts`:
  - Change `useUploadImage` to accept `File[]` instead of `File`
  - Build a `FormData` with multiple file entries:
    ```typescript
    const formData = new FormData();
    for (const file of files) {
      formData.append("file", file);
    }
    ```
  - Use `client.api.upload.$post` with the multi-file form data
  - Response shape is unchanged — the server returns merged results

### Step 6: Extend ImageUploader for multiple files

- In `src/client/components/ImageUploader.tsx`:
  - Change props from `onUpload: (file: File) => void` to `onUpload: (files: File[]) => void`
  - Track `files: File[]` and `previews: string[]` state (instead of single file/preview)
  - On file add (drop or select): append to the files array, create preview URL
  - Show thumbnail grid of added images with a remove button (X) on each
  - Add "Add another image" button (disabled when at 3 files)
  - Show "Process N image(s)" submit button when at least 1 file is added
  - Call `onUpload(files)` when the user clicks the submit button (not on each file add)
  - Revoke all preview URLs on unmount or when files change
  - Accept attribute remains `image/png,image/jpeg`

### Step 7: Update upload route page

- In `src/client/routes/upload.tsx`:
  - Update `handleUpload` to pass `File[]` from the new `ImageUploader`
  - The `uploadMutation.mutate(files, ...)` call passes the array
  - The `onSuccess` handler and `Step` type remain unchanged — the server returns the same shape
  - Update page title or add subtitle explaining multi-image support:
    - "Upload Player Card or Career Pages"
    - Helper text: "Upload your player card, career page screenshots, or both. Career stats span 2 pages."

### Step 8: Create expected stats fixture and run parser tests

- After Steps 1-2, create `tests/fixtures/career-page-expected-stats.json` with the expected merged output from both career pages
- Add parser tests in `parser.test.ts` for career page OCR text:
  - Parse career page 1 text — verify extracted stats
  - Parse career page 2 text — verify extracted stats
  - Verify career pages capture `reinforceStratagems` and `totalStratagems`
- Add merger tests using real fixture data:
  - Merge player card + both career pages — verify all 23 stat keys present
  - Merge just career pages — verify all stats captured without player card

### Step 9: Run validation commands

Run all validation commands from the section below.

## Testing Strategy

### Unit Tests
- `merger.test.ts`: mergeParseResults with various combinations (empty, single, overlap, no overlap, confidence priority)
- `parser.test.ts`: career page OCR parsing with fixture data (both career pages)

### Integration Tests
- Upload route: multi-file upload returns merged stats
- Upload route: single file still works (backward compatibility)
- Upload route: rejects when >3 files
- Upload route: rejects when any file has invalid MIME type

### Edge Cases
- Upload 0 files (should return 400)
- Upload 1 file (backward compatible — same as today)
- Upload 3 files (max — player card + 2 career pages)
- Upload 4 files (rejected — over limit)
- Mix of valid and invalid files (entire request rejected)
- Career page with no recognizable stats (returns empty partial)
- Overlapping stats with different confidence levels (label wins)
- Same stat in all 3 images at same confidence (first image wins)

## Acceptance Criteria

- User can upload 1-3 images in a single batch from the upload page
- Images are processed via OCR individually, then merged into one stat set
- Merged results appear in the existing OcrReview flow with correct confidence indicators
- Career page screenshots capture `reinforceStratagems` and `totalStratagems` (once patterns are added)
- Single-image upload remains backward compatible (no UX regression)
- All existing parser tests pass
- New merger tests pass
- New parser tests for career pages pass
- `bun run typecheck` passes
- `bun run build` succeeds

## Validation Commands

Execute every command to validate the feature works correctly with zero regressions.

- `bun run typecheck` — TypeScript compilation must pass
- `bun test` — All tests pass (existing parser tests + new merger tests + new career page parser tests)
- `bun run build` — Production build succeeds
- `grep -r "onUpload.*File\b[^s\[]" src/client/components/ImageUploader.tsx` — Verify prop accepts File[] not single File

## Notes

- Create a git worktree for isolated implementation (e.g., `feature/multi-image-upload`)
- This feature depends on the post-review-cleanup task completing first (specifically Step 1: moving `Confidence`/`ParseResult` to `src/shared/schemas/ocr.ts` and Step 7: simplifying `OcrResult` to return string)
- Step 1-2 (fixture analysis and career page patterns) cannot be fully completed until the user adds career page screenshots to `tests/fixtures/`. The spec is designed so that Steps 3-7 (merge logic, upload route, client UI) can be built in parallel with pattern work since the interfaces are defined.
- The parser auto-detection (player card vs career page) can be simple: if OCR text contains headers like "ENEMY KILLS" it's likely a player card pattern; if it has career-page-specific labels, route to career patterns. Exact detection logic depends on fixture analysis.
- `Hono.parseBody({ all: true })` returns `{ file: File[] }` when multiple files share the same field name. Verify this behavior in the Hono docs or with a quick test.
- The `rawText` field in the response should concatenate all OCR outputs separated by `\n---\n` for debugging.
- Preview URL cleanup in the multi-image `ImageUploader` should happen in a cleanup effect to avoid memory leaks (mirrors the fix from the post-review-cleanup for single images).
