'use client';

import { startTransition, useEffect, useEffectEvent, useState } from "react";
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

  const applySearch = useEffectEvent((nextValue: string) => {
    const trimmedValue = nextValue.trim();
    const currentQuery = searchParams.get("query") ?? "";
    if (trimmedValue === currentQuery) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");

    if (trimmedValue) {
      params.set("query", trimmedValue);
    } else {
      params.delete("query");
    }

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    startTransition(() => {
      router.replace(nextUrl, { scroll: false });
    });
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      applySearch(value);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [value]);

  return (
    <TextField
      label="Search"
      name="query"
      value={value}
      onChange={(event) => setValue(event.currentTarget.value)}
    />
  );
}
