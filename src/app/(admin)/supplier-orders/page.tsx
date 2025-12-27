
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
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import {
  PlusCircle,
  MoreHorizontal,
  FilePen,
  Trash2,
  CheckCircle2,
  Plus,
  Upload,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { NewOrderItem } from "@/components/new-order-item";
import type { Order, OrderItem, ColorVariant, SizeInfo, Supplier } from "@/types/order";
import Link from "next/link";


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
            sizes: [
              { size: "M", quantity: 8, unitPrice: 38 },
            ],
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
                ]
            }
        ]
      }
    ],
  },
  {
    id: "ORD002",
    supplier: "Zippers & Co.",
    date: "2023-11-20",
    status: "Pending",
    items: [{ 
        id: "item3",
        name: "Metal Zippers - 7in",
        variants: [
            {
                id: "v5",
                color: "Silver",
                sizes: [
                    { size: '7"', quantity: 500, unitPrice: 0.5 }
                ]
            }
        ]
    }],
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

const suppliers = initialSuppliers.map(s => s.name);
const supplierNameToIdMap = initialSuppliers.reduce((acc, supplier) => {
    acc[supplier.name] = supplier.id;
    return acc;
}, {} as Record<string, string>);


const statusVariant: { [key in Order["status"]]: "secondary" | "default" | "outline" } = {
  Pending: "secondary",
  Approved: "default",
  Delivered: "outline",
};

const calculateSizeTotal = (size: SizeInfo) => size.quantity * size.unitPrice;
const calculateVariantTotalCost = (variant: ColorVariant) => variant.sizes.reduce((total, s) => total + calculateSizeTotal(s), 0);
const calculateItemTotalCost = (item: OrderItem) => item.variants.reduce((total, v) => total + calculateVariantTotalCost(v), 0);
const calculateOrderSubTotal = (items: OrderItem[]) => items.reduce((total, item) => total + calculateItemTotalCost(item), 0);

export default function SupplierOrdersPage() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isCreateOrderDialogOpen, setIsCreateOrderDialogOpen] = useState(false);
  const [newOrderData, setNewOrderData] = useState<{ id: string; supplier: string }>({ id: "", supplier: "" });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [addingItemId, setAddingItemId] = useState<string | null>(null);

  const handleApproveClick = (order: Order) => {
    setSelectedOrder(order);
    setIsApproveDialogOpen(true);
  };
  
  const handleApproveConfirm = () => {
    if (selectedOrder) {
      setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status: 'Approved' } : o));
    }
    setIsApproveDialogOpen(false);
    setSelectedOrder(null);
  }

  const handleAddNewItem = (orderId: string, newItem: OrderItem) => {
    setOrders(orders.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          items: [...order.items, newItem]
        };
      }
      return order;
    }));
    setAddingItemId(null);
  };

  const handleCreateOrder = () => {
    if (!newOrderData.id || !newOrderData.supplier) {
      // Basic validation
      // You might want to show a toast or a message to the user
      alert("Please fill in both Order ID and Supplier.");
      return;
    }
    const newOrder: Order = {
      id: newOrderData.id,
      supplier: newOrderData.supplier,
      date: new Date().toISOString().split('T')[0], // a YYYY-MM-DD format
      status: "Pending",
      items: [],
    };
    setOrders([newOrder, ...orders]); // Add to the top of the list
    setIsCreateOrderDialogOpen(false);
    setNewOrderData({ id: "", supplier: "" }); // Reset form
  };


  return (
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
            {orders.map((order) => {
              const subtotal = calculateOrderSubTotal(order.items);
              const supplierId = supplierNameToIdMap[order.supplier];
              return (
                <AccordionItem value={order.id} key={order.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex-1 text-left font-medium">{order.id}</div>
                        <div className="flex flex-[1.5] items-center gap-2 text-left">
                            <span>{order.supplier}</span>
                            {supplierId && (
                                <Link href={`/dashboard/suppliers/${supplierId}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                    <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary"/>
                                </Link>
                            )}
                        </div>
                        <div className="flex-1 text-left">{order.date}</div>
                        <div className="flex-1 text-left">
                            <Badge variant={statusVariant[order.status]}>{order.status}</Badge>
                        </div>
                        <div className="flex-1 text-right font-medium">${subtotal.toFixed(2)}</div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="p-4 bg-muted/50 rounded-md">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-semibold">Order Details</h4>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleApproveClick(order)} disabled={order.status !== 'Pending'}>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Approve & Add to Inventory
                                </Button>
                                 <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">Open menu</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                      <FilePen className="mr-2 h-4 w-4" />
                                      Edit Order
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive">
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete Order
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        <Accordion type="multiple" className="w-full space-y-2">
                          {order.items.map((item) => (
                              <AccordionItem value={item.id} key={item.id} className="bg-background/50 border rounded-md px-4">
                                  <AccordionTrigger>
                                      <div className="flex justify-between w-full font-semibold">
                                          <span>{item.name}</span>
                                          <span>Total: ${calculateItemTotalCost(item).toFixed(2)}</span>
                                      </div>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead>Color</TableHead>
                                                <TableHead>Size</TableHead>
                                                <TableHead className="text-right">Quantity</TableHead>
                                                <TableHead className="text-right">Unit Price</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {item.variants.map((variant) => (
                                               <React.Fragment key={variant.id}>
                                                    {variant.sizes.map((size, sizeIndex) => (
                                                        <TableRow key={`${variant.id}-${size.size}`} className="hover:bg-transparent">
                                                            {sizeIndex === 0 && <TableCell rowSpan={variant.sizes.length} className="align-top font-medium">{variant.color}</TableCell>}
                                                            <TableCell>{size.size}</TableCell>
                                                            <TableCell className="text-right">{size.quantity}</TableCell>
                                                            <TableCell className="text-right">${size.unitPrice.toFixed(2)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                               </React.Fragment>
                                            ))}
                                        </TableBody>
                                    </Table>
                                  </AccordionContent>
                              </AccordionItem>
                          ))}
                           {addingItemId === order.id && (
                            <NewOrderItem
                              onSave={(newItem) => handleAddNewItem(order.id, newItem)}
                              onCancel={() => setAddingItemId(null)}
                            />
                          )}
                        </Accordion>
                        <div className="flex justify-between items-center mt-4 pt-4 border-t">
                            <Button variant="ghost" size="sm" onClick={() => setAddingItemId(order.id)} disabled={addingItemId === order.id}>
                                <Plus className="mr-2 h-4 w-4" /> Add Item
                            </Button>
                            <div className="text-right font-bold">
                                Subtotal: ${subtotal.toFixed(2)}
                            </div>
                        </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* Create Order Dialog */}
      <Dialog open={isCreateOrderDialogOpen} onOpenChange={setIsCreateOrderDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Supplier Order</DialogTitle>
            <DialogDescription>
              Fill in the details below to create a new order. You can add items after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="order-id">Order ID</Label>
              <Input
                id="order-id"
                placeholder="e.g., ORD003"
                value={newOrderData.id}
                onChange={(e) => setNewOrderData({ ...newOrderData, id: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Select
                value={newOrderData.supplier}
                onValueChange={(value) => setNewOrderData({ ...newOrderData, supplier: value })}
              >
                <SelectTrigger id="supplier">
                  <SelectValue placeholder="Select a supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOrderDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateOrder}>Create Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Approve Order & Add to Inventory</DialogTitle>
            <DialogDescription>
              Review the items from order{" "}
              <span className="font-semibold">{selectedOrder?.id}</span> and add
              them to your inventory.
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 py-4">
              <div className="font-medium">
                Items from {selectedOrder.supplier}
              </div>
              <div className="space-y-6 rounded-md border max-h-[60vh] overflow-y-auto p-4">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="p-4 border rounded-lg space-y-4">
                    <h4 className="font-semibold">{item.name}</h4>
                    {item.variants.map((variant) => (
                        <div key={variant.id} className="pl-4 border-l-2">
                             <p className="font-medium text-sm mb-2">{variant.color}</p>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                <div>
                                    <Label>Quantities</Label>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {variant.sizes.map(s => (
                                            <Badge key={s.size} variant="secondary">{s.size}: {s.quantity}</Badge>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`item-photos-${variant.id}`}>Item / Fabric Photos</Label>
                                    <div className="flex items-center justify-center w-full">
                                        <label
                                            htmlFor={`dropzone-file-${variant.id}`}
                                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted"
                                        >
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                <p className="text-xs text-muted-foreground">Photos for {variant.color}</p>
                                            </div>
                                            <Input id={`dropzone-file-${variant.id}`} type="file" className="hidden" multiple />
                                        </label>
                                    </div> 
                                </div>
                            </div>
                        </div>
                    ))}
                    {selectedOrder.items.length > 1 && <DropdownMenuSeparator />}
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApproveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleApproveConfirm}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Approve and Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
