"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/login";
import { Button, Field, Input } from "@/components/ui";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [error, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <form
      action={formAction}
      className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        TBK Enterprise Consulting
      </h1>
      <p className="mt-1 mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        Sign in to your CRM
      </p>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div className="flex flex-col gap-3">
        <Field label="Email">
          <Input name="email" type="email" autoComplete="username" required />
        </Field>
        <Field label="Password">
          <Input
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </Field>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <Button
        type="submit"
        variant="primary"
        disabled={pending}
        className="mt-5 w-full"
      >
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
