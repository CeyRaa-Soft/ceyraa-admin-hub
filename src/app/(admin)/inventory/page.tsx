import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Using inline SVGs for better icon representation as requested
const TshirtIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"></path></svg>
);
const DressIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary"><path d="m22 17-5-5-5 5-5-5-5 5"></path><path d="M17 12V3H7v9"></path><path d="M12 21a3 3 0 0 0 3-3H9a3 3 0 0 0 3 3z"></path></svg>
);

const categories = [
  {
    name: "T-Shirts",
    href: "/dashboard/inventory/t-shirts",
    icon: TshirtIcon,
    image: "https://picsum.photos/400/300",
    imageHint: "tshirt collection"
  },
  {
    name: "Dresses",
    href: "/dashboard/inventory/dresses",
    icon: DressIcon,
    image: "https://picsum.photos/401/300",
    imageHint: "dress fashion"
  },
];

export default function InventoryPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Inventory Categories</h1>
        <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Create Category
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categories.map((category) => (
          <Link href={category.href} key={category.name} className="block group">
            <Card className="overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1.5">
              <CardContent className="p-0">
                <div className="relative h-48 w-full">
                    <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        data-ai-hint={category.imageHint}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                </div>
              </CardContent>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-headline">
                  <category.icon />
                  {category.name}
                </CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))}
        <button className="group">
            <Card className="flex items-center justify-center border-2 border-dashed hover:border-primary hover:text-primary transition-colors duration-300 min-h-[294px] h-full">
                <div className="text-center">
                    <PlusCircle className="mx-auto h-12 w-12 text-muted-foreground transition-colors group-hover:text-primary" />
                    <p className="mt-2 text-sm font-semibold">Create New Category</p>
                </div>
            </Card>
        </button>
      </div>
    </div>
  );
}
