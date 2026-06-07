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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Accordion } from "@/components/ui/accordion";
import { OrderTotalsProvider } from "@/contexts/OrderContext";
import { OrderAccordionItem } from "@/components/OrderAccordionItem";
import type { Order, OrderCategory, Supplier } from "@/types/order";

const initialOrders: Order[] = [
  {
    id: "ORD001",
    supplier: "Lanka Fabrics",
    date: "2023-11-15",
    status: "Delivered",
    items: [
      {
        id: "item1",
        name: "Crew Neck Long Sleeve Dress - 123IO",
        variants: [
          {
            id: "v1",
            color: "Red",
            sizes: [
              { size: "XS", quantity: 5, unitPrice: 35 },
              { size: "M", quantity: 4, unitPrice: 35 },
            ],
          },
          {
            id: "v2",
            color: "Red Dotted Print",
            sizes: [{ size: "M", quantity: 8, unitPrice: 38 }],
          },
          {
            id: "v3",
            color: "White",
            sizes: [
              { size: "XS", quantity: 8, unitPrice: 35 },
              { size: "M", quantity: 6, unitPrice: 35 },
            ],
          },
        ],
      },
      {
        id: "item2",
        name: "V-Neck T-Shirt - 456TS",
        variants: [
          {
            id: "v4",
            color: "Black",
            sizes: [
              { size: "S", quantity: 20, unitPrice: 15 },
              { size: "M", quantity: 30, unitPrice: 15 },
              { size: "L", quantity: 20, unitPrice: 15 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "ORD002",
    supplier: "Zippers & Co.",
    date: "2023-11-20",
    status: "Pending",
    items: [
      {
        id: "item3",
        name: "Metal Zippers - 7in",
        variants: [
          {
            id: "v5",
            color: "Silver",
            sizes: [{ size: '7"', quantity: 500, unitPrice: 0.5 }],
          },
        ],
      },
    ],
  },
];

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
    description:
      "All types of zippers, buttons, and other garment accessories.",
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

const suppliers = initialSuppliers.map((s) => s.name);
const supplierNameToIdMap = initialSuppliers.reduce((acc, supplier) => {
  acc[supplier.name] = supplier.id;
  return acc;
}, {} as Record<string, string>);

export default function SupplierOrdersPage() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [isCreateOrderDialogOpen, setIsCreateOrderDialogOpen] = useState(false);
  const [newOrderData, setNewOrderData] = useState<{
    id: string;
    supplier: string;
  }>({
    id: "",
    supplier: "",
  });

  // Define categories for each order
  const [orderCategories] = useState<Record<string, OrderCategory[]>>({
    ORD001: [
      {
        id: "production",
        name: "Production Items",
        items: initialOrders[0].items,
      },
      {
        id: "supplies",
        name: "Supplies",
        items: [
          {
            id: "supply1",
            name: "Thread Spools - Cotton",
            variants: [
              {
                id: "vs1",
                color: "White",
                sizes: [{ size: "Standard", quantity: 100, unitPrice: 2.5 }],
              },
              {
                id: "vs2",
                color: "Black",
                sizes: [{ size: "Standard", quantity: 50, unitPrice: 2.5 }],
              },
            ],
          },
        ],
      },
    ],
    ORD002: [
      {
        id: "production",
        name: "Production Items",
        items: initialOrders[1].items,
      },
      {
        id: "supplies",
        name: "Supplies",
        items: [],
      },
    ],
  });

  const handleApproveOrder = (order: Order) => {
    setOrders(
      orders.map((o) =>
        o.id === order.id ? { ...o, status: "Approved" as const } : o
      )
    );
  };

  const handleCreateOrder = () => {
    if (!newOrderData.id || !newOrderData.supplier) {
      alert("Please fill in both Order ID and Supplier.");
      return;
    }
    const newOrder: Order = {
      id: newOrderData.id,
      supplier: newOrderData.supplier,
      date: new Date().toISOString().split("T")[0],
      status: "Pending",
      items: [],
    };
    setOrders([newOrder, ...orders]);
    setIsCreateOrderDialogOpen(false);
    setNewOrderData({ id: "", supplier: "" });
  };

  const handleAddItemToCategory = (orderId: string, categoryId: string) => {
    console.log(`Add item to order ${orderId}, category ${categoryId}`);
    // Implement your add item logic here
  };

  return (
    <OrderTotalsProvider>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold font-headline">Supplier Orders</h1>
          <Button onClick={() => setIsCreateOrderDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create Order
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Orders</CardTitle>
            <CardDescription>
              An overview of all your recent supplier orders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {orders.map((order) => (
                <OrderAccordionItem
                  key={order.id}
                  order={order}
                  categories={orderCategories[order.id] || []}
                  supplierNameToIdMap={supplierNameToIdMap}
                  onApprove={handleApproveOrder}
                  onAddItemToCategory={handleAddItemToCategory}
                />
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Create Order Dialog */}
        <Dialog
          open={isCreateOrderDialogOpen}
          onOpenChange={setIsCreateOrderDialogOpen}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Supplier Order</DialogTitle>
              <DialogDescription>
                Fill in the details below to create a new order. You can add
                items after creation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="order-id">Order ID</Label>
                <Input
                  id="order-id"
                  placeholder="e.g., ORD003"
                  value={newOrderData.id}
                  onChange={(e) =>
                    setNewOrderData({ ...newOrderData, id: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Select
                  value={newOrderData.supplier}
                  onValueChange={(value) =>
                    setNewOrderData({ ...newOrderData, supplier: value })
                  }
                >
                  <SelectTrigger id="supplier">
                    <SelectValue placeholder="Select a supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier} value={supplier}>
                        {supplier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateOrderDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateOrder}>Create Order</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </OrderTotalsProvider>
  );
}
