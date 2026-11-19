import { TF, type QuizQuestion } from "./types";

/** Quiz questions of the example area (binary search + the TCP handshake). */
export const QUIZ_EXAMPLE: QuizQuestion[] = [
  {
    id: "bs-01",
    topic: "Searching",
    kind: "choice",
    question: "What does binary search need from the array before it can run?",
    options: ["It must be sorted", "It must have no duplicates", "Its length must be a power of 2", "It must fit in the CPU cache"],
    answer: 0,
    explanation:
      "Discarding half of the range is only correct because everything left of a[mid] is ≤ a[mid] and everything right is ≥ a[mid]. Duplicates are fine (see first occurrence) and any length works.",
    source: "Sample exam · Q1",
    link: "/topics/binary-search",
  },
  {
    id: "bs-02",
    topic: "Searching",
    kind: "choice",
    question: "With lo = 0, hi = 15 and mid = ⌊(lo + hi) / 2⌋, you search for 21 and a[mid] = 35. What is the new range?",
    code: "a = [3, 8, 12, 17, 21, 26, 30, 35, 41, 47, 52, 58, 64, 70, 77, 85]",
    options: ["lo = 0, hi = 6", "lo = 0, hi = 7", "lo = 8, hi = 15", "lo = 7, hi = 15"],
    answer: 0,
    explanation:
      "mid = 7 and a[7] = 35 > 21, so the target can only be left of 7. With inclusive bounds the new hi is mid − 1 = 6; keeping 7 (hi = 7) is the off-by-one that can loop forever.",
    source: "Question bank · Q2",
    link: "/guides/by-hand",
  },
  {
    id: "bs-03",
    topic: "Complexity",
    kind: "choice",
    question: "At most how many comparisons does a classic binary search make on 1,000 elements?",
    options: ["10", "11", "500", "1,000"],
    answer: 0,
    explanation:
      "⌊log₂ 1000⌋ + 1 = 9 + 1 = 10 (2⁹ = 512 ≤ 1000 < 1024 = 2¹⁰). A linear search would need up to 1,000.",
    debatable:
      "Some courses count the final 'empty range' check as a comparison and answer 11. Write the formula you use and say what you count.",
    link: "/topics/binary-search",
  },
  {
    id: "bs-04",
    topic: "Searching",
    kind: "tf",
    question: "In an array with duplicates, the classic binary search always returns the first occurrence of the target.",
    options: TF,
    answer: 1,
    explanation:
      "It returns whichever copy it hits first. In [2, 4, 4, 7, 7, 7, 7, 9, 11, 13] searching for 7 it stops at index 4, but the first 7 is at index 3. To get the first one, remember the match and keep searching left.",
    link: "/topics/binary-search",
  },
  {
    id: "bs-05",
    topic: "Searching",
    kind: "choice",
    question: "When the search ends without finding the target, what does the final value of lo mean?",
    options: [
      "The index where the target would be inserted to keep the array sorted",
      "The index of the closest smaller value",
      "Nothing: it is garbage after the loop",
      "The number of comparisons made",
    ],
    answer: 0,
    explanation:
      "The loop keeps the invariant 'everything left of lo is < target and everything right of hi is > target'. When lo > hi, lo is the first position whose value is greater than the target: the insertion point.",
    link: "/topics/binary-search",
  },
  {
    id: "cx-01",
    topic: "Complexity",
    kind: "tf",
    question: "Doubling the size of the array adds roughly one comparison to a binary search.",
    options: TF,
    answer: 0,
    explanation: "log₂(2n) = log₂ n + 1. That is the whole point of a logarithmic algorithm: each comparison halves the range, so one more comparison handles twice the data.",
    link: "/topics/binary-search",
  },
  {
    id: "net-01",
    topic: "Networking",
    kind: "choice",
    question: "In the three-way handshake the client sends SYN with seq = 100 and the server answers SYN-ACK with seq = 300. What does the client's final ACK carry?",
    options: ["seq = 101, ack = 301", "seq = 100, ack = 300", "seq = 301, ack = 101", "ack = 300 only"],
    answer: 0,
    explanation: "A SYN consumes one sequence number, so each side acknowledges the other's ISN + 1: the client's next byte is 101 and it expects the server's byte 301.",
    link: "/simulators/handshake",
  },
  {
    id: "net-02",
    topic: "Networking",
    kind: "tf",
    question: "If the SYN-ACK is lost, the connection fails and the application gets an error immediately.",
    options: TF,
    answer: 1,
    explanation:
      "Nobody gets an error yet: a retransmission timer fires (about 1 s at first) and the SYN-ACK (or the SYN) is sent again. connect() only fails after several retries.",
    link: "/simulators/handshake",
    extra: true,
  },
];
