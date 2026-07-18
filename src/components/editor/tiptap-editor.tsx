"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { JSONContent } from "@tiptap/core";

interface TipTapEditorProps {
  documentId: string;
  initialTitle: string;
  content: JSONContent;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function TipTapEditor({
  documentId,
  initialTitle,
  content,
}: TipTapEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  // Always contains latest title
  const titleRef = useRef(initialTitle);

  // Debounce timer
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        void saveDocument(content, title);
      }, 1000);
    },
    [saveDocument]
  );

  const editor = useEditor({
    extensions: [StarterKit],
    content,
    immediatelyRender: false,

    onUpdate: ({ editor }) => {
      scheduleSave(editor.getJSON(), titleRef.current);
    },
  });

  const handleTitleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newTitle = e.target.value;

    setTitle(newTitle);
    titleRef.current = newTitle;

    if (!editor) return;

    scheduleSave(editor.getJSON(), newTitle);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!editor) return null;

  return (
    <div className="space-y-4">
      <input
        value={title}
        onChange={handleTitleChange}
        placeholder="Untitled Document"
        className="w-full bg-transparent text-4xl font-bold outline-none"
      />

      <div className="text-sm text-gray-500">
        {saveStatus === "idle" && "Ready"}
        {saveStatus === "saving" && "Saving..."}
        {saveStatus === "saved" && "Saved ✓"}
        {saveStatus === "error" && (
          <span className="text-red-500">
            Failed to save
          </span>
        )}
      </div>

      <div className="min-h-[500px] rounded-lg border p-6">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}