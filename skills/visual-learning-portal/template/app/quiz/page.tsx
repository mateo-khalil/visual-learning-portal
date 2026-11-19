import SimLayout from "@/components/SimLayout";
import Quiz from "@/components/Quiz";
import { EXAM_MODE } from "@/lib/mode";
import { site } from "@/lib/site";

export const metadata = { title: `Quiz / Mock test — ${site.name}` };

export default function QuizPage() {
  return (
    <SimLayout
      eyebrow="Practice"
      title="Quiz / Mock test"
      intro={
        <>
          Multiple choice and true/false, each with the explanation of its key
          {EXAM_MODE ? " (only questions at the course level)" : ""}. When a key is debatable it tells you which assumption to write
          down. In <strong>free mode</strong> you filter by topic; the <strong>mock test</strong> draws 10 at random and grades you. Your best
          score is saved in this browser.
        </>
      }
    >
      <Quiz />
    </SimLayout>
  );
}
