/** A "sort these into buckets" game: each item goes into one category and carries the why. */
export interface Dataset {
  title: string;
  question: string;
  cats: { id: string; label: string }[];
  items: { text: string; cat: string; why: string }[];
}
