// src/components/editor/presence-indicator.tsx
"use client";

import { useEffect, useState } from "react";
import { WebsocketProvider } from "y-websocket";

interface PresenceUser {
  clientId: number;
  name?: string;
  color?: string;
}

interface Props {
  provider: WebsocketProvider;
}

export default function PresenceIndicator({ provider }: Props) {
  const [users, setUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    const updateUsers = () => {
      const states = Array.from(provider.awareness.getStates().entries());

      setUsers(
        states
          .map(([clientId, state]) => {
            const awarenessState = state as {
              user?: { name?: string; color?: string };
            };
            return {
              clientId,
              ...awarenessState.user,
            } as PresenceUser;
          })
          .filter((user) => user.name)
      );
    };

    updateUsers();

    provider.awareness.on("change", updateUsers);

    return () => {
      provider.awareness.off("change", updateUsers);
    };
  }, [provider]);

  if (users.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border bg-muted/40 px-4 py-3">
      <span className="text-sm font-medium text-muted-foreground">
        {users.length === 1
          ? "Only you are editing"
          : `${users.length} Collaborators Online`}
      </span>

      <div className="flex flex-wrap items-center gap-2">
        {users.map((user) => (
          <div
            key={user.clientId}
            className="flex items-center gap-2 rounded-full border bg-background px-3 py-1 shadow-sm"
            title={user.name ?? "Anonymous"}
          >
            <div
              className="h-3 w-3 rounded-full"
              style={{
                backgroundColor: user.color ?? "#94A3B8",
              }}
            />

            <span className="text-xs font-medium">
              {user.name ?? "Anonymous"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}