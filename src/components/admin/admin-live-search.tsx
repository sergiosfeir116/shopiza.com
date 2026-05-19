'use client';

import { startTransition, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { TextField } from "@/components/ui/field";

const SEARCH_DEBOUNCE_MS = 300;

export function AdminLiveSearch({
  defaultValue,
}: {
  defaultValue: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const currentQuery = searchParams.get("query") ?? "";
      if (value === currentQuery) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      params.delete("page");

      if (value.trim()) {
        params.set("query", value.trim());
      } else {
        params.delete("query");
      }

      const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      startTransition(() => {
        router.replace(nextUrl, { scroll: false });
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [pathname, router, searchParams, value]);

  return (
    <TextField
      label="Search"
      name="query"
      value={value}
      onChange={(event) => setValue(event.currentTarget.value)}
    />
  );
}
