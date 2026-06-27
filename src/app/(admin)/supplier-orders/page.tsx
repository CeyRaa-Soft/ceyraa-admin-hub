"use client";

import React, { useEffect, useState } from "react";
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
import { PlusCircle, Building } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Accordion } from "@/components/ui/accordion";
import { OrderTotalsProvider } from "@/contexts/OrderContext";
import { OrderAccordionItem } from "@/components/OrderAccordionItem";
import type { Order, OrderItem } from "@/types/order";
import { orderService } from "@/services/order.service";
import { supplierService } from "@/services/supplier.service";
import { ErrorBanner } from "@/components/ui/error-banner";
import { useToast } from "@/hooks/use-toast";

export default function SupplierOrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [supplierNameToIdMap, setSupplierNameToIdMap] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);

  // Create states
  const [isCreateOrderDialogOpen, setIsCreateOrderDialogOpen] = useState(false);
  const [newOrderData, setNewOrderData] = useState({ supplier: "" });

  // Edit states
  const [isEditOrderDialogOpen, setIsEditOrderDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editOrderData, setEditOrderData] = useState({
    supplier: "",
    status: "Pending" as Order["status"],
  });

  // Errors
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersData, suppliersData] = await Promise.all([
        orderService.getAll(),
        supplierService.getAll(),
      ]);
      setOrders(ordersData);
      setSuppliers(suppliersData.map((s) => s.name));
      setSupplierNameToIdMap(
        suppliersData.reduce((acc, s) => {
          acc[s.name] = s.id;
          return acc;
        }, {} as Record<string, string>)
      );
    } catch (err: any) {
      console.error("Failed to load supplier orders data:", err);
      toast({
        variant: "destructive",
        title: "Load Error",
        description: err.message || "Failed to load orders or suppliers.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetCreateForm = () => {
    setNewOrderData({ supplier: "" });
    setErrorMsg(null);
    setErrorDetails(null);
  };

  const handleOpenCreateDialogOpen = (open: boolean) => {
    setIsCreateOrderDialogOpen(open);
    if (!open) resetCreateForm();
  };

  const handleCreateOrder = async () => {
    setErrorMsg(null);
    setErrorDetails(null);

    if (!newOrderData.supplier) {
      setErrorMsg("Please select a supplier");
      return;
    }

    try {
      const payload: Omit<Order, "id"> & { id?: string } = {
        supplier: newOrderData.supplier,
        date: new Date().toISOString().split("T")[0],
        status: "Pending",
        items: [],
        categories: [
          { id: "production", name: "Sewing & Tailoring (Garments)", items: [] },
          { id: "supplies", name: "Fabrics & Accessories (Materials)", items: [] },
        ],
      };

      const created = await orderService.create(payload as any);
      await loadData();
      setIsCreateOrderDialogOpen(false);
      resetCreateForm();
      toast({
        title: "Order created",
        description: `Order ${created.id} created successfully.`,
      });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to create order");
      if (err.details) setErrorDetails(err.details);
    }
  };

  const handleApproveOrder = async (order: Order) => {
    try {
      await orderService.update(order.id, { status: "Approved" });
      await loadData();
      toast({
        title: "Order Approved",
        description: `Order ${order.id} status updated to Approved.`,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Approval Failed",
        description: err.message || "Failed to approve order.",
      });
    }
  };

  const handleEditOrderClick = (order: Order) => {
    setEditingOrder(order);
    setEditOrderData({
      supplier: order.supplier,
      status: order.status,
    });
    setIsEditOrderDialogOpen(true);
  };

  const handleUpdateOrder = async () => {
    if (!editingOrder) return;
    try {
      await orderService.update(editingOrder.id, {
        supplier: editOrderData.supplier,
        status: editOrderData.status,
      });
      await loadData();
      setIsEditOrderDialogOpen(false);
      toast({
        title: "Order updated",
        description: `Order ${editingOrder.id} saved successfully.`,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: err.message || "Failed to update order details.",
      });
    }
  };

  const handleDeleteOrder = async (order: Order) => {
    try {
      await orderService.delete(order.id);
      await loadData();
      toast({
        title: "Order deleted",
        description: `Order ${order.id} deleted successfully.`,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: err.message || "Failed to delete order.",
      });
    }
  };

  const handleSaveChanges = async (
    orderId: string,
    updatedCategories: any[]
  ) => {
    try {
      await orderService.update(orderId, { categories: updatedCategories });
      await loadData();
      toast({
        title: "Order saved",
        description: `Order items for ${orderId} saved successfully.`,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: err.message || "Failed to save order items.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-pulse">
        <Building className="h-8 w-8 mb-4 animate-bounce text-primary" />
        <p>Loading supplier orders...</p>
      </div>
    );
  }

  return (
    <OrderTotalsProvider>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold font-headline">Supplier Orders</h1>
          <Button onClick={() => handleOpenCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create Order
          </Button>
        </div>

        {orders.length === 0 ? (
          <Card className="p-12 text-center flex flex-col items-center justify-center border-dashed">
            <Building className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No orders found</h3>
            <p className="text-muted-foreground mb-6">
              Create your first supplier order to get started.
            </p>
            <Button onClick={() => handleOpenCreateDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Order
            </Button>
          </Card>
        ) : (
          <Card className="border-border/70 shadow-md">
            <CardHeader className="bg-muted/5 border-b border-border/30 pb-4">
              <CardTitle>Your Orders</CardTitle>
              <CardDescription>
                An overview of all your recent supplier orders.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                {orders.map((order) => (
                  <OrderAccordionItem
                    key={order.id}
                    order={order}
                    categories={order.categories || []}
                    supplierNameToIdMap={supplierNameToIdMap}
                    onApprove={handleApproveOrder}
                    onEdit={handleEditOrderClick}
                    onDelete={handleDeleteOrder}
                    onSaveChanges={handleSaveChanges}
                  />
                ))}
              </Accordion>
            </CardContent>
          </Card>
        )}

        {/* Create Order Dialog */}
        <Dialog
          open={isCreateOrderDialogOpen}
          onOpenChange={handleOpenCreateDialogOpen}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Supplier Order</DialogTitle>
              <DialogDescription>
                Select a supplier to create a new order. The Order ID is automatically generated.
              </DialogDescription>
            </DialogHeader>

            {/* Error Banner */}
            <ErrorBanner
              title="Unable to create order"
              message={errorMsg || undefined}
              details={errorDetails}
              onClose={() => {
                setErrorMsg(null);
                setErrorDetails(null);
              }}
              className="mb-2"
            />

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="order-id">Order ID</Label>
                <Input
                  id="order-id"
                  value="Auto-generated (e.g., ORD003)"
                  disabled
                  className="bg-muted text-muted-foreground border-dashed"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier <span className="text-destructive">*</span></Label>
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
                onClick={() => handleOpenCreateDialogOpen(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button onClick={handleCreateOrder} type="button">Create Order</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Order Dialog */}
        <Dialog
          open={isEditOrderDialogOpen}
          onOpenChange={setIsEditOrderDialogOpen}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Order Details</DialogTitle>
              <DialogDescription>
                Modify details for order {editingOrder?.id}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-supplier">Supplier</Label>
                <Select
                  value={editOrderData.supplier}
                  onValueChange={(val) =>
                    setEditOrderData({ ...editOrderData, supplier: val })
                  }
                >
                  <SelectTrigger id="edit-supplier">
                    <SelectValue />
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

              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editOrderData.status}
                  onValueChange={(val: Order["status"]) =>
                    setEditOrderData({ ...editOrderData, status: val })
                  }
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditOrderDialogOpen(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateOrder} type="button">Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </OrderTotalsProvider>
  );
}
