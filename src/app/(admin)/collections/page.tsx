"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import {
  Layers,
  PlusCircle,
  Loader2,
  Trash2,
  ExternalLink,
  Shirt,
  Calendar,
  Sparkles,
  ChevronRight,
  FolderOpen,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { inventoryService } from "@/services/inventory.service";
import type { Collection, Design } from "@/types/inventory";

export default function CollectionsPage() {
  const { toast } = useToast();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [allDesigns, setAllDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog State: Create Collection
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Selected Collection for viewing designs
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [colls, designs] = await Promise.all([
        inventoryService.getAllCollections(),
        inventoryService.getDesigns(),
      ]);
      setCollections(colls);
      setAllDesigns(designs);
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Load Error",
        description: err.message || "Failed to load collections.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      setSubmitting(true);
      await inventoryService.createCollection({
        name: newName.trim(),
        description: newDescription.trim() || undefined,
      });

      toast({
        title: "Collection Created",
        description: `Successfully created "${newName}".`,
      });

      setNewName("");
      setNewDescription("");
      setIsCreateOpen(false);
      await loadData();
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: err.message || "Failed to create collection.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (col: Collection, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${col.name}"? Designs tagged with this collection will remain safe.`)) return;

    try {
      await inventoryService.deleteCollection(col.id);
      toast({
        title: "Collection Deleted",
        description: `Collection "${col.name}" was deleted.`,
      });
      if (selectedCollection?.id === col.id) {
        setSelectedCollection(null);
      }
      await loadData();
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: err.message || "Failed to delete collection.",
      });
    }
  };

  // Filter designs for the selected collection
  const collectionDesigns = selectedCollection
    ? allDesigns.filter(
        (d) =>
          d.customCollection === selectedCollection.name ||
          d.customCollection === selectedCollection.id
      )
    : [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 border-border/60">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-headline">Custom Collections</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Manage dynamic collections displayed in the CeyRaa client app balcony view.
              </p>
            </div>
          </div>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <PlusCircle className="h-4 w-4" /> Create Collection
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-pulse">
          <Loader2 className="h-8 w-8 mb-4 animate-spin text-primary" />
          <p>Loading collections...</p>
        </div>
      ) : collections.length === 0 ? (
        <Card className="p-12 text-center border-dashed bg-muted/5 flex flex-col items-center justify-center">
          <FolderOpen className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <h3 className="text-lg font-semibold">No Collections Yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
            Create custom collections to group your designs and showcase them dynamically on CeyRaa.
          </p>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <PlusCircle className="h-4 w-4" /> Create First Collection
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Left / Main: Collection Cards */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                All Collections ({collections.length})
              </h2>
              <span className="text-xs text-muted-foreground italic">
                Sorted by most recently updated designs
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {collections.map((col) => {
                const isSelected = selectedCollection?.id === col.id;
                const previewImg = col.latestDesignImage || col.imageUrl;

                return (
                  <Card
                    key={col.id}
                    onClick={() => setSelectedCollection(col)}
                    className={`cursor-pointer transition-all duration-200 overflow-hidden border ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/20 shadow-lg bg-primary/[0.02]"
                        : "border-border/80 hover:border-primary/50 hover:shadow-md bg-card"
                    }`}
                  >
                    <div className="relative aspect-[16/9] w-full bg-muted/30 border-b border-border/40 overflow-hidden flex items-center justify-center">
                      {previewImg ? (
                        <Image
                          src={previewImg}
                          alt={col.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-muted-foreground/40">
                          <Shirt className="h-8 w-8 mb-1" />
                          <span className="text-xs">No designs yet</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm border border-border/50">
                        {col.designCount || 0} {col.designCount === 1 ? "design" : "designs"}
                      </div>
                    </div>

                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-base text-foreground font-headline flex items-center gap-1.5">
                            {col.name}
                          </h3>
                          {col.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {col.description}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDelete(col, e)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mr-1 -mt-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {col.updatedAt ? new Date(col.updatedAt).toLocaleDateString() : "Recently"}
                        </span>
                        <span className="font-medium text-primary flex items-center gap-0.5">
                          View designs <ChevronRight className="h-3 w-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Collection's Designs */}
          <div className="md:col-span-1">
            <Card className="border border-border/80 sticky top-6 shadow-sm">
              <CardHeader className="pb-3 border-b border-border/40 bg-muted/10">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold font-headline flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    {selectedCollection ? selectedCollection.name : "Select a Collection"}
                  </CardTitle>
                  {selectedCollection && (
                    <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold">
                      {collectionDesigns.length} items
                    </span>
                  )}
                </div>
                <CardDescription className="text-xs">
                  {selectedCollection
                    ? "Designs tagged under this custom collection"
                    : "Click any collection card to inspect its designs"}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 max-h-[600px] overflow-y-auto">
                {!selectedCollection ? (
                  <div className="py-12 text-center text-muted-foreground text-xs italic">
                    Select a collection on the left to see which dresses are tagged under it.
                  </div>
                ) : collectionDesigns.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground text-xs italic">
                    No designs tagged under &quot;{selectedCollection.name}&quot; yet.
                    <p className="mt-2 text-foreground font-normal">
                      Tag designs from their detail page in Inventory.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {collectionDesigns.map((d) => {
                      const firstImg = d.images?.[0]?.url;
                      return (
                        <div
                          key={d.id}
                          className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 hover:bg-muted/30 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-md bg-muted/40 overflow-hidden relative flex-shrink-0 border border-border/40">
                              {firstImg ? (
                                <Image
                                  src={firstImg}
                                  alt={d.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <Shirt className="h-5 w-5 m-auto text-muted-foreground/30" />
                              )}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-foreground leading-tight">
                                {d.name}
                              </h4>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {d.code}
                              </span>
                            </div>
                          </div>

                          <Link
                            href={`/inventory/${d.categoryId}/${d.id}`}
                            className="text-xs text-primary hover:underline flex items-center gap-1 opacity-80 group-hover:opacity-100"
                          >
                            <span>Open</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Create Collection Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold font-headline flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" /> Create Custom Collection
              </DialogTitle>
              <DialogDescription className="text-xs">
                Give your collection a distinct name (e.g. &quot;Summer Silk Gala&quot;, &quot;Royal Bridal 2026&quot;).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="col-name" className="text-xs font-semibold">
                  Collection Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="col-name"
                  placeholder="e.g. Midnight Elegance"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="col-desc" className="text-xs font-semibold">
                  Description (Optional)
                </Label>
                <Textarea
                  id="col-desc"
                  placeholder="Brief synopsis of this curated collection..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !newName.trim()}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                  </>
                ) : (
                  "Create Collection"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
