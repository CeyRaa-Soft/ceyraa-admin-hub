"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle,
  Plus,
  Trash2,
  Printer,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCcw,
  Search,
  ShoppingBag,
  Check,
  Truck,
  Undo2,
  XCircle,
  Phone,
  MapPin,
  User,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { customerOrderService } from "@/services/customer-order.service";
import { inventoryService } from "@/services/inventory.service";
import type { CustomerOrder, CustomerOrderItem } from "@/types/customer-order";
import type { DressCategory, Design } from "@/types/inventory";

export default function CustomerOrdersPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-pulse">
        <Loader2 className="h-8 w-8 mb-4 animate-spin text-primary" />
        <p>Loading customer orders view...</p>
      </div>
    }>
      <CustomerOrdersContent />
    </Suspense>
  );
}

function CustomerOrdersContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Orders State
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters State (Header search)
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterDesign, setFilterDesign] = useState<string>("all");
  const [filterColor, setFilterColor] = useState<string>("all");
  const [filterSize, setFilterSize] = useState<string>("all");

  // Metadata/Options for Filters
  const [categories, setCategories] = useState<DressCategory[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [uniqueColors, setUniqueColors] = useState<string[]>([]);
  const [uniqueSizes, setUniqueSizes] = useState<string[]>([]);

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  // Form Fields
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [phone1, setPhone1] = useState("");
  const [phone2, setPhone2] = useState("");
  const [selectedCatId, setSelectedCatId] = useState("");
  const [selectedDesignId, setSelectedDesignId] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [orderItems, setOrderItems] = useState<CustomerOrderItem[]>([]);

  // Active form selections computed synchronously during render
  const formDesigns = selectedCatId
    ? designs.filter((d) => d.categoryId === selectedCatId)
    : [];

  const currentFormDesign = selectedDesignId
    ? designs.find((d) => d.id === selectedDesignId)
    : null;

  const formColors = currentFormDesign
    ? (currentFormDesign.variants || []).map((v) => v.color)
    : [];

  const currentFormVariant = currentFormDesign && selectedColor
    ? (currentFormDesign.variants || []).find((v) => v.color.toLowerCase() === selectedColor.toLowerCase())
    : null;

  const formSizes = currentFormVariant
    ? currentFormVariant.sizes || []
    : [];

  const currentFormSizeObj = currentFormVariant && selectedSize
    ? formSizes.find((s) => s.size === selectedSize)
    : null;

  const availableStock = currentFormSizeObj ? currentFormSizeObj.quantity : null;
  const unitPrice = currentFormSizeObj ? currentFormSizeObj.unitPrice : 0;

  // Printing state
  const [printingOrder, setPrintingOrder] = useState<CustomerOrder | null>(null);

  // Load baseline metadata
  const loadMetadata = async () => {
    try {
      const [catsData, designsData] = await Promise.all([
        inventoryService.getAllCategories(),
        inventoryService.getDesigns(),
      ]);
      setCategories(catsData);
      setDesigns(designsData);

      // Extract unique colors and sizes from designs
      const colorsSet = new Set<string>();
      const sizesSet = new Set<string>();

      designsData.forEach((d) => {
        (d.variants || []).forEach((v) => {
          if (v.color) colorsSet.add(v.color);
          (v.sizes || []).forEach((s) => {
            if (s.size) sizesSet.add(s.size);
          });
        });
      });

      setUniqueColors(Array.from(colorsSet).sort());
      setUniqueSizes(Array.from(sizesSet).sort());
    } catch (err: any) {
      console.error("Failed to load metadata:", err);
      toast({
        variant: "destructive",
        title: "Metadata Error",
        description: "Failed to load inventory data for dropdowns.",
      });
    }
  };

  // Load orders from API
  const loadOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await customerOrderService.getAll({
        page,
        limit: 20,
        categoryId: filterCategory !== "all" ? filterCategory : undefined,
        designId: filterDesign !== "all" ? filterDesign : undefined,
        color: filterColor !== "all" ? filterColor : undefined,
        size: filterSize !== "all" ? filterSize : undefined,
      });

      setOrders(res.orders);
      setTotalPages(res.pagination.pages);
      setTotalCount(res.pagination.total);
    } catch (err: any) {
      console.error("Failed to load customer orders:", err);
      toast({
        variant: "destructive",
        title: "Load Error",
        description: err.message || "Failed to load customer orders.",
      });
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadMetadata();
  }, []);

  useEffect(() => {
    loadOrders();
  }, [page, filterCategory, filterDesign, filterColor, filterSize]);

  // Reset design if category changes and the current design does not belong to it
  useEffect(() => {
    if (filterCategory !== "all") {
      const validDesigns = designs.filter((d) => d.categoryId === filterCategory);
      if (filterDesign !== "all" && !validDesigns.some((d) => d.id === filterDesign)) {
        setFilterDesign("all");
      }
    }
  }, [filterCategory, filterDesign, designs]);

  // Reset color if design or category changes and the current color is no longer available
  useEffect(() => {
    let validColors: string[] = [];
    if (filterDesign !== "all") {
      const d = designs.find((item) => item.id === filterDesign);
      validColors = (d?.variants || []).map((v) => v.color);
    } else if (filterCategory !== "all") {
      const catDesigns = designs.filter((d) => d.categoryId === filterCategory);
      validColors = Array.from(new Set(catDesigns.flatMap((d) => (d.variants || []).map((v) => v.color))));
    } else {
      validColors = uniqueColors;
    }

    if (filterColor !== "all" && !validColors.includes(filterColor)) {
      setFilterColor("all");
    }
  }, [filterDesign, filterCategory, filterColor, designs, uniqueColors]);

  // Reset size if design, color, or category changes and the current size is no longer available
  useEffect(() => {
    let validSizes: string[] = [];
    if (filterDesign !== "all") {
      const d = designs.find((item) => item.id === filterDesign);
      if (filterColor !== "all") {
        const v = (d?.variants || []).find((varItem) => varItem.color === filterColor);
        validSizes = (v?.sizes || []).map((s) => s.size);
      } else {
        validSizes = Array.from(new Set((d?.variants || []).flatMap((v) => (v.sizes || []).map((s) => s.size))));
      }
    } else if (filterCategory !== "all") {
      const catDesigns = designs.filter((d) => d.categoryId === filterCategory);
      if (filterColor !== "all") {
        const matchingVariants = catDesigns.flatMap((d) => (d.variants || []).filter((v) => v.color === filterColor));
        validSizes = Array.from(new Set(matchingVariants.flatMap((v) => (v.sizes || []).map((s) => s.size))));
      } else {
        validSizes = Array.from(new Set(catDesigns.flatMap((d) => (d.variants || []).flatMap((v) => (v.sizes || []).map((s) => s.size)))));
      }
    } else {
      if (filterColor !== "all") {
        const matchingVariants = designs.flatMap((d) => (d.variants || []).filter((v) => v.color === filterColor));
        validSizes = Array.from(new Set(matchingVariants.flatMap((v) => (v.sizes || []).map((s) => s.size))));
      } else {
        validSizes = uniqueSizes;
      }
    }

    if (filterSize !== "all" && !validSizes.includes(filterSize)) {
      setFilterSize("all");
    }
  }, [filterDesign, filterColor, filterCategory, filterSize, designs, uniqueSizes]);

  // Handle URL Query Params for autofilling
  useEffect(() => {
    const addOrder = searchParams.get("addOrder");
    if (addOrder === "true" && categories.length > 0 && designs.length > 0) {
      const catId = searchParams.get("categoryId") || "";
      const designId = searchParams.get("designId") || "";
      const color = searchParams.get("color") || "";
      const size = searchParams.get("size") || "";

      // Prefill fields
      if (catId) {
        setSelectedCatId(catId);

        if (designId) {
          setSelectedDesignId(designId);

          if (color) {
            const currentDesign = designs.find((d) => d.id === designId);
            if (currentDesign) {
              const matchedColor = (currentDesign.variants || []).find(
                (v) => v.color.toLowerCase() === color.toLowerCase()
              );
              if (matchedColor) {
                setSelectedColor(matchedColor.color);

                if (size) {
                  const matchedSizeObj = (matchedColor.sizes || []).find(
                    (s) => s.size.toLowerCase() === size.toLowerCase()
                  );
                  if (matchedSizeObj) {
                    setSelectedSize(matchedSizeObj.size);
                  }
                }
              }
            }
          }
        }
      }

      // Open Modal
      setIsModalOpen(true);

      // Clean URL params so they don't re-trigger on subsequent reloads
      router.replace("/customer-orders");
    }
  }, [searchParams, categories, designs, router]);

  // Reset form helper
  const resetForm = () => {
    setCustomerName("");
    setAddress("");
    setPhone1("");
    setPhone2("");
    setSelectedCatId("");
    setSelectedDesignId("");
    setSelectedColor("");
    setSelectedSize("");
    setQuantity(1);
    setOrderItems([]);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Add Item to current order list
  const handleAddItemToList = () => {
    if (!selectedCatId || !selectedDesignId || !selectedColor || !selectedSize) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please specify all dress details (Category, Design, Color, Size).",
      });
      return;
    }

    if (availableStock === null || quantity > availableStock) {
      toast({
        variant: "destructive",
        title: "Stock Validation Error",
        description: `Order quantity (${quantity}) exceeds available stock (${availableStock || 0}).`,
      });
      return;
    }

    const categoryObj = categories.find((c) => c.id === selectedCatId);
    const designObj = designs.find((d) => d.id === selectedDesignId);

    if (!categoryObj || !designObj) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to resolve category or design references.",
      });
      return;
    }

    // Check if item already exists in current order items list
    const existingIdx = orderItems.findIndex(
      (item) =>
        item.designId === selectedDesignId &&
        item.color.toLowerCase() === selectedColor.toLowerCase() &&
        item.size.toLowerCase() === selectedSize.toLowerCase()
    );

    if (existingIdx > -1) {
      const newQty = orderItems[existingIdx].quantity + quantity;
      if (newQty > availableStock) {
        toast({
          variant: "destructive",
          title: "Stock Validation Error",
          description: `Total quantity for this item in list (${newQty}) would exceed available stock (${availableStock}).`,
        });
        return;
      }
      const updated = [...orderItems];
      updated[existingIdx] = {
        ...updated[existingIdx],
        quantity: newQty,
      };
      setOrderItems(updated);
    } else {
      const newItem: CustomerOrderItem = {
        categoryId: selectedCatId,
        categoryName: categoryObj.name,
        designId: selectedDesignId,
        designCode: designObj.code,
        designName: designObj.name,
        color: selectedColor,
        size: selectedSize,
        quantity,
        price: unitPrice,
      };
      setOrderItems([...orderItems, newItem]);
    }

    toast({
      title: "Item Added",
      description: `Added ${quantity}x ${designObj.name} (${selectedColor} - ${selectedSize}) to the order list.`,
    });

    // Reset selection fields so they can add another
    setSelectedCatId("");
    setSelectedDesignId("");
    setSelectedColor("");
    setSelectedSize("");
    setQuantity(1);
  };

  const handleRemoveItemFromList = (index: number) => {
    setOrderItems(orderItems.filter((_, idx) => idx !== index));
  };

  // Submit Order Creation
  const handleCreateOrderSubmit = async () => {
    if (!customerName || !address || !phone1) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Customer Name, Address, and Primary Phone are required.",
      });
      return;
    }

    if (orderItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please add at least one garment item to the order list.",
      });
      return;
    }

    try {
      setSavingOrder(true);
      await customerOrderService.create({
        customerName: customerName.trim(),
        address: address.trim(),
        phone1: phone1.trim(),
        phone2: phone2.trim() || undefined,
        items: orderItems,
      });

      toast({
        title: "Order Placed",
        description: `Order for ${customerName} placed successfully. Inventory has been updated.`,
      });

      setIsModalOpen(false);
      resetForm();
      // Reload metadata (to reflect reduced inventory in dropdowns)
      await loadMetadata();
      // Reload paginated orders table
      setPage(1);
      await loadOrders();
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Failed to place order",
        description: err.message || "Failed to save order.",
      });
    } finally {
      setSavingOrder(false);
    }
  };

  // Status adjustment
  const handleStatusChange = async (orderId: string, newStatus: CustomerOrder["status"]) => {
    try {
      await customerOrderService.updateStatus(orderId, newStatus);
      toast({
        title: "Status Updated",
        description: `Order status updated to ${newStatus}.`,
      });
      // Refresh inventory stock metadata and order list
      await Promise.all([loadMetadata(), loadOrders()]);
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Status Update Failed",
        description: err.message || "Could not update status.",
      });
    }
  };

  // Reset all search filters
  const resetFilters = () => {
    setFilterCategory("all");
    setFilterDesign("all");
    setFilterColor("all");
    setFilterSize("all");
    setPage(1);
  };

  // CSS and triggering for Courier printing
  const handlePrint = (order: CustomerOrder) => {
    setPrintingOrder(order);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Helper for status styling badges
  const getStatusBadge = (status: CustomerOrder["status"]) => {
    switch (status) {
      case "Pending":
        return <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/15 border-amber-500/20 font-bold px-2 py-0.5">Pending</Badge>;
      case "Sent":
        return <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/15 border-indigo-500/20 font-bold px-2 py-0.5">Sent</Badge>;
      case "Returned":
        return <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/15 border-emerald-500/20 font-bold px-2 py-0.5">Returned</Badge>;
      case "Failed":
        return <Badge variant="secondary" className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/15 border-rose-500/20 font-bold px-2 py-0.5">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Dynamic filter dropdown options based on selections
  const filteredDesignsForFilter = filterCategory === "all"
    ? designs
    : designs.filter((d) => d.categoryId === filterCategory);

  let filteredColorsForFilter: string[] = [];
  if (filterDesign !== "all") {
    const d = designs.find((item) => item.id === filterDesign);
    filteredColorsForFilter = (d?.variants || []).map((v) => v.color);
  } else if (filterCategory !== "all") {
    const catDesigns = designs.filter((d) => d.categoryId === filterCategory);
    filteredColorsForFilter = Array.from(new Set(catDesigns.flatMap((d) => (d.variants || []).map((v) => v.color))));
  } else {
    filteredColorsForFilter = uniqueColors;
  }
  filteredColorsForFilter.sort();

  let filteredSizesForFilter: string[] = [];
  if (filterDesign !== "all") {
    const d = designs.find((item) => item.id === filterDesign);
    if (filterColor !== "all") {
      const v = (d?.variants || []).find((varItem) => varItem.color === filterColor);
      filteredSizesForFilter = (v?.sizes || []).map((s) => s.size);
    } else {
      filteredSizesForFilter = Array.from(new Set((d?.variants || []).flatMap((v) => (v.sizes || []).map((s) => s.size))));
    }
  } else if (filterCategory !== "all") {
    const catDesigns = designs.filter((d) => d.categoryId === filterCategory);
    if (filterColor !== "all") {
      const matchingVariants = catDesigns.flatMap((d) => (d.variants || []).filter((v) => v.color === filterColor));
      filteredSizesForFilter = Array.from(new Set(matchingVariants.flatMap((v) => (v.sizes || []).map((s) => s.size))));
    } else {
      filteredSizesForFilter = Array.from(new Set(catDesigns.flatMap((d) => (d.variants || []).flatMap((v) => (v.sizes || []).map((s) => s.size)))));
    }
  } else {
    if (filterColor !== "all") {
      const matchingVariants = designs.flatMap((d) => (d.variants || []).filter((v) => v.color === filterColor));
      filteredSizesForFilter = Array.from(new Set(matchingVariants.flatMap((v) => (v.sizes || []).map((s) => s.size))));
    } else {
      filteredSizesForFilter = uniqueSizes;
    }
  }
  filteredSizesForFilter.sort();

  return (
    <div className="space-y-8">
      {/* Printable Area - Hidden on Screen via CSS */}
      {printingOrder && (
        <div id="printable-area" className="hidden print:block p-6 bg-white text-black font-sans w-[100mm] min-h-[100mm] border border-black rounded-md relative">
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #printable-area, #printable-area * {
                visibility: visible;
              }
              #printable-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                border: none;
              }
            }
          `}</style>
          
          <div className="border-b-2 border-black pb-2 mb-4 text-center">
            <h1 className="text-xl font-black uppercase tracking-wider">CEYRAA COURIER LABEL</h1>
            <p className="text-[10px] text-gray-600 font-mono">Order ID: {printingOrder.id}</p>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-[9px] uppercase tracking-wide font-bold text-gray-500">Deliver To:</p>
              <h2 className="text-lg font-black leading-tight mt-0.5">{printingOrder.customerName}</h2>
            </div>

            <div>
              <p className="text-[9px] uppercase tracking-wide font-bold text-gray-500">Shipping Address:</p>
              <p className="text-sm font-semibold leading-relaxed mt-0.5 break-words whitespace-pre-wrap">{printingOrder.address}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-b border-dashed border-black py-2">
              <div>
                <p className="text-[9px] uppercase tracking-wide font-bold text-gray-500">Phone 1:</p>
                <p className="text-base font-black tracking-wide mt-0.5">{printingOrder.phone1}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wide font-bold text-gray-500">Phone 2:</p>
                <p className="text-base font-black tracking-wide mt-0.5">{printingOrder.phone2 || "-"}</p>
              </div>
            </div>

            <div className="pt-1">
              <p className="text-[9px] uppercase tracking-wide font-bold text-gray-500">Item Details:</p>
              <div className="space-y-1.5 mt-1">
                {(printingOrder.items || []).map((item, idx) => (
                  <div key={idx} className="text-[9px] font-mono leading-tight border-b border-dashed border-gray-300 pb-1 last:border-0 last:pb-0">
                    <span className="font-bold">{item.designName} ({item.designCode})</span>
                    <div>
                      Color: {item.color} | Size: {item.size} | Qty: <span className="font-bold">{item.quantity}</span> | ${item.price.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute bottom-4 right-4 text-right">
              <p className="text-[9px] uppercase tracking-wide font-bold text-gray-500">Total COD Amount:</p>
              <p className="text-2xl font-black font-mono tracking-tighter text-black mt-0.5">
                ${printingOrder.totalAmount.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Screen Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Customer Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage customer sales, track deliveries, and print labels.
          </p>
        </div>
        <Button onClick={handleOpenCreateModal} className="shadow-md hover:shadow-lg transition-shadow">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Customer Order
        </Button>
      </div>

      {/* Filters Toolbar */}
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="py-4 px-6 bg-muted/5 border-b border-border/30">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-bold">Search & Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 items-end">
            {/* Category Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs">Dress Type (Category)</Label>
              <Select value={filterCategory} onValueChange={(val) => { setFilterCategory(val); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Design Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs">Design (Item)</Label>
              <Select value={filterDesign} onValueChange={(val) => { setFilterDesign(val); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Designs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Designs</SelectItem>
                  {filteredDesignsForFilter.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name} ({d.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Color Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs">Color Variant</Label>
              <Select value={filterColor} onValueChange={(val) => { setFilterColor(val); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Colors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Colors</SelectItem>
                  {filteredColorsForFilter.map((color) => (
                    <SelectItem key={color} value={color}>{color}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Size Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs">Size</Label>
              <Select value={filterSize} onValueChange={(val) => { setFilterSize(val); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sizes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sizes</SelectItem>
                  {filteredSizesForFilter.map((size) => (
                    <SelectItem key={size} value={size}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-dashed">
            {(filterCategory !== "all" || filterDesign !== "all" || filterColor !== "all" || filterSize !== "all") && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" /> Reset Filters
              </Button>
            )}
            <Button size="sm" onClick={loadOrders} className="gap-1.5">
              <Search className="h-3.5 w-3.5" /> Refresh List
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table Card */}
      <Card className="border-border/70 shadow-md overflow-hidden">
        <CardContent className="p-0">
          {loadingOrders ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p>Fetching paginated orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20 bg-muted/5 flex flex-col items-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mb-4 stroke-[1.2]" />
              <h3 className="text-lg font-bold mb-1">No customer orders found</h3>
              <p className="text-muted-foreground text-sm max-w-sm mb-6">
                There are no orders matching your search filters. Place a new order to get started.
              </p>
              <Button onClick={handleOpenCreateModal}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Customer Order
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/15 border-b">
                  <TableRow>
                    <TableHead className="w-[100px] py-3 pl-6 font-semibold text-foreground">Order ID</TableHead>
                    <TableHead className="py-3 font-semibold text-foreground">Customer Contact</TableHead>
                    <TableHead className="py-3 font-semibold text-foreground">Garment Details</TableHead>
                    <TableHead className="py-3 text-right font-semibold text-foreground">Total Price</TableHead>
                    <TableHead className="py-3 text-center font-semibold text-foreground w-[120px]">Status</TableHead>
                    <TableHead className="py-3 text-right pr-6 font-semibold text-foreground w-[240px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/5 border-b border-border/40 last:border-0">
                      {/* Order ID */}
                      <TableCell className="align-top py-4 pl-6 font-bold font-mono text-sm text-foreground">
                        {order.id}
                      </TableCell>

                      {/* Customer contact details */}
                      <TableCell className="align-top py-4 max-w-[280px]">
                        <div className="space-y-1.5">
                          <p className="font-bold text-foreground text-sm flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            {order.customerName}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-start gap-1.5 leading-relaxed break-words whitespace-pre-wrap">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                            {order.address}
                          </p>
                          <div className="text-xs font-mono font-bold text-foreground flex flex-col gap-1 pl-5">
                            <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-muted-foreground" /> {order.phone1}</span>
                            {order.phone2 && <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-muted-foreground" /> {order.phone2}</span>}
                          </div>
                        </div>
                      </TableCell>

                      {/* Garment details in ONE unified column */}
                      <TableCell className="align-top py-4">
                        <div className="space-y-2 max-w-[320px]">
                          {(order.items || []).map((item, idx) => (
                            <div key={idx} className="space-y-1.5 bg-muted/15 border rounded-lg p-2.5">
                              <div className="flex items-center justify-between text-[10px] border-b pb-1 mb-1 font-semibold text-muted-foreground">
                                <span>{item.categoryName}</span>
                                <span className="font-mono text-[9px] bg-background border px-1.5 py-0.5 rounded font-bold">{item.designCode}</span>
                              </div>
                              <p className="text-xs font-bold text-foreground line-clamp-1">{item.designName}</p>
                              <div className="flex flex-wrap gap-1.5 pt-0.5 text-[10px]">
                                <span className="bg-background border rounded px-1 py-0.5">Color: <span className="font-bold text-foreground">{item.color}</span></span>
                                <span className="bg-background border rounded px-1 py-0.5">Size: <span className="font-bold text-foreground">{item.size}</span></span>
                                <span className="bg-background border rounded px-1 py-0.5">Qty: <span className="font-bold text-foreground font-mono">{item.quantity}</span></span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TableCell>

                      {/* Price */}
                      <TableCell className="align-top py-4 text-right font-mono font-bold text-sm text-foreground">
                        <div>
                          <p className="text-base">${order.totalAmount.toFixed(2)}</p>
                          <p className="text-[10px] text-muted-foreground font-normal mt-0.5">
                            {order.items?.length || 0} {(order.items?.length || 0) === 1 ? "item" : "items"}
                          </p>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="align-top py-4 text-center">
                        {getStatusBadge(order.status)}
                      </TableCell>

                      {/* Quick action buttons */}
                      <TableCell className="align-top py-4 text-right pr-6">
                        <div className="flex flex-col gap-1.5 items-end">
                          {/* Status Toggles */}
                          <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                            {order.status !== "Sent" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[10px] font-bold border-indigo-500/30 text-indigo-500 hover:bg-indigo-500/10 hover:text-indigo-500"
                                onClick={() => handleStatusChange(order.id, "Sent")}
                              >
                                <Truck className="h-3 w-3 mr-0.5" /> Sent
                              </Button>
                            )}
                            {order.status !== "Returned" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[10px] font-bold border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-500"
                                onClick={() => handleStatusChange(order.id, "Returned")}
                              >
                                <Undo2 className="h-3 w-3 mr-0.5" /> Returned
                              </Button>
                            )}
                            {order.status !== "Failed" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[10px] font-bold border-rose-500/30 text-rose-500 hover:bg-rose-500/10 hover:text-rose-500"
                                onClick={() => handleStatusChange(order.id, "Failed")}
                              >
                                <XCircle className="h-3 w-3 mr-0.5" /> Failed
                              </Button>
                            )}
                            {order.status !== "Pending" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[10px] font-bold border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hover:text-amber-500"
                                onClick={() => handleStatusChange(order.id, "Pending")}
                              >
                                Pending
                              </Button>
                            )}
                          </div>

                          {/* Print details button */}
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 text-[11px] gap-1 shadow-xs bg-muted/60"
                            onClick={() => handlePrint(order)}
                          >
                            <Printer className="h-3.5 w-3.5" /> Print Tag
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border/40 pt-4 px-2">
          <p className="text-xs text-muted-foreground">
            Showing Page <span className="font-bold text-foreground">{page}</span> of <span className="font-bold text-foreground">{totalPages}</span> ({totalCount} total orders)
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pNum) => (
              <Button
                key={pNum}
                variant={pNum === page ? "default" : "outline"}
                className={`h-8 w-8 rounded-full text-xs ${pNum === page ? "font-bold shadow-sm" : ""}`}
                onClick={() => setPage(pNum)}
              >
                {pNum}
              </Button>
            ))}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-4xl" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>New Customer Sales Order</DialogTitle>
            <DialogDescription>
              Add multiple designs from inventory and enter customer mailing information to place a bulk or single sales order.
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable Modal Content Body */}
          <div className="max-h-[70vh] overflow-y-auto pr-3 -mr-3 space-y-6 py-2">
            <div className="grid gap-8 md:grid-cols-2">
              {/* Column 1: Dress Details / Selection Form */}
              <div className="space-y-4 pr-0 md:pr-4 md:border-r">
                <div className="flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                  <span>Garment Selection Form</span>
                </div>

                {/* Category selector */}
                <div className="space-y-1.5">
                  <Label htmlFor="form-category">Dress Type (Category) <span className="text-destructive">*</span></Label>
                  <Select
                    value={selectedCatId}
                    onValueChange={(val) => {
                      setSelectedCatId(val);
                      setSelectedDesignId("");
                      setSelectedColor("");
                      setSelectedSize("");
                    }}
                  >
                    <SelectTrigger id="form-category">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Design selector */}
                <div className="space-y-1.5">
                  <Label htmlFor="form-design">Design Item <span className="text-destructive">*</span></Label>
                  <Select
                    value={selectedDesignId}
                    onValueChange={(val) => {
                      setSelectedDesignId(val);
                      setSelectedColor("");
                      setSelectedSize("");
                    }}
                    disabled={!selectedCatId}
                  >
                    <SelectTrigger id="form-design">
                      <SelectValue placeholder="Select Design" />
                    </SelectTrigger>
                    <SelectContent>
                      {formDesigns.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name} ({d.code})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Color selector */}
                <div className="space-y-1.5">
                  <Label htmlFor="form-color">Color Variant <span className="text-destructive">*</span></Label>
                  <Select
                    value={selectedColor}
                    onValueChange={(val) => {
                      setSelectedColor(val);
                      setSelectedSize("");
                    }}
                    disabled={!selectedDesignId}
                  >
                    <SelectTrigger id="form-color">
                      <SelectValue placeholder="Select Color" />
                    </SelectTrigger>
                    <SelectContent>
                      {formColors.map((color) => (
                        <SelectItem key={color} value={color}>{color}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Size selector */}
                <div className="space-y-1.5">
                  <Label htmlFor="form-size">Size <span className="text-destructive">*</span></Label>
                  <Select
                    value={selectedSize}
                    onValueChange={setSelectedSize}
                    disabled={!selectedColor}
                  >
                    <SelectTrigger id="form-size">
                      <SelectValue placeholder="Select Size" />
                    </SelectTrigger>
                    <SelectContent>
                      {formSizes.map((sz) => (
                        <SelectItem key={sz.size} value={sz.size}>
                          Size: {sz.size} (Qty: {sz.quantity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Inventory feedback */}
                {selectedSize && (
                  <div className="p-3 bg-muted/30 border border-dashed rounded-lg space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Available Stock:</span>
                      <span className={`font-bold font-mono ${availableStock && availableStock > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                        {availableStock} pcs
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Unit Price:</span>
                      <span className="font-bold font-mono text-foreground">${unitPrice.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div className="space-y-1.5">
                  <Label htmlFor="form-quantity">Order Quantity <span className="text-destructive">*</span></Label>
                  <Input
                    id="form-quantity"
                    type="number"
                    min={1}
                    max={availableStock || undefined}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    disabled={!selectedSize}
                  />
                </div>

                {/* Price Calculation Display */}
                {selectedSize && (
                  <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between text-sm">
                    <span className="font-bold text-foreground">Subtotal:</span>
                    <span className="text-lg font-black font-mono text-primary">
                      ${(quantity * unitPrice).toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Add Item Button */}
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full gap-1.5 font-bold shadow-sm bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15"
                  onClick={handleAddItemToList}
                  disabled={!selectedSize || (availableStock !== null && quantity > availableStock)}
                >
                  <Plus className="h-4 w-4" /> Add Item to Order
                </Button>
              </div>

              {/* Column 2: Customer Mailing Details & Items List */}
              <div className="space-y-6">
                {/* Mailing Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-wider">
                    <User className="h-3.5 w-3.5" />
                    <span>Customer Mailing Information</span>
                  </div>

                  {/* Customer Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="form-name">Customer Name <span className="text-destructive">*</span></Label>
                    <Input
                      id="form-name"
                      placeholder="e.g. Amanda Perera"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>

                  {/* Address */}
                  <div className="space-y-1.5">
                    <Label htmlFor="form-address">Courier Delivery Address <span className="text-destructive">*</span></Label>
                    <Textarea
                      id="form-address"
                      placeholder="Street address, City, District"
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="resize-none"
                    />
                  </div>

                  {/* Phone numbers */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="form-phone1">Primary Phone <span className="text-destructive">*</span></Label>
                      <Input
                        id="form-phone1"
                        placeholder="e.g. 0771234567"
                        value={phone1}
                        onChange={(e) => setPhone1(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="form-phone2">Secondary Phone</Label>
                      <Input
                        id="form-phone2"
                        placeholder="e.g. 0719876543"
                        value={phone2}
                        onChange={(e) => setPhone2(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Items in current order summary */}
                <div className="space-y-3 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-wider">
                      <ShoppingBag className="h-3.5 w-3.5" />
                      <span>Items in this Order ({orderItems.length})</span>
                    </div>
                  </div>

                  {orderItems.length === 0 ? (
                    <div className="p-6 border border-dashed rounded-xl text-center text-xs text-muted-foreground bg-muted/10 leading-relaxed">
                      No garments added yet. Use the garment selection form on the left and click "Add Item to Order".
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {orderItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 bg-muted/30 border rounded-lg text-xs hover:bg-muted/40 transition-colors">
                          <div className="space-y-0.5">
                            <p className="font-bold text-foreground">
                              {item.designName}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              Code: <span className="font-bold">{item.designCode}</span> | Color: {item.color} | Size: {item.size}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-foreground bg-background border px-1.5 py-0.5 rounded text-[10px]">
                              Qty: {item.quantity}
                            </span>
                            <span className="font-mono font-bold text-foreground text-right w-14">
                              ${(item.quantity * item.price).toFixed(2)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                              onClick={() => handleRemoveItemFromList(idx)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {orderItems.length > 0 && (
                    <div className="p-3.5 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between">
                      <span className="font-bold text-foreground text-sm">Total Order COD:</span>
                      <span className="text-xl font-black font-mono text-primary">
                        ${orderItems.reduce((acc, item) => acc + item.quantity * item.price, 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-2 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={savingOrder}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateOrderSubmit}
              disabled={savingOrder || orderItems.length === 0}
              className="font-bold"
            >
              {savingOrder ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Create Sales Order"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
