import { notFound } from "next/navigation";
import ExamView from "@/components/ExamView";
import StudiedToggle from "@/components/StudiedToggle";
import { contentTitle, listContent } from "@/lib/content";
import { loadExam } from "@/lib/exams";
import { site } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return listContent("questions").map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `${contentTitle("questions", slug)} — ${site.name}` };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let exam;
  try {
    exam = loadExam(slug, "questions");
  } catch {
    notFound();
  }
  return (
    <>
      <ExamView exam={exam} />
      <StudiedToggle />
    </>
  );
}
