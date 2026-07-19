"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
}

type ActivityMetadata = {
  version?: number;
  restoredVersion?: number;
  [key: string]: unknown;
};

type Activity = {
  id: string;
  action: string;
  metadata: ActivityMetadata | null;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
  };
};

function getActionText(log: Activity) {
  switch (log.action) {
    case "DOCUMENT_CREATED":
      return "created the document";
    case "DOCUMENT_UPDATED":
      return "edited the document";
    case "SNAPSHOT_CREATED":
      return `saved Version ${log.metadata?.version}`;
    case "SNAPSHOT_RESTORED":
      return `restored Version ${log.metadata?.restoredVersion}`;
    case "DOCUMENT_SHARED":
      return "shared the document";
    case "DOCUMENT_DELETED":
      return "deleted the document";
    default:
      return "performed an unknown action";
  }
}

export function ActivityDialog({
  open,
  onOpenChange,
  documentId,
}: ActivityDialogProps) {
  const [activity, setActivity] = React.useState<Activity[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;

    const fetchActivity = async () => {
      setLoading(true);

      try {
        const response = await fetch(`/api/documents/${documentId}/activity`);

        if (!response.ok) {
          throw new Error("Failed to fetch activity");
        }

        const data = await response.json();
        setActivity(data);
      } catch (error) {
        console.error("Failed to fetch activity:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchActivity();
  }, [open, documentId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] gap-5 overflow-y-auto p-6 sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight">
            Activity
          </DialogTitle>

          <p className="text-sm text-muted-foreground">
            A timeline of recent document changes.
          </p>
        </DialogHeader>

        {loading ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Loading...
          </p>
        ) : activity.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No recent activity.
          </p>
        ) : (
          <ul className="relative space-y-1 before:absolute before:bottom-3 before:left-3.5 before:top-3 before:w-px before:bg-border">
            {activity.map((item) => (
              <li key={item.id} className="relative py-3 pl-9">
                <span className="absolute left-1.5 top-4 size-4 rounded-full border-4 border-background bg-blue-500 shadow-sm" />

                <p className="text-sm">
                  <span className="font-semibold">
                    {item.user.name || item.user.email}
                  </span>{" "}
                  {getActionText(item)}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(item.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}