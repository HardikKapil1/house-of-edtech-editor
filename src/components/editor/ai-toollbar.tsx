// src/components/editor/ai-toolbar.tsx
"use client";

import { useState } from "react";
import { Editor } from "@tiptap/react";

interface Props {
    editor: Editor;
}

export default function AiToolbar({ editor }: Props) {
    const [action, setAction] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleAction = async (actionToRun: string) => {
        const selection = editor.state.doc.textBetween(
            editor.state.selection.from,
            editor.state.selection.to,
            " "
        );

        if (!selection || selection.trim() === "") {
            alert("Please select some text first.");
            return;
        }

        setAction(actionToRun);
        setLoading(true);

        try {
            const response = await fetch("/api/ai", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    action: actionToRun,
                    text: selection, 
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to generate content");
            }

            const data = await response.json();
            
            editor.chain().focus().insertContent(data.output).run();
            
        } catch (error) {
            console.error("Error generating content:", error);
            alert("Failed to generate content. Please try again.");
        } finally {
            setLoading(false);
            setAction(null);
        }
    };

    // FIX: Removed the backticks around the JSX
    return (
        <div className="flex space-x-2 mb-4">
            <button
                onClick={() => handleAction("summarize")}
                disabled={loading}
                className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"  
            >   
                {loading && action === "summarize" ? "Summarizing..." : "Summarize"}
            </button>
            <button
                onClick={() => handleAction("expand")}
                disabled={loading}
                className="rounded bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
            >
                {loading && action === "expand" ? "Expanding..." : "Expand"}
            </button>
            <button
                onClick={() => handleAction("rephrase")}
                disabled={loading}
                className="rounded bg-purple-600 px-3 py-2 text-sm text-white hover:bg-purple-700 disabled:opacity-50"
            >
                {loading && action === "rephrase" ? "Rephrasing..." : "Rephrase"}   
            </button>   
        </div>
    );
}