"use client";

import React, { useEffect, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OrderItem } from "@/types/order";
import {
  calculateItemTotalCost,
  calculateItemsSubTotal,
} from "@/lib/orderCalculations";
import { NewOrderItem } from "@/components/new-order-item";

type OrderItemsTableProps = {
  categoryId: string;
  items: OrderItem[];
  onAddItem?: () => void;
  addingItem?: boolean;
  showAddButton?: boolean;
  onSaveNewItem?: (newItem: OrderItem) => void;
  onCancelNewItem?: () => void;
};

export const OrderItemsTable: React.FC<OrderItemsTableProps> = ({
  categoryId,
  items,
  onAddItem,
  addingItem = false,
  showAddButton = true,
  onSaveNewItem,
  onCancelNewItem,
}) => {
  const subtotal = calculateItemsSubTotal(items);
  const isMaterialsCategory = categoryId.endsWith("-supplies");

  return (
    <div className="space-y-4">
      {items.length > 0 ? (
        isMaterialsCategory ? (
          /* Simple Flat Table for Fabrics & Accessories */
          <Table className="border rounded-lg overflow-hidden">
            <TableHeader className="bg-muted/10">
              <TableRow>
                <TableHead>Material / Accessory</TableHead>
                <TableHead className="text-right">Quantity / Unit</TableHead>
                <TableHead className="text-right">Total Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const variant = item.variants[0];
                const sizeInfo = variant?.sizes[0];
                const qty = sizeInfo?.quantity || 0;
                const unit = sizeInfo?.size || "";
                const totalPrice = qty * (sizeInfo?.unitPrice || 0);

                return (
                  <TableRow key={item.id} className="hover:bg-muted/5">
                    <TableCell className="font-semibold text-foreground">{item.name}</TableCell>
                    <TableCell className="text-right font-mono">{qty} {unit}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-foreground">
                      ${totalPrice.toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          /* Detailed Garment Accordion Table for Sewing & Tailoring */
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
        )
      ) : (
        <div className="text-center py-4 text-xs text-muted-foreground italic">
          No items in this category.
        </div>
      )}

      {addingItem && (
        <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {isMaterialsCategory ? (
            /* Simple Materials entry form */
            <MaterialForm
              onSave={(newItem) => onSaveNewItem?.(newItem)}
              onCancel={() => onCancelNewItem?.()}
            />
          ) : (
            /* Complex Garments entry form */
            <div className="border border-primary/30 rounded-xl overflow-hidden bg-muted/5">
              <NewOrderItem
                onSave={(newItem) => onSaveNewItem?.(newItem)}
                onCancel={() => onCancelNewItem?.()}
              />
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between items-center pt-4 border-t">
        {showAddButton && !addingItem && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddItem}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>
        )}
        <div className="text-right font-bold ml-auto text-sm md:text-base">
          Subtotal: ${subtotal.toFixed(2)}
        </div>
      </div>
    </div>
  );
};

/* Inner Helper Component for Simple Material Entry */
interface MaterialFormProps {
  onSave: (newItem: OrderItem) => void;
  onCancel: () => void;
}

function MaterialForm({ onSave, onCancel }: MaterialFormProps) {
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("kg");
  const [price, setPrice] = useState("");

  const handleSave = () => {
    if (!name.trim() || !qty || !price) {
      alert("Please fill in all material details.");
      return;
    }
    const q = parseFloat(qty) || 0;
    const p = parseFloat(price) || 0;
    
    onSave({
      id: `item-${Date.now()}`,
      name: name.trim(),
      variants: [
        {
          id: `var-${Date.now()}`,
          color: "Default",
          sizes: [
            {
              size: unit,
              quantity: q,
              unitPrice: q > 0 ? p / q : 0,
            },
          ],
        },
      ],
    });
  };

  return (
    <div className="space-y-4 p-4 border rounded-xl bg-card shadow-sm border-primary/20">
      <h5 className="font-semibold text-sm text-foreground/80">Add Material / Accessory</h5>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2 space-y-1">
          <Label htmlFor="mat-name" className="text-xs">Material Description</Label>
          <Input
            id="mat-name"
            placeholder="e.g. rib red, rib 2 way"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="mat-qty" className="text-xs">Quantity</Label>
          <div className="flex gap-1">
            <Input
              id="mat-qty"
              type="number"
              placeholder="e.g. 25"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-20"
            />
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">kg</SelectItem>
                <SelectItem value="yards">yards</SelectItem>
                <SelectItem value="m">m</SelectItem>
                <SelectItem value="pcs">pcs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="mat-price" className="text-xs">Total Price ($)</Label>
          <Input
            id="mat-price"
            type="number"
            placeholder="e.g. 48000"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
        <Button variant="ghost" size="sm" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} type="button">
          Save Material
        </Button>
      </div>
    </div>
  );
}
