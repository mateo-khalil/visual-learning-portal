# Quality checklist (run before saying "done")

## Correctness
- [ ] `npm run verify` prints **All OK** (strict mode).
- [ ] `npm run build` and `npm run lint` are green.
- [ ] Every number in the content is asserted in a check that cites its source.
- [ ] Every past-exam question has a full solution; off-scope ones are flagged, not skipped.
- [ ] Source disagreements (slides vs textbook vs official solution) are stated on the page and recorded in `PORTAL.md`.

## Visual
- [ ] No ```` ```text ```` block except literal console output. No ASCII diagrams anywhere.
- [ ] Each topic section has at least one drawing (diagram block, figure or simulator).
- [ ] Every process that evolves over time has a step player, not just a final-state picture.
- [ ] Solutions use frozen snapshots (`:sheet`) of the same simulator the topic uses.
- [ ] Screenshots read back: desktop and 390 px, dark and light. Labels don't collide, arrows land on boxes, the page never scrolls horizontally, and wide diagrams scroll inside their card.
- [ ] Colors come from theme tokens or the tone system; there's no hard-coded text color that disappears in one theme.

## Pedagogy
- [ ] Every topic opens with "✍️ For the sheet" and "The idea in 30 seconds".
- [ ] Every topic closes with "On the exam", "Common mistakes" and "👉 Review".
- [ ] Every procedure the exam asks for has a "by hand" guide with the past instances worked out.
- [ ] Depth matches the exam map. Deeper material is inside `<!-- extra -->`, and nothing was deleted.
- [ ] The slides' terminology is used, in the learner's language and register.

## Navigation and state
- [ ] `lib/site.ts` nav covers every page. Lower-priority and "slides only" items are marked, and out-of-scope items are absent.
- [ ] Home page: a study plan ("start here" order with time estimates), a progress bar and cards per area.
- [ ] "✓ Studied" toggles and the quiz's best score persist in `localStorage` under the portal's own `storagePrefix` (portals on the same domain must not collide).
- [ ] Renamed pages have redirects in `next.config.ts`.

## Project hygiene
- [ ] `PORTAL.md` is filled in (scope, sources, canonical results, decisions, ownership) and copied or linked as `CLAUDE.md` / `AGENTS.md`.
- [ ] `materials/` (PDFs, extracted text) is git-ignored and excluded from deploys.
- [ ] No personal data, credentials or copyrighted PDFs in the repo.
