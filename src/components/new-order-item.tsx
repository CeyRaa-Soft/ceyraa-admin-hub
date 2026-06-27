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
    initialItem?: OrderItem;
}

export function NewOrderItem({ onSave, onCancel, initialItem }: NewOrderItemProps) {
    const [itemName, setItemName] = useState(initialItem?.name || "");
    const [variants, setVariants] = useState<Omit<ColorVariant, 'id'>[]>(
        initialItem?.variants.map(({ id, ...v }) => v) || []
    );

    const handleAddVariant = () => {
        setVariants([...variants, { color: "", sizes: [] }]);
    };

    const handleVariantChange = (index: number, field: 'color', value: any) => {
        setVariants(prev => prev.map((variant, idx) => {
            if (idx === index) {
                return { ...variant, [field]: value };
            }
            return variant;
        }));
    };

    const handleRemoveVariant = (index: number) => {
        setVariants(prev => prev.filter((_, i) => i !== index));
    };

    const handleAddSize = (variantIndex: number) => {
        setVariants(prev => prev.map((variant, vIdx) => {
            if (vIdx === variantIndex) {
                return {
                    ...variant,
                    sizes: [...variant.sizes, { size: "", quantity: 0, unitPrice: 0 }]
                };
            }
            return variant;
        }));
    };

    const handleSizeChange = (variantIndex: number, sizeIndex: number, field: keyof SizeInfo, value: any) => {
        setVariants(prev => prev.map((variant, vIdx) => {
            if (vIdx === variantIndex) {
                return {
                    ...variant,
                    sizes: variant.sizes.map((size, sIdx) => {
                        if (sIdx === sizeIndex) {
                            return {
                                ...size,
                                [field]: (field === 'quantity' || field === 'unitPrice')
                                    ? (parseFloat(value) || 0)
                                    : value
                            };
                        }
                        return size;
                    })
                };
            }
            return variant;
        }));
    };
    
    const handleRemoveSize = (variantIndex: number, sizeIndex: number) => {
        setVariants(prev => prev.map((variant, vIdx) => {
            if (vIdx === variantIndex) {
                return {
                    ...variant,
                    sizes: variant.sizes.filter((_, i) => i !== sizeIndex)
                };
            }
            return variant;
        }));
    };

    const handleSave = () => {
        if (!itemName.trim()) {
            return;
        }
        const newItem: OrderItem = {
            id: initialItem?.id || `item-${Date.now()}`,
            name: itemName,
            variants: variants.map((v, i) => ({
                ...v,
                id: (v as any).id || `variant-${Date.now()}-${i}`
            })),
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
