import { NextResponse } from "next/server";
import { getSupplierById } from "@/repositories/supplier.repository";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supplier = await getSupplierById(id);

  return NextResponse.json(supplier);
}
