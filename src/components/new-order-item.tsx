"use client";

import React, { useState } from "react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import type { OrderItem, ColorVariant } from "@/types/order";
import { GarmentVariantsEditor } from "@/components/GarmentVariantsEditor";

interface NewOrderItemProps {
  onSave: (newItem: OrderItem) => void;
  onCancel: () => void;
  initialItem?: OrderItem;
}

export function NewOrderItem({ onSave, onCancel, initialItem }: NewOrderItemProps) {
  const [itemName, setItemName] = useState(initialItem?.name || "");
  const [variants, setVariants] = useState<ColorVariant[]>(
    initialItem?.variants.map((v) => ({
      ...v,
      id: v.id || `variant-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    })) || []
  );

  const handleSave = () => {
    if (!itemName.trim()) {
      return;
    }
    const newItem: OrderItem = {
      id: initialItem?.id || `item-${Date.now()}`,
      name: itemName.trim(),
      variants: variants.map((v, i) => ({
        ...v,
        id: v.id || `variant-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
      })),
    };
    onSave(newItem);
  };

  return (
    <AccordionItem value="new-item" className="bg-background/50 border rounded-md px-4 border-primary">
      <AccordionTrigger>
        <div className="flex justify-between w-full font-semibold text-primary">
          <span>{initialItem ? "Edit Garment Item" : "New Garment Item"}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 p-4">
          <div className="space-y-1.5">
            <Input
              placeholder="Item Name (e.g., V-Neck T-Shirt - 123TS)"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="font-semibold"
            />
          </div>

          <GarmentVariantsEditor
            variants={variants}
            onChange={setVariants}
            showPrice={true}
          />

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border/40">
            <Button variant="ghost" onClick={onCancel} type="button">
              <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button onClick={handleSave} type="button">
              <Check className="mr-2 h-4 w-4" /> Save Item
            </Button>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
