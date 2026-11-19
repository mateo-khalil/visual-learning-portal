import type { Dataset } from "./types";

/** Classifier datasets of the example area (`[[vis:classify:<id>]]`). */
export const DATASETS_EXAMPLE: Record<string, Dataset> = {
  complexity: {
    title: "O(1), O(log n) or O(n)?",
    question: "How does the running time grow with n?",
    cats: [
      { id: "const", label: "O(1)" },
      { id: "log", label: "O(log n)" },
      { id: "lin", label: "O(n)" },
    ],
    items: [
      { text: "Read a[i] given i", cat: "const", why: "The address is base + i × size: one computation, whatever n is." },
      { text: "Binary search in a sorted array", cat: "log", why: "Each comparison halves the range: ⌊log₂ n⌋ + 1 comparisons at most." },
      { text: "Find the maximum of an unsorted array", cat: "lin", why: "Any element could be the maximum, so you must look at all n." },
      { text: "Find the maximum of a sorted array", cat: "const", why: "It is the last element: no search needed." },
      { text: "Linear search for a value", cat: "lin", why: "In the worst case (absent, or last) you compare with all n elements." },
      { text: "Count how many times you can halve n until you reach 1", cat: "log", why: "That count is log₂ n by definition: it is the same loop as binary search." },
      { text: "Insert a value into a sorted array, keeping it sorted", cat: "lin", why: "Finding the spot is O(log n), but shifting the elements after it is O(n): the shift dominates." },
      { text: "Look up a word in a paper dictionary by opening it in the middle", cat: "log", why: "It is binary search by hand: each opening discards about half of the pages." },
      { text: "Push onto a stack", cat: "const", why: "Write at the top and move the top pointer: no dependence on n." },
    ],
  },
};
