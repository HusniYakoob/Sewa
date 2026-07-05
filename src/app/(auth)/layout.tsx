import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
      <Link
        href="/"
        className="mb-8 text-2xl font-black tracking-[-1px] text-foreground"
      >
        sewa<span className="text-brand-text">.</span>
      </Link>
      {children}
    </div>
  );
}
