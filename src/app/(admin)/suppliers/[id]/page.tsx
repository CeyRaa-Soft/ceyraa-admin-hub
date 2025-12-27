
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, Phone, Landmark, University, FileText, ArrowLeft, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Supplier } from "@/types/order";

// This would typically come from a data store or API call
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


export default function SupplierDetailPage() {
  const params = useParams();
  const supplierId = params.id;
  const supplier = initialSuppliers.find((s) => s.id === supplierId);

  if (!supplier) {
    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <Button variant="outline" asChild>
                <Link href="/dashboard/suppliers">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Suppliers
                </Link>
            </Button>
            <Card>
                <CardHeader>
                    <CardTitle>Supplier Not Found</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>The supplier you are looking for does not exist.</p>
                </CardContent>
            </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
       <Button variant="outline" asChild>
        <Link href="/dashboard/suppliers">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Suppliers
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Building className="h-8 w-8 text-primary" />
                <div>
                    <CardTitle className="text-3xl font-bold">{supplier.name}</CardTitle>
                    <CardDescription>{supplier.category}</CardDescription>
                </div>
            </div>
            <div className="flex gap-2">
                <Button variant="outline"><Edit className="mr-2 h-4 w-4"/> Edit</Button>
                <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4"/> Delete</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6 border-t">
          <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2"><Landmark className="h-5 w-5 text-muted-foreground"/> Address</h4>
                <p className="text-muted-foreground pl-7">{supplier.address}</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2"><Phone className="h-5 w-5 text-muted-foreground"/> Contact</h4>
                <p className="text-muted-foreground pl-7">{supplier.phone}</p>
              </div>
               <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2"><University className="h-5 w-5 text-muted-foreground"/> Bank Details</h4>
                <p className="text-muted-foreground pl-7">{supplier.bankDetails}</p>
              </div>
              {supplier.description && (
                <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2"><FileText className="h-5 w-5 text-muted-foreground"/> Description</h4>
                    <p className="text-muted-foreground italic pl-7">{supplier.description}</p>
                </div>
              )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
