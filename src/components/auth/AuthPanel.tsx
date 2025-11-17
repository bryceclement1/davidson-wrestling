"use client";

import { useState } from "react";
import { useActionState } from "react";
import { loginAction, signUpAction } from "@/app/(auth)/actions";
import type { SignUpState } from "@/app/(auth)/actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AuthForm } from "./AuthForm";

const signUpInitial: SignUpState = { status: "idle" };

export function AuthPanel() {
  const [baseMode, setBaseMode] = useState<"signin" | "signup">("signin");
  const [signUpState, signUpDispatch] = useActionState(signUpAction, signUpInitial);

  const shouldShowVerify = signUpState.status === "verify";
  const mode = shouldShowVerify ? "verify" : baseMode;
  const pendingEmail = signUpState.email ?? "";

  const infoMessage =
    signUpState.status === "error"
      ? signUpState.message ?? "Unable to sign up."
      : signUpState.status === "verify"
        ? signUpState.message ?? "We sent a verification link to your email."
        : null;

  return (
    <div className="mt-6 space-y-4">
      <div className="flex gap-3 text-sm font-semibold text-[var(--neutral-gray)]">
        <button
          type="button"
          onClick={() => setBaseMode("signin")}
          className={
            mode === "signin"
              ? "text-[var(--brand-navy)] underline"
              : "hover:text-[var(--brand-navy)]"
          }
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setBaseMode("signup")}
          className={
            mode === "signup"
              ? "text-[var(--brand-navy)] underline"
              : "hover:text-[var(--brand-navy)]"
          }
        >
          Sign Up
        </button>
      </div>

      {infoMessage && (
        <p className="rounded-xl bg-[var(--muted)]/60 px-4 py-2 text-sm text-[var(--brand-navy)]">
          {infoMessage}
        </p>
      )}

      {mode === "signin" && <AuthForm action={loginAction} submitLabel="Sign In" />}

      {mode === "signup" && (
        <form action={signUpDispatch} className="space-y-4">
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
              Create Password
            </label>
            <Input
              type="password"
              name="password"
              required
              placeholder="••••••••"
              minLength={6}
              className="mt-1"
            />
          </div>
          <Button type="submit" fullWidth>
            Send Verification Link
          </Button>
          {signUpState.status === "error" && signUpState.message && (
            <p className="text-sm text-[var(--danger-red)]">{signUpState.message}</p>
          )}
        </form>
      )}

      {mode === "verify" && (
        <div className="rounded-2xl bg-[var(--muted)]/40 px-4 py-6 text-sm text-[var(--brand-navy)]">
          <p className="font-semibold">Almost done!</p>
          <p className="mt-2">
            We sent a verification link to <strong>{pendingEmail}</strong>. Open it to activate
            your account, then sign in with your new password.
          </p>
        </div>
      )}
    </div>
  );
}
