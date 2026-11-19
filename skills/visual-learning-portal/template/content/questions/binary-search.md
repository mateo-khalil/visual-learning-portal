# Question bank: binary search

Meta: 4 questions · from the slides and past exams · with model solutions

A question bank uses the same format as an exam: each `## ` heading is a question and `### Solution` opens its model answer. Try each one on paper before opening the solution.

All questions use this array (16 values, indices 0 to 15) unless they say otherwise:

| index | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| a | 3 | 8 | 12 | 17 | 21 | 26 | 30 | 35 | 41 | 47 | 52 | 58 | 64 | 70 | 77 | 85 |

## Question 1 — Trace a search

Trace a binary search for **21**: write lo, hi, mid and the decision for each comparison. How many comparisons does it take?

### Solution

Convention: inclusive bounds, mid = ⌊(lo + hi) / 2⌋.

[[vis:bsearch:basic:sheet]]

**Found at index 4 after 4 comparisons**, which is the worst case for 16 elements (⌊log₂ 16⌋ + 1 = 5 is the bound; this run used 4).

👉 [Doing it by hand](/guides/by-hand)

## Question 2 — The first step

Searching for **21**, what are lo and hi after the first comparison? Why is index 7 not kept?

### Solution

mid = ⌊(0 + 15) / 2⌋ = 7 and a[7] = 35 > 21, so the target can only be left of 7: **lo = 0, hi = 6**.

[[vis:bsearch:basic:sheet:1]]

Index 7 was just compared and it is not the target, so keeping it (hi = 7) only adds a useless comparison, and with the `lo = mid` variant it can make the loop run forever when lo = hi.

## Question 3 — How many comparisons at most

At most how many comparisons does a binary search make on 1,000 elements? And on 1,000,000?

### Solution

The worst case is $\lfloor \log_2 n \rfloor + 1$:

$$
\begin{aligned}
2^9 = 512 \le 1000 < 1024 = 2^{10} &\Rightarrow \lfloor \log_2 1000 \rfloor = 9 \Rightarrow 10 \text{ comparisons} \\
2^{19} = 524{,}288 \le 10^6 < 2^{20} &\Rightarrow \lfloor \log_2 10^6 \rfloor = 19 \Rightarrow 20 \text{ comparisons}
\end{aligned}
$$

A thousand times more data costs only **10 more comparisons**.

## Question 4 — First occurrence

In **a = [2, 4, 4, 7, 7, 7, 7, 9, 11, 13]**, the classic search for 7 returns index 4. Change the algorithm so it returns the **first** 7, and trace it.

### Solution

On a match, **remember mid and keep searching the left half** (hi = mid − 1) instead of returning. When the range is empty, the remembered index is the first occurrence.

[[vis:bsearch:first-occurrence:sheet]]

**Answer: index 3**, after 4 comparisons. The classic version stops at the first 7 it hits (index 4).
