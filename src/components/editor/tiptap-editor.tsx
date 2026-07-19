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
import { toast } from "sonner";

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

const cursorColors = ['#958DF1', '#F98181', '#FBBC88', '#FAF594', '#70CFF8', '#94FADB', '#B9F18D0', '#E6A0F8', '#FF99C8', '#FFB347', '#FF6961', '#FFB6C1', '#FFD700', '#ADFF2F', '#00CED1', '#1E90FF', '#BA55D3', '#FF4500', '#32CD32', '#00FA9A', '#FF6347', '#40E0D0', '#FF1493', '#7B68EE', '#00BFFF', '#FF69B4', '#8A2BE2', '#00FF7F', '#FF8C00', '#DA70D6', '#00FFFF', '#FF4500', '#ADFF2F', '#1E90FF', '#FF1493', '#32CD32'];

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
// eslint-disable-next-line react-hooks/set-state-in-effect
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
            toast.info("Server has newer changes. Reload the page to see them.");
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

  useEffect(() => {
    if (!editable) return;

    if (title === initialTitle) return;

    const timer = setTimeout(async () => {
      try {
        setSaveStatus("saving");

        if (!navigator.onLine) {
          await queueChange(documentId, title, content);
          setSaveStatus("saved");
          return;
        }

        const response = await fetch(`/api/documents/${documentId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
          }),
        });

        if (response.status === 409) {
          toast.info(
            "Another change was detected. Please reload to get the latest version."
          );
          setSaveStatus("error");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to save title");
        }

        setSaveStatus("saved");
      } catch (error) {
        console.error(error);
        setSaveStatus("error");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [
    title,
    editable,
    documentId,
    content,
    initialTitle,
  ]);


  if (!editor) return null;

  return (
    <div className="space-y-5">
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
        onChange={(e) => setTitle(e.target.value)}
        readOnly={!editable}
        placeholder="Untitled Document"
        className={`w-full rounded-xl border border-transparent bg-transparent px-3 py-2 text-3xl font-semibold tracking-tight outline-none transition focus:bg-blue-50/50 focus:ring-2 focus:ring-blue-500/20 sm:text-4xl ${
          !editable ? "cursor-default" : ""
        }`}
      />

      <div className="px-3"><span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"><span className="size-1.5 rounded-full bg-blue-500" />
        {saveStatus === "idle" && "Live Sync Active"}
        {saveStatus === "saving" && "Saving Title..."}
        {saveStatus === "saved" && "Title Saved ✓"}
        {saveStatus === "error" && (
          <span className="text-red-500">
            Failed to save title
          </span>
        )}
      </span></div>

      <div className="min-h-[500px] overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition-shadow focus-within:border-blue-200 focus-within:shadow-md">
          {editable && <AiToolbar editor={editor} />}

          <div className="p-6 sm:p-10">
              <EditorContent editor={editor} />
          </div>
      </div>
    </div>
  );
}
