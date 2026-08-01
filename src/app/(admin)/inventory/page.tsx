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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { PlusCircle, Boxes, Loader2, MoreVertical, FilePen, Trash2, FolderHeart } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { inventoryService } from "@/services/inventory.service";
import type { DressCategory } from "@/types/inventory";

// Dynamic background list for premium styling
const GRADIENTS = [
  "from-pink-500/10 via-purple-500/10 to-indigo-500/10 border-purple-500/20",
  "from-amber-500/10 via-orange-500/10 to-yellow-500/10 border-orange-500/20",
  "from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border-teal-500/20",
  "from-blue-500/10 via-indigo-500/10 to-violet-500/10 border-blue-500/20",
];

export default function InventoryPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<DressCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Category Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DressCategory | null>(null);
  const [catName, setCatName] = useState("");
  const [catPrefix, setCatPrefix] = useState("");
  const [saving, setSaving] = useState(false);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getAllCategories();
      setCategories(data);
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Load Error",
        description: err.message || "Failed to load categories.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenDialog = (cat: DressCategory | null = null) => {
    setEditingCategory(cat);
    if (cat) {
      setCatName(cat.name);
      setCatPrefix(cat.prefix);
    } else {
      setCatName("");
      setCatPrefix("");
    }
    setIsDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!catName.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Category name is required.",
      });
      return;
    }

    try {
      setSaving(true);
      if (editingCategory) {
        // Edit Category
        await inventoryService.updateCategory(editingCategory.id, {
          name: catName.trim(),
          prefix: catPrefix.trim().toUpperCase() || undefined,
        });
        toast({
          title: "Category Updated",
          description: `Category "${catName}" updated successfully.`,
        });
      } else {
        // Create Category
        const created = await inventoryService.createCategory({
          name: catName.trim(),
          prefix: catPrefix.trim().toUpperCase() || undefined,
        });
        toast({
          title: "Category Created",
          description: `Category "${created.name}" created with ID: ${created.id}.`,
        });
      }
      setIsDialogOpen(false);
      loadCategories();
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: err.message || "Failed to save category.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (cat: DressCategory) => {
    if (
      !confirm(
        `Are you sure you want to delete "${cat.name}"? This will delete all designs inside this category permanently.`
      )
    ) {
      return;
    }

    try {
      await inventoryService.deleteCategory(cat.id);
      toast({
        title: "Category Deleted",
        description: `Successfully deleted "${cat.name}" and all associated designs.`,
      });
      loadCategories();
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: err.message || "Failed to delete category.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-pulse">
        <Boxes className="h-8 w-8 mb-4 animate-bounce text-primary" />
        <p>Loading inventory categories...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Inventory Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage dress categories and explore garment designs.
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center border-dashed">
          <Boxes className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No categories found</h3>
          <p className="text-muted-foreground mb-6">
            Create your first category to start organizing your designs.
          </p>
          <Button onClick={() => handleOpenDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create Category
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in duration-300">
          {categories.map((category, index) => {
            const gradient = GRADIENTS[index % GRADIENTS.length];
            return (
              <div key={category.id} className="group relative">
                <Link href={`/inventory/${category.id}`} className="block">
                  <Card className={`h-48 overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1.5 bg-gradient-to-br ${gradient} border flex flex-col justify-between`}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="p-2.5 rounded-lg bg-background/60 shadow-sm border border-border/20 text-primary">
                          <FolderHeart className="h-5 w-5" />
                        </div>
                        {/* Dropdown Menu - Stop click propagation to prevent link click */}
                        <div onClick={(e) => e.preventDefault()} className="relative z-10">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0 rounded-full hover:bg-background/80"
                              >
                                <MoreVertical className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenDialog(category)}>
                                <FilePen className="mr-2 h-4 w-4 text-muted-foreground" />
                                Edit Category
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                onClick={() => handleDeleteCategory(category)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Category
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 pb-5">
                      <CardTitle className="text-xl font-headline group-hover:text-primary transition-colors">
                        {category.name}
                      </CardTitle>
                      <CardDescription className="mt-1 font-mono text-xs text-muted-foreground/80">
                        Code Prefix: {category.prefix} | ID: {category.id}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            );
          })}

          <button
            onClick={() => handleOpenDialog()}
            className="group text-left"
          >
            <Card className="flex items-center justify-center border-2 border-dashed border-border/80 hover:border-primary/60 hover:shadow-md transition-all duration-300 min-h-[192px] h-full bg-card">
              <div className="text-center p-6">
                <PlusCircle className="mx-auto h-10 w-10 text-muted-foreground transition-colors group-hover:text-primary" />
                <p className="mt-2 text-sm font-semibold group-hover:text-primary transition-colors">Create New Category</p>
                <p className="text-xs text-muted-foreground mt-1">Add a new clothing type</p>
              </div>
            </Card>
          </button>
        </div>
      )}

      {/* Category Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Create Dress Category"}</DialogTitle>
            <DialogDescription>
              Add a new category or customize an existing one. Code prefixes help generate short codes like CROP001.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="category-name">Category Name <span className="text-destructive">*</span></Label>
              <Input
                id="category-name"
                placeholder="e.g. Crop Tops, Shorts, Dresses"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category-prefix">Short Code Prefix</Label>
              <Input
                id="category-prefix"
                placeholder="e.g. CROP, SHRT, DRS (Auto-generated if empty)"
                value={catPrefix}
                onChange={(e) => setCatPrefix(e.target.value)}
                maxLength={5}
                className="uppercase"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveCategory} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : editingCategory ? (
                "Save Changes"
              ) : (
                "Create Category"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
