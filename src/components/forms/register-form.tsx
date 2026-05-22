'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { PasswordField } from "@/components/ui/password-field";

export function RegisterForm() {
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
        const payload = {
          fullName: String(formData.get("fullName") ?? ""),
          username: String(formData.get("username") ?? ""),
          email: String(formData.get("email") ?? ""),
          phoneNumber: String(formData.get("phoneNumber") ?? ""),
          password: String(formData.get("password") ?? ""),
          confirmPassword: String(formData.get("confirmPassword") ?? ""),
        };

        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = (await response.json()) as {
          registrationId?: string;
          message?: string;
          errors?: Record<string, string[]>;
        };

        if (!response.ok) {
          setErrors(data.errors ?? {});
          toast.error(data.message ?? "Could not create your account.");
          setPending(false);
          return;
        }

        toast.success(
          "Verification email sent. Finish email verification to create the account.",
        );
        router.push(`/verify?registrationId=${data.registrationId}`);
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <TextField label="Full name" name="fullName" />
          {errors.fullName ? (
            <p className="mt-2 text-xs text-[var(--danger-500)]">{errors.fullName[0]}</p>
          ) : null}
        </div>
        <div>
          <TextField label="Username" name="username" />
          {errors.username ? (
            <p className="mt-2 text-xs text-[var(--danger-500)]">{errors.username[0]}</p>
          ) : null}
        </div>
        <div>
          <TextField label="Email" name="email" type="email" />
          {errors.email ? (
            <p className="mt-2 text-xs text-[var(--danger-500)]">{errors.email[0]}</p>
          ) : null}
        </div>
        <div>
          <TextField label="Phone number" name="phoneNumber" />
          {errors.phoneNumber ? (
            <p className="mt-2 text-xs text-[var(--danger-500)]">{errors.phoneNumber[0]}</p>
          ) : null}
        </div>
        <div>
          <PasswordField
            label="Password"
            name="password"
            autoComplete="new-password"
          />
          {errors.password ? (
            <p className="mt-2 text-xs text-[var(--danger-500)]">{errors.password[0]}</p>
          ) : null}
        </div>
        <div>
          <PasswordField
            label="Confirm password"
            name="confirmPassword"
            autoComplete="new-password"
          />
          {errors.confirmPassword ? (
            <p className="mt-2 text-xs text-[var(--danger-500)]">{errors.confirmPassword[0]}</p>
          ) : null}
        </div>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Starting email verification..." : "Create account"}
      </Button>
    </form>
  );
}
