import { SectionEditor } from "@/components/admin/section-editor";

export default function NewSectionPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[var(--pink-500)]">
          Catalog
        </p>
        <h1 className="mt-2 display-title text-4xl font-semibold text-[var(--navy-950)]">
          Create section
        </h1>
      </div>
      <SectionEditor />
    </div>
  );
}
