"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { inventoryService } from "@/services/inventory.service";
import type { DressCategory, Design, DesignImage } from "@/types/inventory";
import type { ColorVariant } from "@/types/order";
import { GarmentVariantsEditor } from "@/components/GarmentVariantsEditor";
import Image from "next/image";

interface DesignEditorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  design?: Design | null; // null if creating
  categories: DressCategory[];
  categoryId?: string; // Pre-selected category if provided
  onSaveSuccess: () => void;
}

export function DesignEditorForm({
  open,
  onOpenChange,
  design,
  categories,
  categoryId,
  onSaveSuccess,
}: DesignEditorFormProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [selectedCatId, setSelectedCatId] = useState("");
  const [variants, setVariants] = useState<ColorVariant[]>([]);
  const [images, setImages] = useState<DesignImage[]>([]);
  
  // Loading states
  const [saving, setSaving] = useState(false);
  const [uploadingColors, setUploadingColors] = useState<Record<string, boolean>>({});

  // Reset or fill form when design changes or modal opens
  useEffect(() => {
    if (open) {
      if (design) {
        setName(design.name);
        setCode(design.code);
        setSelectedCatId(design.categoryId);
        setVariants(design.variants || []);
        setImages(design.images || []);
      } else {
        setName("");
        setCode("");
        setSelectedCatId(categoryId || (categories[0]?.id || ""));
        setVariants([]);
        setImages([]);
      }
    }
  }, [open, design]);

  // Generate design code if creating and category changes
  useEffect(() => {
    if (!design && selectedCatId) {
      const category = categories.find((c) => c.id === selectedCatId);
      if (category) {
        // Fetch next code preview
        const fetchNextCode = async () => {
          try {
            // We call a temporary api endpoint or generate client-side preview
            // Let's call the repository next short code via route or fetch designs to calculate
            const designs = await inventoryService.getDesigns(selectedCatId);
            const prefix = category.prefix.toUpperCase();
            
            // Generate client-side code prefix
            const regex = new RegExp(`^${prefix}\\d{3}$`, "i");
            const codes = designs
              .map((d) => d.code)
              .filter((c) => regex.test(c))
              .sort();
            
            if (codes.length === 0) {
              setCode(`${prefix}001`);
            } else {
              const lastCode = codes[codes.length - 1];
              const numStr = lastCode.substring(prefix.length);
              const lastNum = parseInt(numStr, 10) || 0;
              const nextNum = lastNum + 1;
              const paddedNum = String(nextNum).padStart(3, "0");
              setCode(`${prefix}${paddedNum}`);
            }
          } catch (err) {
            console.error("Failed to generate code preview:", err);
          }
        };
        fetchNextCode();
      }
    }
  }, [selectedCatId, design, categories]);

  const handleImageUpload = async (color: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const colorKey = color || "Default";
    const filesArray = Array.from(files);
    
    // Count existing images for this color
    const existingCount = images.filter((img) => img.color === colorKey).length;
    const maxAllowed = 3;
    const remainingSlots = maxAllowed - existingCount;

    if (remainingSlots <= 0) {
      toast({
        variant: "destructive",
        title: "Upload Limit",
        description: `You can upload a maximum of ${maxAllowed} photos per color.`,
      });
      return;
    }

    // Limit files to upload based on remaining slots
    const filesToUpload = filesArray.slice(0, remainingSlots);
    if (filesArray.length > remainingSlots) {
      toast({
        variant: "destructive",
        title: "Upload Limit Exceeded",
        description: `Only the first ${remainingSlots} files will be uploaded (Max ${maxAllowed} total).`,
      });
    }

    try {
      setUploadingColors((prev) => ({ ...prev, [colorKey]: true }));
      const uploadedImages: DesignImage[] = [];

      for (const file of filesToUpload) {
        const res = await inventoryService.uploadImage(file, code || design?.code, colorKey);
        uploadedImages.push({
          color: colorKey,
          url: res.url,
          publicId: res.publicId,
        });
      }

      setImages((prev) => [...prev, ...uploadedImages]);
      toast({
        title: "Images Uploaded",
        description: `Successfully uploaded ${uploadedImages.length} photo(s) for color "${colorKey}".`,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: err.message || "Failed to upload image(s).",
      });
    } finally {
      setUploadingColors((prev) => ({ ...prev, [colorKey]: false }));
      e.target.value = "";
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Name",
        description: "Design name is required.",
      });
      return;
    }

    if (!selectedCatId) {
      toast({
        variant: "destructive",
        title: "Missing Category",
        description: "Please select a category.",
      });
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: name.trim(),
        categoryId: selectedCatId,
        variants,
        images,
      };

      if (design) {
        await inventoryService.updateDesign(design.id, payload);
        toast({
          title: "Design Updated",
          description: `Successfully updated design "${name}".`,
        });
      } else {
        await inventoryService.createDesign({
          ...payload,
          code: code.trim() || undefined,
        });
        toast({
          title: "Design Created",
          description: `Successfully created design "${name}".`,
        });
      }

      onSaveSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: err.message || "Failed to save design.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{design ? "Edit Design Details" : "Create New Design"}</DialogTitle>
          <DialogDescription>
            Configure design details, stock quantities, and upload image gallery.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="design-name">Design Name</Label>
              <Input
                id="design-name"
                placeholder="e.g. Floral Crop Top"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="design-code">Design Code</Label>
              <Input
                id="design-code"
                placeholder="e.g. CROP001"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={!!design} // Prevent changing code after creation
                className={design ? "bg-muted text-muted-foreground" : ""}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="design-category">Dress Category</Label>
            <Input
              id="design-category"
              value={categories.find((c) => c.id === selectedCatId)?.name || ""}
              disabled
              className="bg-muted text-muted-foreground font-semibold"
            />
          </div>

          {/* Variants and Quantities section */}
          <div className="space-y-3 pt-2 border-t border-border/60">
            <h4 className="font-semibold text-sm text-foreground">Colors & Sizes Configuration</h4>
            <GarmentVariantsEditor
              variants={variants}
              onChange={setVariants}
              showPrice={true}
            />
          </div>

          {/* Image Upload per Color */}
          {variants.filter((v) => v.color.trim() !== "").length > 0 && (
            <div className="space-y-4 pt-4 border-t border-border/60">
              <h4 className="font-semibold text-sm text-foreground">Images Library (1-3 photos per color)</h4>
              
              <div className="space-y-4">
                {variants
                  .filter((v) => v.color.trim() !== "")
                  .map((variant) => {
                    const colorKey = variant.color.trim();
                    const colorImages = images.filter(
                      (img) => img.color.trim().toLowerCase() === colorKey.toLowerCase()
                    );

                    return (
                      <div key={variant.id || colorKey} className="p-4 border rounded-xl bg-muted/5 border-border/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-foreground">
                            Color: <span className="text-primary">{colorKey}</span>
                          </span>
                          
                          {colorImages.length < 3 && (
                            <div className="relative">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                id={`file-${variant.id}`}
                                className="hidden"
                                onChange={(e) => handleImageUpload(colorKey, e)}
                                disabled={uploadingColors[colorKey]}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                disabled={uploadingColors[colorKey]}
                              >
                                <label htmlFor={`file-${variant.id}`} className="cursor-pointer flex items-center gap-1.5">
                                  {uploadingColors[colorKey] ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Upload className="h-3.5 w-3.5" />
                                  )}
                                  Upload Photo ({colorImages.length}/3)
                                </label>
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Display Uploaded Images for this Color */}
                        {colorImages.length === 0 ? (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground italic py-2">
                            <ImageIcon className="h-4 w-4" /> No images uploaded for this color.
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                            {images.map((img, imgIdx) => {
                              if (img.color.trim().toLowerCase() !== colorKey.toLowerCase()) return null;
                            return (
                              <div key={imgIdx} className="relative group aspect-square rounded-lg overflow-hidden border border-border/80 bg-muted/30">
                                <Image
                                  src={img.url}
                                  alt={`${colorKey} photo`}
                                  fill
                                  sizes="100px"
                                  className="object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(imgIdx)}
                                  className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Remove image"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4 border-t border-border/60">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : design ? (
              "Save Changes"
            ) : (
              "Create Design"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
