"use client";

import React, { useState } from "react";
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
import { useOrderTotals } from "@/contexts/OrderContext";
import type { Order, OrderCategory } from "@/types/order";

type OrderAccordionItemProps = {
  order: Order;
  categories: OrderCategory[];
  supplierNameToIdMap: Record<string, string>;
  onApprove?: (order: Order) => void;
  onEdit?: (order: Order) => void;
  onDelete?: (order: Order) => void;
  onAddItemToCategory?: (orderId: string, categoryId: string) => void;
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
  onAddItemToCategory,
}) => {
  const { getTotalForAllCategories } = useOrderTotals();
  const [addingItemToCategoryId, setAddingItemToCategoryId] = useState<
    string | null
  >(null);

  const orderTotal = getTotalForAllCategories();
  const supplierId = supplierNameToIdMap[order.supplier];

  const handleAddItem = (categoryId: string) => {
    setAddingItemToCategoryId(categoryId);
    onAddItemToCategory?.(order.id, categoryId);
  };

  return (
    <AccordionItem value={order.id}>
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex-1 text-left font-medium">{order.id}</div>
          <div className="flex flex-[1.5] items-center gap-2 text-left">
            <span>{order.supplier}</span>
            {supplierId && (
              <Link
                href={`/dashboard/suppliers/${supplierId}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
              </Link>
            )}
          </div>
          <div className="flex-1 text-left">{order.date}</div>
          <div className="flex-1 text-left">
            <Badge variant={statusVariant[order.status]}>{order.status}</Badge>
          </div>
          <div className="flex-1 text-right font-medium">
            ${orderTotal.toFixed(2)}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="p-4 bg-muted/50 rounded-md">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold">Order Details</h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onApprove?.(order)}
                disabled={order.status !== "Pending"}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Approve & Add to Inventory
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
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
                    className="text-destructive"
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
            {categories.map((category) => (
              <AccordionItem
                key={category.id}
                value={category.id}
                className="border rounded-md"
              >
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex justify-between w-full pr-4">
                    <span className="font-semibold">{category.name}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <OrderItemsTable
                    categoryId={`${order.id}-${category.id}`}
                    items={category.items}
                    onAddItem={() => handleAddItem(category.id)}
                    addingItem={addingItemToCategoryId === category.id}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="flex justify-end mt-4 pt-4 border-t">
            <div className="text-right">
              <div className="text-lg font-bold">
                Order Total: ${orderTotal.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};
