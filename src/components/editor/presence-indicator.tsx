"use client";

import { useEffect, useState } from "react";
import { WebsocketProvider } from "y-websocket";

interface Props {
  provider: WebsocketProvider;
}

/**
 * Displays users currently connected to this document.
 *
 * Uses the Yjs Awareness protocol. Awareness stores ephemeral
 * presence information (name, cursor, color) and is NOT part
 * of the shared document content.
 */
export default function PresenceIndicator({ provider }: Props) {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const updateUsers = () => {
      const states = Array.from(provider.awareness.getStates().values());

      setUsers(
        states
          .map((state: any) => state.user)
          .filter(Boolean)
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
    <div className="mb-4 flex items-center gap-3 rounded-lg border bg-gray-50 p-3">
      <span className="text-sm font-medium text-gray-600">
        Collaborating:
      </span>

      <div className="flex -space-x-2">
        {users.map((user, index) => (
          <div
            key={index}
            title={user.name}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-white"
            style={{
              backgroundColor: user.color,
            }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
        ))}
      </div>
    </div>
  );
}