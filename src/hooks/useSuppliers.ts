import { useEffect, useState } from "react";
import { supplierService } from "@/services/supplier.service";
import type { Supplier } from "@/types/order";

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSuppliers = async () => {
    setLoading(true);

    const data = await supplierService.getAll();

    setSuppliers(data);

    setLoading(false);
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  return {
    suppliers,
    loading,
    refresh: loadSuppliers,
  };
}
