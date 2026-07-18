// src/components/editor/tiptap-editor.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { JSONContent } from "@tiptap/core";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

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
        
        router.refresh();

        if (!response.ok) {
          throw new Error("Failed to save");
        }

        setSaveStatus("saved");
      } catch (error) {
        console.error(error);
        setSaveStatus("error");
      }
    },
    [documentId, router]
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
    editable: editable, // Lock TipTap internally based on prop
    onUpdate: ({ editor }) => {
      if (!editable) return;
      scheduleSave(editor.getJSON(), titleRef.current);
    },
  });

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editable) return; // Failsafe

    const newTitle = e.target.value;
    setTitle(newTitle);
    titleRef.current = newTitle;

    if (!editor) return;
    scheduleSave(editor.getJSON(), newTitle);
  };

  if (!editor) return null;

  return (
    <div className="space-y-4">
      <input
        value={title}
        onChange={handleTitleChange}
        readOnly={!editable} // 3. Prevent title from being changed by viewers!
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
          <span className="text-red-500">Failed to save</span>
        )}
      </div>

      <div className="min-h-[500px] rounded-lg border p-6">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}