import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background py-12">
      <div className="mb-10 flex flex-col items-center text-center">
        <Image
          src="/brand/loomstory-monogram.svg"
          alt=""
          width={1254}
          height={1254}
          priority
          unoptimized
          className="h-40 w-auto sm:h-48"
        />
        <h1 className="mt-5 font-heading text-3xl font-semibold tracking-[0.25em] text-gold sm:text-4xl">
          LOOMSTORY
        </h1>
        <p className="mt-3 font-heading text-xs tracking-[0.18em] text-gold/80 sm:text-sm">
          Weave worlds, tell timeless stories.
        </p>
      </div>
      <div className="w-full max-w-md px-4">{children}</div>
    </div>
  );
}
