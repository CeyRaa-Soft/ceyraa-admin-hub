import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getOrderById,
  updateOrder,
  deleteOrder,
} from "@/repositories/order.repository";

const orderSchema = z.object({
  id: z.string().optional(),
  supplier: z.string().min(1, "Supplier is required"),
  date: z.string(),
  status: z.enum(["Pending", "Approved", "Delivered"]),
  categories: z.array(z.any()).optional().default([]),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch order" },
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
    const existing = await getOrderById(id);
    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const body = await req.json();
    const validation = orderSchema.partial().safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.errors[0]?.message || "Validation failed";
      return NextResponse.json(
        { error: firstError, details: validation.error.format() },
        { status: 400 }
      );
    }

    const updated = await updateOrder(id, validation.data as any);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update order" },
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
    const existing = await getOrderById(id);
    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    await deleteOrder(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete order" },
      { status: 500 }
    );
  }
}
