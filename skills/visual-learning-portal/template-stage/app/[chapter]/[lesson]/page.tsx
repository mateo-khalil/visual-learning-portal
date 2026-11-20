import { notFound } from "next/navigation";
import LessonView from "@/components/stage/LessonView";
import { lessonHref } from "@/components/shell/nav";
import { COURSE, findLesson, navOf } from "@/content/course";
import { site } from "@/lib/site";

export const dynamicParams = false;

type Params = Promise<{ chapter: string; lesson: string }>;

export function generateStaticParams() {
  return COURSE.flatMap((c) => c.lessons.map((l) => ({ chapter: c.id, lesson: l.id })));
}

export async function generateMetadata({ params }: { params: Params }) {
  const { chapter, lesson } = await params;
  const f = findLesson(chapter, lesson);
  return { title: f ? `${f.lesson.title} · ${f.chapter.short} — ${site.name}` : site.name };
}

export default async function Page({ params }: { params: Params }) {
  const { chapter, lesson } = await params;
  const f = findLesson(chapter, lesson);
  if (!f) notFound();
  const nav = navOf(COURSE);
  // Previous and next lesson, across chapters.
  const flat = COURSE.flatMap((c) => c.lessons.map((l) => ({ c, l })));
  const at = flat.findIndex((x) => x.c.id === chapter && x.l.id === lesson);
  const nx = flat[at + 1];
  const pv = flat[at - 1];
  return (
    <LessonView
      chapter={nav.find((c) => c.id === chapter)!}
      lesson={f.lesson}
      nav={nav}
      index={f.index}
      next={nx ? { href: lessonHref(nx.c.id, nx.l.id), title: nx.l.title } : undefined}
      prev={pv ? { href: lessonHref(pv.c.id, pv.l.id), title: pv.l.title } : undefined}
    />
  );
}
