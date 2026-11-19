# Content authoring

All content is Markdown in `content/`. It's rendered statically, with two extensions: visual markers and diagram blocks (see `visual-toolkit.md`).

| Folder | Rendered by | Format |
|---|---|---|
| `content/topics/` | `VisContent` + "✓ Studied" toggle | free-form page (anatomy below) |
| `content/guides/` | `VisContent` + "✓ Studied" toggle | numbered method + worked examples |
| `content/questions/` | `ExamView` | `## Question` + `### Solution` |
| `content/exams/` | `ExamView` | `## Question` + `### Solution` |

The first line of every file is `# Title` (used for the page title and nav). An optional second line `Meta: …` gives a subtitle (date, points, "solved").

## Topic page anatomy

```markdown
# <Topic>

<Where it comes from: slide deck + slide numbers. Where it was asked: exam, question, points.>

> ✍️ **For the sheet**
>
> - **<Term>:** <the definition that gets full marks, with the keywords in bold>.
> - <2–5 bullets max>

## The idea in 30 seconds

- <3 bullets of intuition; no formulas>

## <Sub-idea 1>

<1–3 short paragraphs>

<a diagram block, a fig, or a simulator>

> 💡 <an analogy or a mnemonic>

## <Sub-idea 2> …

## On the exam

<Which questions asked this, how many points, what they wanted. Link to the solved exam.>

## Common mistakes

- ❌ <wrong statement> → ✅ <right one, and why in one line>

## 👉 Review

- [<related topic>](/topics/<slug>) · [<simulator>](/simulators/<name>) · [<past question>](/exams/<slug>#<anchor>)
```

Callout conventions (blockquotes with an emoji lead): `✍️ For the sheet`, `💡` insight or analogy, `🧠` mnemonic, `⚠️` trap or source disagreement, `📌` exam fact.

## Guide page ("by hand")

~~~markdown
# <Procedure> by hand

> ✍️ **The method in N steps** (what you write on the sheet)

```steps
title: <Procedure> in N steps
1. <Step> | <what you compute or draw>
   - <detail>
   > <if you see X> => <do Y> | <why>
2. …
```

## Worked: <Exam · Qn>
<statement, then the method applied step by step, with the frozen simulator snapshot or a ```gantt / table for each intermediate state>

## Traps
- <the subtle convention, the off-by-one, the tie-break>
~~~

## Question / exam file

```markdown
# <Month Year> exam

Meta: <n> questions · <points> points · solved

<optional intro table: question, points, topic>

## Q1 — <short title> (<points> points)

<verbatim statement>

### Solution

> **For the sheet.** <the direct answer in 1–3 sentences>

<the full answer that gets every point: drawing first, then explanation, then a table or KaTeX>

## Q2 — …
```

Rules the parser depends on:
- `## ` at line start splits questions, so **no line inside any fenced block may start with `## `**. `verify` checks this.
- `### Solution` (exact text) splits statement from solution. The solution is hidden behind a "Show solution" button.
- Anchor ids come from heading text (slugified), so links like `/exams/may-2025#q7-scheduling-6-points` are stable as long as the heading is.
- An `<!-- extra -->` block in these files either wraps whole `## ` questions or sits entirely inside one question. It never crosses `### Solution`.

## Style rules
- **Short paragraphs, bold keywords.** A student scanning only bold text should still get the skeleton.
- **Numbers from the course.** Reuse the slide's own example values in the first explanation, so the student recognizes it in class material.
- **One drawing per idea.** If a section has two ideas and one drawing, split it.
- **Money signs**: write `\$` (remark-math treats `$` as math).
- **Hex / code values**: in `inline code` or `\texttt{}` inside KaTeX.
- **Units**: state the convention once (e.g. "KB = 1024 B in these exercises").
- **Links**: internal links are absolute (`/topics/slug`). `verify` fails on broken ones.
- **Tone**: talk to the student directly ("try it", "notice that…"), in their language and register.

## The "summary sheet" guide
For exams that allow a handwritten sheet (or for the last review), add `content/guides/summary-sheet.md`. It's the whole subject on one page: every "For the sheet" box, the key formulas, and tiny versions of the core diagrams. Link it first in the nav.
