// src/components/document/document-card.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { FileText, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

interface Props {
  id: string;
  title: string | null;
  updatedAt: Date | string;
  role: "OWNER" | "EDITOR" | "VIEWER";
}

export default function DocumentCard({ id, title, updatedAt, role }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      toast.success("Document deleted.");
      router.refresh();
      setOpen(false);
    } catch (error) {
      console.error("Failed to delete document:", error);
      toast.error("Failed to delete document.");
    }
  };

  return (
    <div className="group flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <Link href={`/documents/${id}`}prefetch={false} className="flex min-w-0 flex-1 items-center gap-3.5">
        <div className="flex items-center gap-3.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><FileText className="size-5" /></span>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="truncate text-[15px] font-semibold tracking-tight">
                {title || "Untitled Document"}
              </h2>
              {role === "VIEWER" && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                  Read Only
                </span>
              )}
            </div>

            <p suppressHydrationWarning className="mt-1 text-xs text-muted-foreground">
              Updated{" "}
              {formatDistanceToNow(new Date(updatedAt), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>
      </Link>

      {role === "OWNER" && (
        <AlertDialog open={open} onOpenChange={setOpen}>
          <button
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setOpen(true);
            }}
            className="rounded-lg p-2 opacity-0 transition-all hover:bg-red-50 focus-visible:opacity-100 group-hover:opacity-100"
            aria-label="Delete document"
            type="button"
          >
            <Trash2 className="h-5 w-5 text-red-500" />
          </button>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this document?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The document will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}