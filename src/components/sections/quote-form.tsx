"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, Send, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { company, productOptions } from "@/lib/site-data";

const quoteSchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  companyName: z.string().optional(),
  phone: z.string().min(7, "Enter a valid phone number"),
  email: z.email("Enter a valid email"),
  product: z.string().min(1, "Select a product"),
  quantity: z.string().optional(),
  specifications: z.string().optional(),
  deliveryLocation: z.string().min(2, "Enter delivery location"),
  message: z.string().optional(),
});

type QuoteFormValues = z.infer<typeof quoteSchema>;

export function QuoteForm() {
  const [submitted, setSubmitted] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      name: "",
      companyName: "",
      phone: "",
      email: "",
      product: "",
      quantity: "",
      specifications: "",
      deliveryLocation: "",
      message: "",
    },
  });

  const values = watch();

  const buildWhatsAppMessage = (data: Partial<QuoteFormValues>) => {
    const lines = [
      "Hi A.J. Wires, I'd like to request a quote.",
      data.name && `Name: ${data.name}`,
      data.companyName && `Company: ${data.companyName}`,
      data.product && `Product: ${data.product}`,
      data.quantity && `Quantity: ${data.quantity}`,
      data.specifications && `Specifications: ${data.specifications}`,
      data.deliveryLocation && `Delivery Location: ${data.deliveryLocation}`,
      data.message && `Message: ${data.message}`,
    ].filter(Boolean);
    return lines.join("\n");
  };

  const whatsappHref = `https://wa.me/${company.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
    buildWhatsAppMessage(values)
  )}`;

  const onSubmit = async (data: QuoteFormValues) => {
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Request failed");
      setSubmitted(true);
      reset();
      toast.success("Quote request sent — we'll be in touch shortly.");
    } catch {
      toast.error("Something went wrong. Please try WhatsApp or call us instead.");
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-10">
      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }}
            >
              <CheckCircle2 className="size-20 text-gold" />
            </motion.div>
            <h3 className="mt-6 font-heading text-2xl font-bold text-foreground">
              Request Received
            </h3>
            <p className="mt-2 max-w-md text-muted-foreground">
              Thank you for reaching out. Our team will review your specifications and get back
              to you shortly with a tailored quote.
            </p>
            <Button className="mt-7 bg-gold text-navy hover:bg-gold-light" onClick={() => setSubmitted(false)}>
              Submit Another Request
            </Button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit(onSubmit)}
            className="grid gap-6 sm:grid-cols-2"
          >
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input id="name" className="mt-2" placeholder="Your full name" {...register("name")} />
              {errors.name && <p className="mt-1.5 text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="companyName">Company</Label>
              <Input id="companyName" className="mt-2" placeholder="Company name" {...register("companyName")} />
            </div>
            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input id="phone" className="mt-2" placeholder="+91 00000 00000" {...register("phone")} />
              {errors.phone && <p className="mt-1.5 text-xs text-destructive">{errors.phone.message}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" className="mt-2" placeholder="you@company.com" {...register("email")} />
              {errors.email && <p className="mt-1.5 text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="product">Product *</Label>
              <Controller
                name="product"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="product" className="mt-2 w-full">
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {productOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.product && <p className="mt-1.5 text-xs text-destructive">{errors.product.message}</p>}
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" className="mt-2" placeholder="e.g. 5 tonnes / 200 coils" {...register("quantity")} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="specifications">Specifications</Label>
              <Textarea
                id="specifications"
                className="mt-2"
                placeholder="Gauge, mesh size, barb spacing, finish, etc."
                {...register("specifications")}
              />
            </div>
            <div>
              <Label htmlFor="deliveryLocation">Delivery Location *</Label>
              <Input id="deliveryLocation" className="mt-2" placeholder="City, State" {...register("deliveryLocation")} />
              {errors.deliveryLocation && (
                <p className="mt-1.5 text-xs text-destructive">{errors.deliveryLocation.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Input id="message" className="mt-2" placeholder="Anything else we should know?" {...register("message")} />
            </div>

            <div className="mt-2 flex flex-col gap-3 sm:col-span-2 sm:flex-row">
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="flex-1 bg-gold text-navy hover:bg-gold-light"
              >
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Request Quote
              </Button>
              <Button asChild type="button" size="lg" variant="outline" className="flex-1 border-[#25D366]/40 text-[#1ea952] hover:bg-[#25D366]/10 dark:text-[#25D366]">
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="size-4" /> WhatsApp Us
                </a>
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
