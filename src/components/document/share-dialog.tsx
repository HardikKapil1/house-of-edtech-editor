// src/components/document/share-dialog.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

interface ShareDialogProps {
  documentId: string;
}

export default function ShareDialog({documentId,}: ShareDialogProps) {
  const [email, setEmail] = useState("");
const [role, setRole] = useState<"VIEWER" | "EDITOR">("VIEWER");
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");


const handleShare = async () => {
  setError("");

  if (!email.trim()) {
    setError("Email is required.");
    return;
  }

  try {
    setLoading(true);

    const response = await fetch(
      `/api/documents/${documentId}/share`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          role,
        }),
      }
    );

const data = await response.json();

if (!response.ok) {
  setError(data.error);
  return;
}

    // Success
    setEmail("");
    setRole("VIEWER");
    setError("");

    alert("Document shared successfully!");

    // We'll close the dialog in the next step
  } catch (error) {
    console.error(error);
    setError("Network error. Please try again.");
  } finally {
    setLoading(false);
  }
};
    
  return (
    <Dialog>
      <DialogTrigger className="rounded-lg bg-blue-600 px-4 py-2 text-white">
        Share
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Document</DialogTitle>
        </DialogHeader>

      <input
      disabled={loading}
        type="email"
        placeholder="Enter email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-md border p-2"
      />
      {error && (
        <p className="text-sm text-red-500">
          {error}
        </p>
      )}
      <select
      disabled={loading}
        value={role}
        onChange={(e) => setRole(e.target.value as "VIEWER" | "EDITOR")}
        className="w-full rounded-md border p-2"
      >
        <option value="VIEWER">Viewer</option>
        <option value="EDITOR">Editor</option>
      </select>
      <button
        disabled={loading}
        onClick={handleShare}
        className="rounded-md bg-blue-600 px-4 py-2 text-white"
      >
        {loading ? "Sharing..." : "Share"}
      </button>
      </DialogContent>
    </Dialog>
  );
}