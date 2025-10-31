"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import "katex/dist/katex.min.css";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex, rehypeHighlight]}
      components={{
        code({ node, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '');
          const isInline = !match;
          return isInline ? (
            <code
              className="px-1 py-0.5 bg-muted rounded text-sm font-mono"
              {...props}
            >
              {children}
            </code>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
        pre({ children }) {
          return (
            <pre className="overflow-x-auto p-4 bg-muted rounded-lg my-4 text-sm">
              {children}
            </pre>
          );
        },
        p({ children }) {
          return <p className="mb-4 last:mb-0">{children}</p>;
        },
        ul({ children }) {
          return <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>;
        },
        ol({ children }) {
          return <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>;
        },
        h1({ children }) {
          return <h1 className="text-2xl font-bold mb-4">{children}</h1>;
        },
        h2({ children }) {
          return <h2 className="text-xl font-bold mb-3">{children}</h2>;
        },
        h3({ children }) {
          return <h3 className="text-lg font-bold mb-2">{children}</h3>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
