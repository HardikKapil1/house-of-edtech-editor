// src/components/editor/tiptap-editor.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { JSONContent } from "@tiptap/core";
import { db } from "@/lib/db";

interface TipTapEditorProps {
  documentId: string;
  initialTitle: string;
  content: JSONContent;
  editable: boolean;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function TipTapEditor({
  documentId,
  initialTitle,
  content,
  editable,
}: TipTapEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [pendingChanges, setPendingChanges] = useState<any[]>([]);

  const titleRef = useRef(initialTitle);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitialized = useRef(false);
  const lastSavedTitle = useRef(initialTitle);
  const lastSavedContent = useRef(JSON.stringify(content));

  useEffect(() => {
    setTitle(initialTitle);
    titleRef.current = initialTitle;
    lastSavedTitle.current = initialTitle;
    lastSavedContent.current = JSON.stringify(content);
    hasInitialized.current = false;
  }, [initialTitle, content]);

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

  const saveDocument = useCallback(
    async (content: JSONContent, title: string) => {
      try {
        setSaveStatus("saving");

        const response = await fetch(`/api/documents/${documentId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            content,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save");
        }

        setSaveStatus("saved");
      } catch (error) {
        // Save to Dexie on failure
        await db.pendingChanges.put({
          id: crypto.randomUUID(),
          documentId,
          title,
          content,
          updatedAt: Date.now(),
        });
        console.error(error);
        setSaveStatus("error");
      }
    },
    [documentId]
  );

  const scheduleSave = useCallback(
    (content: JSONContent, title: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        const currentContent = JSON.stringify(content);

        if (
          title === lastSavedTitle.current &&
          currentContent === lastSavedContent.current
        ) {
          return;
        }

        lastSavedTitle.current = title;
        lastSavedContent.current = currentContent;

        void saveDocument(content, title);
      }, 1000);
    },
    [saveDocument]
  );

  const editor = useEditor({
    extensions: [StarterKit],
    content,
    immediatelyRender: false,
    editable: editable,
    onUpdate: ({ editor }) => {
      if (!editable) return;

      if (!hasInitialized.current) {
        hasInitialized.current = true;
        return;
      }

      scheduleSave(editor.getJSON(), titleRef.current);
    },
  });

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editable) return;

    const newTitle = e.target.value;
    setTitle(newTitle);
    titleRef.current = newTitle;

    if (!editor) return;
    scheduleSave(editor.getJSON(), newTitle);
  };

  const handleSyncPending = async () => {
    setSaveStatus("saving");
    try {
      for (const change of pendingChanges) {
        const response = await fetch(`/api/documents/${documentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: change.title || title,
            content: change.content,
          }),
        });

        if (!response.ok) throw new Error("Failed to sync change");

        await db.pendingChanges.delete(change.id);
      }
      
      setPendingChanges([]);
      setSaveStatus("saved");
    } catch (error) {
      console.error("Failed to sync pending changes", error);
      setSaveStatus("error");
    }
  };

  const handleDiscardPending = async () => {
    for (const change of pendingChanges) {
      await db.pendingChanges.delete(change.id);
    }
    setPendingChanges([]);
  };

  if (!editor) return null;

  return (
    <div className="space-y-4">
      
      {pendingChanges.length > 0 && (
        <div className="flex items-center justify-between rounded bg-yellow-100 p-4 text-yellow-800">
          <span className="font-medium">⚠️ Offline changes found</span>
          <div className="flex gap-2">
            <button 
              onClick={handleSyncPending}
              className="rounded bg-yellow-600 px-3 py-1 text-sm text-white hover:bg-yellow-700"
            >
              Sync
            </button>
            <button 
              onClick={handleDiscardPending}
              className="rounded bg-transparent px-3 py-1 text-sm text-yellow-800 hover:bg-yellow-200"
            >
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
        {saveStatus === "idle" && "Ready"}
        {saveStatus === "saving" && "Saving..."}
        {saveStatus === "saved" && "Saved ✓"}
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