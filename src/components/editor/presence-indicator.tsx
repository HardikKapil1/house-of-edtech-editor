"use client";

import { useEffect, useState } from "react";
import { WebsocketProvider } from "y-websocket";

interface PresenceUser {
  clientId: number;
  id?: string;
  email?: string;
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

      const unique = new Map<string, PresenceUser>();

      states.forEach(([clientId, state]) => {
        const awareness = state as {
          user?: {
            id?: string;
            email?: string;
            name?: string;
            color?: string;
          };
        };

        if (!awareness.user) return;

        const key =
          awareness.user.id ??
          awareness.user.email ??
          awareness.user.name ??
          String(clientId);

        if (!unique.has(key)) {
          unique.set(key, {
            clientId,
            ...awareness.user,
          });
        }
      });

      setUsers(Array.from(unique.values()));
    };

    updateUsers();

    provider.awareness.on("change", updateUsers);

    return () => {
        provider.awareness.off("change", updateUsers);
    };
  }, [provider]);

  if (users.length === 0) return null;

  // Find names that appear more than once
  const duplicateNames = new Set(
    users
      .map((user) => user.name)
      .filter(
        (name): name is string =>
          !!name &&
          users.filter((user) => user.name === name).length > 1
      )
  );

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
      <span className="text-sm font-medium text-muted-foreground">
        {users.length === 1
          ? "Only you are editing"
          : `${users.length} Collaborators Online`}
      </span>

      <div className="flex flex-wrap items-center gap-2">
        {users.map((user) => {
          const displayName =
            duplicateNames.has(user.name ?? "")
              ? `${user.name} (${user.email?.split("@")[0] ?? "Unknown"})`
              : user.name ??
                user.email?.split("@")[0] ??
                "Anonymous";

          return (
            <div
              key={user.id ?? user.email ?? user.clientId}
              className="flex items-center gap-2 rounded-full border bg-background px-3 py-1 shadow-sm"
              title={user.email ?? user.name ?? "Anonymous"}
            >
              <div
                className="h-3 w-3 rounded-full"
                style={{
                  backgroundColor: user.color ?? "#94A3B8",
                }}
              />

              <span className="text-xs font-medium">
                {displayName}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}