"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, X, Check, Image as ImageIcon, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { inventoryService } from "@/services/inventory.service";
import type { Order, OrderItem } from "@/types/order";
import type { DressCategory, Design, DesignImage } from "@/types/inventory";
import Image from "next/image";

interface AddToInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onSuccess: () => void;
}

type ItemMapping = {
  orderItemId: string;
  action: "create" | "merge";
  categoryId: string;
  designId: string; // for merge
  name: string; // for create
  code: string; // for create (optional preview)
  images: DesignImage[];
};

export function AddToInventoryDialog({
  open,
  onOpenChange,
  order,
  onSuccess,
}: AddToInventoryDialogProps) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<DressCategory[]>([]);
  const [designsMap, setDesignsMap] = useState<Record<string, Design[]>>({}); // categoryId -> designs
  const [mappings, setMappings] = useState<ItemMapping[]>([]);
  
  // Loading states
  const [loadingCats, setLoadingCats] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingColors, setUploadingColors] = useState<Record<string, boolean>>({}); // "itemId-color" -> boolean

  // Get order items in the production category
  const garmentItems = order?.categories?.find((c) => c.id === "production")?.items || [];

  // Load dress categories
  useEffect(() => {
    if (open) {
      const loadCats = async () => {
        try {
          setLoadingCats(true);
          const cats = await inventoryService.getAllCategories();
          setCategories(cats);
          
          // Pre-populate empty mappings for each garment item
          if (garmentItems.length > 0) {
            const defaultCatId = cats[0]?.id || "";
            const initialMappings = garmentItems.map((item) => {
              return {
                orderItemId: item.id,
                action: "create" as const,
                categoryId: defaultCatId,
                designId: "",
                name: item.name,
                code: "",
                images: [],
              };
            });
            setMappings(initialMappings);

            // Fetch designs for the default category
            if (defaultCatId) {
              fetchDesignsForCategory(defaultCatId);
            }
          }
        } catch (err: any) {
          console.error(err);
          toast({
            variant: "destructive",
            title: "Error Loading Categories",
            description: "Could not load dress categories.",
          });
        } finally {
          setLoadingCats(false);
        }
      };
      loadCats();
    }
  }, [open, order]);

  // Fetch designs for a category if not already cached
  const fetchDesignsForCategory = async (catId: string) => {
    if (!catId || designsMap[catId]) return;
    try {
      const designs = await inventoryService.getDesigns(catId);
      setDesignsMap((prev) => ({ ...prev, [catId]: designs }));
    } catch (err) {
      console.error(`Failed to fetch designs for category ${catId}:`, err);
    }
  };

  const handleCategoryChange = (itemId: string, catId: string) => {
    setMappings((prev) =>
      prev.map((m) => {
        if (m.orderItemId === itemId) {
          fetchDesignsForCategory(catId);
          // If changing category, reset the designId
          return { ...m, categoryId: catId, designId: "", code: "" };
        }
        return m;
      })
    );
  };

  const handleActionChange = (itemId: string, action: "create" | "merge") => {
    setMappings((prev) =>
      prev.map((m) => {
        if (m.orderItemId === itemId) {
          return { ...m, action, designId: "", code: "" };
        }
        return m;
      })
    );
  };

  const handleMappingFieldChange = (itemId: string, field: keyof ItemMapping, value: any) => {
    setMappings((prev) =>
      prev.map((m) => {
        if (m.orderItemId === itemId) {
          return { ...m, [field]: value };
        }
        return m;
      })
    );
  };

  const handleImageUpload = async (
    itemId: string,
    color: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const colorKey = color || "Default";
    const uploadKey = `${itemId}-${colorKey}`;
    const filesArray = Array.from(files);

    const mapping = mappings.find((m) => m.orderItemId === itemId);
    if (!mapping) return;

    const existingCount = mapping.images.filter((img) => img.color === colorKey).length;
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

    const filesToUpload = filesArray.slice(0, remainingSlots);
    if (filesArray.length > remainingSlots) {
      toast({
        variant: "destructive",
        title: "Upload Limit Exceeded",
        description: `Only the first ${remainingSlots} files will be uploaded (Max ${maxAllowed} total).`,
      });
    }

    try {
      setUploadingColors((prev) => ({ ...prev, [uploadKey]: true }));
      const uploadedImages: DesignImage[] = [];

      for (const file of filesToUpload) {
        const res = await inventoryService.uploadImage(
          file,
          mapping.code || mapping.name || order?.id,
          colorKey
        );
        uploadedImages.push({
          color: colorKey,
          url: res.url,
          publicId: res.publicId,
        });
      }

      setMappings((prev) =>
        prev.map((m) => {
          if (m.orderItemId === itemId) {
            return { ...m, images: [...m.images, ...uploadedImages] };
          }
          return m;
        })
      );

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
      setUploadingColors((prev) => ({ ...prev, [uploadKey]: false }));
      e.target.value = "";
    }
  };

  const handleRemoveImage = (itemId: string, imageIndex: number) => {
    setMappings((prev) =>
      prev.map((m) => {
        if (m.orderItemId === itemId) {
          return {
            ...m,
            images: m.images.filter((_, idx) => idx !== imageIndex),
          };
        }
        return m;
      })
    );
  };

  const handleConfirm = async () => {
    // Validate mappings
    for (const m of mappings) {
      const item = garmentItems.find((gi) => gi.id === m.orderItemId);
      const itemName = item?.name || "Garment Item";

      if (!m.categoryId) {
        toast({
          variant: "destructive",
          title: "Incomplete Mapping",
          description: `Please select a category for "${itemName}".`,
        });
        return;
      }

      if (m.action === "merge" && !m.designId) {
        toast({
          variant: "destructive",
          title: "Incomplete Mapping",
          description: `Please select an existing design to merge "${itemName}" into.`,
        });
        return;
      }

      if (m.action === "create" && !m.name.trim()) {
        toast({
          variant: "destructive",
          title: "Incomplete Mapping",
          description: `Please enter a design name for "${itemName}".`,
        });
        return;
      }
    }

    if (!order) return;

    try {
      setSubmitting(true);
      await inventoryService.addToInventory(order.id, mappings);

      toast({
        title: "Success",
        description: `Order ${order.id} items have been added to inventory successfully.`,
      });
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Confirmation Failed",
        description: err.message || "Failed to add items to inventory.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (garmentItems.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Add to Inventory</DialogTitle>
            <DialogDescription>
              This order does not contain any garments under the Sewing & Tailoring ( Garments ) section.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6 text-center text-amber-500">
            <AlertCircle className="h-12 w-12 mb-3" />
            <p className="font-semibold text-sm">No inventory conversion needed.</p>
          </div>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Confirm & Add to Inventory</DialogTitle>
          <DialogDescription>
            Map each garment item in order {order?.id} to a design category and upload images.
          </DialogDescription>
        </DialogHeader>

        {loadingCats ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground animate-pulse">
            <Loader2 className="h-8 w-8 animate-spin mb-3 text-primary" />
            <p className="text-sm">Loading categories...</p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <Accordion type="single" collapsible defaultValue={garmentItems[0]?.id} className="w-full space-y-3">
              {garmentItems.map((item) => {
                const mapping = mappings.find((m) => m.orderItemId === item.id);
                if (!mapping) return null;

                const categoryDesigns = designsMap[mapping.categoryId] || [];

                return (
                  <AccordionItem
                    key={item.id}
                    value={item.id}
                    className="border rounded-xl bg-card overflow-hidden border-border/80 shadow-sm"
                  >
                    <AccordionTrigger className="px-5 py-3 hover:no-underline hover:bg-muted/5">
                      <div className="flex items-center justify-between w-full text-left pr-4">
                        <span className="font-semibold text-sm md:text-base text-foreground">{item.name}</span>
                        <div className="flex gap-2">
                          <Badge variant="secondary">
                            {item.variants.reduce((sum, v) => sum + v.sizes.reduce((sSum, s) => sSum + s.quantity, 0), 0)} pcs
                          </Badge>
                          <Badge variant={mapping.action === "create" ? "default" : "outline"}>
                            {mapping.action === "create" ? "New Design" : "Merge Design"}
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-5 pt-3 space-y-4 border-t border-border/40 bg-muted/5">
                      
                      {/* Mapping Setup */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Dress Category</Label>
                          <Select
                            value={mapping.categoryId}
                            onValueChange={(val) => handleCategoryChange(item.id, val)}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Action</Label>
                          <Select
                            value={mapping.action}
                            onValueChange={(val: "create" | "merge") => handleActionChange(item.id, val)}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="create">Create New Design</SelectItem>
                              <SelectItem value="merge">Link to Existing Design</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {mapping.action === "create" ? (
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">New Design Name</Label>
                            <Input
                              value={mapping.name}
                              onChange={(e) => handleMappingFieldChange(item.id, "name", e.target.value)}
                              className="h-9"
                            />
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Select Existing Design</Label>
                            <Select
                              value={mapping.designId}
                              onValueChange={(val) => handleMappingFieldChange(item.id, "designId", val)}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Select Design" />
                              </SelectTrigger>
                              <SelectContent>
                                {categoryDesigns.map((d) => (
                                  <SelectItem key={d.id} value={d.id}>
                                    {d.name} ({d.code})
                                  </SelectItem>
                                ))}
                                {categoryDesigns.length === 0 && (
                                  <SelectItem value="_empty" disabled>
                                    No designs in this category
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>

                      {/* Display Quantities Summary */}
                      <div className="text-xs bg-muted/20 border border-border/40 rounded-lg p-3">
                        <span className="font-semibold text-muted-foreground block mb-1">Items to Add:</span>
                        <div className="flex flex-wrap gap-2">
                          {item.variants.map((v) => (
                            <div key={v.color} className="bg-background border rounded px-2.5 py-1 text-foreground/80 font-mono">
                              <span className="font-semibold text-primary">{v.color}</span>:{" "}
                              {v.sizes.map((s) => `${s.size} (${s.quantity}pcs)`).join(", ")}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Image Upload per Color */}
                      <div className="space-y-3 pt-2">
                        <Label className="text-xs font-semibold block">Upload Photos for Design Library (1-3 per color)</Label>
                        <div className="space-y-3">
                          {item.variants.map((variant) => {
                            const colorKey = variant.color || "Default";
                            const uploadKey = `${item.id}-${colorKey}`;
                            const colorImages = mapping.images.filter((img) => img.color === colorKey);

                            return (
                              <div key={variant.color} className="p-3 border rounded-xl bg-card border-border/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
                                <span className="font-semibold text-xs text-muted-foreground min-w-[100px]">
                                  Color: <span className="text-primary font-bold">{colorKey}</span>
                                </span>

                                <div className="flex flex-wrap items-center gap-3">
                                  {/* Thumbnail list */}
                                  {colorImages.map((img, imgIdx) => {
                                    // Get original index in complete images array to remove
                                    const origIdx = mapping.images.findIndex((i) => i.url === img.url);
                                    return (
                                      <div key={imgIdx} className="relative w-12 h-12 rounded-lg overflow-hidden border border-border/60">
                                        <Image
                                          src={img.url}
                                          alt={`${colorKey} photo`}
                                          fill
                                          sizes="48px"
                                          className="object-cover"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveImage(item.id, origIdx)}
                                          className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center"
                                        >
                                          <X className="h-2.5 w-2.5" />
                                        </button>
                                      </div>
                                    );
                                  })}

                                  {/* Upload Button */}
                                  {colorImages.length < 3 && (
                                    <div className="relative">
                                      <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        id={`file-${item.id}-${colorKey}`}
                                        className="hidden"
                                        onChange={(e) => handleImageUpload(item.id, colorKey, e)}
                                        disabled={uploadingColors[uploadKey]}
                                      />
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        asChild
                                        disabled={uploadingColors[uploadKey]}
                                        className="h-8 py-0 px-2.5"
                                      >
                                        <label htmlFor={`file-${item.id}-${colorKey}`} className="cursor-pointer flex items-center gap-1">
                                          {uploadingColors[uploadKey] ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            <Upload className="h-3 w-3" />
                                          )}
                                          Upload Photo ({colorImages.length}/3)
                                        </label>
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        )}

        <DialogFooter className="border-t border-border/60 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={submitting || loadingCats}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Committing...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" /> Add to Inventory
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
