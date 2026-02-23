"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

type MarkdownRendererProps = {
  content: string;
};

const components: Components = {
  a: ({ href, children, ...props }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
};

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <article
      id="markdown-output"
      className="prose prose-zinc max-w-none prose-headings:tracking-tight prose-headings:font-semibold prose-p:leading-relaxed prose-pre:bg-zinc-50 prose-pre:border prose-pre:border-zinc-200 prose-code:text-zinc-700 prose-code:font-mono prose-a:text-accent-600 prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-accent-700"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </article>
  );
}
