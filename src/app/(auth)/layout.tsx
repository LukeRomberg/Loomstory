import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background py-12">
      <Image
        src="/brand/loomstory-logo.png"
        alt="Loomstory"
        width={256}
        height={256}
        priority
        className="mb-8 h-auto w-48 sm:w-56"
      />
      <div className="w-full max-w-md px-4">{children}</div>
    </div>
  );
}
