"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Menu, Phone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { navLinks, company } from "@/lib/site-data";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 24);
  });

  // Every page opens on a navy hero, so before scrolling the header sits on a dark
  // background regardless of the active theme — force light text until it picks up
  // the scrolled (theme-aware) background.
  const textClass = scrolled
    ? "text-muted-foreground hover:text-foreground"
    : "text-white/80 hover:text-white";
  const activeTextClass = scrolled ? "text-foreground" : "text-white";
  const iconClass = scrolled ? "text-foreground hover:text-foreground" : "text-white hover:text-white";

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-border/60 bg-background/90 backdrop-blur-md shadow-sm"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="container-px mx-auto flex h-16 max-w-7xl items-center justify-between lg:h-20">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="relative flex size-9 shrink-0 items-center justify-center lg:size-10">
            <Image
              src="/logo-mark-white.png"
              alt=""
              fill
              priority
              className={cn("object-contain", scrolled ? "hidden dark:block" : "block")}
            />
            <Image
              src="/logo-mark.png"
              alt=""
              fill
              priority
              className={cn("object-contain", scrolled ? "block dark:hidden" : "hidden")}
            />
          </span>
          <span
            className={cn(
              "font-heading text-lg font-bold tracking-[0.04em] transition-colors lg:text-xl",
              activeTextClass
            )}
          >
            <span className="text-gold">AJ</span> WIRES
          </span>
        </Link>

        <nav className="hidden items-center xl:flex">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative whitespace-nowrap rounded-md px-3.5 py-2 text-sm font-medium transition-colors",
                  active ? activeTextClass : textClass
                )}
              >
                {link.label}
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-gold"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 xl:flex">
          <a
            href={`tel:${company.phonesRaw[0]}`}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap text-sm font-medium transition-colors",
              textClass
            )}
          >
            <Phone className="size-4 shrink-0" />
            {company.phones[0]}
          </a>
          <ThemeToggle className={iconClass} />
          <Button asChild className="whitespace-nowrap bg-gold text-navy hover:bg-gold-light">
            <Link href="/quote">
              Request a Quote <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-1 xl:hidden">
          <ThemeToggle className={iconClass} />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu" className={iconClass}>
                <Menu className="size-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[360px]">
              <SheetHeader>
                <SheetTitle className="font-heading">A.J. Wires</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4">
                {navLinks.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "rounded-md px-3 py-2.5 text-base font-medium transition-colors hover:bg-muted",
                        pathname === link.href ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
              <div className="mt-4 flex flex-col gap-3 px-4">
                <a
                  href={`tel:${company.phonesRaw[0]}`}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
                >
                  <Phone className="size-4" /> {company.phones[0]}
                </a>
                <SheetClose asChild>
                  <Button asChild className="w-full bg-gold text-navy hover:bg-gold-light">
                    <Link href="/quote">
                      Request a Quote <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
}
