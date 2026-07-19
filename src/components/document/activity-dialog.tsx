// src/components/document/activity-dialog.tsx
"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
      return `shared the document`;
    case "DOCUMENT_DELETED":
      return "deleted the document";
    default:
      return "performed an unknown action";
  }
}

export function ActivityDialog({ open, onOpenChange, documentId }: ActivityDialogProps) {
  const [activity, setActivity] = React.useState<Activity[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
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
    }
  }, [open, documentId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Activity</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <p className="text-sm text-gray-500 text-center py-4">Loading...</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {activity.length === 0 ? (
               <p className="text-sm text-gray-500 py-4 text-center">No recent activity.</p>
            ) : (
              activity.map((item) => (
                <li key={item.id} className="py-3">
                  <p className="text-sm text-gray-800">
                    <span className="font-semibold">
                      {item.user.name || item.user.email}
                    </span>{" "}
                    {getActionText(item)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(item.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </li>
              ))
            )}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}