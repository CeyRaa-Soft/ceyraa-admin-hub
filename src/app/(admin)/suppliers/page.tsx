"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { PlusCircle, Building } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Supplier } from "@/types/order";
import Link from "next/link";
import { useSuppliers } from "@/hooks/useSuppliers";
import { supplierService } from "@/services/supplier.service";
import { ErrorBanner } from "@/components/ui/error-banner";

const newEmptySupplier: Omit<Supplier, "id"> = {
  name: "",
  category: "",
  address: "",
  phone: "",
  bankDetails: "",
  description: "",
};

export default function SuppliersPage() {
  const { suppliers, loading, refresh } = useSuppliers();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSupplierData, setNewSupplierData] =
    useState<Omit<Supplier, "id">>(newEmptySupplier);
  const [notesText, setNotesText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);

  const handleOpenChange = (open: boolean) => {
    setIsCreateDialogOpen(open);
    if (!open) {
      setNewSupplierData(newEmptySupplier);
      setNotesText("");
      setErrorMsg(null);
      setErrorDetails(null);
    }
  };

  const handleInputChange = (
    field: keyof Omit<Supplier, "id" | "notes">,
    value: string,
  ) => {
    setNewSupplierData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateSupplier = async () => {
    setErrorMsg(null);
    setErrorDetails(null);

    if (!newSupplierData.name.trim()) {
      setErrorMsg("Supplier Name is required");
      return;
    }

    try {
      const parsedNotes = notesText
        .split("\n")
        .map((n) => n.trim())
        .filter(Boolean);

      await supplierService.create({
        ...newSupplierData,
        notes: parsedNotes,
      });

      await refresh();
      handleOpenChange(false);
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Failed to create supplier");
      if (error.details) {
        setErrorDetails(error.details);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground animate-pulse">
        <Building className="h-6 w-6 mr-2 animate-bounce" /> Loading
        suppliers...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Suppliers</h1>

        <Button onClick={() => handleOpenChange(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Supplier
        </Button>
      </div>

      {suppliers.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center border-dashed">
          <Building className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No suppliers found</h3>
          <p className="text-muted-foreground mb-6">
            Get started by adding your first supplier.
          </p>
          <Button onClick={() => handleOpenChange(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Supplier
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {suppliers.map((supplier: Supplier) => (
            <Link
              key={supplier.id}
              href={`/suppliers/${supplier.id}`}
              className="block group"
            >
              <Card className="flex flex-col h-full transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1.5 border-border/60 hover:border-primary/30">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Building className="h-8 w-8 text-primary flex-shrink-0" />
                    <div>
                      <CardTitle className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">
                        {supplier.name}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-grow">
                  {supplier.category ? (
                    <Badge variant="secondary">{supplier.category}</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      No category
                    </span>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Supplier</DialogTitle>
            <DialogDescription>
              Fill in the details below. Only the supplier name is mandatory.
            </DialogDescription>
          </DialogHeader>

          {/* Validation Error Banner */}
          <ErrorBanner
            title="Unable to save supplier"
            message={errorMsg || undefined}
            details={errorDetails}
            onClose={() => {
              setErrorMsg(null);
              setErrorDetails(null);
            }}
            className="mb-2"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label htmlFor="sup-name">
                Supplier Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sup-name"
                value={newSupplierData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g., Lanka Fabrics"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sup-category">Item Category</Label>
              <Input
                id="sup-category"
                value={newSupplierData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                placeholder="e.g., Textiles"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="sup-address">Address / Location</Label>
              <Textarea
                id="sup-address"
                value={newSupplierData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Full address of the supplier"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sup-phone">Phone Number</Label>
              <Input
                id="sup-phone"
                value={newSupplierData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+94 11 234 5678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sup-bank">Bank Details</Label>
              <Input
                id="sup-bank"
                value={newSupplierData.bankDetails}
                onChange={(e) =>
                  handleInputChange("bankDetails", e.target.value)
                }
                placeholder="Bank, Branch, A/C"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="sup-desc">Additional Description</Label>
              <Textarea
                id="sup-desc"
                value={newSupplierData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Any extra details about the supplier"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="sup-notes">
                Notes (one note per line for point-form)
              </Label>
              <Textarea
                id="sup-notes"
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="e.g. Premium supplier&#10;Prefers direct bank transfers&#10;Discounts apply for bulk orders"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button onClick={handleCreateSupplier} type="button">
              Save Supplier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
