"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  MoreHorizontal,
  FilePen,
  Trash2,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { OrderItemsTable } from "@/components/OrderItemsTable";
import type { Order, OrderCategory, OrderItem } from "@/types/order";
import { calculateItemsSubTotal } from "@/lib/orderCalculations";

type OrderAccordionItemProps = {
  order: Order;
  categories: OrderCategory[];
  supplierNameToIdMap: Record<string, string>;
  onApprove?: (order: Order) => void;
  onEdit?: (order: Order) => void;
  onDelete?: (order: Order) => void;
  onSaveChanges?: (orderId: string, updatedCategories: OrderCategory[]) => void;
};

const statusVariant: Record<
  Order["status"],
  "secondary" | "default" | "outline"
> = {
  Pending: "secondary",
  Approved: "default",
  Delivered: "outline",
};

export const OrderAccordionItem: React.FC<OrderAccordionItemProps> = ({
  order,
  categories,
  supplierNameToIdMap,
  onApprove,
  onEdit,
  onDelete,
  onSaveChanges,
}) => {
  const [addingItemToCategoryId, setAddingItemToCategoryId] = useState<
    string | null
  >(null);

  // Maintain local categories state to support multiple items addition before save
  const [localCategories, setLocalCategories] = useState<OrderCategory[]>(categories);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sync with parent properties updates
  useEffect(() => {
    setLocalCategories(categories);
    setHasUnsavedChanges(false);
  }, [categories]);

  const getOrderTotal = () => {
    let total = 0;
    localCategories.forEach((cat) => {
      cat.items.forEach((item) => {
        item.variants.forEach((v) => {
          v.sizes.forEach((s) => {
            total += s.quantity * s.unitPrice;
          });
        });
      });
    });
    return total;
  };

  const getCategoryDisplayName = (catId: string, originalName: string) => {
    if (catId === "production") return "Sewing & Tailoring (Garments)";
    if (catId === "supplies") return "Fabrics & Accessories (Materials)";
    return originalName;
  };

  const orderTotal = getOrderTotal();
  const supplierId = supplierNameToIdMap[order.supplier];

  const handleAddItem = (categoryId: string) => {
    setAddingItemToCategoryId(categoryId);
  };

  const handleSaveNewItemLocal = (categoryId: string, newItem: OrderItem) => {
    setLocalCategories((prev) =>
      prev.map((cat) => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            items: [...cat.items, newItem],
          };
        }
        return cat;
      })
    );
    setHasUnsavedChanges(true);
  };

  return (
    <AccordionItem
      value={order.id}
      className="border rounded-xl mb-4 overflow-hidden bg-card transition-all duration-300 data-[state=open]:border-primary/50 data-[state=open]:shadow-md"
    >
      <AccordionTrigger className="hover:no-underline px-6 py-4 transition-colors border-b data-[state=closed]:border-b-transparent data-[state=open]:border-border/60 data-[state=open]:bg-primary/5 data-[state=open]:text-primary">
        <div className="flex items-center justify-between w-full pr-4 text-sm md:text-base">
          <div className="flex-1 text-left font-bold">{order.id}</div>
          <div className="flex flex-[1.5] items-center gap-2 text-left">
            <span className="font-semibold">{order.supplier}</span>
            {supplierId && (
              <Link
                href={`/suppliers/${supplierId}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
              </Link>
            )}
          </div>
          <div className="flex-1 text-left hidden md:block">{order.date}</div>
          <div className="flex-1 text-left">
            <Badge variant={statusVariant[order.status]}>{order.status}</Badge>
          </div>
          <div className="flex-1 text-right font-mono font-bold">
            ${orderTotal.toFixed(2)}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="p-6 bg-muted/15">
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-sm tracking-tight text-foreground/80">
              Order Details
            </h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onApprove?.(order)}
                disabled={order.status !== "Pending" || hasUnsavedChanges}
                title={hasUnsavedChanges ? "Please save changes before approving" : undefined}
              >
                <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
                Approve & Add to Inventory
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0 border hover:bg-muted/40">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit?.(order)}>
                    <FilePen className="mr-2 h-4 w-4" />
                    Edit Order
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                    onClick={() => onDelete?.(order)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Order
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Category Accordions */}
          <Accordion type="multiple" className="w-full space-y-4">
            {localCategories.map((category) => {
              const subtotal = calculateItemsSubTotal(category.items);
              return (
                <AccordionItem
                  key={category.id}
                  value={category.id}
                  className="border rounded-xl bg-card overflow-hidden"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/10 font-semibold text-sm">
                    <div className="flex justify-between w-full pr-4 items-center">
                      <span>{getCategoryDisplayName(category.id, category.name)}</span>
                      <span className="font-mono text-xs text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full border">
                        ${subtotal.toFixed(2)}
                      </span>
                    </div>
                  </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2">
                  <OrderItemsTable
                    categoryId={`${order.id}-${category.id}`}
                    items={category.items}
                    onAddItem={() => handleAddItem(category.id)}
                    addingItem={addingItemToCategoryId === category.id}
                    onSaveNewItem={(newItem) => {
                      handleSaveNewItemLocal(category.id, newItem);
                      setAddingItemToCategoryId(null);
                    }}
                    onCancelNewItem={() => setAddingItemToCategoryId(null)}
                  />
                </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-border/60">
            {hasUnsavedChanges ? (
              <div className="flex items-center gap-2 text-xs text-amber-500 font-semibold animate-pulse">
                <span>⚠️ Unsaved changes. Save order to commit items.</span>
              </div>
            ) : (
              <div />
            )}
            <div className="text-right flex items-center gap-4">
              <div className="text-lg font-bold">
                Order Total: ${orderTotal.toFixed(2)}
              </div>
              {hasUnsavedChanges && (
                <Button
                  onClick={() => {
                    onSaveChanges?.(order.id, localCategories);
                    setHasUnsavedChanges(false);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white animate-in fade-in zoom-in-95 duration-200"
                  size="sm"
                >
                  Save Order Items
                </Button>
              )}
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};
