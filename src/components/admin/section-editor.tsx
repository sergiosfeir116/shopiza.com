'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { TextAreaField, TextField } from "@/components/ui/field";

export function SectionEditor({
  section,
}: {
  section?: {
    id: string;
    name: string;
    description: string;
  };
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  return (
    <form
      className="glass-card rounded-[36px] p-8"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setErrors({});

        const formData = new FormData(event.currentTarget);
        const payload = {
          name: String(formData.get("name") ?? ""),
          description: String(formData.get("description") ?? ""),
        };

        const response = await fetch(
          section ? `/api/admin/sections/${section.id}` : "/api/admin/sections",
          {
            method: section ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        const data = (await response.json()) as {
          message?: string;
          errors?: Record<string, string[]>;
        };

        if (!response.ok) {
          const firstError = Object.values(data.errors ?? {}).flat()[0];
          setErrors(data.errors ?? {});
          toast.error(data.message ?? firstError ?? "Could not save the section.");
          setPending(false);
          return;
        }

        toast.success(section ? "Section updated." : "Section created.");
        router.push("/admin/sections");
        router.refresh();
      }}
    >
      <div className="grid gap-4">
        <div>
          <TextField label="Section name" name="name" defaultValue={section?.name} />
          {errors.name ? (
            <p className="mt-2 text-xs text-[var(--danger-500)]">{errors.name[0]}</p>
          ) : null}
        </div>
        <div>
          <TextAreaField
            label="Description"
            name="description"
            defaultValue={section?.description}
          />
          {errors.description ? (
            <p className="mt-2 text-xs text-[var(--danger-500)]">{errors.description[0]}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : section ? "Update section" : "Create section"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() => router.push("/admin/sections")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
