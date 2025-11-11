"use client";

import React, { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Check, X } from "lucide-react";
import type { OrderItem, ColorVariant, SizeInfo } from "@/types/order";

interface NewOrderItemProps {
    onSave: (newItem: OrderItem) => void;
    onCancel: () => void;
}

export function NewOrderItem({ onSave, onCancel }: NewOrderItemProps) {
    const [itemName, setItemName] = useState("");
    const [variants, setVariants] = useState<Omit<ColorVariant, 'id'>[]>([]);

    const handleAddVariant = () => {
        setVariants([...variants, { color: "", sizes: [] }]);
    };

    const handleVariantChange = (index: number, field: 'color', value: any) => {
        const newVariants = [...variants];
        newVariants[index] = { ...newVariants[index], [field]: value };
        setVariants(newVariants);
    };

    const handleRemoveVariant = (index: number) => {
        const newVariants = variants.filter((_, i) => i !== index);
        setVariants(newVariants);
    };

    const handleAddSize = (variantIndex: number) => {
        const newVariants = [...variants];
        newVariants[variantIndex].sizes.push({ size: "", quantity: 0, unitPrice: 0 });
        setVariants(newVariants);
    };

    const handleSizeChange = (variantIndex: number, sizeIndex: number, field: keyof SizeInfo, value: any) => {
        const newVariants = [...variants];
        const newSizes = [...newVariants[variantIndex].sizes];
        if (field === 'quantity' || field === 'unitPrice') {
            newSizes[sizeIndex] = { ...newSizes[sizeIndex], [field]: parseFloat(value) || 0 };
        } else {
            newSizes[sizeIndex] = { ...newSizes[sizeIndex], [field]: value };
        }
        newVariants[variantIndex].sizes = newSizes;
        setVariants(newVariants);
    };
    
    const handleRemoveSize = (variantIndex: number, sizeIndex: number) => {
        const newVariants = [...variants];
        newVariants[variantIndex].sizes = newVariants[variantIndex].sizes.filter((_, i) => i !== sizeIndex);
        setVariants(newVariants);
    };

    const handleSave = () => {
        if (!itemName.trim()) {
            // Maybe show a toast or error message
            return;
        }
        const newItem: OrderItem = {
            id: `item-${Date.now()}`,
            name: itemName,
            variants: variants.map((v, i) => ({ ...v, id: `variant-${Date.now()}-${i}` })),
        };
        onSave(newItem);
    };


    return (
        <AccordionItem value="new-item" className="bg-background/50 border rounded-md px-4 border-primary">
            <AccordionTrigger>
                <div className="flex justify-between w-full font-semibold text-primary">
                    <span>New Item</span>
                </div>
            </AccordionTrigger>
            <AccordionContent>
                <div className="space-y-4 p-4">
                    <Input
                        placeholder="Item Name (e.g., V-Neck T-Shirt - 123TS)"
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        className="font-semibold"
                    />

                    {variants.map((variant, vIndex) => (
                        <div key={vIndex} className="space-y-2 p-3 border rounded-md relative">
                             <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-1 right-1 h-7 w-7 text-destructive"
                                onClick={() => handleRemoveVariant(vIndex)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            <Input
                                placeholder="Color (e.g., Blue)"
                                value={variant.color}
                                onChange={(e) => handleVariantChange(vIndex, 'color', e.target.value)}
                            />
                            <div className="space-y-2 pl-2">
                                {variant.sizes.map((size, sIndex) => (
                                    <div key={sIndex} className="flex items-center gap-2">
                                        <Input
                                            placeholder="Size (e.g., M)"
                                            value={size.size}
                                            onChange={(e) => handleSizeChange(vIndex, sIndex, 'size', e.target.value)}
                                            className="flex-1"
                                        />
                                        <Input
                                            type="number"
                                            placeholder="Quantity"
                                            value={size.quantity || ''}
                                            onChange={(e) => handleSizeChange(vIndex, sIndex, 'quantity', e.target.value)}
                                            className="w-24"
                                        />
                                         <Input
                                            type="number"
                                            placeholder="Unit Price"
                                            value={size.unitPrice || ''}
                                            onChange={(e) => handleSizeChange(vIndex, sIndex, 'unitPrice', e.target.value)}
                                            className="w-24"
                                        />
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveSize(vIndex, sIndex)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button variant="outline" size="sm" onClick={() => handleAddSize(vIndex)}>
                                    <Plus className="mr-2 h-4 w-4" /> Add Size
                                </Button>
                            </div>
                        </div>
                    ))}

                    <Button variant="outline" onClick={handleAddVariant}>
                        <Plus className="mr-2 h-4 w-4" /> Add Color Variant
                    </Button>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="ghost" onClick={onCancel}><X className="mr-2 h-4 w-4" /> Cancel</Button>
                        <Button onClick={handleSave}><Check className="mr-2 h-4 w-4" /> Save Item</Button>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
