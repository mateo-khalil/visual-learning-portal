import Steps from "./Steps";
import Flow from "./Flow";
import Sequence from "./Sequence";
import Tree from "./Tree";
import Gantt from "./Gantt";
import Queues from "./Queues";

/**
 * Mounts the diagram of a ```<lang> block of the markdown. The languages are listed
 * in `lib/markerSplit.ts` (DIAGRAM_LANGS); each component's header comment is the
 * spec of its syntax.
 */
export default function Diagram({ lang, body }: { lang: string; body: string }) {
  switch (lang) {
    case "steps":
      return <Steps body={body} />;
    case "flow":
      return <Flow body={body} />;
    case "sequence":
      return <Sequence body={body} />;
    case "tree":
      return <Tree body={body} />;
    case "gantt":
      return <Gantt body={body} />;
    case "queues":
      return <Queues body={body} />;
    default:
      return null;
  }
}
