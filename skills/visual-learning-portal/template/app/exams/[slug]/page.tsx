import { notFound } from "next/navigation";
import ExamView from "@/components/ExamView";
import { contentTitle, listContent } from "@/lib/content";
import { loadExam } from "@/lib/exams";
import { site } from "@/lib/site";

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `${contentTitle("exams", slug)} — ${site.name}` };
}

export function generateStaticParams() {
  return listContent("exams").map((slug) => ({ slug }));
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let exam;
  try {
    exam = loadExam(slug, "exams");
  } catch {
    notFound();
  }
  return <ExamView exam={exam} />;
}
