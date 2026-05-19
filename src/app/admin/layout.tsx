import { requireAdmin } from "@/lib/auth/current-user";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="container-shell py-10">
      <section>{children}</section>
    </div>
  );
}
