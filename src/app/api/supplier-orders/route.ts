import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getOrders,
  createOrder,
} from "@/repositories/order.repository";

const orderSchema = z.object({
  id: z.string().optional(),
  supplier: z.string().min(1, "Supplier is required"),
  date: z.string(),
  status: z.enum(["Pending", "Approved", "Delivered"]).default("Pending"),
  categories: z.array(z.any()).optional().default([]),
});

export async function GET() {
  try {
    const orders = await getOrders();
    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate request body
    const validation = orderSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.errors[0]?.message || "Validation failed";
      return NextResponse.json(
        { error: firstError, details: validation.error.format() },
        { status: 400 }
      );
    }

    const orderData = validation.data;
    
    // Initialize standard categories if they are empty
    if (!orderData.categories || orderData.categories.length === 0) {
      orderData.categories = [
        { id: "production", name: "Sewing & Tailoring (Garments)", items: [] },
        { id: "supplies", name: "Fabrics & Accessories (Materials)", items: [] }
      ];
    }

    const newOrder = await createOrder(orderData as any);

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
