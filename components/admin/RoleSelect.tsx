"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

const ROLES = [
  ["BUYER", "구매자"],
  ["SELLER", "채취자"],
  ["BOTH", "구매+채취"],
  ["ADMIN", "관리자"],
];

export default function RoleSelect({ id, role, disabled }: { id: number; role: string; disabled?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <select
      className="rounded-lg border border-hanji-300 bg-white px-2 py-1 text-xs disabled:opacity-50"
      defaultValue={role}
      disabled={disabled || pending}
      onChange={(e) => {
        const next = e.target.value;
        if (next === "ADMIN" && !window.confirm("이 회원에게 관리자 권한을 줄까요?")) {
          e.target.value = role;
          return;
        }
        start(async () => {
          await fetch(`/api/admin/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: next }) });
          router.refresh();
        });
      }}
    >
      {ROLES.map(([v, l]) => (
        <option key={v} value={v}>{l}</option>
      ))}
    </select>
  );
}
