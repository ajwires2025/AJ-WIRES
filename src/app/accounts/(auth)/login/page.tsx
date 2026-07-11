"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/firebase/client";

const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(6, "Enter your password"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function AccountsLoginPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginValues) => {
    try {
      const credential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const idToken = await credential.user.getIdToken();

      const response = await fetch("/api/accounts/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        await signOut(auth);
        toast.error(body.error ?? "Sign-in failed. Try again.");
        return;
      }

      router.push("/accounts/dashboard");
      router.refresh();
    } catch {
      toast.error("Incorrect email or password.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-navy px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-navy-light/40 p-8 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-2 text-gold-light">
          <ShieldCheck className="size-5" />
          <span className="text-xs font-semibold uppercase tracking-[0.16em]">A.J. Wires Accounts</span>
        </div>
        <h1 className="mt-4 font-heading text-2xl font-bold text-white">Sign in</h1>
        <p className="mt-1 text-sm text-white/60">Admin and CA access only.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
          <div>
            <Label htmlFor="email" className="text-white/80">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              className="mt-1.5 border-white/15 bg-white/5 text-white placeholder:text-white/30"
              {...register("email")}
            />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
          </div>

          <div>
            <Label htmlFor="password" className="text-white/80">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              className="mt-1.5 border-white/15 bg-white/5 text-white placeholder:text-white/30"
              {...register("password")}
            />
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gold text-navy hover:bg-gold-light"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Sign in"}
          </Button>
        </form>
      </div>
    </main>
  );
}
