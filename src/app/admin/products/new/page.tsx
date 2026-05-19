import { ProductEditor } from "@/components/admin/product-editor";
import { getAdminSections } from "@/lib/services/admin";

export default async function NewProductPage() {
  const { sections } = await getAdminSections({ page: 1, pageSize: 200 });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[var(--pink-500)]">
          Catalog
        </p>
        <h1 className="mt-2 display-title text-4xl font-semibold text-[var(--navy-950)]">
          Create product
        </h1>
      </div>
      <ProductEditor
        sections={sections.map((section) => ({
          id: section.id,
          name: section.name,
        }))}
      />
    </div>
  );
}
