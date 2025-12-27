
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { PlusCircle, Building } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Supplier } from "@/types/order";
import Link from "next/link";


const initialSuppliers: Supplier[] = [
  {
    id: "sup1",
    name: "Lanka Fabrics",
    category: "Textiles",
    address: "No. 123, Galle Road, Colombo 03, Sri Lanka",
    phone: "+94 11 234 5678",
    bankDetails: "Commercial Bank, Kollupitiya Branch, A/C: 1234567890",
    description: "Premium quality fabrics, specializing in cotton and linen.",
  },
  {
    id: "sup2",
    name: "Zippers & Co.",
    category: "Accessories",
    address: "45, Main Street, Pettah, Colombo 11, Sri Lanka",
    phone: "+94 11 298 7654",
    bankDetails: "Hatton National Bank, Pettah Branch, A/C: 0987654321",
    description: "All types of zippers, buttons, and other garment accessories.",
  },
   {
    id: "sup3",
    name: "Colombo Textiles",
    category: "Textiles",
    address: "78, Kandy Road, Kadawatha, Sri Lanka",
    phone: "+94 11 456 7890",
    bankDetails: "Sampath Bank, Kadawatha Branch, A/C: 1122334455",
    description: "Wholesale supplier of printed and plain fabrics.",
  },
  {
    id: "sup4",
    name: "Kandy Batiks",
    category: "Batik & Handloom",
    address: "21, Peradeniya Road, Kandy, Sri Lanka",
    phone: "+94 81 222 3333",
    bankDetails: "Bank of Ceylon, Kandy Branch, A/C: 5566778899",
    description: "Authentic Sri Lankan batik and handloom materials.",
  },
];

const newEmptySupplier: Omit<Supplier, "id"> = {
  name: "",
  category: "",
  address: "",
  phone: "",
  bankDetails: "",
  description: "",
};


export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSupplierData, setNewSupplierData] = useState<Omit<Supplier, "id">>(newEmptySupplier);

  const handleCreateSupplier = () => {
    if (!newSupplierData.name || !newSupplierData.category) {
        alert("Please fill in at least Name and Category.");
        return;
    }
    const newSupplier: Supplier = {
      id: `sup-${Date.now()}`,
      ...newSupplierData,
    };
    setSuppliers([newSupplier, ...suppliers]);
    setIsCreateDialogOpen(false);
    setNewSupplierData(newEmptySupplier);
  };

  const handleInputChange = (field: keyof typeof newSupplierData, value: string) => {
    setNewSupplierData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Suppliers</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Supplier
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {suppliers.map((supplier) => (
          <Link href={`/dashboard/suppliers/${supplier.id}`} key={supplier.id} className="block group">
            <Card className="flex flex-col h-full transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1.5">
              <CardHeader>
                <div className="flex items-center gap-4">
                    <Building className="h-8 w-8 text-primary flex-shrink-0" />
                    <div>
                        <CardTitle className="text-xl font-bold leading-tight">{supplier.name}</CardTitle>
                    </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <Badge variant="secondary">{supplier.category}</Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Create Supplier Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Supplier</DialogTitle>
            <DialogDescription>
              Fill in the details below to add a new supplier to your list.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label htmlFor="sup-name">Supplier Name</Label>
              <Input id="sup-name" value={newSupplierData.name} onChange={e => handleInputChange('name', e.target.value)} placeholder="e.g., Lanka Fabrics" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="sup-category">Item Category</Label>
              <Input id="sup-category" value={newSupplierData.category} onChange={e => handleInputChange('category', e.target.value)} placeholder="e.g., Textiles" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="sup-address">Address / Location</Label>
              <Textarea id="sup-address" value={newSupplierData.address} onChange={e => handleInputChange('address', e.target.value)} placeholder="Full address of the supplier" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="sup-phone">Phone Number</Label>
              <Input id="sup-phone" value={newSupplierData.phone} onChange={e => handleInputChange('phone', e.target.value)} placeholder="+94 11 234 5678" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="sup-bank">Bank Details</Label>
              <Input id="sup-bank" value={newSupplierData.bankDetails} onChange={e => handleInputChange('bankDetails', e.target.value)} placeholder="Bank, Branch, A/C" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="sup-desc">Additional Description</Label>
              <Textarea id="sup-desc" value={newSupplierData.description} onChange={e => handleInputChange('description', e.target.value)} placeholder="Any extra details about the supplier" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateSupplier}>Save Supplier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
