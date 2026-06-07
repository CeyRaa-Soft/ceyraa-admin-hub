import { getCollection } from "@/lib/database";
import type { Supplier } from "@/types/order";

const COLLECTION = "suppliers";

export async function getSuppliers() {
  return (await getCollection(COLLECTION))
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getSupplierById(id: string) {
  return (await getCollection(COLLECTION)).findOne({ id });
}

export async function createSupplier(data: Omit<Supplier, "id">) {
  return (await getCollection(COLLECTION)).insertOne({
    id: crypto.randomUUID(),
    ...data,
    createdAt: new Date(),
  });
}
