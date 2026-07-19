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
import { toast } from "sonner";

interface ShareDialogProps {
  documentId: string;
}

export default function ShareDialog({ documentId }: ShareDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"VIEWER" | "EDITOR">("VIEWER");
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    if (!email.trim()) {
      toast.error("Email is required.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/documents/${documentId}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error);
        return;
      }

      setEmail("");
      setRole("VIEWER");
      toast.success(`Shared with ${email}`);

    } catch (error) {
      console.error(error);
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };
    
  return (
    <Dialog>
      <DialogTrigger className="h-9 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-[0.98]">
        Share
      </DialogTrigger>

      <DialogContent className="gap-5 p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight">Share document</DialogTitle><p className="text-sm text-muted-foreground">Invite collaborators by email and choose what they can do.</p>
        </DialogHeader>

        <input
          disabled={loading}
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        />
        
        <select
          disabled={loading}
          value={role}
          onChange={(e) => setRole(e.target.value as "VIEWER" | "EDITOR")}
          className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        >
          <option value="VIEWER">Viewer</option>
          <option value="EDITOR">Editor</option>
        </select>
        
        <button
          disabled={loading}
          onClick={handleShare}
          className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Sharing..." : "Share"}
        </button>
      </DialogContent>
    </Dialog>
  );
}