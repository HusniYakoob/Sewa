"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { deleteAccount, type DeleteAccountState } from "./actions";
import { Icon } from "@/components/ui/icon";

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState<DeleteAccountState, FormData>(
    deleteAccount,
    {},
  );
  const [confirm, setConfirm] = useState("");

  return (
    <form action={action} className="px-[22px] pt-3 pb-24">
      <Link
        href="/settings"
        aria-label="Back"
        className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-border bg-surface"
      >
        <Icon name="arrow_back" />
      </Link>

      <div className="mt-6 flex flex-col items-center text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-danger/10">
          <Icon name="delete_forever" className="text-3xl text-danger" />
        </span>
        <h1 className="mt-4 text-[20px] font-extrabold tracking-tight">Delete account</h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
          This permanently erases your profile, bookings, ads and messages. This
          can&rsquo;t be undone.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border-[1.5px] border-danger/30 bg-danger/5 p-4">
        <p className="text-[13px] font-bold text-danger">Before you go</p>
        <ul className="mt-2 flex flex-col gap-1.5 text-xs text-muted-foreground">
          <li>• Any upcoming bookings should be cancelled first</li>
          <li>• Wallet balances aren&rsquo;t paid out automatically</li>
          <li>• Your reviews and chat history will be removed</li>
        </ul>
      </div>

      <label className="mb-1.5 mt-6 block text-[13px] font-bold">
        Type <span className="font-mono">DELETE</span> to confirm
      </label>
      <input
        name="confirm"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        autoComplete="off"
        className="w-full rounded-2xl border-[1.5px] border-border bg-surface px-4 py-3.5 text-[15px] font-bold tracking-wide focus:border-danger focus:outline-none"
      />

      {state.error ? (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-danger">
          <Icon name="error" className="text-base" />
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || confirm !== "DELETE"}
        className="mt-6 flex w-full items-center justify-center rounded-2xl bg-danger py-4 text-[15px] font-extrabold text-white disabled:opacity-40"
      >
        {pending ? "Deleting…" : "Permanently delete my account"}
      </button>
    </form>
  );
}
