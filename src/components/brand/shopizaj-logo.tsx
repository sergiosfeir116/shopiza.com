import Link from "next/link";
import Image from "next/image";

import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function ShopizajLogo({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-3 rounded-full px-1 py-1",
        className,
      )}
    >
      <span className="relative flex h-12 w-13 bg-white items-center justify-center overflow-hidden rounded-2xl  shadow-[0_18px_36px_rgba(17,22,48,0.28)]">
        <Image
          src="/shopizaj-logo.jpeg"
          alt={APP_NAME}
          fill
          sizes="44px"
          className="rounded-2xl object-contain"
        />
      </span>
      <span className="display-title text-xl font-semibold tracking-tight text-[var(--navy-950)]">
        {APP_NAME}
      </span>
    </Link>
  );
}
