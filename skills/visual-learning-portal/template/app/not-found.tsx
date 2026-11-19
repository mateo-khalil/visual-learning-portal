import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <p className="text-5xl font-bold text-accent">404</p>
      <p className="mt-3 text-lg">This page does not exist yet.</p>
      <Link href="/" className="mt-6 inline-block rounded-lg bg-accent px-4 py-2 font-medium text-on-accent">
        Back to the home page
      </Link>
    </div>
  );
}
