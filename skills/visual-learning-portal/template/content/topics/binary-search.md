# Binary search

The example topic of this template: every pattern a topic page can use, on a small but real subject. Replace it with the course's topics, keeping the anatomy: **the idea in 30 seconds → the explanation with drawings → on the exam → common mistakes → review**.

> ✍️ **For the sheet**
>
> - **Needs:** a **sorted** array. Bounds **[lo, hi] inclusive**, **mid = ⌊(lo + hi) / 2⌋**.
> - **Rule:** a[mid] < target → **lo = mid + 1**; a[mid] > target → **hi = mid − 1**; equal → found. Stop when **lo > hi** (not found; lo is the insertion point).
> - **Cost:** at most **⌊log₂ n⌋ + 1** comparisons. 16 values → 5, 1,000 → 10, 1,000,000 → 20.
> - **The drawing:** the array with lo, mid and hi under it, one row per comparison.

## The idea in 30 seconds

- You are looking for a value in a **sorted** array. Look at the **middle** element.
- If it is too small, the target can only be **to the right**; if it is too big, only **to the left**. Either way **half of the array is gone** after one comparison.
- Repeat on the half that is left. 16 → 8 → 4 → 2 → 1: four halvings reach a single candidate.

> 📖 It is how you look up a word in a paper dictionary: open it in the middle, see that "kiwi" comes after "harbor", and never look at the first half again.

[[vis:fig:sorted-array-halving]]

## The algorithm

```steps
title: Binary search in 4 steps
1. Set the range | lo = 0, hi = n − 1: the whole array is a candidate.
2. Probe the middle | mid = ⌊(lo + hi) / 2⌋, then compare a[mid] with the target.
   > a[mid] = target => found | return mid
   > a[mid] < target => lo = mid + 1 | the left part, mid included, is out
   > a[mid] > target => hi = mid − 1 | the right part, mid included, is out
3. Repeat | while lo ≤ hi.
   - each round removes at least one element, so the loop always ends {ok}
4. Empty range | lo > hi: the target is not there.
   - lo is where it would be inserted to keep the array sorted
```

Step through it. The first tab finds 21 in 4 comparisons, the second misses 50 and ends with its insertion point, the third finds the **first** 7 among duplicates:

[[vis:bsearch:basic]]

The same run, as the set of candidates that survive each comparison:

```queues
title: The candidates left while searching for 21
start: 3 8 12 17 21 26 30 35 41 47 52 58 64 70 77 85 | 16 candidates
after 1: 3 8 12 17 21 26 30 | a[7] = 35 > 21, keep the left part
after 2: 21 26 30 | a[3] = 17 < 21, keep the right part
after 3: 21 | a[5] = 26 > 21, the 4th comparison confirms it {ok}
```

In code it is a few lines. The loop condition and the two `± 1` are where the bugs live:

```python
def binary_search(a, target):
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] == target:
            return mid
        if a[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1  # not found; lo is the insertion point
```

## Why it needs a sorted array

Discarding half is only correct because the order guarantees where the target **cannot** be. With an unsorted array, a[mid] < target says nothing about the left half. So binary search usually comes after a sort, paid once, and pays off over many queries:

```flow
title: Where binary search fits
Once :: raw data|n values, unsorted -(sort, O(n log n))-> [sorted array|a[0] ≤ a[1] ≤ …]
Every query :: target -> [binary search|⌊log₂ n⌋ + 1 comparisons] -> ((index|or insertion point)) {ok}
```

## How many comparisons

Each comparison halves what is left. After **k** comparisons there are about **n / 2ᵏ** candidates; the search ends when one is left:

$$
\begin{aligned}
\frac{n}{2^k} &= 1 \\
2^k &= n \\
k &= \log_2 n
\end{aligned}
$$

Counting the comparison that confirms the last candidate, the worst case is exactly $\lfloor \log_2 n \rfloor + 1$. Doubling the array adds **one** comparison; a linear search would double its work.

Every possible run is a path in the **comparison tree**. On 7 elements the tree has depth 3, so no search needs more than 3 comparisons:

```tree
title: All the runs on 7 elements (indices 0 to 6)
note: Left edge: the target is smaller than the element compared; right edge: bigger.
a[3]
  [<] a[1]
    [<] a[0] {ok}
    [>] a[2] {ok}
  [>] a[5]
    [<] a[4] {ok}
    [>] a[6] {ok}
```

Against a linear scan, searching for 70 among the same 16 values:

```gantt
title: Comparisons over time, searching for 70
ticks: units
lines: 3 "binary search is done"
Linear: 0-14 "a[0], a[1], … a[13]: 14 comparisons"
Binary: 0-1 "a[7]", 1-2 "a[11]", 2-3 "a[13]", 3-14 idle
```

Sort these by how their cost grows:

[[vis:classify:complexity]]

<!-- extra -->
### Beyond the course: the overflow in (lo + hi) / 2

With fixed-size integers, `lo + hi` can overflow when the array has more than about 2³⁰ elements, and `mid` becomes negative. The safe form is `mid = lo + (hi − lo) / 2`, which gives the same value. This bug sat in the standard library of a major language for years. Python's integers do not overflow, so the code above is fine as is.
<!-- /extra -->

## The same idea elsewhere

Halving shows up whenever "is it before or after?" can be answered. A guessing game is binary search as a conversation:

```sequence
title: "I am thinking of a number from 1 to 100"
actors: Y = You (guessing), F = Friend (knows 37)
Y: range 1 to 100, try the middle
Y -> F: is it 50?
F -> Y: lower
Y: range 1 to 49
Y -> F: is it 25?
F -> Y: higher
Y: range 26 to 49
Y -> F: is it 37?
F -> Y: yes! {ok}
note: 7 guesses always suffice for 100 numbers, because 2⁷ = 128 ≥ 100.
```

The mirror image is **doubling**. When a TCP segment is lost, the sender waits a timeout and retries, and each retry **doubles** the wait (1 s, 2 s, 4 s…): after k retries it has waited about 2ᵏ seconds, so reaching a minute takes only about log₂ 60 ≈ 6 retries. Here the SYN-ACK of the handshake is lost and the first timer rescues it:

[[vis:handshake:lost-syn-ack:solo]]

## On the exam

- **Trace it:** given an array and a target, write the table lo / hi / mid / a[mid] / decision, one row per comparison. State the convention (inclusive bounds, ⌊ ⌋) on the first line. See [Doing it by hand](/guides/by-hand).
- **Count:** "at most how many comparisons for n = …?" → ⌊log₂ n⌋ + 1, with the powers of 2 written next to it.
- **Explain:** why it needs a sorted array, and why it is O(log n).
- **Variant:** first occurrence among duplicates, or the insertion point of a missing value.

## Common mistakes

- **hi = mid instead of mid − 1** (or lo = mid): when lo = hi the range never shrinks and the loop never ends.
- **`while lo < hi`** with inclusive bounds: the last candidate is never compared, so a value that is there gets reported as missing.
- **Running it on unsorted data:** it returns *something*, and that something is wrong.
- **"It returns the first match":** the classic search returns whichever copy it hits. In [2, 4, 4, 7, 7, 7, 7, 9, 11, 13] it finds the 7 at index 4, not at 3.
- **log₂ 1000 = 10 exactly:** it is 9.97; what is exact is ⌊log₂ 1000⌋ + 1 = 10.

## 👉 Review

- Replay all three runs in the [simulator](/simulators/binary-search) and fill the table on paper before each step.
- Do the [question bank](/questions/binary-search), then the [sample exam](/exams/sample-exam) against the clock.
- Quick check: the [quiz](/quiz).
