# The sheet: everything on one page

If the exam allows a handwritten sheet, this is what goes on it: only what you would otherwise have to rederive under pressure. One block per topic, each with its drawing.

## Binary search

- **Precondition:** sorted array. **Convention:** [lo, hi] inclusive, mid = ⌊(lo + hi) / 2⌋.
- **Rules:** < → lo = mid + 1 · > → hi = mid − 1 · = → found · lo > hi → not found, insertion point = lo.
- **First occurrence:** on a match, remember mid and keep going left (hi = mid − 1).
- **Cost:** worst case ⌊log₂ n⌋ + 1 comparisons.

| n | 16 | 100 | 1,000 | 10⁶ | 10⁹ |
|---|---|---|---|---|---|
| worst case | 5 | 7 | 10 | 20 | 30 |

```flow
title: The decision at each step
compare a[mid] with x -> [a[mid] < x|lo = mid + 1] -> repeat while lo ≤ hi
compare a[mid] with x -> [a[mid] > x|hi = mid − 1] -> repeat while lo ≤ hi
compare a[mid] with x -> ((found|return mid)) {ok}
```

## TCP three-way handshake

- **SYN** (seq = x) → **SYN-ACK** (seq = y, ack = x + 1) → **ACK** (ack = y + 1).
- **States:** client CLOSED → SYN-SENT → ESTABLISHED; server LISTEN → SYN-RECEIVED → ESTABLISHED.
- **Loss:** a timer resends the same segment (same numbers); the timeout doubles on each retry.

[[vis:fig:tcp-states]]

👉 Back to the [topic](/topics/binary-search) or test yourself with the [quiz](/quiz).
