import { NextResponse } from "next/server";
import {
  getSuppliers,
  createSupplier,
} from "@/repositories/supplier.repository";

export async function GET() {
  const suppliers = await getSuppliers();

  return NextResponse.json(suppliers);
}

export async function POST(req: Request) {
  const body = await req.json();

  await createSupplier(body);

  return NextResponse.json({
    success: true,
  });
}
