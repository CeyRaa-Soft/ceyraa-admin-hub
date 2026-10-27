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
  Palette,
  Video,
  Play,
  CheckCircle2,
  Tag,
  Percent,
  Layers,
  Ruler,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { inventoryService } from "@/services/inventory.service";
import type { DressCategory, Design, DesignImage, Collection } from "@/types/inventory";
import { GarmentItemsSummaryTable } from "@/components/GarmentItemsSummaryTable";
import { DesignEditorForm } from "@/components/DesignEditorForm";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

  // Swatch Modal State
  const [swatchModalVariant, setSwatchModalVariant] = useState<{
    id: string;
    color: string;
    swatchUrl?: string;
  } | null>(null);
  const [swatchFile, setSwatchFile] = useState<File | null>(null);
  const [swatchPreview, setSwatchPreview] = useState<string | null>(null);
  const [uploadingSwatch, setUploadingSwatch] = useState(false);

  // Per-Variant Video / GIF State
  const [uploadingVariantVideos, setUploadingVariantVideos] = useState<Record<string, boolean>>({});

  // Per-color variant video/GIF upload handler
  const handleVariantVideoUpload = async (
    variantIdOrColor: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!design) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const isGif = file.type === "image/gif";

    if (!isVideo && !isGif) {
      toast({
        variant: "destructive",
        title: "Invalid Media",
        description: "Please upload an MP4, WebM video, or GIF file.",
      });
      e.target.value = "";
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "Showcase video or GIF must be smaller than 25MB.",
      });
      e.target.value = "";
      return;
    }

    try {
      setUploadingVariantVideos((prev) => ({ ...prev, [variantIdOrColor]: true }));
      const res = await inventoryService.uploadImage(
        file,
        design.code,
        variantIdOrColor,
        "videos"
      );

      const updatedVariants = (design.variants || []).map((v) => {
        if (v.id === variantIdOrColor || v.color === variantIdOrColor) {
          return {
            ...v,
            mediaVideoUrl: res.url,
            mediaVideoPublicId: res.publicId,
          };
        }
        return v;
      });

      await inventoryService.updateDesign(design.id, {
        variants: updatedVariants,
      });

      setDesign({
        ...design,
        variants: updatedVariants,
      });

      toast({
        title: "Variant Media Saved",
        description: "Color variant video / GIF uploaded successfully.",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: err.message || "Failed to upload video / GIF.",
      });
    } finally {
      setUploadingVariantVideos((prev) => ({ ...prev, [variantIdOrColor]: false }));
      e.target.value = "";
    }
  };

  const handleRemoveVariantVideo = async (variantIdOrColor: string) => {
    if (!design) return;
    if (!confirm("Are you sure you want to remove the video/GIF for this color variant?")) return;

    try {
      setUploadingVariantVideos((prev) => ({ ...prev, [variantIdOrColor]: true }));
      const updatedVariants = (design.variants || []).map((v) => {
        if (v.id === variantIdOrColor || v.color === variantIdOrColor) {
          return {
            ...v,
            mediaVideoUrl: null,
            mediaVideoPublicId: null,
          };
        }
        return v;
      });

      await inventoryService.updateDesign(design.id, {
        variants: updatedVariants,
      });

      setDesign({
        ...design,
        variants: updatedVariants,
      });

      toast({
        title: "Variant Media Removed",
        description: "Color variant video / GIF removed successfully.",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Removal Failed",
        description: err.message || "Failed to remove video / GIF.",
      });
    } finally {
      setUploadingVariantVideos((prev) => ({ ...prev, [variantIdOrColor]: false }));
    }
  };

  // Collections State
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isTaggingOpen, setIsTaggingOpen] = useState(false);
  const [defaultCollection, setDefaultCollection] = useState<string>("Queen's Wardrobe");
  const [customCollection, setCustomCollection] = useState<string>("");
  const [savingTagging, setSavingTagging] = useState(false);

  // Offer Modal State
  const [isOfferOpen, setIsOfferOpen] = useState(false);
  const [discountPercent, setDiscountPercent] = useState<number>(10);
  const [savingOffer, setSavingOffer] = useState(false);

  // Size Chart State
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [sizeChartText, setSizeChartText] = useState<string>("");
  const [sizeChartFile, setSizeChartFile] = useState<File | null>(null);
  const [sizeChartPreview, setSizeChartPreview] = useState<string | null>(null);
  const [savingSizeChart, setSavingSizeChart] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [catData, designData, colls] = await Promise.all([
        inventoryService.getCategoryById(categoryId),
        inventoryService.getDesignById(designId),
        inventoryService.getAllCollections().catch(() => [] as Collection[]),
      ]);
      setCategory(catData);
      setDesign(designData);
      setCollections(colls);
      if (designData) {
        setDefaultCollection(designData.defaultCollection || "Queen's Wardrobe");
        setCustomCollection(designData.customCollection || "");
        setSizeChartText(designData.sizeChartText || "");
        setSizeChartPreview(designData.sizeChartImageUrl || null);
        if (designData.offer?.discountPercentage) {
          setDiscountPercent(designData.offer.discountPercentage);
        }
      }
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

  const handleSaveTagging = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!design) return;

    try {
      setSavingTagging(true);
      await inventoryService.updateDesign(design.id, {
        defaultCollection: defaultCollection as any,
        customCollection: customCollection ? customCollection : (null as any),
      });

      setDesign({
        ...design,
        defaultCollection: defaultCollection as any,
        customCollection: customCollection || undefined,
      });

      toast({
        title: "Collections Updated",
        description: "Design collections tagging saved successfully.",
      });
      setIsTaggingOpen(false);
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: err.message || "Failed to update collection tagging.",
      });
    } finally {
      setSavingTagging(false);
    }
  };

  // Helper to determine base price
  const getBasePrice = () => {
    if (!design?.variants) return 0;
    for (const v of design.variants) {
      if (v.sizes && v.sizes.length > 0) {
        for (const s of v.sizes) {
          if (s.unitPrice && s.unitPrice > 0) return s.unitPrice;
        }
      }
    }
    return 0;
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!design) return;

    const basePrice = getBasePrice();
    const percent = Number(discountPercent);
    if (isNaN(percent) || percent <= 0 || percent >= 100) {
      toast({
        variant: "destructive",
        title: "Invalid Percentage",
        description: "Discount percentage must be between 1 and 99.",
      });
      return;
    }

    const offerPrice = Math.round(basePrice * (1 - percent / 100) * 100) / 100;

    try {
      setSavingOffer(true);
      const offerPayload = {
        discountPercentage: percent,
        offerPrice: offerPrice,
        originalPrice: basePrice,
        active: true,
        startDate: new Date().toISOString(),
      };

      await inventoryService.updateDesign(design.id, {
        offer: offerPayload,
      });

      setDesign({
        ...design,
        offer: offerPayload,
      });

      toast({
        title: "Offer Activated",
        description: `Special offer (${percent}% off) is now active for this dress.`,
      });
      setIsOfferOpen(false);
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Offer Error",
        description: err.message || "Failed to save offer.",
      });
    } finally {
      setSavingOffer(false);
    }
  };

  const handleEndOffer = async () => {
    if (!design) return;
    if (!confirm("Are you sure you want to end this offer?")) return;

    try {
      setSavingOffer(true);
      await inventoryService.updateDesign(design.id, {
        offer: null as any,
      });

      setDesign({
        ...design,
        offer: undefined,
      });

      toast({
        title: "Offer Ended",
        description: "Special offer tag has been removed from this dress.",
      });
      setIsOfferOpen(false);
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error Ending Offer",
        description: err.message || "Failed to remove offer.",
      });
    } finally {
      setSavingOffer(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [categoryId, designId]);

  const handleImageUpload = async (color: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!design) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const colorKey = (color || "Default").trim();
    const filesArray = Array.from(files);

    const existingCount = (design.images || []).filter((img) => {
      const imgColor = (img.color || "").trim().toLowerCase();
      const targetColor = colorKey.toLowerCase();
      if (imgColor && targetColor && imgColor === targetColor) return true;
      if (design.variants?.length === 1) return true;
      return false;
    }).length;
    const maxAllowed = 5;
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

    // Validate size (max 5MB per image)
    for (const f of filesToUpload) {
      if (f.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File Too Large",
          description: `Image "${f.name}" exceeds the 5MB size limit.`,
        });
        e.target.value = "";
        return;
      }
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

  // Swatch Modal Handlers
  const handleOpenSwatchModal = (variant: any) => {
    setSwatchModalVariant({
      id: variant.id,
      color: variant.color,
      swatchUrl: variant.swatchUrl,
    });
    setSwatchPreview(variant.swatchUrl || null);
    setSwatchFile(null);
  };

  const handleSwatchFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation: Image only & max 3MB
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: "Please select an image file (JPG, PNG, WebP).",
      });
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "Color pattern swatch image must be smaller than 3MB.",
      });
      return;
    }

    setSwatchFile(file);
    setSwatchPreview(URL.createObjectURL(file));
  };

  const handleSaveSwatch = async () => {
    if (!design || !swatchModalVariant) return;

    try {
      setUploadingSwatch(true);
      let newSwatchUrl = swatchModalVariant.swatchUrl;
      let newSwatchPublicId = "";

      if (swatchFile) {
        const uploadRes = await inventoryService.uploadImage(
          swatchFile,
          design.code,
          swatchModalVariant.color,
          "swatches"
        );
        newSwatchUrl = uploadRes.url;
        newSwatchPublicId = uploadRes.publicId;
      }

      // Update variants array
      const updatedVariants = (design.variants || []).map((v) => {
        if (v.id === swatchModalVariant.id || v.color === swatchModalVariant.color) {
          return {
            ...v,
            swatchUrl: newSwatchUrl,
            swatchPublicId: newSwatchPublicId || v.swatchPublicId,
          };
        }
        return v;
      });

      await inventoryService.updateDesign(design.id, {
        variants: updatedVariants,
      });

      setDesign({ ...design, variants: updatedVariants });
      setSwatchModalVariant(null);
      setSwatchFile(null);
      setSwatchPreview(null);

      toast({
        title: "Swatch Saved",
        description: `Color pattern swatch updated for "${swatchModalVariant.color}".`,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: err.message || "Failed to update color swatch.",
      });
    } finally {
      setUploadingSwatch(false);
    }
  };

  const handleRemoveSwatch = async () => {
    if (!design || !swatchModalVariant) return;
    if (!confirm("Are you sure you want to remove this color swatch pattern?")) return;

    try {
      setUploadingSwatch(true);
      const updatedVariants = (design.variants || []).map((v) => {
        if (v.id === swatchModalVariant.id || v.color === swatchModalVariant.color) {
          const { swatchUrl, swatchPublicId, ...rest } = v;
          return rest;
        }
        return v;
      });

      await inventoryService.updateDesign(design.id, {
        variants: updatedVariants,
      });

      setDesign({ ...design, variants: updatedVariants });
      setSwatchModalVariant(null);
      setSwatchFile(null);
      setSwatchPreview(null);

      toast({
        title: "Swatch Removed",
        description: `Pattern swatch removed for "${swatchModalVariant.color}".`,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Removal Failed",
        description: err.message || "Failed to remove color swatch.",
      });
    } finally {
      setUploadingSwatch(false);
    }
  };



  // Size Chart Handlers
  const handleSizeChartFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: "Please upload an image file (PNG, JPG, WebP).",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "Size chart image must be under 5MB.",
      });
      return;
    }

    setSizeChartFile(file);
    setSizeChartPreview(URL.createObjectURL(file));
  };

  const handleSaveSizeChart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!design) return;

    try {
      setSavingSizeChart(true);
      let imageUrl = design.sizeChartImageUrl;
      let publicId = design.sizeChartPublicId;

      if (sizeChartFile) {
        const uploadRes = await inventoryService.uploadImage(
          sizeChartFile,
          design.code,
          "size-chart",
          "size-charts"
        );
        imageUrl = uploadRes.url;
        publicId = uploadRes.publicId;
      }

      await inventoryService.updateDesign(design.id, {
        sizeChartText: sizeChartText.trim() || null,
        sizeChartImageUrl: imageUrl || null,
        sizeChartPublicId: publicId || null,
      });

      setDesign({
        ...design,
        sizeChartText: sizeChartText.trim() || null,
        sizeChartImageUrl: imageUrl || null,
        sizeChartPublicId: publicId || null,
      });

      setSizeChartFile(null);
      setIsSizeChartOpen(false);

      toast({
        title: "Size Chart Saved",
        description: "Size chart guidance and image updated successfully.",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: err.message || "Failed to update size chart.",
      });
    } finally {
      setSavingSizeChart(false);
    }
  };

  const handleRemoveSizeChart = async () => {
    if (!design) return;
    if (!confirm("Are you sure you want to remove the size chart guidance and image?")) return;

    try {
      setSavingSizeChart(true);
      await inventoryService.updateDesign(design.id, {
        sizeChartText: null,
        sizeChartImageUrl: null,
        sizeChartPublicId: null,
      });

      setDesign({
        ...design,
        sizeChartText: null,
        sizeChartImageUrl: null,
        sizeChartPublicId: null,
      });

      setSizeChartText("");
      setSizeChartFile(null);
      setSizeChartPreview(null);
      setIsSizeChartOpen(false);

      toast({
        title: "Size Chart Removed",
        description: "Size chart removed successfully.",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Removal Failed",
        description: err.message || "Failed to remove size chart.",
      });
    } finally {
      setSavingSizeChart(false);
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
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
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

        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <Button
            variant="outline"
            onClick={() => setIsTaggingOpen(true)}
            className="border-primary/30 hover:bg-primary/5 text-foreground"
          >
            <Tag className="mr-2 h-4 w-4 text-primary" /> Collections
            {design.defaultCollection && (
              <span className="ml-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded">
                {design.defaultCollection.includes("King") ? "King's" : "Queen's"}
              </span>
            )}
            {design.customCollection && (
              <span className="ml-1.5 bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded">
                {design.customCollection}
              </span>
            )}
          </Button>

          <Button
            variant={design.offer?.active ? "default" : "outline"}
            onClick={() => setIsOfferOpen(true)}
            className={
              design.offer?.active
                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                : "border-rose-500/30 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
            }
          >
            <Percent className="mr-1.5 h-4 w-4" />
            {design.offer?.active ? `${design.offer.discountPercentage}% Off Active` : "Make Offer"}
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsSizeChartOpen(true)}
            className="border-indigo-500/30 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400"
          >
            <Ruler className="mr-2 h-4 w-4" /> Size Chart
            {(design.sizeChartText || design.sizeChartImageUrl) && (
              <span className="ml-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold px-1.5 py-0.5 rounded">
                Active
              </span>
            )}
          </Button>

          <Button onClick={() => setIsEditorOpen(true)}>
            <FilePen className="mr-2 h-4 w-4" /> Edit Design & Stock
          </Button>
        </div>
      </div>

      {/* Top: Quantities Summary Table */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          <h2 className="text-xl font-bold font-headline text-foreground">Available Stock Levels</h2>
        </div>
        <GarmentItemsSummaryTable
          variants={variants}
          showPrice={true}
          onAddCustomerOrder={(color, size) => {
            window.location.href = `/customer-orders?addOrder=true&categoryId=${categoryId}&designId=${designId}&color=${encodeURIComponent(color)}&size=${encodeURIComponent(size)}`;
          }}
        />
      </div>

      {/* Bottom: Premium Photo Gallery */}
      <div className="space-y-6 pt-4 border-t border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold font-headline text-foreground">Design Images Library</h2>
          </div>
          <span className="text-xs text-muted-foreground italic">
            Up to 5 images per color variant
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
              const colorKey = (variant.color || "Default").trim();
              const vColor = colorKey.toLowerCase();
              
              // Filter images for this color variant
              const colorImages = (design.images || []).map((img, idx) => ({ ...img, originalIndex: idx })).filter(
                (img) => {
                  const imgColor = (img.color || "").trim().toLowerCase();
                  if (imgColor && vColor && imgColor === vColor) return true;
                  if ((!vColor || vColor === "default") && (!imgColor || imgColor === "default")) return true;
                  if (variants.length === 1) return true;
                  return false;
                }
              );

              return (
                <Card key={variant.id || colorKey} className="overflow-hidden border border-border/80 shadow-sm bg-card hover:shadow-md transition-shadow">
                  <CardHeader className="bg-muted/15 border-b border-border/40 py-3 px-5 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Swatch Trigger Icon / Circle */}
                      <button
                        type="button"
                        onClick={() => handleOpenSwatchModal(variant)}
                        title={variant.swatchUrl ? "Edit fabric/color pattern swatch" : "Add fabric/color pattern swatch"}
                        className="relative group/swatch w-9 h-9 rounded-full border-2 border-primary/40 hover:border-primary transition-all duration-200 overflow-hidden flex items-center justify-center bg-muted/60 shadow-inner flex-shrink-0"
                      >
                        {variant.swatchUrl ? (
                          <>
                            <Image
                              src={variant.swatchUrl}
                              alt={`${colorKey} swatch`}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/swatch:opacity-100 transition-opacity flex items-center justify-center">
                              <Palette className="h-3.5 w-3.5 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-muted-foreground group-hover/swatch:text-primary transition-colors">
                            <Palette className="h-4 w-4" />
                          </div>
                        )}
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base font-bold text-foreground">
                            Color Variant: <span className="text-primary font-headline">{colorKey}</span>
                          </CardTitle>
                          {variant.swatchUrl && (
                            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              Swatch Added
                            </span>
                          )}
                        </div>
                        <CardDescription className="text-xs">
                          Sizes: {variant.sizes.map((s) => s.size).join(", ") || "None"}
                        </CardDescription>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenSwatchModal(variant)}
                        className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-primary border hover:bg-muted/60"
                        title="Configure pattern swatch for client catalog selector"
                      >
                        <Palette className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">
                          {variant.swatchUrl ? "Edit Swatch" : "Add Swatch"}
                        </span>
                      </Button>

                      {/* Per-Color GIF / Video Upload Button */}
                      <div className="relative">
                        <input
                          type="file"
                          accept="video/mp4,video/webm,image/gif"
                          id={`video-upload-${variant.id || colorKey}`}
                          className="hidden"
                          onChange={(e) => handleVariantVideoUpload(variant.id || colorKey, e)}
                          disabled={uploadingVariantVideos[variant.id || colorKey]}
                        />
                        <Button
                          variant={variant.mediaVideoUrl ? "secondary" : "outline"}
                          size="sm"
                          asChild
                          disabled={uploadingVariantVideos[variant.id || colorKey]}
                          className="h-8 text-xs gap-1.5"
                          title="Upload animated video or GIF for this color"
                        >
                          <label htmlFor={`video-upload-${variant.id || colorKey}`} className="cursor-pointer">
                            {uploadingVariantVideos[variant.id || colorKey] ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Video className="h-3.5 w-3.5 text-purple-500" />
                            )}
                            <span className="hidden sm:inline">
                              {variant.mediaVideoUrl ? "Change GIF/Video" : "Add GIF/Video"}
                            </span>
                            <span className="sm:hidden">GIF</span>
                          </label>
                        </Button>
                      </div>

                      {colorImages.length < 5 && (
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
                              Add Photo ({colorImages.length}/5)
                            </label>
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    {/* Media grid: Photos + Per-Variant Video/GIF */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {/* Photos */}
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

                      {/* Per-variant Video / GIF Slot if present */}
                      {variant.mediaVideoUrl && (
                        <div className="relative group aspect-[3/4] rounded-xl overflow-hidden border-2 border-purple-500/50 bg-black/90 shadow-md">
                          {variant.mediaVideoUrl.match(/\.(gif)(\?.*)?$/i) ? (
                            <img
                              src={variant.mediaVideoUrl}
                              alt={`${colorKey} GIF`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <video
                              src={variant.mediaVideoUrl}
                              controls
                              loop
                              muted
                              autoPlay
                              playsInline
                              className="w-full h-full object-cover"
                            />
                          )}
                          <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-purple-600/90 text-white text-[10px] font-bold tracking-wider uppercase">
                            GIF / Video
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                            <Button
                              variant="destructive"
                              size="icon"
                              type="button"
                              className="h-7 w-7 rounded-full ml-auto shadow-md"
                              onClick={() => handleRemoveVariantVideo(variant.id || colorKey)}
                              title="Remove video/GIF for this color"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {colorImages.length === 0 && !variant.mediaVideoUrl && (
                      <div className="flex flex-col items-center justify-center py-8 border border-dashed border-border/60 rounded-xl text-muted-foreground/60 italic text-sm">
                        <ImageIcon className="h-8 w-8 mb-2 stroke-[1.2] text-muted-foreground/40" />
                        No photos or GIF added for this color variant.
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {/* Unassigned / Other photos section if any exist */}
            {(() => {
              const assignedIndices = new Set<number>();
              variants.forEach((v) => {
                const vCol = (v.color || "Default").trim().toLowerCase();
                (design.images || []).forEach((img, idx) => {
                  const imgCol = (img.color || "").trim().toLowerCase();
                  if (
                    (imgCol && vCol && imgCol === vCol) ||
                    ((!vCol || vCol === "default") && (!imgCol || imgCol === "default")) ||
                    variants.length === 1
                  ) {
                    assignedIndices.add(idx);
                  }
                });
              });

              const unassignedImages = (design.images || [])
                .map((img, idx) => ({ ...img, originalIndex: idx }))
                .filter((img) => !assignedIndices.has(img.originalIndex));

              if (unassignedImages.length === 0) return null;

              return (
                <Card className="overflow-hidden border border-amber-500/30 bg-card shadow-sm">
                  <CardHeader className="bg-amber-500/10 border-b border-amber-500/20 py-3 px-5 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                        <span>Unassigned / Other Photos</span>
                        <span className="text-xs font-normal text-muted-foreground">({unassignedImages.length})</span>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Photos uploaded without matching a currently configured color variant.
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {unassignedImages.map((img) => (
                        <div
                          key={img.url}
                          className="relative group aspect-[3/4] rounded-xl overflow-hidden border border-border/80 bg-muted/20 shadow-sm cursor-zoom-in"
                          onClick={() => setLightboxIndex(img.originalIndex)}
                        >
                          <Image
                            src={img.url}
                            alt="Unassigned photo"
                            fill
                            sizes="(max-width: 768px) 50vw, 20vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded font-medium">
                            {img.color || "Unlabeled"}
                          </div>
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
                  </CardContent>
                </Card>
              );
            })()}
          </div>
        )}

      </div>

      {/* Swatch Upload & Adjustment Modal */}
      {swatchModalVariant && (
        <Dialog open={true} onOpenChange={(open) => { if (!open) setSwatchModalVariant(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Color Swatch: {swatchModalVariant.color}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Upload a fabric texture or pattern swatch. This will be shown as a small circle icon in the client catalog color picker.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="flex flex-col items-center justify-center gap-4">
                {/* Circular preview */}
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-primary/40 shadow-lg bg-muted flex items-center justify-center">
                  {swatchPreview ? (
                    <img
                      src={swatchPreview}
                      alt="Swatch preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Palette className="h-8 w-8 text-muted-foreground/50" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {swatchPreview ? "Client Circle Preview (200x200 WebP)" : "No image selected"}
                </span>
              </div>

              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  id="swatch-file-input"
                  className="hidden"
                  onChange={handleSwatchFileChange}
                />
                <Button variant="outline" asChild className="w-full cursor-pointer gap-2">
                  <label htmlFor="swatch-file-input">
                    <Upload className="h-4 w-4" />
                    {swatchPreview ? "Choose Different Pattern Image" : "Select Pattern Image"}
                  </label>
                </Button>
                <p className="text-[11px] text-muted-foreground text-center">
                  Supports JPG, PNG, WebP up to 3MB. Image will be centered and optimized to a smooth circle icon.
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              {swatchModalVariant.swatchUrl ? (
                <Button
                  variant="destructive"
                  size="sm"
                  type="button"
                  onClick={handleRemoveSwatch}
                  disabled={uploadingSwatch}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                </Button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSwatchModalVariant(null)}
                  disabled={uploadingSwatch}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveSwatch}
                  disabled={uploadingSwatch || (!swatchFile && !swatchPreview)}
                  className="gap-1.5"
                >
                  {uploadingSwatch && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Swatch
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

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
      {/* Collection Tagging Modal */}
      <Dialog open={isTaggingOpen} onOpenChange={setIsTaggingOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSaveTagging}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold font-headline flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" /> Assign Collections
              </DialogTitle>
              <DialogDescription className="text-xs">
                Configure default collection and custom collection for this dress.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Default Collection */}
              <div className="space-y-1.5">
                <Label htmlFor="default-collection" className="text-xs font-semibold">
                  Default Collection <span className="text-destructive">*</span>
                </Label>
                <select
                  id="default-collection"
                  value={defaultCollection}
                  onChange={(e) => setDefaultCollection(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="Queen's Wardrobe">Queen&apos;s Wardrobe</option>
                  <option value="King's Wardrobe">King&apos;s Wardrobe</option>
                </select>
                <p className="text-[11px] text-muted-foreground">
                  The primary category in the CeyRaa client balcony.
                </p>
              </div>

              {/* Custom Collection */}
              <div className="space-y-1.5">
                <Label htmlFor="custom-collection" className="text-xs font-semibold">
                  Custom Collection (Optional)
                </Label>
                <select
                  id="custom-collection"
                  value={customCollection}
                  onChange={(e) => setCustomCollection(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">-- None / No Custom Collection --</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Dynamic collection created in the Admin Hub Collections section.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsTaggingOpen(false)}
                disabled={savingTagging}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={savingTagging}>
                {savingTagging ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Tagging"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Make Offer Modal */}
      <Dialog open={isOfferOpen} onOpenChange={setIsOfferOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSaveOffer}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold font-headline flex items-center gap-2">
                <Percent className="h-5 w-5 text-rose-600" /> Special Offer / Discount
              </DialogTitle>
              <DialogDescription className="text-xs">
                Apply a percentage discount to showcase this design in CeyRaa&apos;s Exclusive Offers.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Existing active offer banner */}
              {design.offer?.active && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold">Active Offer:</span> {design.offer.discountPercentage}% OFF
                    <div className="text-[11px] opacity-80 mt-0.5">
                      Price: LKR {design.offer.offerPrice?.toLocaleString()} (Was LKR {design.offer.originalPrice?.toLocaleString()})
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleEndOffer}
                    disabled={savingOffer}
                    className="h-8 text-xs font-semibold"
                  >
                    End Offer
                  </Button>
                </div>
              )}

              {/* Price Calculation preview */}
              <div className="bg-muted/40 p-3.5 rounded-lg border border-border/60 space-y-2 text-xs">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Base Price:</span>
                  <span className="font-mono font-semibold text-foreground">
                    LKR {getBasePrice().toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Discount ({discountPercent || 0}%):</span>
                  <span className="font-mono text-rose-600 font-semibold">
                    - LKR {Math.round(getBasePrice() * ((discountPercent || 0) / 100)).toLocaleString()}
                  </span>
                </div>
                <div className="pt-2 border-t border-border/40 flex justify-between items-center font-bold text-sm">
                  <span>Offer Price:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    LKR {Math.round(getBasePrice() * (1 - (discountPercent || 0) / 100)).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Discount Percentage Input */}
              <div className="space-y-1.5">
                <Label htmlFor="discount-percent" className="text-xs font-semibold">
                  Discount Percentage (%)
                </Label>
                <div className="relative">
                  <Input
                    id="discount-percent"
                    type="number"
                    min="1"
                    max="99"
                    step="1"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    placeholder="e.g. 15"
                    className="pr-8"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-muted-foreground text-sm font-semibold">
                    %
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Enter an integer between 1% and 99%.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOfferOpen(false)}
                disabled={savingOffer}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingOffer || !discountPercent || discountPercent <= 0}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {savingOffer ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : design.offer?.active ? (
                  "Update Offer"
                ) : (
                  "Activate Offer"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Size Chart Modal */}
      <Dialog open={isSizeChartOpen} onOpenChange={setIsSizeChartOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSaveSizeChart}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold font-headline flex items-center gap-2">
                <Ruler className="h-5 w-5 text-indigo-600" /> Size Chart & Fitting Guide
              </DialogTitle>
              <DialogDescription className="text-xs">
                Add dress measurement guidance text and an optional size chart diagram or photo for customers in CeyRaa.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Guidance / Measurement Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="size-chart-text" className="text-xs font-semibold">
                  Size Guide & Measurement Notes
                </Label>
                <Textarea
                  id="size-chart-text"
                  rows={4}
                  value={sizeChartText}
                  onChange={(e) => setSizeChartText(e.target.value)}
                  placeholder="e.g. Model is 5'8 wearing size S. Chest: 34'', Waist: 28'', Length: 42''. Fits true to size with a comfortable relaxed drape."
                  className="text-xs leading-relaxed resize-none"
                />
                <p className="text-[11px] text-muted-foreground">
                  Text instructions, fit notes, model height, or measurement points displayed on the sidebar.
                </p>
              </div>

              {/* Size Chart Image Upload */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Size Chart Image / Diagram</Label>
                {sizeChartPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-border/80 bg-muted/20 p-2 space-y-2">
                    <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden bg-black/50">
                      <img
                        src={sizeChartPreview}
                        alt="Size chart preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground truncate">
                        {sizeChartFile ? sizeChartFile.name : "Current Size Chart Image"}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSizeChartFile(null);
                          setSizeChartPreview(null);
                        }}
                        className="text-destructive h-7 text-xs hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove Photo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-border/80 rounded-xl p-5 text-center bg-muted/10 hover:bg-muted/20 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      id="size-chart-file"
                      className="hidden"
                      onChange={handleSizeChartFileChange}
                    />
                    <label htmlFor="size-chart-file" className="cursor-pointer block space-y-2">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center justify-center mx-auto">
                        <Upload className="h-5 w-5" />
                      </div>
                      <div className="text-xs font-semibold text-foreground">
                        Upload Size Chart Image
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        PNG, JPG or WebP up to 5MB. Measurement table or garment dimension graphic.
                      </p>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
              {(design.sizeChartText || design.sizeChartImageUrl) ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveSizeChart}
                  disabled={savingSizeChart}
                  className="text-xs"
                >
                  Clear Guide
                </Button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSizeChartOpen(false)}
                  disabled={savingSizeChart}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={savingSizeChart}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {savingSizeChart ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save Size Chart"
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

