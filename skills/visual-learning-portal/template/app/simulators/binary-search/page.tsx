import SimLayout from "@/components/SimLayout";
import BinarySearchSim from "@/components/example/BinarySearchSim";
import Classifier from "@/components/Classifier";
import { site } from "@/lib/site";

export const metadata = { title: `Binary search, step by step — ${site.name}` };

export default function Page() {
  return (
    <SimLayout
      eyebrow="Simulator · Searching"
      title="Binary search, step by step"
      theoryHref="/topics/binary-search"
      intro={
        <>
          Three runs on sorted arrays: a hit, a miss (and where the value would be inserted) and the <strong>first occurrence</strong> among
          duplicates. Step with ← / →, or press space to play. The table under the array is exactly what you write on paper.
        </>
      }
    >
      <BinarySearchSim preset="basic" />
      <section className="space-y-3 pt-4">
        <h2 className="text-xl font-bold">How fast does it grow?</h2>
        <Classifier dataset="complexity" />
      </section>
    </SimLayout>
  );
}
