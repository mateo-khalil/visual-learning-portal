# Doing it by hand

How to trace a binary search on paper so that every step earns its marks. A guide page is a **procedure**: numbered steps, one worked example done the same way, and the traps that cost points.

## The procedure

```steps
title: On paper, in 5 steps
1. Write the convention | "Inclusive bounds [lo, hi], mid = ⌊(lo + hi) / 2⌋." One line, before anything else.
2. Number the array | Write the indices above the values. Every later step refers to indices, not values.
3. One row per comparison | Columns: # · lo · hi · mid · a[mid] vs target · then.
   - compute mid from the lo and hi of **that** row
   - write the decision as an assignment: lo = mid + 1 or hi = mid − 1
4. Stop at the right time | Found (a[mid] = target), or lo > hi.
   - on lo > hi write the final lo and hi: lo is the insertion point
5. Answer and count | "Index 4, after 4 comparisons; worst case ⌊log₂ 16⌋ + 1 = 5."
```

## Worked example

Search for **50** in this array of 16 values:

| index | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| a | 3 | 8 | 12 | 17 | 21 | 26 | 30 | 35 | 41 | 47 | 52 | 58 | 64 | 70 | 77 | 85 |

| # | lo | hi | mid | a[mid] vs 50 | then |
|---|---|---|---|---|---|
| 1 | 0 | 15 | 7 | 35 < 50 | lo = 8 |
| 2 | 8 | 15 | 11 | 58 > 50 | hi = 10 |
| 3 | 8 | 10 | 9 | 47 < 50 | lo = 10 |
| 4 | 10 | 10 | 10 | 52 > 50 | hi = 9 |

Now lo = 10 > hi = 9: **50 is not in the array**, and it would go at **index 10** (between 47 and 52). Four comparisons, within the worst case of 5. The same trace, drawn:

[[vis:bsearch:not-found:sheet]]

## Traps

- **Computing mid from the previous row's bounds.** Update lo or hi first, then compute the next mid.
- **⌈ ⌉ instead of ⌊ ⌋.** Both work if you are consistent, but the mids change and so does the expected table. Say which one you use.
- **Stopping at lo = hi.** One candidate is left and it still has to be compared (row 4 above).
- **Answering with a value instead of an index** (or the other way round). Read what the question asks for.
- **Forgetting the count.** Many questions ask for the number of comparisons too: it is the number of rows.

👉 Practice it in the [question bank](/questions/binary-search) and check yourself with the [simulator](/simulators/binary-search).
