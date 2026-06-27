import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getSuppliers,
  createSupplier,
} from "@/repositories/supplier.repository";

const supplierSchema = z.object({
  name: z.string().min(1, "Supplier Name is required"),
  category: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  bankDetails: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  notes: z.array(z.string()).optional().default([]),
});

export async function GET() {
  try {
    const suppliers = await getSuppliers();
    return NextResponse.json(suppliers);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch suppliers" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate request body
    const validation = supplierSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.errors[0]?.message || "Validation failed";
      return NextResponse.json(
        { error: firstError, details: validation.error.format() },
        { status: 400 }
      );
    }

    const newSupplier = await createSupplier(validation.data as any);

    return NextResponse.json(newSupplier, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create supplier" },
      { status: 500 }
    );
  }
}
