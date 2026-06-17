import {
  Wheat,
  Factory,
  Shield,
  Square,
  Sun,
  Route,
  TrainFront,
  Trophy,
  Warehouse,
  Building2,
  type LucideProps,
} from "lucide-react";
import type { applications } from "@/lib/site-data";

type IconKey = (typeof applications)[number]["icon"];

const iconMap: Record<IconKey, React.ComponentType<LucideProps>> = {
  wheat: Wheat,
  factory: Factory,
  shield: Shield,
  square: Square,
  sun: Sun,
  road: Route,
  train: TrainFront,
  trophy: Trophy,
  warehouse: Warehouse,
  building: Building2,
};

export function ApplicationIcon({ icon, ...props }: { icon: IconKey } & LucideProps) {
  const Icon = iconMap[icon];
  return <Icon {...props} />;
}
