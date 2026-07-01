import { Spline, Grid3x3, CircleDashed, type LucideProps } from "lucide-react";
import type { Product } from "@/lib/site-data";

const iconMap: Record<Product["icon"], React.ComponentType<LucideProps>> = {
  barbed: Spline,
  chainlink: Grid3x3,
  gi: CircleDashed,
};

export function ProductIcon({ icon, ...props }: { icon: Product["icon"] } & LucideProps) {
  const Icon = iconMap[icon];
  return <Icon {...props} />;
}
