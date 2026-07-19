// src/components/editor/tiptap-editor.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { JSONContent } from "@tiptap/core";
import { db } from "@/lib/db";
import { flushQueue, queueChange } from "@/lib/sync-queue";
import { Collaboration } from "@tiptap/extension-collaboration";
import { CollaborationCaret } from "@tiptap/extension-collaboration-caret";
import { createCollaborationProvider } from "@/lib/collaboration";
import AiToolbar from "./ai-toolbar";
import PresenceIndicator from "./presence-indicator";
import { useSession } from "next-auth/react";

interface TipTapEditorProps {
  documentId: string;
  initialTitle: string;
  content: JSONContent;
  editable: boolean;
}

interface PendingChange {
  documentId: string;
  title: string;
  content: JSONContent;
}

const cursorColors = ['#958DF1', '#F98181', '#FBBC88', '#FAF594', '#70CFF8', '#94FADB', '#B9F18D'];

function getUserColor(identifier?: string | null) {
  if (!identifier) return cursorColors[0];
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash += identifier.charCodeAt(i);
  }
  return cursorColors[hash % cursorColors.length];
}

export default function TipTapEditor({
  documentId,
  initialTitle,
  content,
  editable,
}: TipTapEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [saveStatus, setSaveStatus] = useState<string>("idle");
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const { data: session } = useSession();

  const yjsRef = useRef(createCollaborationProvider(documentId));
  const { ydoc, provider } = yjsRef.current;
  useEffect(() => {
    return () => {
      provider.destroy();
      ydoc.destroy();
    };
  }, [provider, ydoc]);

  useEffect(() => {
    const fetchPendingChanges = async () => {
      try {
        const changes = (await db.pendingChanges
          .where("documentId")
          .equals(documentId)
          .toArray()) as PendingChange[];

        if (changes && changes.length > 0) {
          setPendingChanges(changes);
        }
      } catch (error) {
        console.error("Failed to load offline changes", error);
      }
    };
    
    void fetchPendingChanges();
  }, [documentId]);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          undoRedo: false, 
        }),
        Collaboration.configure({
          document: ydoc,
        }),
        CollaborationCaret.configure({
          provider,
          user: {
            id: session?.user?.email,
            name:
              session?.user?.name ??
              session?.user?.email?.split("@")[0] ??
              "Anonymous",
            email: session?.user?.email,
            color: getUserColor(session?.user?.email),
          },
        }),
      ],
      immediatelyRender: false,
      editable: editable,
    },
    [session?.user?.email, session?.user?.name]
  );

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  useEffect(() => {
    const handleOnline = () => {
      void flushQueue(documentId)
        .then((response) => {
          if (response?.status === 409) {
            alert("Server has newer changes — reload?");
          }
        })
        .catch((error) => {
          console.error("Failed to sync queued changes", error);
        });
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [documentId]);

  const handleTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editable) return;

    const newTitle = e.target.value;
    setTitle(newTitle);

    try {
      setSaveStatus("saving");

      if (!navigator.onLine) {
        await queueChange(documentId, newTitle, content);
        setSaveStatus("saved");
        return;
      }

      const response = await fetch(`/api/documents/${documentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, clientUpdatedAt: Date.now() }),
      });

      if (response.status === 409) {
        alert("Server has newer changes — reload?");
        setSaveStatus("error");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to save title");
      }

      setSaveStatus("saved");
    } catch (error) {
      console.error("Failed to save title", error);
      setSaveStatus("error");
    }
  };

  if (!editor) return null;

  return (
    <div className="space-y-4">
      {pendingChanges.length > 0 && (
        <div className="flex items-center justify-between rounded bg-yellow-100 p-4 text-yellow-800">
          <span className="font-medium">⚠️ Offline changes found</span>
          <div className="flex gap-2">
            <button className="rounded bg-yellow-600 px-3 py-1 text-sm text-white hover:bg-yellow-700">
              Sync
            </button>
            <button className="rounded bg-transparent px-3 py-1 text-sm text-yellow-800 hover:bg-yellow-200">
              Discard
            </button>
          </div>
        </div>
      )}
      <div className="flex items-center gap-3">
        <PresenceIndicator provider={provider} />
      </div>
      <input
        value={title}
        onChange={handleTitleChange}
        readOnly={!editable}
        placeholder="Untitled Document"
        className={`w-full bg-transparent text-4xl font-bold outline-none ${
          !editable ? "cursor-default" : ""
        }`}
      />

      <div className="text-sm text-gray-500">
        {saveStatus === "idle" && "Live Sync Active"}
        {saveStatus === "saving" && "Saving Title..."}
        {saveStatus === "saved" && "Title Saved ✓"}
        {saveStatus === "error" && (
          <span className="text-red-500">Failed to save (Offline mode)</span>
        )}
      </div>

      <div className="min-h-[500px] rounded-lg border">
          {editable && <AiToolbar editor={editor} />}

          <div className="p-6">
              <EditorContent editor={editor} />
          </div>
      </div>
    </div>
  );
}