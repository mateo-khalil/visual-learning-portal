# Parallel build: contract first, one owner per file

A full portal (5–7 areas, each with engines, simulators, figures, topics, guides, a question bank and past exams) is a lot of work. It parallelizes well **if no two agents ever edit the same file**. Agents that share files overwrite each other, and the integration turns into a merge mess.

Fan out only when the user wants speed or asks for it. Seven agents spend tokens fast and can hit usage limits. For a small subject, one agent working area by area is fine.

## 1. The integrator sets up the contract (alone, before fan-out)
1. **Scaffold** from the template and set `lib/site.ts` with the final nav, including every route each area will create.
2. **Registries**: for each area, create `lib/registry/<area>.ts` exporting `KINDS_<AREA>: Record<string, readonly string[]>` with the agreed kinds and presets. The owner may add presets but never remove the contract ones.
3. **Stubs**: for every contracted component create a file with a default export taking `{ preset?: string }` that renders a placeholder. Wire them all into `components/visuals/Vis.tsx` now. Do the same for `components/figures/Figs<Area>.tsx` (empty `FIGS_<AREA>`), `lib/data/quiz/<area>.ts`, `lib/data/classifiers/<area>.ts` and `scripts/checks/<area>.ts`.
4. **Contract table in `PORTAL.md`**: kind → component → presets, figure ids, classifier ids. Anyone can reference these from content before they exist.
5. **Ownership table in `PORTAL.md`**: area → exact list of files and globs it owns. Shared files (`site.ts`, `Vis.tsx`, `Figs.tsx`, registries index, `verify.ts`, `PORTAL.md`) belong to the integrator only.
6. `npm run verify && npm run build` green on the stubs.

## 2. Brief each area agent
Each brief contains:
- the area's scope and the exact past-exam questions it must answer (from the exam map);
- the source files (slide decks, textbook chapters, exam PDFs) to read;
- its owned files (copy the row of the ownership table) and the rule "edit nothing else; if you need a change in a shared file, say so in your report";
- the contract rows it must implement, and the canonical results its checks must assert;
- the definition of done: `npx tsx scripts/verify.ts --strict` → "All OK", `npm run build`, `npm run lint`, and screenshots of its pages read back at desktop and mobile width;
- "report: files created, presets added, canonical results checked, open questions where sources disagree".

Past exams can be their own owners (one agent per exam file). Their solutions link to topics and use `[[vis:…:sheet]]` frozen snapshots from the contract, which may still be stubs while they write.

## 3. Integrate
- Apply the shared-file changes requested in the reports.
- Run `verify --strict`: it catches markers pointing at missing presets, broken links between areas, unbalanced `extra` markers and visible pages linking to hidden ones.
- Screenshot the home page and one page per area. Read every report's "open questions" and record the decisions in `PORTAL.md`.
