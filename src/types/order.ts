export type SizeInfo = {
    size: string;
    quantity: number;
    unitPrice: number;
};

export type ColorVariant = {
    id: string;
    color: string;
    sizes: SizeInfo[];
};

export type OrderItem = {
    id: string;
    name: string;
    variants: ColorVariant[];
};

export type Order = {
    id: string;
    supplier: string;
    date: string;
    status: "Pending" | "Approved" | "Delivered";
    items: OrderItem[];
};

export type Supplier = {
  id: string;
  name: string;
  category: string;
  address: string;
  phone: string;
  bankDetails: string;
  description?: string;
};
