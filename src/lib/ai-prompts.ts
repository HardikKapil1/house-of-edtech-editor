export type AiAction = "rewrite" | "summarize" | "continue" | "fix-grammar";

/**
 * Returns a prompt based on the requested AI action.
 */
export function getPrompt(action: AiAction, text: string): string {
  switch (action) {
    case "rewrite":
      return `Rewrite the following text while preserving its original meaning. Return only the rewritten text.

${text}`;

    case "summarize":
      return `Summarize the following text in a concise way. Return only the summary.

${text}`;

    case "continue":
      return `Continue writing naturally from the following text.

${text}`;

    case "fix-grammar":
      return `Fix grammar, punctuation and spelling without changing the meaning.

${text}`;

    default:
      throw new Error("Unsupported AI action");
  }
}
