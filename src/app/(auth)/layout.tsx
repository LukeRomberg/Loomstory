import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black py-12">
      <Image
        src="/brand/loomstory-monogram.png"
        alt="Loomstory"
        width={512}
        height={512}
        priority
        className="mb-8 h-auto w-48 sm:w-64"
      />
      <div className="w-full max-w-md px-4">{children}</div>
    </div>
  );
}
