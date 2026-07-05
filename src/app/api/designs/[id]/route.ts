import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getDesignById,
  updateDesign,
  deleteDesign,
} from "@/repositories/inventory.repository";

const designSchema = z.object({
  name: z.string().min(1, "Design name is required").optional(),
  variants: z.array(z.any()).optional(),
  images: z.array(
    z.object({
      color: z.string(),
      url: z.string(),
      publicId: z.string().optional(),
    })
  ).optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const design = await getDesignById(id);
    if (!design) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 });
    }
    return NextResponse.json(design);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch design" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await getDesignById(id);
    if (!existing) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 });
    }

    const body = await req.json();
    const validation = designSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.errors[0]?.message || "Validation failed";
      return NextResponse.json(
        { error: firstError, details: validation.error.format() },
        { status: 400 }
      );
    }

    const updated = await updateDesign(id, validation.data);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update design" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await getDesignById(id);
    if (!existing) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 });
    }

    await deleteDesign(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete design" },
      { status: 500 }
    );
  }
}
