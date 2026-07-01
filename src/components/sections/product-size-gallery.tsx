import Image from "next/image";

export function ProductSizeGallery({
  items,
}: {
  items: { label: string; image: string }[];
}) {
  if (items.length === 0) return null;

  return (
    <div className="mt-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Available Sizes
      </p>
      <div className="mt-2 -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
        {items.map((item) => (
          <div
            key={item.label}
            className="group relative aspect-square w-24 shrink-0 snap-start overflow-hidden rounded-xl bg-navy ring-1 ring-border transition-shadow duration-300 hover:shadow-lg sm:w-28"
          >
            <Image
              src={item.image}
              alt={item.label}
              fill
              sizes="112px"
              className="object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/95 via-navy/40 to-transparent p-1.5 pt-4">
              <p className="text-center text-[10px] font-semibold leading-tight text-white">
                {item.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
