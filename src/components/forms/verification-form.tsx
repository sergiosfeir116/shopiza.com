'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button, ButtonLink } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";

export function VerificationForm({ registrationId }: { registrationId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [completed, setCompleted] = useState(false);

  const submitCode = async (code: string) => {
    setPending(true);
    const response = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId, code }),
    });
    const data = (await response.json()) as { message?: string; fullyVerified?: boolean };

    if (!response.ok) {
      toast.error(data.message ?? "Verification failed.");
      setPending(false);
      return;
    }

    toast.success("Email verified.");
    setCompleted(true);
    setPending(false);

    if (data.fullyVerified) {
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <div className="grid gap-5">
      <form
        className="rounded-[30px] border border-[var(--line-soft)] bg-white p-5"
        onSubmit={async (event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const code = String(formData.get("code") ?? "");
          await submitCode(code);
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="display-title text-2xl font-semibold text-[var(--navy-950)]">
              Email verification
            </p>
            <p className="mt-2 text-sm text-[var(--ink-700)]">
              Enter the 6-digit code sent to your email inbox.
            </p>
          </div>
          {completed ? (
            <span className="rounded-full bg-[rgba(31,157,109,0.12)] px-3 py-1 text-xs font-semibold text-[var(--success-500)]">
              Verified
            </span>
          ) : null}
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <TextField
              name="code"
              placeholder="Enter code"
              maxLength={6}
              inputMode="numeric"
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Checking..." : "Verify"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={async () => {
              setPending(true);
              const response = await fetch("/api/auth/verify", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ registrationId }),
              });
              const data = (await response.json()) as { message?: string };
              if (!response.ok) {
                toast.error(data.message ?? "Could not resend the code.");
                setPending(false);
                return;
              }
              toast.success(data.message ?? "Verification code resent.");
              setPending(false);
            }}
          >
            Resend
          </Button>
        </div>
      </form>
      <ButtonLink href="/login" variant="ghost">
        Back to login
      </ButtonLink>
    </div>
  );
}
