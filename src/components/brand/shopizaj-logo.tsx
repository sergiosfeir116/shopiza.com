import Image from "next/image";
import Link from "next/link";

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
      aria-label={APP_NAME}
      className={cn(
        "group inline-flex items-center rounded-full py-1",
        className,
      )}
    >
      <Image
        src="/shopizaj-logo.jpeg"
        alt={APP_NAME}
        width={1119}
        height={746}
        className="h-11 w-auto object-contain"
      />
    </Link>
  );
}
