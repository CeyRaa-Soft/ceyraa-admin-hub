"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus } from "lucide-react";
import { useOrderTotals } from "@/contexts/OrderContext";
import type { OrderItem } from "@/types/order";
import {
  calculateItemTotalCost,
  calculateItemsSubTotal,
} from "@/lib/orderCalculations";

type OrderItemsTableProps = {
  categoryId: string;
  items: OrderItem[];
  onAddItem?: () => void;
  addingItem?: boolean;
  showAddButton?: boolean;
};

export const OrderItemsTable: React.FC<OrderItemsTableProps> = ({
  categoryId,
  items,
  onAddItem,
  addingItem = false,
  showAddButton = true,
}) => {
  const { updateCategoryTotal } = useOrderTotals();

  // Calculate and update total whenever items change
  useEffect(() => {
    const total = calculateItemsSubTotal(items);
    updateCategoryTotal(categoryId, total);
  }, [items, categoryId, updateCategoryTotal]);

  const subtotal = calculateItemsSubTotal(items);

  return (
    <div className="space-y-4">
      <Accordion type="multiple" className="w-full space-y-2">
        {items.map((item) => (
          <AccordionItem
            value={item.id}
            key={item.id}
            className="bg-background/50 border rounded-md px-4"
          >
            <AccordionTrigger>
              <div className="flex justify-between w-full font-semibold">
                <span>{item.name}</span>
                <span>Total: ${calculateItemTotalCost(item).toFixed(2)}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Color</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {item.variants.map((variant) => (
                    <React.Fragment key={variant.id}>
                      {variant.sizes.map((size, sizeIndex) => (
                        <TableRow
                          key={`${variant.id}-${size.size}`}
                          className="hover:bg-transparent"
                        >
                          {sizeIndex === 0 && (
                            <TableCell
                              rowSpan={variant.sizes.length}
                              className="align-top font-medium"
                            >
                              {variant.color}
                            </TableCell>
                          )}
                          <TableCell>{size.size}</TableCell>
                          <TableCell className="text-right">
                            {size.quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            ${size.unitPrice.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="flex justify-between items-center pt-4 border-t">
        {showAddButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddItem}
            disabled={addingItem}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>
        )}
        <div className="text-right font-bold ml-auto">
          Subtotal: ${subtotal.toFixed(2)}
        </div>
      </div>
    </div>
  );
};
