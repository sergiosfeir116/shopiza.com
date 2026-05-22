'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button, ButtonLink } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { PasswordField } from "@/components/ui/password-field";

export function LoginForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  return (
    <form
      className="grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setErrors({});

        const formData = new FormData(event.currentTarget);
        const payload = Object.fromEntries(formData.entries());

        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = (await response.json()) as {
          message?: string;
          errors?: Record<string, string[]>;
          user?: { role: "ADMIN" | "CLIENT" };
        };

        if (!response.ok) {
          setErrors(data.errors ?? {});
          toast.error(data.message ?? "Login failed.");
          setPending(false);
          return;
        }

        toast.success("Welcome back.");
        router.push(data.user?.role === "ADMIN" ? "/admin" : "/");
        router.refresh();
      }}
    >
      <div>
        <TextField
          label="Email or username"
          name="identifier"
        />
        {errors.identifier ? (
          <p className="mt-2 text-xs text-[var(--danger-500)]">{errors.identifier[0]}</p>
        ) : null}
      </div>
      <div>
        <PasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
        />
        {errors.password ? (
          <p className="mt-2 text-xs text-[var(--danger-500)]">{errors.password[0]}</p>
        ) : null}
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Signing in..." : "Login"}
      </Button>
      <div className="flex flex-wrap gap-3 text-sm">
        <ButtonLink href="/register" variant="ghost">
          Create account
        </ButtonLink>
        <ButtonLink href="/forgot-password" variant="ghost">
          Forgot password?
        </ButtonLink>
      </div>
    </form>
  );
}
