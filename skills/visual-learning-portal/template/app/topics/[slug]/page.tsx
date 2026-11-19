import { notFound } from "next/navigation";
import VisContent from "@/components/VisContent";
import StudiedToggle from "@/components/StudiedToggle";
import { contentTitle, listContent, readContent } from "@/lib/content";
import { site } from "@/lib/site";

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `${contentTitle("topics", slug)} — ${site.name}` };
}

export function generateStaticParams() {
  return listContent("topics").map((slug) => ({ slug }));
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let md = "";
  try {
    md = readContent("topics", `${slug}.md`);
  } catch {
    notFound();
  }
  return (
    <article>
      <VisContent>{md}</VisContent>
      <StudiedToggle />
    </article>
  );
}
