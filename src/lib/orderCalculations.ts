import type { SizeInfo, ColorVariant, OrderItem } from "@/types/order";

export const calculateSizeTotal = (size: SizeInfo): number => {
  return size.quantity * size.unitPrice;
};

export const calculateVariantTotalCost = (variant: ColorVariant): number => {
  return variant.sizes.reduce(
    (total, size) => total + calculateSizeTotal(size),
    0
  );
};

export const calculateItemTotalCost = (item: OrderItem): number => {
  return item.variants.reduce(
    (total, variant) => total + calculateVariantTotalCost(variant),
    0
  );
};

export const calculateItemsSubTotal = (items: OrderItem[]): number => {
  return items.reduce((total, item) => total + calculateItemTotalCost(item), 0);
};
