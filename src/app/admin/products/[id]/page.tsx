import { notFound } from "next/navigation";

import { ProductEditor } from "@/components/admin/product-editor";
import { getAdminSections } from "@/lib/services/admin";
import { getAdminProductById } from "@/lib/services/catalog";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, sectionsResult] = await Promise.all([
    getAdminProductById(id),
    getAdminSections({ page: 1, pageSize: 200 }),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[var(--pink-500)]">
          Catalog
        </p>
        <h1 className="mt-2 display-title text-4xl font-semibold text-[var(--navy-950)]">
          Edit product
        </h1>
      </div>
      <ProductEditor
        product={{
          id: product.id,
          name: product.name,
          description: product.description,
          priceCents: product.priceCents,
          stock: product.stock,
          sectionId: product.sectionId,
          images: product.images,
        }}
        sections={sectionsResult.sections.map((section) => ({
          id: section.id,
          name: section.name,
        }))}
      />
    </div>
  );
}
