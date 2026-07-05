import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getDressCategories,
  createDressCategory,
} from "@/repositories/inventory.repository";

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  prefix: z.string().optional(),
});

export async function GET() {
  try {
    const categories = await getDressCategories();
    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch dress categories" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = categorySchema.safeParse(body);
    
    if (!validation.success) {
      const firstError = validation.error.errors[0]?.message || "Validation failed";
      return NextResponse.json(
        { error: firstError, details: validation.error.format() },
        { status: 400 }
      );
    }

    const newCategory = await createDressCategory(validation.data);
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create dress category" },
      { status: 500 }
    );
  }
}
