# Conversion Progress

## 2026-09-06

- Resolved and copied the 128-page source PDF into the book-local repository.
- Surveyed every source page and measured the fixed-layout page frame and embedded typography.
- Established the page taxonomy, reusable component inventory, canonical pilot set, and asset policy.
- Ran the complete ADT Studio pipeline: extraction, image analysis, sectioning, fixed-layout rendering, quizzes, captions, glossary, table of contents, easy-read/translation preparation, speech, word timing, packaging, and accessibility assessment.
- Generated speech for 3,261 text entries.
- Corrected opaque-black cover artifacts and duplicate raster/semantic cover title painting.
- Restored and verified 37 quiz pages after the final storyboard rerender.
- Audited all 128 source pages in the browser and verified all 165 packaged entries structurally.
- Restored the mirrored top ribbon and food-strip footer pattern from the source across interior pages.
- Corrected clipped and duplicate text on representative chapter and assessment pages, then completed a zero-issue automated traversal of every non-cover source page and all 37 quizzes.
- Added an automated GitHub Pages deployment for the finished `adt/` reader.
- Final output: `adt/index.html`.

## Verification

- `pnpm build`: passed.
- `pnpm typecheck`: passed.
- Focused cover-overlap regression: passed.
- Whole ADT Studio test suite: two pre-existing failures in `translation-evaluation-runner.test.ts`; the broader fixed-layout test file also has one pre-existing production-mark expectation incompatible with other uncommitted renderer work. The new focused regression passes.
- `git diff --check`: passed.
