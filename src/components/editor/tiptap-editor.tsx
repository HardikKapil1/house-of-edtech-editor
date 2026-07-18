"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { JSONContent } from "@tiptap/core";
import { db } from "@/lib/db";
import { Collaboration } from "@tiptap/extension-collaboration";
import { CollaborationCursor } from "@tiptap/extension-collaboration-cursor";
import { createCollaborationProvider } from "@/lib/collaboration";

interface TipTapEditorProps {
  documentId: string;
  initialTitle: string;
  content: JSONContent;
  editable: boolean;
}

// Array of random cursor colors
const cursorColors = ['#958DF1', '#F98181', '#FBBC88', '#FAF594', '#70CFF8', '#94FADB', '#B9F18D'];

export default function TipTapEditor({
  documentId,
  initialTitle,
  content,
  editable,
}: TipTapEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [saveStatus, setSaveStatus] = useState<string>("idle");
  const [pendingChanges, setPendingChanges] = useState<any[]>([]);

  // 1. Initialize Yjs provider synchronously
  const yjsRef = useRef(createCollaborationProvider(documentId));
  const { ydoc, provider } = yjsRef.current;

  // Cleanup websocket connection when unmounting
  useEffect(() => {
    return () => {
      provider.destroy();
      ydoc.destroy();
    };
  }, [provider, ydoc]);

  // Load offline changes (Title only now, since body is managed by Yjs)
  useEffect(() => {
    const fetchPendingChanges = async () => {
      try {
        const changes = await db.pendingChanges
          .where("documentId")
          .equals(documentId)
          .toArray();

        if (changes && changes.length > 0) {
          setPendingChanges(changes);
        }
      } catch (error) {
        console.error("Failed to load offline changes", error);
      }
    };
    
    void fetchPendingChanges();
  }, [documentId]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Renamed from 'history' in TipTap v3
        undoRedo: false, 
      }),
      Collaboration.configure({
        document: ydoc,
      }),
      // 4. Pass the provider and mock user data to the cursor extension
      CollaborationCursor.configure({
        provider: provider,
        user: {
          name: `User ${Math.floor(Math.random() * 1000)}`,
          color: cursorColors[Math.floor(Math.random() * cursorColors.length)],
        },
      }),
    ],
    // Note: We deliberately do not pass `content: content` here. 
    // Yjs handles the initial state injection over the websocket.
    immediatelyRender: false,
    editable: editable,
  });

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  const handleTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editable) return;

    const newTitle = e.target.value;
    setTitle(newTitle);

    // Save title to the database (Autosave for document body is disabled per Phase 5)
    try {
      setSaveStatus("saving");
      await fetch(`/api/documents/${documentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }), // Only updating the title
      });
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

      <div className="min-h-[500px] rounded-lg border p-6">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}