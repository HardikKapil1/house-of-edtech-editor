// src/components/document/document-toolbar.tsx
"use client";

import { useState } from "react";
import { Activity, History } from "lucide-react";

import ShareDialog from "./share-dialog";
import HistoryDialog from "./history-dialog";
import SaveVersionButton from "./save-version-button";
import { ActivityDialog } from "./activity-dialog";

import { Button } from "@/components/ui/button";
import { DocumentRole } from "@/generated/prisma";

interface Props {
  documentId: string;
  role: DocumentRole;
  canRestore: boolean;
}

export default function DocumentToolbar({
  documentId,
  role,
  canRestore,
}: Props) {
  const [activityOpen, setActivityOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <HistoryDialog
        documentId={documentId}
        canRestore={canRestore}
      />

      <Button
        variant="outline"
        onClick={() => setActivityOpen(true)}
      >
        <Activity className="mr-2 h-4 w-4" />
        Activity
      </Button>

      <SaveVersionButton documentId={documentId} />

      {role === DocumentRole.OWNER && (
        <ShareDialog documentId={documentId} />
      )}

      <ActivityDialog
        open={activityOpen}
        onOpenChange={setActivityOpen}
        documentId={documentId}
      />
    </div>
  );
}