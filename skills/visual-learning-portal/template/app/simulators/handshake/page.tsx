import SimLayout from "@/components/SimLayout";
import HandshakeSim from "@/components/example/HandshakeSim";
import { site } from "@/lib/site";

export const metadata = { title: `TCP three-way handshake — ${site.name}` };

export default function Page() {
  return (
    <SimLayout
      eyebrow="Simulator · Networking"
      title="TCP three-way handshake"
      theoryHref="/topics/binary-search#the-same-idea-elsewhere"
      theoryLabel="Where it shows up in the topic"
      intro={
        <>
          SYN, SYN-ACK, ACK between a client and a server, with the TCP state of each end and the sequence numbers. The second tab loses the
          SYN-ACK and shows the <strong>retransmission timer</strong> rescuing the connection.
        </>
      }
    >
      <HandshakeSim preset="normal" />
    </SimLayout>
  );
}
