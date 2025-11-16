"use client";

import { useFormStatus } from "react-dom";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface Props {
  action: (formData: FormData) => void;
}

export function AuthForm({ action }: Props) {
  const { pending } = useFormStatus();

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="text-sm font-semibold text-[var(--brand-navy)]">
          Email
        </label>
        <Input
          type="email"
          name="email"
          required
          placeholder="you@davidson.edu"
          className="mt-1"
        />
      </div>
      <div>
        <label className="text-sm font-semibold text-[var(--brand-navy)]">
          Password
        </label>
        <Input
          type="password"
          name="password"
          required
          placeholder="••••••••"
          className="mt-1"
        />
      </div>
      <Button type="submit" fullWidth disabled={pending}>
        {pending ? "Authenticating..." : "Sign In"}
      </Button>
    </form>
  );
}
