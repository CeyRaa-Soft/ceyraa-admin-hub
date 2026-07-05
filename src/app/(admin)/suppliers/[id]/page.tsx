"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Building,
  Phone,
  Landmark,
  University,
  FileText,
  ArrowLeft,
  Edit,
  Trash2,
  ListTodo,
} from "lucide-react";
import Link from "next/link";
import type { Supplier } from "@/types/order";
import { supplierService } from "@/services/supplier.service";
import { useToast } from "@/hooks/use-toast";
import { ErrorBanner } from "@/components/ui/error-banner";

export default function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const supplierId = params.id as string;

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Partial<Supplier>>({});
  const [editNotesText, setEditNotesText] = useState("");
  const [editErrorMsg, setEditErrorMsg] = useState<string | null>(null);
  const [editErrorDetails, setEditErrorDetails] = useState<any>(null);

  // Load supplier detail
  const loadSupplier = async () => {
    try {
      setLoading(true);
      const data = await supplierService.getById(supplierId);
      setSupplier(data);
      // Pre-fill edit data
      if (data) {
        setEditData(data);
        setEditNotesText((data.notes || []).join("\n"));
      }
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error loading supplier",
        description: error.message || "Failed to retrieve supplier details.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (supplierId) {
      loadSupplier();
    }
  }, [supplierId]);

  const handleOpenEditChange = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open && supplier) {
      // Reset to original data
      setEditData(supplier);
      setEditNotesText((supplier.notes || []).join("\n"));
      setEditErrorMsg(null);
      setEditErrorDetails(null);
    }
  };

  const handleEditInputChange = (
    field: keyof Omit<Supplier, "id" | "notes">,
    value: string
  ) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUpdateSupplier = async () => {
    setEditErrorMsg(null);
    setEditErrorDetails(null);

    if (!editData.name?.trim()) {
      setEditErrorMsg("Supplier Name is required");
      return;
    }

    try {
      const parsedNotes = editNotesText
        .split("\n")
        .map((n) => n.trim())
        .filter(Boolean);

      const updated = await supplierService.update(supplierId, {
        ...editData,
        notes: parsedNotes,
      });

      setSupplier(updated);
      setIsEditDialogOpen(false);
      toast({
        title: "Supplier updated",
        description: "The supplier details have been successfully saved.",
      });
    } catch (error: any) {
      console.error(error);
      setEditErrorMsg(error.message || "Failed to update supplier");
      if (error.details) {
        setEditErrorDetails(error.details);
      }
    }
  };

  const handleDeleteSupplier = async () => {
    try {
      await supplierService.delete(supplierId);
      toast({
        title: "Supplier deleted",
        description: "The supplier has been removed successfully.",
      });
      router.push("/suppliers");
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description: error.message || "Could not delete supplier.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-pulse">
        <Building className="h-10 w-10 mb-4 animate-bounce text-primary" />
        <p>Loading supplier details...</p>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        <Button variant="outline" asChild>
          <Link href="/suppliers">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Suppliers
          </Link>
        </Button>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">Supplier Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">The supplier you are looking for does not exist or has been deleted.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <Button variant="outline" asChild>
        <Link href="/suppliers">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Suppliers
        </Link>
      </Button>

      <div className="grid gap-6">
        {/* Main Details Card */}
        <Card className="overflow-hidden border-border/70 shadow-md">
          <CardHeader className="bg-muted/15 pb-6 border-b border-border/40">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Building className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold font-headline">{supplier.name}</CardTitle>
                  <CardDescription className="text-sm mt-0.5">
                    {supplier.category || <span className="italic text-muted-foreground">No category specified</span>}
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleOpenEditChange(true)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete <strong>{supplier.name}</strong> from the database. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteSupplier} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2 text-sm text-foreground/80">
                  <Landmark className="h-5 w-5 text-primary/70" /> Address
                </h4>
                <p className="text-muted-foreground pl-7">
                  {supplier.address || <span className="italic text-xs opacity-75">No address provided</span>}
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2 text-sm text-foreground/80">
                  <Phone className="h-5 w-5 text-primary/70" /> Contact
                </h4>
                <p className="text-muted-foreground pl-7">
                  {supplier.phone || <span className="italic text-xs opacity-75">No phone number provided</span>}
                </p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <h4 className="font-semibold flex items-center gap-2 text-sm text-foreground/80">
                  <University className="h-5 w-5 text-primary/70" /> Bank Details
                </h4>
                <p className="text-muted-foreground pl-7 font-mono text-sm">
                  {supplier.bankDetails || <span className="italic text-xs opacity-75">No bank details provided</span>}
                </p>
              </div>
              {supplier.description && (
                <div className="space-y-2 md:col-span-2 border-t pt-4 border-border/40">
                  <h4 className="font-semibold flex items-center gap-2 text-sm text-foreground/80">
                    <FileText className="h-5 w-5 text-primary/70" /> Description
                  </h4>
                  <p className="text-muted-foreground italic pl-7 text-sm leading-relaxed">
                    {supplier.description}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notes Section Card */}
        <Card className="border-border/70 shadow-md">
          <CardHeader className="bg-muted/10 border-b border-border/40 py-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg font-bold">Point-Form Notes</CardTitle>
                <CardDescription className="text-xs">Important details or comments about this supplier</CardDescription>
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => handleOpenEditChange(true)}>
              <Edit className="h-3 w-3 mr-1" /> Edit Notes
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            {!supplier.notes || supplier.notes.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm italic">
                No notes added for this supplier. Click Edit to add some notes.
              </div>
            ) : (
              <ul className="space-y-3 pl-2">
                {supplier.notes.map((note, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-foreground/95 bg-muted/15 p-3 rounded-lg border border-border/30 animate-in fade-in duration-300">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs mt-0.5 font-mono">
                      {index + 1}
                    </span>
                    <span className="flex-1 leading-normal">{note}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={handleOpenEditChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Supplier Details</DialogTitle>
            <DialogDescription>
              Modify the details below. Only the supplier name is mandatory.
            </DialogDescription>
          </DialogHeader>

          {/* Validation Error Banner */}
          <ErrorBanner
            title="Unable to update supplier"
            message={editErrorMsg || undefined}
            details={editErrorDetails}
            onClose={() => {
              setEditErrorMsg(null);
              setEditErrorDetails(null);
            }}
            className="mb-2"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Supplier Name <span className="text-destructive">*</span></Label>
              <Input
                id="edit-name"
                value={editData.name || ""}
                onChange={(e) => handleEditInputChange("name", e.target.value)}
                placeholder="e.g., Lanka Fabrics"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Item Category</Label>
              <Input
                id="edit-category"
                value={editData.category || ""}
                onChange={(e) => handleEditInputChange("category", e.target.value)}
                placeholder="e.g., Textiles"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-address">Address / Location</Label>
              <Textarea
                id="edit-address"
                value={editData.address || ""}
                onChange={(e) => handleEditInputChange("address", e.target.value)}
                placeholder="Full address of the supplier"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                value={editData.phone || ""}
                onChange={(e) => handleEditInputChange("phone", e.target.value)}
                placeholder="+94 11 234 5678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-bank">Bank Details</Label>
              <Input
                id="edit-bank"
                value={editData.bankDetails || ""}
                onChange={(e) => handleEditInputChange("bankDetails", e.target.value)}
                placeholder="Bank, Branch, A/C"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-desc">Additional Description</Label>
              <Textarea
                id="edit-desc"
                value={editData.description || ""}
                onChange={(e) => handleEditInputChange("description", e.target.value)}
                placeholder="Any extra details about the supplier"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-notes">Notes (one note per line for point-form)</Label>
              <Textarea
                id="edit-notes"
                value={editNotesText}
                onChange={(e) => setEditNotesText(e.target.value)}
                placeholder="e.g. Premium supplier&#10;Prefers direct bank transfers"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleOpenEditChange(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateSupplier} type="button">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
