'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";

type ProductImageItem = {
  id?: string;
  imageUrl: string;
  altText?: string | null;
  isMain: boolean;
  sortOrder: number;
};

type ProductEditorProps = {
  product?: {
    id: string;
    name: string;
    description: string;
    priceCents: number;
    stock: number;
    sectionId: string | null;
    images: ProductImageItem[];
  };
  sections: Array<{
    id: string;
    name: string;
  }>;
};

export function ProductEditor({ product, sections }: ProductEditorProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [images, setImages] = useState<ProductImageItem[]>(
    product?.images.map((image, index) => ({
      id: image.id,
      imageUrl: image.imageUrl,
      altText: image.altText ?? "",
      isMain: image.isMain,
      sortOrder: image.sortOrder ?? index,
    })) ?? [],
  );

  const priceValue = product ? (product.priceCents / 100).toFixed(2) : undefined;

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const selectedFiles = Array.from(input.files ?? []);
    input.value = "";

    if (selectedFiles.length === 0) {
      return;
    }

    setIsUploadingImages(true);

    try {
      const uploadFormData = new FormData();
      selectedFiles.forEach((file) => uploadFormData.append("files", file));

      const uploadResponse = await fetch("/api/admin/uploads/product-image", {
        method: "POST",
        body: uploadFormData,
      });
      const uploadData = (await uploadResponse.json()) as {
        message?: string;
        imageUrls?: string[];
      };

      if (!uploadResponse.ok || !uploadData.imageUrls) {
        toast.error(uploadData.message ?? "Image upload failed.");
        return;
      }

      const { imageUrls } = uploadData;
      setImages((current) => [
        ...current,
        ...imageUrls.map((imageUrl, index) => ({
          imageUrl,
          altText: "",
          isMain: false,
          sortOrder: current.length + index,
        })),
      ]);
      toast.success("Images uploaded successfully. please choose the main image before saving");
    } finally {
      setIsUploadingImages(false);
    }
  }

  return (
    <form
      className="glass-card rounded-[36px] p-8"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setErrors({});
        const form = event.currentTarget;

        const nextImages = images.map((image, index) => ({
          ...image,
          sortOrder: index,
        }));
        setImages(nextImages);

        const formData = new FormData(form);
        const sectionId = String(formData.get("sectionId") ?? "");
        const payload = {
          name: String(formData.get("name") ?? ""),
          description: String(formData.get("description") ?? ""),
          price: String(formData.get("price") ?? ""),
          stock: Number(formData.get("stock") ?? "0"),
          sectionId,
          archived: sectionId === "",
          images: nextImages.map((image, index) => ({
            imageUrl: image.imageUrl,
            altText: image.altText ?? "",
            isMain: image.isMain,
            sortOrder: index,
          })),
        };

        const response = await fetch(
          product ? `/api/admin/products/${product.id}` : "/api/admin/products",
          {
            method: product ? "PUT" : "POST",
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
          toast.error(data.message ?? firstError ?? "Could not save the product.");
          setPending(false);
          return;
        }

        toast.success(product ? "Product updated." : "Product created.");
        router.push("/admin/products");
        router.refresh();
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <TextField
            label="Product name"
            name="name"
            defaultValue={product?.name}
            placeholder="Product name"
          />
          {errors.name ? (
            <p className="mt-2 text-xs text-[var(--danger-500)]">{errors.name[0]}</p>
          ) : null}
        </div>
        <div>
          <TextField
            label="Price"
            name="price"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            required
            defaultValue={priceValue}
            placeholder="0.00"
          />
          {errors.price ? (
            <p className="mt-2 text-xs text-[var(--danger-500)]">{errors.price[0]}</p>
          ) : null}
        </div>
        <div>
          <TextField
            label="Stock"
            name="stock"
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            required
            defaultValue={product?.stock}
            placeholder="0"
          />
          {errors.stock ? (
            <p className="mt-2 text-xs text-[var(--danger-500)]">{errors.stock[0]}</p>
          ) : null}
        </div>
        <div>
          <SelectField
            label="Section"
            name="sectionId"
            defaultValue={product?.sectionId ?? ""}
          >
            <option value="">Unassigned</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
              </option>
            ))}
          </SelectField>
          {errors.sectionId ? (
            <p className="mt-2 text-xs text-[var(--danger-500)]">{errors.sectionId[0]}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-4">
        <TextAreaField
          label="Description"
          name="description"
          defaultValue={product?.description}
        />
        {errors.description ? (
          <p className="mt-2 text-xs text-[var(--danger-500)]">{errors.description[0]}</p>
        ) : null}
      </div>

      <div className="mt-8 rounded-[28px] border border-[var(--line-soft)] bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="display-title text-2xl font-semibold text-[var(--navy-950)]">
              Product images
            </p>
            <p className="mt-2 text-sm text-[var(--ink-700)]">
              Upload images first, then explicitly choose the main image before saving.
            </p>
          </div>
          <input
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp"
            disabled={pending || isUploadingImages}
            onChange={(event) => {
              void handleImageUpload(event);
            }}
            className="max-w-[260px] text-sm"
          />
        </div>
        <p className="mt-4 text-xs uppercase tracking-[0.24em] text-[var(--ink-500)]">
          {isUploadingImages
            ? "Uploading images..."
            : images.some((image) => image.isMain)
              ? "Main image selected."
              : "Select a main image before creating this product."}
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {images.map((image, index) => (
            <article
              key={image.id ?? `${image.imageUrl}-${index}`}
              className="rounded-[24px] border border-[var(--line-soft)] p-3"
            >
              <div className="relative aspect-square overflow-hidden rounded-[18px] bg-[rgba(19,24,47,0.04)]">
                <Image
                  src={image.imageUrl}
                  alt={image.altText ?? "Product image"}
                  fill
                  className="object-cover"
                  sizes="240px"
                />
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm font-medium text-[var(--navy-950)]">
                <input
                  type="radio"
                  name="main-image"
                  checked={image.isMain}
                  onChange={() =>
                    setImages((current) =>
                      current.map((entry, entryIndex) => ({
                        ...entry,
                        isMain: entryIndex === index,
                      })),
                    )
                  }
                />
                Main image
              </label>
              <button
                type="button"
                className="mt-3 text-sm font-semibold text-[var(--danger-500)]"
                onClick={async () => {
                  if (!image.id) {
                    const response = await fetch("/api/admin/uploads/product-image", {
                      method: "DELETE",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        imageUrl: image.imageUrl,
                      }),
                    });
                    const data = (await response.json()) as { message?: string };

                    if (!response.ok) {
                      toast.error(data.message ?? "Could not remove the image.");
                      return;
                    }
                  }

                  setImages((current) =>
                    current.filter((_, entryIndex) => entryIndex !== index),
                  );
                }}
              >
                Remove image
              </button>
            </article>
          ))}
        </div>
        {errors.images ? (
          <p className="mt-4 text-xs text-[var(--danger-500)]">{errors.images[0]}</p>
        ) : null}
      </div>

      <div className="mt-8 flex gap-3">
        <Button type="submit" disabled={pending || isUploadingImages}>
          {pending
            ? "Saving..."
            : isUploadingImages
              ? "Uploading images..."
              : product
                ? "Update product"
                : "Create product"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={pending || isUploadingImages}
          onClick={() => router.push("/admin/products")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
