import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
      <Link href="/" className="mb-8 text-xl font-bold tracking-tight">
        Sewa
      </Link>
      {children}
    </div>
  );
}
