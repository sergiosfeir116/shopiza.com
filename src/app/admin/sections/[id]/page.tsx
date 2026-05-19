import { notFound } from "next/navigation";

import { SectionEditor } from "@/components/admin/section-editor";
import { getAdminSectionById } from "@/lib/services/admin";

export default async function EditSectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const section = await getAdminSectionById(id);

  if (!section) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[var(--pink-500)]">
          Catalog
        </p>
        <h1 className="mt-2 display-title text-4xl font-semibold text-[var(--navy-950)]">
          Edit section
        </h1>
      </div>
      <SectionEditor
        section={{
          id: section.id,
          name: section.name,
          description: section.description,
        }}
      />
    </div>
  );
}
