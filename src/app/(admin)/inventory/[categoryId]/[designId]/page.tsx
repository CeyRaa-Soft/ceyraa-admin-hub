"use client";

import React, { useEffect, useState, use } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Loader2,
  FilePen,
  Trash2,
  Upload,
  X,
  Sparkles,
  Camera,
  Shirt,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { inventoryService } from "@/services/inventory.service";
import type { DressCategory, Design, DesignImage } from "@/types/inventory";
import { GarmentItemsSummaryTable } from "@/components/GarmentItemsSummaryTable";
import { DesignEditorForm } from "@/components/DesignEditorForm";
import Image from "next/image";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface DesignDetailPageProps {
  params: Promise<{ categoryId: string; designId: string }>;
}

export default function DesignDetailPage({ params }: DesignDetailPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  // Unwrap parameters
  const { categoryId, designId } = use(params);

  const [category, setCategory] = useState<DressCategory | null>(null);
  const [design, setDesign] = useState<Design | null>(null);
  const [loading, setLoading] = useState(true);

  // Editor Dialog States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
  // Image uploading states
  const [uploadingColors, setUploadingColors] = useState<Record<string, boolean>>({});

  // Lightbox gallery state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [catData, designData] = await Promise.all([
        inventoryService.getCategoryById(categoryId),
        inventoryService.getDesignById(designId),
      ]);
      setCategory(catData);
      setDesign(designData);
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Load Error",
        description: err.message || "Failed to load design details.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [categoryId, designId]);

  const handleImageUpload = async (color: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!design) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const colorKey = color || "Default";
    const filesArray = Array.from(files);

    const existingCount = (design.images || []).filter((img) => img.color === colorKey).length;
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
      setUploadingColors((prev) => ({ ...prev, [colorKey]: true }));
      const uploadedImages: DesignImage[] = [];

      for (const file of filesToUpload) {
        const res = await inventoryService.uploadImage(file, design.code, colorKey);
        uploadedImages.push({
          color: colorKey,
          url: res.url,
          publicId: res.publicId,
        });
      }

      const updatedImages = [...(design.images || []), ...uploadedImages];
      
      // Update DB
      await inventoryService.updateDesign(design.id, {
        images: updatedImages,
      });

      // Update state locally to avoid reload flash
      setDesign({ ...design, images: updatedImages });

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

  const handleRemoveImage = async (imageIndex: number) => {
    if (!design) return;
    if (!confirm("Are you sure you want to delete this photo from the library?")) return;

    try {
      const updatedImages = (design.images || []).filter((_, idx) => idx !== imageIndex);
      
      // Update DB
      await inventoryService.updateDesign(design.id, {
        images: updatedImages,
      });

      // Update state locally
      setDesign({ ...design, images: updatedImages });

      toast({
        title: "Image Deleted",
        description: "Successfully deleted image from gallery.",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: err.message || "Failed to delete image.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-pulse">
        <Loader2 className="h-8 w-8 mb-4 animate-spin text-primary" />
        <p>Loading design details...</p>
      </div>
    );
  }

  if (!design || !category) {
    return (
      <div className="text-center py-20">
        <ArrowLeft className="h-10 w-10 text-muted-foreground mx-auto mb-4 cursor-pointer" onClick={() => router.back()} />
        <h3 className="text-xl font-semibold mb-2">Design not found</h3>
        <p className="text-muted-foreground">The requested design could not be found.</p>
      </div>
    );
  }

  const variants = design.variants || [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 border-border/60">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/inventory/${categoryId}`)}
            className="h-10 w-10 rounded-full border border-border/80 bg-background/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold font-headline">{design.name}</h1>
              <span className="bg-primary/10 text-primary border border-primary/20 text-xs font-bold font-mono px-2 py-0.5 rounded">
                {design.code}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Category: <span className="font-semibold text-foreground/80">{category.name}</span>
            </p>
          </div>
        </div>

        <Button onClick={() => setIsEditorOpen(true)} className="sm:ml-auto">
          <FilePen className="mr-2 h-4 w-4" /> Edit Design & Stock
        </Button>
      </div>

      {/* Top: Quantities Summary Table */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          <h2 className="text-xl font-bold font-headline text-foreground">Available Stock Levels</h2>
        </div>
        <GarmentItemsSummaryTable variants={variants} showPrice={true} />
      </div>

      {/* Bottom: Premium Photo Gallery */}
      <div className="space-y-6 pt-4 border-t border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold font-headline text-foreground">Design Images Library</h2>
          </div>
          <span className="text-xs text-muted-foreground italic">
            Up to 3 images per color variant
          </span>
        </div>

        {variants.length === 0 ? (
          <Card className="p-8 text-center border-dashed bg-muted/5 flex flex-col items-center">
            <Shirt className="h-10 w-10 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground italic">
              Configure color variants first to upload photos.
            </p>
          </Card>
        ) : (
          <div className="grid gap-6">
            {variants.map((variant) => {
              const colorKey = variant.color || "Default";
              
              // Filter images for this color variant
              const colorImages = (design.images || []).map((img, idx) => ({ ...img, originalIndex: idx })).filter(
                (img) => img.color.toLowerCase() === colorKey.toLowerCase()
              );

              return (
                <Card key={variant.id || colorKey} className="overflow-hidden border border-border/80 shadow-sm bg-card hover:shadow-md transition-shadow">
                  <CardHeader className="bg-muted/15 border-b border-border/40 py-3 px-5 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold text-foreground">
                        Color Variant: <span className="text-primary font-headline">{colorKey}</span>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Sizes: {variant.sizes.map((s) => s.size).join(", ") || "None"}
                      </CardDescription>
                    </div>

                    {colorImages.length < 3 && (
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          id={`file-upload-${variant.id || colorKey}`}
                          className="hidden"
                          onChange={(e) => handleImageUpload(colorKey, e)}
                          disabled={uploadingColors[colorKey]}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          disabled={uploadingColors[colorKey]}
                          className="h-8 text-xs gap-1.5"
                        >
                          <label htmlFor={`file-upload-${variant.id || colorKey}`} className="cursor-pointer">
                            {uploadingColors[colorKey] ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Upload className="h-3.5 w-3.5" />
                            )}
                            Add Photo ({colorImages.length}/3)
                          </label>
                        </Button>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="p-5">
                    {colorImages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 border border-dashed border-border/60 rounded-xl text-muted-foreground/60 italic text-sm">
                        <ImageIcon className="h-8 w-8 mb-2 stroke-[1.2] text-muted-foreground/40" />
                        No photos added for this color variant.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {colorImages.map((img) => (
                          <div
                            key={img.url}
                            className="relative group aspect-[3/4] rounded-xl overflow-hidden border border-border/80 bg-muted/20 shadow-sm cursor-zoom-in"
                            onClick={() => setLightboxIndex(img.originalIndex)}
                          >
                            <Image
                              src={img.url}
                              alt={`${colorKey} variant photo`}
                              fill
                              sizes="(max-width: 768px) 50vw, 20vw"
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                              <Button
                                variant="destructive"
                                size="icon"
                                type="button"
                                className="h-7 w-7 rounded-full ml-auto shadow-md"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveImage(img.originalIndex);
                                }}
                                title="Delete photo"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Editor Modal dialog */}
      {isEditorOpen && (
        <DesignEditorForm
          open={isEditorOpen}
          onOpenChange={setIsEditorOpen}
          design={design}
          categories={category ? [category] : []}
          categoryId={categoryId}
          onSaveSuccess={loadData}
        />
      )}

      {/* Lightbox Gallery Modal */}
      {lightboxIndex !== null && design && design.images && design.images.length > 0 && (
        <Dialog open={true} onOpenChange={(open) => { if (!open) setLightboxIndex(null); }}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-none text-white flex flex-col items-center justify-center max-h-[90vh]">
            <div className="relative w-full aspect-[4/5] max-h-[75vh] flex items-center justify-center">
              <Image
                src={design.images[lightboxIndex]?.url}
                alt={`${design.name} gallery image`}
                fill
                className="object-contain"
                priority
              />
              
              {/* Next/Prev controls */}
              {design.images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      const count = design.images!.length;
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
                      const count = design.images!.length;
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
                Color: <span className="text-primary font-bold">{design.images[lightboxIndex]?.color}</span>
              </span>
              <span className="font-mono text-white/60">
                {lightboxIndex + 1} / {design.images.length}
              </span>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
