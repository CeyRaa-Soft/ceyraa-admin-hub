import { NextResponse } from "next/server";
import { getOrderById, updateOrder } from "@/repositories/order.repository";
import {
  createDesign,
  getDesignById,
  updateDesign,
} from "@/repositories/inventory.repository";
import type { ColorVariant, SizeInfo } from "@/types/order";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const body = await req.json();
    const { mappings } = body;

    if (!mappings || !Array.isArray(mappings)) {
      return NextResponse.json(
        { error: "Invalid mappings data" },
        { status: 400 }
      );
    }

    // Process each mapping
    for (const mapping of mappings) {
      const { orderItemId, action, categoryId, designId, name, code, images } = mapping;

      // Find the item in the order's production category
      const productionCategory = order.categories?.find(
        (c) => c.id === "production"
      );
      const item = productionCategory?.items.find((i) => i.id === orderItemId);

      if (!item) {
        return NextResponse.json(
          { error: `Order item ${orderItemId} not found in order garments` },
          { status: 400 }
        );
      }

      if (action === "create") {
        // Create new design with the quantities from this order item
        await createDesign({
          name: name || item.name,
          categoryId,
          code: code || undefined,
          variants: item.variants, // Quantities and sizes from order
          images: images || [],
        });
      } else if (action === "merge") {
        // Merge quantities with an existing design
        if (!designId) {
          return NextResponse.json(
            { error: `Missing design ID for merge action on item ${item.name}` },
            { status: 400 }
          );
        }

        const design = await getDesignById(designId);
        if (!design) {
          return NextResponse.json(
            { error: `Design ${designId} to merge not found` },
            { status: 404 }
          );
        }

        // Merge logic for variants
        const mergedVariants = [...(design.variants || [])];

        for (const orderVar of item.variants) {
          const existingVarIdx = mergedVariants.findIndex(
            (v) => v.color.toLowerCase() === orderVar.color.toLowerCase()
          );

          if (existingVarIdx > -1) {
            // Color variant exists in design, merge sizes
            const existingVar = mergedVariants[existingVarIdx];
            const mergedSizes = [...existingVar.sizes];

            for (const orderSize of orderVar.sizes) {
              const existingSizeIdx = mergedSizes.findIndex(
                (s) => s.size.toLowerCase() === orderSize.size.toLowerCase()
              );

              if (existingSizeIdx > -1) {
                // Size exists, increment quantity
                mergedSizes[existingSizeIdx] = {
                  ...mergedSizes[existingSizeIdx],
                  quantity:
                    mergedSizes[existingSizeIdx].quantity + orderSize.quantity,
                  // Optionally keep the higher price or update it
                  unitPrice: orderSize.unitPrice || mergedSizes[existingSizeIdx].unitPrice,
                };
              } else {
                // Size doesn't exist, append new size info
                mergedSizes.push(orderSize);
              }
            }

            mergedVariants[existingVarIdx] = {
              ...existingVar,
              sizes: mergedSizes,
            };
          } else {
            // Color variant doesn't exist in design, append whole color variant
            mergedVariants.push(orderVar);
          }
        }

        // Merge images if new ones are uploaded
        const mergedImages = [...(design.images || [])];
        if (images && Array.isArray(images)) {
          for (const newImg of images) {
            // Avoid adding exact duplicate URLs
            if (!mergedImages.some((img) => img.url === newImg.url)) {
              mergedImages.push(newImg);
            }
          }
        }

        // Update existing design
        await updateDesign(designId, {
          variants: mergedVariants,
          images: mergedImages,
        });
      }
    }

    // Update supplier order status
    await updateOrder(id, {
      status: "Delivered",
      addedToInventory: true, // Custom flag to prevent double addition
    } as any);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Add to inventory conversion error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add order to inventory" },
      { status: 500 }
    );
  }
}
