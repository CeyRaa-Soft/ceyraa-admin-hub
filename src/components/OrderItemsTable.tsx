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
import { Plus, FilePen, Trash2 } from "lucide-react";
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
  onUpdateItem?: (updatedItem: OrderItem) => void;
  onDeleteItem?: (itemId: string) => void;
};

export const OrderItemsTable: React.FC<OrderItemsTableProps> = ({
  categoryId,
  items,
  onAddItem,
  addingItem = false,
  showAddButton = true,
  onSaveNewItem,
  onCancelNewItem,
  onUpdateItem,
  onDeleteItem,
}) => {
  const subtotal = calculateItemsSubTotal(items);
  const isMaterialsCategory = categoryId.endsWith("-supplies");
  const isOtherCategory = categoryId.endsWith("-other");

  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {items.length > 0 ? (
        isOtherCategory ? (
          /* Simple Flat Table for Other Expenses */
          <Table className="border rounded-lg overflow-hidden bg-card">
            <TableHeader className="bg-muted/10">
              <TableRow>
                <TableHead>Expense Detail</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const variant = item.variants[0];
                const sizeInfo = variant?.sizes[0];
                const price = sizeInfo?.unitPrice || 0;

                if (editingItemId === item.id) {
                  return (
                    <TableRow key={item.id} className="hover:bg-transparent">
                      <TableCell colSpan={3} className="p-2">
                        <ExpenseForm
                          initialItem={item}
                          onSave={(updatedItem) => {
                            onUpdateItem?.(updatedItem);
                            setEditingItemId(null);
                          }}
                          onCancel={() => setEditingItemId(null)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                }

                return (
                  <TableRow key={item.id} className="hover:bg-muted/5">
                    <TableCell className="font-semibold text-foreground">{item.name}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-foreground">
                      ${price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary"
                          onClick={() => setEditingItemId(item.id)}
                          type="button"
                        >
                          <FilePen className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => onDeleteItem?.(item.id)}
                          type="button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : isMaterialsCategory ? (
          /* Simple Flat Table for Fabrics & Accessories */
          <Table className="border rounded-lg overflow-hidden bg-card">
            <TableHeader className="bg-muted/10">
              <TableRow>
                <TableHead>Material / Accessory</TableHead>
                <TableHead className="text-right">Quantity / Unit</TableHead>
                <TableHead className="text-right">Total Price</TableHead>
                <TableHead className="text-right w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const variant = item.variants[0];
                const sizeInfo = variant?.sizes[0];
                const qty = sizeInfo?.quantity || 0;
                const unit = sizeInfo?.size || "";
                const totalPrice = qty * (sizeInfo?.unitPrice || 0);

                if (editingItemId === item.id) {
                  return (
                    <TableRow key={item.id} className="hover:bg-transparent">
                      <TableCell colSpan={4} className="p-2">
                        <MaterialForm
                          initialItem={item}
                          onSave={(updatedItem) => {
                            onUpdateItem?.(updatedItem);
                            setEditingItemId(null);
                          }}
                          onCancel={() => setEditingItemId(null)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                }

                return (
                  <TableRow key={item.id} className="hover:bg-muted/5">
                    <TableCell className="font-semibold text-foreground">{item.name}</TableCell>
                    <TableCell className="text-right font-mono">{qty} {unit}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-foreground">
                      ${totalPrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary"
                          onClick={() => setEditingItemId(item.id)}
                          type="button"
                        >
                          <FilePen className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => onDeleteItem?.(item.id)}
                          type="button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          /* Detailed Garment Accordion Table for Sewing & Tailoring */
          <Accordion type="multiple" className="w-full space-y-2">
            {items.map((item) => {
              if (editingItemId === item.id) {
                return (
                  <div key={item.id} className="my-2 border border-primary/40 rounded-xl overflow-hidden bg-muted/5 p-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <NewOrderItem
                      initialItem={item}
                      onSave={(updatedItem) => {
                        onUpdateItem?.(updatedItem);
                        setEditingItemId(null);
                      }}
                      onCancel={() => setEditingItemId(null)}
                    />
                  </div>
                );
              }

              return (
                <AccordionItem
                  value={item.id}
                  key={item.id}
                  className="bg-background/50 border rounded-md overflow-hidden"
                >
                  <div className="flex justify-between w-full items-center pr-4 bg-muted/5">
                    <AccordionTrigger className="flex-1 hover:no-underline py-3 px-4 text-left">
                      <span className="font-semibold">{item.name}</span>
                    </AccordionTrigger>
                    <div className="flex items-center gap-3 font-semibold">
                      <span className="font-mono text-sm text-foreground/80">${calculateItemTotalCost(item).toFixed(2)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary border hover:bg-muted bg-background/50"
                        onClick={() => setEditingItemId(item.id)}
                        type="button"
                      >
                        <FilePen className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10 border border-destructive/20 bg-background/50"
                        onClick={() => onDeleteItem?.(item.id)}
                        type="button"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <AccordionContent className="px-4 pb-4 pt-2">
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
              );
            })}
          </Accordion>
        )
      ) : (
        <div className="text-center py-4 text-xs text-muted-foreground italic">
          No items in this category.
        </div>
      )}

      {addingItem && (
        <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {isOtherCategory ? (
            /* Simple Other Expenses entry form */
            <ExpenseForm
              onSave={(newItem) => onSaveNewItem?.(newItem)}
              onCancel={() => onCancelNewItem?.()}
            />
          ) : isMaterialsCategory ? (
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
  initialItem?: OrderItem;
}

function MaterialForm({ onSave, onCancel, initialItem }: MaterialFormProps) {
  const variant = initialItem?.variants[0];
  const sizeInfo = variant?.sizes[0];

  const [name, setName] = useState(initialItem?.name || "");
  const [qty, setQty] = useState(sizeInfo ? String(sizeInfo.quantity) : "");
  const [unit, setUnit] = useState(sizeInfo?.size || "kg");
  const [price, setPrice] = useState(
    sizeInfo ? String((sizeInfo.quantity * sizeInfo.unitPrice).toFixed(2)) : ""
  );

  const handleSave = () => {
    if (!name.trim() || !qty || !price) {
      alert("Please fill in all material details.");
      return;
    }
    const q = parseFloat(qty) || 0;
    const p = parseFloat(price) || 0;
    
    onSave({
      id: initialItem?.id || `item-${Date.now()}`,
      name: name.trim(),
      variants: [
        {
          id: variant?.id || `var-${Date.now()}`,
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
      <h5 className="font-semibold text-sm text-foreground/80">
        {initialItem ? "Edit Material / Accessory" : "Add Material / Accessory"}
      </h5>
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

/* Inner Helper Component for Simple Expense Entry */
interface ExpenseFormProps {
  onSave: (newItem: OrderItem) => void;
  onCancel: () => void;
  initialItem?: OrderItem;
}

function ExpenseForm({ onSave, onCancel, initialItem }: ExpenseFormProps) {
  const variant = initialItem?.variants[0];
  const sizeInfo = variant?.sizes[0];

  const [detail, setDetail] = useState(initialItem?.name || "");
  const [cost, setCost] = useState(sizeInfo ? String(sizeInfo.unitPrice.toFixed(2)) : "");

  const handleSave = () => {
    if (!detail.trim() || !cost) {
      alert("Please fill in all expense details.");
      return;
    }
    const c = parseFloat(cost) || 0;
    
    onSave({
      id: initialItem?.id || `item-${Date.now()}`,
      name: detail.trim(),
      variants: [
        {
          id: variant?.id || `var-${Date.now()}`,
          color: "Default",
          sizes: [
            {
              size: "flat",
              quantity: 1,
              unitPrice: c,
            },
          ],
        },
      ],
    });
  };

  return (
    <div className="space-y-4 p-4 border rounded-xl bg-card shadow-sm border-primary/20">
      <h5 className="font-semibold text-sm text-foreground/80">
        {initialItem ? "Edit Other Expense" : "Add Other Expense"}
      </h5>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 space-y-1">
          <Label htmlFor="exp-detail" className="text-xs">Expense Description</Label>
          <Input
            id="exp-detail"
            placeholder="e.g. Courier charges, Ironing & Packaging, Patternmaking & Grading"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="exp-cost" className="text-xs">Cost ($)</Label>
          <Input
            id="exp-cost"
            type="number"
            placeholder="e.g. 1200"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
        <Button variant="ghost" size="sm" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} type="button">
          Save Expense
        </Button>
      </div>
    </div>
  );
}
