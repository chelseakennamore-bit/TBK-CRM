"use client";

import { useState, useTransition } from "react";
import { setUserActive } from "@/app/actions/users";
import { Button, Table, Td, Th, Tag } from "@/components/ui";
import { fmtDate } from "@/lib/format";

type User = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
};

export function UsersTable({
  users: initialUsers,
  currentUserId,
}: {
  users: User[];
  currentUserId: string;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [pending, startTransition] = useTransition();

  return (
    <Table>
      <thead>
        <tr>
          <Th>Name</Th>
          <Th>Email</Th>
          <Th>Status</Th>
          <Th>Added</Th>
          <Th />
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr key={u.id}>
            <Td className="font-semibold text-zinc-900 dark:text-zinc-50">
              {u.name || "—"}
              {u.id === currentUserId && (
                <span className="ml-1.5 text-xs font-normal text-zinc-400">(you)</span>
              )}
            </Td>
            <Td className="text-zinc-500 dark:text-zinc-400">{u.email}</Td>
            <Td>
              <Tag variant={u.active ? "accent" : "neutral"}>
                {u.active ? "Active" : "Deactivated"}
              </Tag>
            </Td>
            <Td className="text-sm text-zinc-500 dark:text-zinc-400">
              {fmtDate(u.createdAt)}
            </Td>
            <Td>
              <Button
                variant={u.active ? "danger" : "secondary"}
                disabled={pending}
                onClick={() => {
                  const next = !u.active;
                  startTransition(async () => {
                    const result = await setUserActive(u.id, next);
                    if (!result?.ok) {
                      window.alert(result?.error ?? "Couldn't update this user.");
                      return;
                    }
                    setUsers((prev) =>
                      prev.map((x) => (x.id === u.id ? { ...x, active: next } : x))
                    );
                  });
                }}
              >
                {u.active ? "Deactivate" : "Reactivate"}
              </Button>
            </Td>
          </tr>
        ))}
        {users.length === 0 && (
          <tr>
            <Td colSpan={5} className="text-center text-zinc-400">
              No users yet.
            </Td>
          </tr>
        )}
      </tbody>
    </Table>
  );
}
