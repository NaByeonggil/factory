"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login,
    {},
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="next" value={next} />

      <Field label="이메일" htmlFor="email" required>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
        />
      </Field>

      <Field label="비밀번호" htmlFor="password" required>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>

      {state.error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "확인 중…" : "로그인"}
      </Button>
    </form>
  );
}
