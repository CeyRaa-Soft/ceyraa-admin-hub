"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type OrderTotalsContextType = {
  categoryTotals: Record<string, number>;
  updateCategoryTotal: (categoryId: string, total: number) => void;
  getTotalForAllCategories: () => number;
  clearCategoryTotal: (categoryId: string) => void;
};

const OrderTotalsContext = createContext<OrderTotalsContextType | undefined>(
  undefined
);

export const useOrderTotals = () => {
  const context = useContext(OrderTotalsContext);
  if (!context) {
    throw new Error("useOrderTotals must be used within OrderTotalsProvider");
  }
  return context;
};

type OrderTotalsProviderProps = {
  children: ReactNode;
};

export const OrderTotalsProvider: React.FC<OrderTotalsProviderProps> = ({
  children,
}) => {
  const [categoryTotals, setCategoryTotals] = useState<Record<string, number>>(
    {}
  );

  const updateCategoryTotal = (categoryId: string, total: number) => {
    setCategoryTotals((prev) => ({
      ...prev,
      [categoryId]: total,
    }));
  };

  const clearCategoryTotal = (categoryId: string) => {
    setCategoryTotals((prev) => {
      const newTotals = { ...prev };
      delete newTotals[categoryId];
      return newTotals;
    });
  };

  const getTotalForAllCategories = () => {
    return Object.values(categoryTotals).reduce((sum, total) => sum + total, 0);
  };

  return (
    <OrderTotalsContext.Provider
      value={{
        categoryTotals,
        updateCategoryTotal,
        getTotalForAllCategories,
        clearCategoryTotal,
      }}
    >
      {children}
    </OrderTotalsContext.Provider>
  );
};
