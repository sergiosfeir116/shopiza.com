import { RegisterForm } from "@/components/forms/register-form";
import { redirectAdminHome } from "@/lib/auth/current-user";

export default async function RegisterPage() {
  await redirectAdminHome();

  return (
    <div className="container-shell py-12">
      <div className="mx-auto max-w-3xl glass-card rounded-[40px] p-8 md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[var(--pink-500)]">
          Create account
        </p>
        <h1 className="mt-3 display-title text-4xl font-semibold text-[var(--navy-950)]">
          Join Shopiza as a client
        </h1>
        <p className="mt-3 text-sm leading-7 text-[var(--ink-700)]">
          New accounts start as clients by default and are only created after email verification. Delivery location is chosen separately for each order during checkout.
        </p>
        <div className="mt-8">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
