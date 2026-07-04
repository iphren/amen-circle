import { Fragment } from "react";

// Minimal inline renderer for the markdown-lite used in dictionary strings that
// carry light formatting (consent checkboxes, legal documents). Supports:
//   **bold**        -> <strong>
//   `code`          -> <code>
//   [text](href)    -> <a>
// Anything else is rendered as plain text. Deliberately tiny — not a general
// markdown engine.
export function Inline({ text }: { text: string }) {
  // Fresh regex per call so its stateful `lastIndex` isn't shared across renders.
  const token = /\*\*(.+?)\*\*|`([^`]+?)`|\[([^\]]+?)\]\(([^)]+?)\)/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = token.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <Fragment key={key++}>{text.slice(lastIndex, match.index)}</Fragment>,
      );
    }

    const [, bold, code, linkText, href] = match;
    if (bold !== undefined) {
      nodes.push(<strong key={key++}>{bold}</strong>);
    } else if (code !== undefined) {
      nodes.push(
        <code key={key++} className="font-mono">
          {code}
        </code>,
      );
    } else if (linkText !== undefined && href !== undefined) {
      nodes.push(
        <a
          key={key++}
          href={href}
          className="underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {linkText}
        </a>,
      );
    }

    lastIndex = token.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(<Fragment key={key++}>{text.slice(lastIndex)}</Fragment>);
  }

  return <>{nodes}</>;
}
