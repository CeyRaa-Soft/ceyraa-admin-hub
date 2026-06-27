import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getSupplierById,
  updateSupplier,
  deleteSupplier,
} from "@/repositories/supplier.repository";

const supplierSchema = z.object({
  name: z.string().min(1, "Supplier Name is required"),
  category: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  bankDetails: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  notes: z.array(z.string()).optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supplier = await getSupplierById(id);
    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }
    return NextResponse.json(supplier);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch supplier" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const existing = await getSupplierById(id);
    if (!existing) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    const body = await req.json();
    const validation = supplierSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.errors[0]?.message || "Validation failed";
      return NextResponse.json(
        { error: firstError, details: validation.error.format() },
        { status: 400 }
      );
    }

    const updated = await updateSupplier(id, validation.data as any);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update supplier" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const existing = await getSupplierById(id);
    if (!existing) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    await deleteSupplier(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete supplier" },
      { status: 500 }
    );
  }
}
