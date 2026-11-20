# Stage portal template

A static Next.js site of **step-by-step lessons on animated isometric scenes**. Each step declares its whole scene; the stage animates the difference from the previous step (exits sink, survivors move, newcomers drop in, wires draw themselves, the camera re-frames, packets travel along wires).

```bash
npm install
npm run dev          # http://localhost:3000
npm run verify       # lesson integrity + canonical checks → "All OK"
node scripts/shot-steps.mjs /example/binary-search          # one PNG per step in shots/
node scripts/shot-steps.mjs /example/tcp-handshake 3 --mid=400 --dark
```

- `lib/stage/` — the framework, pure: types, isometric projection and geometry, transitions, camera fit, scene helpers.
- `components/stage/` — `Stage` (the animated SVG), `LessonView` (lesson screen), `Cards` (code, tables, timing diagrams…), piece kits.
- `content/` — the course: chapters → lessons → steps, built from engines in `lib/<area>/`.
- `/pieces` — a gallery of every piece type.

Read `references/stage-lessons.md` in the skill for the scene language and the authoring rules.
