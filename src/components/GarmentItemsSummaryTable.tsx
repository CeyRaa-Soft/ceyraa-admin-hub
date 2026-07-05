import React from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import type { ColorVariant } from "@/types/order";

interface GarmentItemsSummaryTableProps {
  variants: ColorVariant[];
  showPrice?: boolean;
  emptyMessage?: string;
}

export const GarmentItemsSummaryTable: React.FC<GarmentItemsSummaryTableProps> = ({
  variants,
  showPrice = true,
  emptyMessage = "No variants or sizes specified.",
}) => {
  if (!variants || variants.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-muted-foreground italic bg-muted/5 border rounded-lg">
        {emptyMessage}
      </div>
    );
  }

  // Calculate totals
  let totalQty = 0;
  let totalValuation = 0;
  variants.forEach((v) => {
    v.sizes.forEach((s) => {
      totalQty += s.quantity || 0;
      totalValuation += (s.quantity || 0) * (s.unitPrice || 0);
    });
  });

  return (
    <div className="border rounded-xl overflow-hidden bg-card shadow-sm border-border/80">
      <Table>
        <TableHeader className="bg-muted/15 border-b border-border/60">
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-semibold text-foreground py-3 pl-6">Color</TableHead>
            <TableHead className="font-semibold text-foreground py-3">Size</TableHead>
            <TableHead className="font-semibold text-foreground py-3 text-right">Available Quantity</TableHead>
            {showPrice && (
              <TableHead className="font-semibold text-foreground py-3 text-right pr-6">Unit Price</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {variants.map((variant) => (
            <React.Fragment key={variant.id || variant.color}>
              {variant.sizes.map((size, sizeIndex) => (
                <TableRow
                  key={`${variant.id || variant.color}-${size.size}`}
                  className="hover:bg-muted/5 border-b border-border/40 last:border-b-0"
                >
                  {sizeIndex === 0 && (
                    <TableCell
                      rowSpan={variant.sizes.length}
                      className="align-top font-semibold text-foreground/90 pl-6 border-r border-border/20 py-3 bg-muted/5 w-1/3"
                    >
                      {variant.color}
                    </TableCell>
                  )}
                  <TableCell className="font-medium text-muted-foreground py-3">
                    {size.size}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-foreground py-3">
                    {size.quantity}
                  </TableCell>
                  {showPrice && (
                    <TableCell className="text-right font-mono text-muted-foreground py-3 pr-6">
                      ${(size.unitPrice || 0).toFixed(2)}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </React.Fragment>
          ))}
          {/* Summary Row */}
          <TableRow className="bg-muted/10 font-bold border-t border-border/80 hover:bg-muted/15">
            <TableCell className="pl-6 py-4" colSpan={2}>
              Total Stock
            </TableCell>
            <TableCell className="text-right font-mono text-lg text-primary py-4">
              {totalQty}
            </TableCell>
            {showPrice && (
              <TableCell className="text-right font-mono text-muted-foreground pr-6 py-4">
                ${totalValuation.toFixed(2)}
              </TableCell>
            )}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};
