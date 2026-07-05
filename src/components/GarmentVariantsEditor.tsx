import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import type { ColorVariant, SizeInfo } from "@/types/order";

interface GarmentVariantsEditorProps {
  variants: ColorVariant[];
  onChange: (updatedVariants: ColorVariant[]) => void;
  showPrice?: boolean;
}

export const GarmentVariantsEditor: React.FC<GarmentVariantsEditorProps> = ({
  variants,
  onChange,
  showPrice = true,
}) => {
  const handleAddVariant = () => {
    const newVariant: ColorVariant = {
      id: `variant-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      color: "",
      sizes: [],
    };
    onChange([...variants, newVariant]);
  };

  const handleVariantChange = (index: number, field: "color", value: string) => {
    const updated = variants.map((variant, idx) => {
      if (idx === index) {
        return { ...variant, [field]: value };
      }
      return variant;
    });
    onChange(updated);
  };

  const handleRemoveVariant = (index: number) => {
    const updated = variants.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleAddSize = (variantIndex: number) => {
    const updated = variants.map((variant, vIdx) => {
      if (vIdx === variantIndex) {
        return {
          ...variant,
          sizes: [
            ...variant.sizes,
            { size: "", quantity: 0, unitPrice: 0 },
          ],
        };
      }
      return variant;
    });
    onChange(updated);
  };

  const handleSizeChange = (
    variantIndex: number,
    sizeIndex: number,
    field: keyof SizeInfo,
    value: any
  ) => {
    const updated = variants.map((variant, vIdx) => {
      if (vIdx === variantIndex) {
        return {
          ...variant,
          sizes: variant.sizes.map((size, sIdx) => {
            if (sIdx === sizeIndex) {
              return {
                ...size,
                [field]:
                  field === "quantity" || field === "unitPrice"
                    ? parseFloat(value) || 0
                    : value,
              };
            }
            return size;
          }),
        };
      }
      return variant;
    });
    onChange(updated);
  };

  const handleRemoveSize = (variantIndex: number, sizeIndex: number) => {
    const updated = variants.map((variant, vIdx) => {
      if (vIdx === variantIndex) {
        return {
          ...variant,
          sizes: variant.sizes.filter((_, i) => i !== sizeIndex),
        };
      }
      return variant;
    });
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {variants.map((variant, vIndex) => (
        <div key={variant.id || vIndex} className="space-y-3 p-4 border rounded-xl bg-card border-border/80 relative shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 text-destructive hover:bg-destructive/10"
            onClick={() => handleRemoveVariant(vIndex)}
            type="button"
            title="Remove Color Variant"
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          <div className="max-w-xs space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Color Variant</Label>
            <Input
              placeholder="e.g. Red, Blue, Default"
              value={variant.color}
              onChange={(e) => handleVariantChange(vIndex, "color", e.target.value)}
              className="h-9"
            />
          </div>

          <div className="space-y-2.5 pl-3 border-l-2 border-primary/20">
            <Label className="text-xs font-semibold text-muted-foreground block">Sizes & Stock Levels</Label>
            {variant.sizes.map((size, sIndex) => (
              <div key={sIndex} className="flex items-center gap-3">
                <div className="flex-1 min-w-[70px]">
                  <Input
                    placeholder="Size (M, L, XL)"
                    value={size.size}
                    onChange={(e) => handleSizeChange(vIndex, sIndex, "size", e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={size.quantity || ""}
                    onChange={(e) => handleSizeChange(vIndex, sIndex, "quantity", e.target.value)}
                    className="h-9 font-mono"
                  />
                </div>
                {showPrice && (
                  <div className="w-24">
                    <Input
                      type="number"
                      placeholder="Price ($)"
                      value={size.unitPrice || ""}
                      onChange={(e) => handleSizeChange(vIndex, sIndex, "unitPrice", e.target.value)}
                      className="h-9 font-mono"
                    />
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  onClick={() => handleRemoveSize(vIndex, sIndex)}
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddSize(vIndex)}
              type="button"
              className="h-8 border-dashed hover:border-primary hover:text-primary mt-1.5"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Size
            </Button>
          </div>
        </div>
      ))}

      <Button
        variant="outline"
        onClick={handleAddVariant}
        type="button"
        className="w-full h-10 border-dashed hover:border-primary hover:text-primary"
      >
        <Plus className="mr-2 h-4 w-4" /> Add Color Variant
      </Button>
    </div>
  );
};
