import Link from "next/link";
import HomeProgress from "@/components/HomeProgress";
import { site } from "@/lib/site";

/*
 * Home: hero → how to use the portal (a study plan) → the areas → simulators.
 * Everything here is content: replace it with the course's areas and plan.
 */

const sims = [
  {
    href: "/simulators/binary-search",
    emoji: "🔎",
    title: "Binary search, step by step",
    desc: "lo, mid and hi moving over a sorted array: a hit, a miss with its insertion point, and the first occurrence among duplicates.",
  },
  {
    href: "/simulators/handshake",
    emoji: "🤝",
    title: "TCP three-way handshake",
    desc: "SYN, SYN-ACK, ACK with the TCP state of both ends, and what the retransmission timer does when a segment is lost.",
  },
];

const areas = [
  {
    t: "1 · Searching",
    e: "🔎",
    source: "Slides: searching and complexity",
    items: [
      ["/topics/binary-search", "Binary search ★"],
      ["/guides/by-hand", "Doing it by hand"],
    ],
  },
  {
    t: "2 · Practice",
    e: "📝",
    source: "Past exams and the question bank",
    items: [
      ["/exams/sample-exam", "Sample exam"],
      ["/questions/binary-search", "Question bank"],
    ],
  },
];

const plan = [
  [
    "Understand it with drawings",
    "Read the topic with its simulator open next to it: first the idea in 30 seconds, then each step on the diagram. Mark it as studied when you can explain it without looking.",
    "/topics/binary-search",
  ],
  [
    "Do it on paper",
    "Follow the by-hand procedure on the worked example and on one of your own. The exam grades the trace, not only the answer.",
    "/guides/by-hand",
  ],
  [
    "Exam conditions",
    "Solve the sample exam against the clock, then compare with the model solutions. Finish with the one-page sheet and the quiz.",
    "/exams/sample-exam",
  ],
];

export default function Home() {
  return (
    <div className="space-y-12">
      <section>
        <p className="text-sm font-semibold uppercase tracking-wider text-accent">Course · Exam</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{site.name}</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
          Every topic of the exam explained <strong className="text-foreground">with drawings first</strong> and formulas as backup, step-by-step
          simulators you can replay, solved past exams and a quiz with the reasoning behind each answer.
        </p>
        <HomeProgress />
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/guides/summary-sheet" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent">
            The sheet: everything on one page →
          </Link>
          <Link href="/exams/sample-exam" className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold transition hover:border-accent">
            Sample exam →
          </Link>
          <Link href="/quiz" className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold transition hover:border-accent">
            Quiz →
          </Link>
        </div>
      </section>

      <section id="plan" className="scroll-mt-20">
        <h2 className="mb-4 text-xl font-bold">How to use this portal</h2>
        <ol className="space-y-3">
          {plan.map(([t, d, href], i) => (
            <li key={t} className="flex gap-3 rounded-xl border border-border bg-card p-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-on-accent">{i + 1}</span>
              <div>
                <p className="font-semibold">{t}</p>
                <p className="text-sm text-muted">{d}</p>
                <Link href={href} className="mt-1 inline-block text-sm font-medium text-accent">
                  Start →
                </Link>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">The areas</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {areas.map((b) => (
            <div key={b.t} className="rounded-2xl border border-border bg-card p-4">
              <p className="font-bold">
                <span className="mr-1.5">{b.e}</span>
                {b.t}
              </p>
              <p className="mt-0.5 text-xs text-muted">{b.source}</p>
              <ul className="mt-2 space-y-1">
                {b.items.map(([h, l]) => (
                  <li key={h}>
                    <Link href={h} className="text-sm font-medium text-foreground/80 transition hover:text-accent">
                      → {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Simulators</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {sims.map((s) => (
            <Link key={s.href} href={s.href} className="group rounded-2xl border border-border bg-card p-5 transition hover:border-accent hover:shadow-sm">
              <div className="text-2xl">{s.emoji}</div>
              <p className="mt-2 font-semibold group-hover:text-accent">{s.title}</p>
              <p className="mt-1 text-sm text-muted">{s.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
