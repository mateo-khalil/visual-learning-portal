# Sample exam

Meta: 4 questions · 20 points · 60 minutes · closed book

An exam page in the format of the course's past exams. Do it **on paper and against the clock** (about 3 minutes per point), then open each solution. The model solutions use frozen simulators (`:sheet`): the same drawing you would make on the sheet.

| Question | Topic | Points |
|---|---|---|
| 1 | Binary search: idea and cost | 5 |
| 2 | Tracing a search that fails | 5 |
| 3 | First occurrence | 5 |
| 4 | TCP three-way handshake | 5 |

## Question 1 — Binary search (5 points)

a) What does binary search require from its input, and why? b) Show that it makes O(log n) comparisons. c) At most how many comparisons for n = 16?

### Solution

**a)** A **sorted** array. Each comparison with a[mid] discards half of the range, and that is only correct because the order guarantees that the target cannot be on the discarded side.

**b)** Each comparison halves the candidates: after k comparisons n / 2ᵏ are left, and the search ends when one is left.

[[vis:fig:sorted-array-halving]]

$$
\frac{n}{2^k} = 1 \iff k = \log_2 n
$$

**c)** ⌊log₂ 16⌋ + 1 = **5**.

👉 [Binary search](/topics/binary-search)

## Question 2 — A search that fails (5 points)

Trace a binary search for **50** in a = [3, 8, 12, 17, 21, 26, 30, 35, 41, 47, 52, 58, 64, 70, 77, 85]. State your convention. Where would 50 be inserted?

### Solution

Inclusive bounds, mid = ⌊(lo + hi) / 2⌋.

[[vis:bsearch:not-found:sheet]]

The range empties with **lo = 10 > hi = 9**: 50 is not in the array and it would be inserted at **index 10**, between 47 and 52. 4 comparisons.

## Question 3 — First occurrence (5 points)

Modify binary search so that, in an array with repeated values, it returns the index of the **first** occurrence. Trace it for 7 in [2, 4, 4, 7, 7, 7, 7, 9, 11, 13].

### Solution

```python
def first_occurrence(a, target):
    lo, hi, best = 0, len(a) - 1, -1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] == target:
            best, hi = mid, mid - 1   # remember it, keep looking left
        elif a[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return best
```

[[vis:bsearch:first-occurrence:sheet]]

**Index 3.** The match at index 4 is remembered and the search goes on to the left until the range is empty.

## Question 4 — TCP three-way handshake (5 points)

a) Draw the three segments of the handshake between a client (ISN 100) and a server (ISN 300), with flags, seq and ack, and the state of each end. b) What happens if the SYN-ACK is lost?

### Solution

**a)**

```sequence
actors: C = Client, S = Server
C: CLOSED → connect()
S: LISTEN
C -> S: SYN-SENT => SYN seq=100 => SYN-RECEIVED
S -> C: SYN-RECEIVED => SYN-ACK seq=300 ack=101 => ESTABLISHED {ok}
C -> S: ESTABLISHED => ACK ack=301 => ESTABLISHED {ok}
```

Each side acknowledges the other's ISN + 1, because a SYN consumes one sequence number.

[[vis:fig:tcp-states]]

**b)** Nobody is notified. The server stays in SYN-RECEIVED and the client in SYN-SENT until a **retransmission timer** fires (about 1 s; it doubles on each retry) and the **same** segment is sent again. The connection opens late; it only fails after several retries.

👉 [The simulator](/simulators/handshake)
