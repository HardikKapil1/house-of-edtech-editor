export function getPrompt(action: string, text: string) {
  switch (action) {
    case "rewrite":
      return `Rewrite the following text while preserving its meaning:\n\n${text}`;

    case "summarize":
      return `Summarize this text:\n\n${text}`;

    case "continue":
      return `Continue writing naturally from:\n\n${text}`;

    case "grammar":
      return `Correct grammar only. Do not change meaning:\n\n${text}`;

    case "explain":
      return `Explain this text in simple words:\n\n${text}`;

    case "tone":
      return `Rewrite this text in a professional tone:\n\n${text}`;

    case "expand":
      return `Expand on this text with more details:\n\n${text}`;

    case "shorten":
      return `Shorten this text while keeping the main points:\n\n${text}`;
    
    case "rephrase":
      return `Rephrase this text in a different way:\n\n${text}`;

    default:
      throw new Error("Invalid action");
  }
}