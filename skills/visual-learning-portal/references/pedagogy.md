# Pedagogy: why the portal looks the way it does

These principles come from portals that students actually studied from under time pressure. When one of them conflicts with "being thorough", the principle wins.

## 1. Picture → intuition → formula
A student who has *seen* the mechanism can rebuild the formula. The reverse rarely happens. So each idea is introduced in this order:
1. **A drawing or animation** of the thing happening.
2. **One or two sentences** of intuition ("a container is not a small VM: it's an ordinary process that the kernel shows a trimmed view of the system").
3. **The formal statement or formula**, as backup, in KaTeX.

Monospace ASCII diagrams fail this test. They read as a wall of text, not a picture. Every diagram gets rendered (see `visual-toolkit.md`).

## 2. Show state changing, not just the final state
Most hard topics are *processes*: an algorithm iterating, a CPU switching context, a protocol retransmitting, a scheduler picking. A static figure of the final state hides exactly what confuses students. Use a step player:
- every step has a **mono title** (what happened: `SYN-ACK lost`, `mid = 7`, `trap → kernel mode`) and **one or two sentences** of narration;
- only what changed is highlighted (tone `active`, an animated packet on the arrow that just fired);
- the learner controls the pace (← / → / space, clickable dots, autoplay).

## 3. The exam answer is visible first
Every topic and every solution starts with a **"✍️ For the sheet"** box: the exact sentences and keywords that get full marks. It goes up front so the exam answer isn't buried under the explanation. A student reviewing the night before reads just those boxes. A student learning reads on.

## 4. Depth = the union of recent exams
Build the **exam map** (every past question, its points and topic) before writing. The depth of each topic is "enough to get every point on these questions and their obvious variants". Anything deeper (textbook proofs, historical variants, edge cases nobody asks) goes in `<!-- extra -->` blocks. It's hidden by `EXAM_MODE = true` and shown again by flipping it to `false`. Never delete it, because the student may want the full version after the exam.

Give time estimates when trimming ("theory reading drops from ~3 h to ~1 h 20 min"). Students plan around them.

## 5. Practice the way the exam is taken
- **Guides "by hand"** teach the paper procedure as a numbered method. They work every past instance with that method and end with "Traps".
- **Past exams** are reproduced verbatim, one file per exam, with full solutions. The solutions use frozen simulator snapshots (`…:sheet`), so the drawing in the answer is the same one the student played with.
- **Question banks** per area, in the same format, for questions that never appeared but could.
- **A quiz** with sources (`source: "May 2025 · Q7"`), flagged `debatable` items when the course itself is ambiguous, and best score saved.
- **"✓ Studied" toggles** and a progress bar on the home page, stored in `localStorage`.

## 6. The course's words, not the textbook's
Students are graded by the professor who wrote the slides. Use the slides' terminology. When slides and textbook disagree (a name, a convention, an outright error in a slide), the page says so in one line and recommends what to write. Record each such decision in `PORTAL.md` so it stays consistent across pages.

## 7. Errors are content
Each topic ends with **"Common mistakes"**: the wrong answers students actually give, why they are wrong, and the one-line fix. Where the classic mistake is a computation, show the wrong and right computation side by side.

## 8. Mobile and dark mode are real use cases
Students review on the bus at night. Every visual must be readable at 390 px and in both themes. Diagrams wider than the screen scroll *inside their card* (minimum ~620 px drawing width), never the page. Use theme tokens (`var(--foreground)`, `tint()`), never hard-coded text colors.
