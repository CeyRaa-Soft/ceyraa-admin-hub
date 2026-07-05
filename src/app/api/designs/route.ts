import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getDesigns,
  getDesignsByCategoryId,
  createDesign,
} from "@/repositories/inventory.repository";

const designSchema = z.object({
  name: z.string().min(1, "Design name is required"),
  code: z.string().optional(),
  categoryId: z.string().min(1, "Category ID is required"),
  variants: z.array(z.any()).default([]),
  images: z.array(
    z.object({
      color: z.string(),
      url: z.string(),
      publicId: z.string().optional(),
    })
  ).default([]),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");

    const designs = categoryId
      ? await getDesignsByCategoryId(categoryId)
      : await getDesigns();

    return NextResponse.json(designs);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch designs" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = designSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0]?.message || "Validation failed";
      return NextResponse.json(
        { error: firstError, details: validation.error.format() },
        { status: 400 }
      );
    }

    const newDesign = await createDesign(validation.data);
    return NextResponse.json(newDesign, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create design" },
      { status: 500 }
    );
  }
}
