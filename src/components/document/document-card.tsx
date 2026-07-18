// src/components/document/document-card.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { FileText, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
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
}

export default function DocumentCard({
  id,
  title,
  updatedAt,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const handleDelete = async (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      router.refresh();
      setOpen(false);
    } catch (error) {
      console.error("Failed to delete document:", error);
      alert("Failed to delete document.");
    }
  };

  return (
    <div className="group flex items-center justify-between rounded-xl border p-5 transition hover:bg-muted">
      <Link href={`/documents/${id}`} className="flex min-w-0 flex-1 items-center gap-4">
        <div className="flex items-center gap-4">
          <FileText className="h-6 w-6 text-blue-500" />

          <div>
            <h2 className="truncate font-semibold">
              {title || "Untitled Document"}
            </h2>

            <p
              suppressHydrationWarning
              className="text-sm text-muted-foreground"
            >
              Updated{" "}
              {formatDistanceToNow(new Date(updatedAt), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>
      </Link>

        <AlertDialog open={open} onOpenChange={setOpen}>
          <button
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setOpen(true);
            }}
            className="rounded-md p-2 opacity-0 transition-opacity hover:bg-red-100 group-hover:opacity-100"
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
              <AlertDialogAction onClick={handleDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}