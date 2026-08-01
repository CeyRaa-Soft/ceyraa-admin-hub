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
  PlusCircle,
  ArrowLeft,
  Boxes,
  Loader2,
  MoreVertical,
  FilePen,
  Trash2,
  Shirt,
  Info,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { inventoryService } from "@/services/inventory.service";
import type { DressCategory, Design } from "@/types/inventory";
import { DesignEditorForm } from "@/components/DesignEditorForm";
import Image from "next/image";

interface CategoryDesignsPageProps {
  params: Promise<{ categoryId: string }>;
}

export default function CategoryDesignsPage({ params }: CategoryDesignsPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  // Unwrap params using React.use()
  const { categoryId } = use(params);

  const [category, setCategory] = useState<DressCategory | null>(null);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);

  // Design Editor Dialog States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingDesign, setEditingDesign] = useState<Design | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [catData, designsData] = await Promise.all([
        inventoryService.getCategoryById(categoryId),
        inventoryService.getDesigns(categoryId),
      ]);
      setCategory(catData);
      setDesigns(designsData);
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Load Error",
        description: err.message || "Failed to load category designs.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [categoryId]);

  const handleOpenEditor = (designToEdit: Design | null = null) => {
    setEditingDesign(designToEdit);
    setIsEditorOpen(true);
  };

  const handleDeleteDesign = async (designToDelete: Design, e: React.MouseEvent) => {
    e.preventDefault(); // Stop click propagation to Card Link
    e.stopPropagation();

    if (!confirm(`Are you sure you want to delete design "${designToDelete.name}" (${designToDelete.code}) permanently?`)) {
      return;
    }

    try {
      await inventoryService.deleteDesign(designToDelete.id);
      toast({
        title: "Design Deleted",
        description: `Successfully deleted design "${designToDelete.name}".`,
      });
      loadData();
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: err.message || "Failed to delete design.",
      });
    }
  };

  // Helper to calculate total stock for a design
  const calculateTotalStock = (designItem: Design) => {
    if (!designItem.variants) return 0;
    return designItem.variants.reduce((total, variant) => {
      if (!variant.sizes) return total;
      return total + variant.sizes.reduce((sizeTotal, size) => sizeTotal + (size.quantity || 0), 0);
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-pulse">
        <Loader2 className="h-8 w-8 mb-4 animate-spin text-primary" />
        <p>Loading designs...</p>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="text-center py-20">
        <ArrowLeft className="h-10 w-10 text-muted-foreground mx-auto mb-4 cursor-pointer" onClick={() => router.back()} />
        <h3 className="text-xl font-semibold mb-2">Category not found</h3>
        <p className="text-muted-foreground">The requested dress category could not be found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/inventory")} className="h-10 w-10 rounded-full border border-border/80 bg-background/50">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold font-headline">{category.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Designs under category: <span className="font-mono bg-muted px-1.5 py-0.5 rounded border text-xs">{category.id}</span>
          </p>
        </div>
        <Button onClick={() => handleOpenEditor()} className="ml-auto">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Design
        </Button>
      </div>

      {designs.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center border-dashed">
          <Shirt className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No designs found</h3>
          <p className="text-muted-foreground mb-6">
            Add your first design to category "{category.name}" to get started.
          </p>
          <Button onClick={() => handleOpenEditor()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Design
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 animate-in fade-in duration-300">
          {designs.map((design) => (
            <DesignCard
              key={design.id}
              design={design}
              categoryId={categoryId}
              onEdit={handleOpenEditor}
              onDelete={handleDeleteDesign}
              totalStock={calculateTotalStock(design)}
            />
          ))}
        </div>
      )}

      {/* Reusable Design Form */}
      {isEditorOpen && (
        <DesignEditorForm
          open={isEditorOpen}
          onOpenChange={setIsEditorOpen}
          design={editingDesign}
          categories={category ? [category] : []}
          categoryId={categoryId}
          onSaveSuccess={loadData}
        />
      )}
    </div>
  );
}

interface DesignCardProps {
  design: any;
  categoryId: string;
  onEdit: (design: any) => void;
  onDelete: (design: any, e: React.MouseEvent) => void;
  totalStock: number;
}

function DesignCard({ design, categoryId, onEdit, onDelete, totalStock }: DesignCardProps) {
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const images = design.images || [];
  const hasImages = images.length > 0;
  const currentImage = hasImages ? images[activeImgIdx]?.url : null;
  const currentColor = hasImages ? images[activeImgIdx]?.color : "";

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveImgIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveImgIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Reset active image index if design changes
  useEffect(() => {
    setActiveImgIdx(0);
  }, [design]);

  return (
    <div className="group relative">
      <Link href={`/inventory/${categoryId}/${design.id}`} className="block">
        <Card className="overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1.5 bg-card border border-border/85 h-full flex flex-col">
          {/* Thumbnail Display */}
          <div className="relative aspect-square w-full bg-muted/20 border-b border-border/40 overflow-hidden flex items-center justify-center text-muted-foreground/40">
            {hasImages ? (
              <Image
                src={currentImage!}
                alt={`${design.name} - ${currentColor}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <Shirt className="h-16 w-16 stroke-[1.2]" />
            )}

            {/* Design Code Badge */}
            <span className="absolute top-2.5 left-2.5 bg-black/70 border border-white/10 backdrop-blur-sm text-white text-[10px] font-bold font-mono px-2 py-0.5 rounded z-10">
              {design.code}
            </span>

            {/* Image cycle arrows */}
            {hasImages && images.length > 1 && (
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity z-15">
                <Button
                  variant="secondary"
                  size="icon"
                  type="button"
                  className="h-7 w-7 rounded-full bg-white/90 hover:bg-white text-foreground shadow-md hover:scale-105 transition-all"
                  onClick={handlePrev}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  type="button"
                  className="h-7 w-7 rounded-full bg-white/90 hover:bg-white text-foreground shadow-md hover:scale-105 transition-all"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Indicator dots */}
            {hasImages && images.length > 1 && (
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1 z-10 bg-black/40 px-2 py-1 rounded-full backdrop-blur-xs">
                {images.map((_: any, idx: number) => (
                  <span
                    key={idx}
                    className={`h-1.5 w-1.5 rounded-full transition-all ${
                      idx === activeImgIdx ? "bg-white scale-125" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Display active image color indicator */}
            {hasImages && (
              <span className="absolute bottom-2.5 right-2.5 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded font-mono z-10 tracking-wider">
                {currentColor}
              </span>
            )}

            {/* Quick Action Overlays */}
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <Button
                variant="secondary"
                size="icon"
                type="button"
                className="h-8 w-8 rounded-full bg-white/90 hover:bg-white text-foreground shadow-sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit(design);
                }}
                title="Edit design"
              >
                <FilePen className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                type="button"
                className="h-8 w-8 rounded-full shadow-sm"
                onClick={(e) => onDelete(design, e)}
                title="Delete design"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <CardHeader className="p-4 flex-1">
            <div className="flex justify-between items-start gap-2">
              <div>
                <CardTitle className="text-base font-headline group-hover:text-primary transition-colors line-clamp-1">
                  {design.name}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Colors: {design.variants?.length || 0}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          {/* Stock status footer */}
          <div className="px-4 pb-4 pt-0 border-t border-border/20 mt-auto space-y-3">
            <div className="flex items-center justify-between text-xs pt-3">
              <span className="text-muted-foreground">Available Stock</span>
              <span className={`font-bold ${totalStock > 0 ? "text-emerald-600 font-mono text-sm" : "text-muted-foreground italic"}`}>
                {totalStock > 0 ? `${totalStock} pcs` : "Out of Stock"}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs gap-1.5 text-primary hover:bg-primary/10 transition-colors"
              disabled={totalStock <= 0}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `/customer-orders?addOrder=true&categoryId=${categoryId}&designId=${design.id}`;
              }}
            >
              <ShoppingCart className="h-3.5 w-3.5" /> Order
            </Button>
          </div>
        </Card>
      </Link>
    </div>
  );
}
