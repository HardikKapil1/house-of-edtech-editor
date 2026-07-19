// src/components/editor/ai-toolbar.tsx
"use client";

import { useState } from "react";
import { Editor } from "@tiptap/react";
import { toast } from "sonner";
import {
    Sparkles,
    FileText,
    PenSquare,
    SpellCheck,
    Loader2,
} from "lucide-react";

interface Props {
    editor: Editor;
}

type Action =
    | "rewrite"
    | "summarize"
    | "continue"
    | "fix-grammar";

// FIX: Moved outside the main component to prevent React re-creation on every render
interface ToolbarButtonProps {
    action: Action;
    label: string;
    icon: React.ReactNode;
    loadingAction: Action | null;
    onClick: (action: Action) => void;
}

function ToolbarButton({
    action,
    label,
    icon,
    loadingAction,
    onClick,
}: ToolbarButtonProps) {
    return (
        <button
            onClick={() => onClick(action)}
            disabled={loadingAction !== null}
            className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
            {loadingAction === action ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                icon
            )}
            {label}
        </button>
    );
}

/**
 * AI Toolbar
 *
 * Allows users to transform the currently selected text using Gemini.
 * Continue Writing inserts new content after the cursor while the
 * remaining actions replace the selected text.
 */
export default function AiToolbar({ editor }: Props) {
    const [loadingAction, setLoadingAction] = useState<Action | null>(null);

    async function runAction(action: Action) {
        const selectedText = editor.state.doc.textBetween(
            editor.state.selection.from,
            editor.state.selection.to,
            " "
        );

        if (action !== "continue" && !selectedText.trim()) {
            toast.error("Please select some text first.");
            return;
        }

        setLoadingAction(action);

        try {
            const response = await fetch("/api/ai", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    action,
                    text:
                        action === "continue"
                            ? editor.getText()
                            : selectedText,
                }),
            });

            if (!response.ok) {
                throw new Error("AI request failed");
            }

            const data = await response.json();

            if (action === "continue") {
                editor
                    .chain()
                    .focus()
                    .insertContent("\n" + data.output)
                    .run();
            } else {
                editor
                    .chain()
                    .focus()
                    .deleteSelection()
                    .insertContent(data.output)
                    .run();
            }

            toast.success("AI completed.");
        } catch (err) {
            console.error(err);
            toast.error("Failed to generate AI response.");
        } finally {
            setLoadingAction(null);
        }
    }

    return (
        <div className="sticky top-0 z-20 flex flex-wrap gap-2 border-b bg-gray-50 p-3">
            <ToolbarButton
                action="rewrite"
                label="Rewrite"
                icon={<Sparkles size={16} />}
                loadingAction={loadingAction}
                onClick={runAction}
            />

            <ToolbarButton
                action="summarize"
                label="Summarize"
                icon={<FileText size={16} />}
                loadingAction={loadingAction}
                onClick={runAction}
            />

            <ToolbarButton
                action="continue"
                label="Continue"
                icon={<PenSquare size={16} />}
                loadingAction={loadingAction}
                onClick={runAction}
            />

            <ToolbarButton
                action="fix-grammar"
                label="Fix Grammar"
                icon={<SpellCheck size={16} />}
                loadingAction={loadingAction}
                onClick={runAction}
            />
        </div>
    );
}