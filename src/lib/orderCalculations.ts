import type { SizeInfo, ColorVariant, OrderItem, Order } from "@/types/order";

export const calculateSizeTotal = (size: SizeInfo): number => {
  return size.quantity * size.unitPrice;
};

export const calculateVariantTotalCost = (variant: ColorVariant): number => {
  return variant.sizes.reduce(
    (total, size) => total + calculateSizeTotal(size),
    0,
  );
};

export const calculateItemTotalCost = (item: OrderItem): number => {
  return item.variants.reduce(
    (total, variant) => total + calculateVariantTotalCost(variant),
    0,
  );
};

export const calculateItemsSubTotal = (items: OrderItem[]): number => {
  return items.reduce((total, item) => total + calculateItemTotalCost(item), 0);
};

export const calculateOrderTotal = (order: Order): number => {
  let total = 0;
  order.categories?.forEach((cat) => {
    cat.items.forEach((item) => {
      item.variants.forEach((v) => {
        v.sizes.forEach((s) => {
          total += s.quantity * s.unitPrice;
        });
      });
    });
  });
  return total;
};

export const calculateTotalDressCount = (order: Order): number => {
  const productionCategory = order.categories?.find(
    (c) => c.id === "production",
  );
  if (!productionCategory) return 0;

  let count = 0;
  productionCategory.items.forEach((item) => {
    item.variants.forEach((v) => {
      v.sizes.forEach((s) => {
        count += s.quantity;
      });
    });
  });
  return count;
};

/**
 * Calculates the standard selling price for a dress based on its unit cost.
 * For now, we use a standard formula that calculates a markup of 2x the unit cost
 * (representing a 50% target profit margin), and adds a 20% discount buffer/margin
 * so that promotional discounts do not eat into the core profit margins.
 *
 * Formula:
 * (Unit Cost * Markup Factor) / (1 - Discount Margin)
 * Example: Unit Cost = $10. Markup = 2.0. Discount Margin = 0.2 (20%).
 * Selling Price = ($10 * 2) / (1 - 0.2) = $20 / 0.8 = $25
 * If we apply a 20% discount to $25, it sells at $20 (exactly 2x cost).
 */
export const calculateSellingPrice = (unitCost: number): number => {
  const markupFactor = 2.0; // unit cost * 2 (100% markup)
  const discountMargin = 0.2; // 20% discount margin

  const sellingPrice = (unitCost * markupFactor) / (1 - discountMargin);
  return Math.round(sellingPrice * 100) / 100;
};
