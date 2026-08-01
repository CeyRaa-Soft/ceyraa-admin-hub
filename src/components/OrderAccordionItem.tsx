"use client";

import React, { useState, useEffect } from "react";
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
  Camera,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Upload,
  X,
  Loader2,
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
import type { Order, OrderCategory, OrderItem } from "@/types/order";
import { calculateItemsSubTotal } from "@/lib/orderCalculations";
import { GarmentItemsSummaryTable } from "@/components/GarmentItemsSummaryTable";
import { useToast } from "@/hooks/use-toast";
import { orderService } from "@/services/order.service";
import { inventoryService } from "@/services/inventory.service";
import Image from "next/image";
import { Dialog, DialogContent } from "@/components/ui/dialog";


type OrderAccordionItemProps = {
  order: Order;
  categories: OrderCategory[];
  supplierNameToIdMap: Record<string, string>;
  onApprove?: (order: Order) => void;
  onEdit?: (order: Order) => void;
  onDelete?: (order: Order) => void;
  onSaveChanges?: (orderId: string, updatedCategories: OrderCategory[]) => void;
  onAddToInventory?: (order: Order) => void;
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
  onSaveChanges,
  onAddToInventory,
}) => {
  const [addingItemToCategoryId, setAddingItemToCategoryId] = useState<
    string | null
  >(null);

  // Maintain local categories state to support multiple items addition before save
  const [localCategories, setLocalCategories] = useState<OrderCategory[]>(categories);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { toast } = useToast();
  const [stageImages, setStageImages] = useState<{ url: string; publicId: string }[]>(order.stageImages || []);
  const [uploadingStages, setUploadingStages] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const handleStageImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    const existingCount = stageImages.length;
    const maxAllowed = 5;
    const remainingSlots = maxAllowed - existingCount;

    if (remainingSlots <= 0) {
      toast({
        variant: "destructive",
        title: "Upload Limit",
        description: `You can upload a maximum of ${maxAllowed} stage photos.`,
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
      setUploadingStages(true);
      const uploadedImages: { url: string; publicId: string }[] = [];

      for (const file of filesToUpload) {
        const res = await inventoryService.uploadImage(file, undefined, undefined, "stages", order.id);
        uploadedImages.push({
          url: res.url,
          publicId: res.publicId,
        });
      }

      const newImages = [...stageImages, ...uploadedImages];
      await orderService.update(order.id, { stageImages: newImages });
      setStageImages(newImages);

      toast({
        title: "Images Uploaded",
        description: `Successfully uploaded ${uploadedImages.length} stage photo(s).`,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: err.message || "Failed to upload image(s).",
      });
    } finally {
      setUploadingStages(false);
      e.target.value = "";
    }
  };

  const handleRemoveStageImage = async (idxToRemove: number) => {
    if (!confirm("Are you sure you want to remove this stage image?")) return;

    try {
      const newImages = stageImages.filter((_, idx) => idx !== idxToRemove);
      await orderService.update(order.id, { stageImages: newImages });
      setStageImages(newImages);

      toast({
        title: "Image Removed",
        description: "Stage image removed successfully.",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: err.message || "Failed to remove stage image.",
      });
    }
  };

  // Sync with parent properties updates only when there are no unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges) {
      setLocalCategories(categories);
    }
  }, [categories, hasUnsavedChanges]);

  const getOrderTotal = () => {
    let total = 0;
    localCategories.forEach((cat) => {
      cat.items.forEach((item) => {
        item.variants.forEach((v) => {
          v.sizes.forEach((s) => {
            total += s.quantity * s.unitPrice;
          });
        });
      });
    });
    return total;
  };

  const getCategoryDisplayName = (catId: string, originalName: string) => {
    if (catId === "production") return "Sewing & Tailoring (Garments)";
    if (catId === "supplies") return "Fabrics & Accessories (Materials)";
    if (catId === "other") return "Other Expenses (Courier, Packaging, etc.)";
    return originalName;
  };

  const orderTotal = getOrderTotal();
  const supplierId = supplierNameToIdMap[order.supplier];

  const handleAddItem = (categoryId: string) => {
    setAddingItemToCategoryId(categoryId);
  };

  const handleSaveNewItemLocal = (categoryId: string, newItem: OrderItem) => {
    setLocalCategories((prev) =>
      prev.map((cat) => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            items: [...cat.items, newItem],
          };
        }
        return cat;
      })
    );
    setHasUnsavedChanges(true);
  };

  const handleUpdateItemLocal = (categoryId: string, updatedItem: OrderItem) => {
    setLocalCategories((prev) =>
      prev.map((cat) => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            items: cat.items.map((item) =>
              item.id === updatedItem.id ? updatedItem : item
            ),
          };
        }
        return cat;
      })
    );
    setHasUnsavedChanges(true);
  };

  const handleDeleteItemLocal = (categoryId: string, itemId: string) => {
    setLocalCategories((prev) =>
      prev.map((cat) => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            items: cat.items.filter((item) => item.id !== itemId),
          };
        }
        return cat;
      })
    );
    setHasUnsavedChanges(true);
  };

  return (
    <AccordionItem
      value={order.id}
      className="border rounded-xl mb-4 overflow-hidden bg-card transition-all duration-300 data-[state=open]:border-primary/50 data-[state=open]:shadow-md"
    >
      <AccordionTrigger className="hover:no-underline px-6 py-4 transition-colors border-b data-[state=closed]:border-b-transparent data-[state=open]:border-border/60 data-[state=open]:bg-primary/5 data-[state=open]:text-primary">
        <div className="flex items-center justify-between w-full pr-4 text-sm md:text-base">
          <div className="flex-1 text-left font-bold">{order.id}</div>
          <div className="flex flex-[1.5] items-center gap-2 text-left">
            <span className="font-semibold">{order.supplier}</span>
            {supplierId && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`/suppliers/${supplierId}`, "_blank", "noopener,noreferrer");
                }}
                className="inline-flex items-center justify-center cursor-pointer text-muted-foreground hover:text-primary transition-colors p-1"
                title="View Supplier Details"
              >
                <ExternalLink className="h-4 w-4" />
              </span>
            )}
          </div>
          <div className="flex-1 text-left hidden md:block">{order.date}</div>
          <div className="flex-1 text-left">
            <Badge variant={statusVariant[order.status]}>{order.status}</Badge>
          </div>
          <div className="flex-1 text-right font-mono font-bold">
            ${orderTotal.toFixed(2)}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="p-6 bg-muted/15">
        <div className="space-y-6">
          {/* Design Details & Stages */}
          <div className="bg-card border border-border/80 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                <h4 className="font-bold text-sm text-foreground">
                  Design Details & Stages (Max 5 images)
                </h4>
              </div>
              
              {stageImages.length < 5 && (
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    id={`stage-file-${order.id}`}
                    className="hidden"
                    onChange={handleStageImagesUpload}
                    disabled={uploadingStages}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    disabled={uploadingStages}
                  >
                    <label htmlFor={`stage-file-${order.id}`} className="cursor-pointer flex items-center gap-1.5">
                      {uploadingStages ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      Upload Stages ({stageImages.length}/5)
                    </label>
                  </Button>
                </div>
              )}
            </div>

            {stageImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 border border-dashed border-border/60 rounded-xl text-muted-foreground/60 italic text-xs">
                <ImageIcon className="h-8 w-8 mb-2 stroke-[1.2] text-muted-foreground/40" />
                No stage photos uploaded yet. Upload images of your sketches, fabric, patterns, or sample garment.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {stageImages.map((img, idx) => (
                  <div
                    key={img.url}
                    className="relative group aspect-square rounded-xl overflow-hidden border border-border/80 bg-muted/20 shadow-sm cursor-zoom-in"
                    onClick={() => setLightboxIndex(idx)}
                  >
                    <Image
                      src={img.url}
                      alt={`Stage photo ${idx + 1}`}
                      fill
                      sizes="(max-width: 768px) 50vw, 15vw"
                      className="object-cover"
                    />
                    
                    {/* Stage Badge Label overlay */}
                    <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs font-mono uppercase">
                      Stage {idx + 1}
                    </span>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <Button
                        variant="destructive"
                        size="icon"
                        type="button"
                        className="h-6 w-6 rounded-full ml-auto shadow-md"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveStageImage(idx);
                        }}
                        title="Delete photo"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center border-t pt-4 border-border/40">
            <h4 className="font-semibold text-sm tracking-tight text-foreground/80">
              Order Details
            </h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddToInventory?.(order)}
                disabled={order.status === "Delivered" || (order as any).addedToInventory || hasUnsavedChanges}
                title={
                  (order as any).addedToInventory
                    ? "Already added to inventory"
                    : hasUnsavedChanges
                    ? "Please save changes before converting"
                    : "Add these items to your inventory"
                }
              >
                <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
                {(order as any).addedToInventory ? "Added to Inventory" : "Confirm & Add to Inventory"}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0 border hover:bg-muted/40">
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
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
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
            {localCategories.map((category) => {
              const subtotal = calculateItemsSubTotal(category.items);
              return (
                <AccordionItem
                  key={category.id}
                  value={category.id}
                  className="border rounded-xl bg-card overflow-hidden"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/10 font-semibold text-sm">
                    <div className="flex justify-between w-full pr-4 items-center">
                      <span>{getCategoryDisplayName(category.id, category.name)}</span>
                      <span className="font-mono text-xs text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full border">
                        ${subtotal.toFixed(2)}
                      </span>
                    </div>
                  </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2">
                  <OrderItemsTable
                    categoryId={`${order.id}-${category.id}`}
                    items={category.items}
                    onAddItem={() => handleAddItem(category.id)}
                    addingItem={addingItemToCategoryId === category.id}
                    onSaveNewItem={(newItem) => {
                      handleSaveNewItemLocal(category.id, newItem);
                      setAddingItemToCategoryId(null);
                    }}
                    onCancelNewItem={() => setAddingItemToCategoryId(null)}
                    onUpdateItem={(updatedItem) => {
                      handleUpdateItemLocal(category.id, updatedItem);
                    }}
                    onDeleteItem={(itemId) => {
                      handleDeleteItemLocal(category.id, itemId);
                    }}
                  />
                </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-border/60">
            {hasUnsavedChanges ? (
              <div className="flex items-center gap-2 text-xs text-amber-500 font-semibold animate-pulse">
                <span>⚠️ Unsaved changes. Save order to commit items.</span>
              </div>
            ) : (
              <div />
            )}
            <div className="text-right flex items-center gap-4">
              <div className="text-lg font-bold">
                Order Total: ${orderTotal.toFixed(2)}
              </div>
              {hasUnsavedChanges && (
                <Button
                  onClick={() => {
                    onSaveChanges?.(order.id, localCategories);
                    setHasUnsavedChanges(false);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white animate-in fade-in zoom-in-95 duration-200"
                  size="sm"
                >
                  Save Order Items
                </Button>
              )}
            </div>
          </div>
        </div>
      </AccordionContent>

      {/* Lightbox Modal for Stage Images */}
      {lightboxIndex !== null && stageImages.length > 0 && (
        <Dialog open={true} onOpenChange={(open) => { if (!open) setLightboxIndex(null); }}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-none text-white flex flex-col items-center justify-center max-h-[90vh]">
            <div className="relative w-full aspect-[4/5] max-h-[75vh] flex items-center justify-center">
              <Image
                src={stageImages[lightboxIndex]?.url}
                alt={`Stage photo ${lightboxIndex + 1}`}
                fill
                className="object-contain"
                priority
              />
              
              {/* Next/Prev controls */}
              {stageImages.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      const count = stageImages.length;
                      setLightboxIndex((prev) => (prev === null ? 0 : (prev === 0 ? count - 1 : prev - 1)));
                    }}
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      const count = stageImages.length;
                      setLightboxIndex((prev) => (prev === null ? 0 : (prev === count - 1 ? 0 : prev + 1)));
                    }}
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                </>
              )}
            </div>
            
            {/* Caption bar */}
            <div className="w-full bg-black/80 py-3 px-6 flex justify-between items-center border-t border-white/10 text-sm">
              <span>
                Stage: <span className="text-primary font-bold">Stage {lightboxIndex + 1}</span>
              </span>
              <span className="font-mono text-white/60">
                {lightboxIndex + 1} / {stageImages.length}
              </span>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AccordionItem>
  );
};
