import Link from "next/link";
import ChapterProgress from "@/components/shell/ChapterProgress";
import HeroStage from "@/components/shell/HeroStage";
import TopBar from "@/components/shell/TopBar";
import { lessonHref } from "@/components/shell/nav";
import { COURSE } from "@/content/course";
import { site } from "@/lib/site";
import { UI } from "@/lib/ui";

// The hero cycles through one scene per lesson (its middle step), with the stage transitions.
const HERO = COURSE.flatMap((c) => c.lessons.map((l) => ({ label: l.title, scene: l.steps[Math.floor(l.steps.length / 2)].scene })));

export default function Home() {
  return (
    <div className="min-h-dvh">
      <TopBar />
      <main className="mx-auto max-w-6xl px-4 pt-8 pb-16">
        <section className="grid items-center gap-6 md:grid-cols-[1fr_1.25fr]">
          <div>
            <h1 className="font-mono text-[30px] leading-[1.12] font-bold tracking-tight md:text-[38px]">{site.tagline}.</h1>
            <p className="mt-3 text-[15.5px] leading-relaxed text-muted">{site.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {COURSE.map((c) => (
                <Link key={c.id} href={lessonHref(c.id, c.lessons[0].id)} className={`btn tone-${c.tone} px-3.5 py-2 font-mono text-[13px] font-semibold`} style={{ background: "var(--c1)", color: "var(--fg)" }}>
                  {c.short} →
                </Link>
              ))}
            </div>
            <p className="mt-4 font-mono text-[11.5px] text-muted">
              ← → {UI.keysStep} · R {UI.keysReplay} · {UI.keySpace} {UI.keysPause}
            </p>
          </div>
          <HeroStage scenes={HERO} />
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          {COURSE.map((c) => (
            <div key={c.id} className="card flex flex-col overflow-hidden">
              <div className={`tone-${c.tone} border-b-[1.5px] border-line px-4 py-3`} style={{ background: "color-mix(in srgb, var(--c1) 60%, var(--panel))" }}>
                <h2 className="font-mono text-[18px] font-bold">{c.title}</h2>
                <p className="mt-1 text-[13px] leading-snug text-muted">{c.blurb}</p>
              </div>
              <ol className="flex-1 divide-y divide-line">
                {c.lessons.map((l, k) => (
                  <li key={l.id}>
                    <Link href={lessonHref(c.id, l.id)} className="flex items-baseline gap-3 px-4 py-2.5 hover:bg-panel-2">
                      <span className="font-mono text-[12px] text-muted">{k + 1}.</span>
                      <span className="flex-1 font-mono text-[13.5px] font-semibold">{l.title}</span>
                      <span className="shrink-0 font-mono text-[11px]">
                        <ChapterProgress chapter={c.id} lesson={l.id} steps={l.steps.length} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
