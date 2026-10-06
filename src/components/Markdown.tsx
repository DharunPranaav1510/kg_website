import type { ReactNode } from "react";
import { isSafeLink } from "@/lib/content-schema";

/**
 * A tiny, safe formatter for policy text: ## headings, paragraphs, - bullets, 1. numbers,
 * **bold** and [links](/path). Everything is rendered as React text, never as raw HTML.
 */

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      out.push(<strong key={`${keyBase}-${i++}`} className="font-semibold text-primary-text">{m[1]}</strong>);
    } else if (isSafeLink(m[3])) {
      const external = m[3].startsWith("https://");
      out.push(
        <a key={`${keyBase}-${i++}`} href={m[3]} className="text-accent hover:underline" {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {m[2]}
        </a>
      );
    } else {
      out.push(m[2]);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function Markdown({ text, className = "" }: { text: string; className?: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let para: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let k = 0;

  const flushPara = () => {
    if (para.length) {
      blocks.push(<p key={k++}>{inline(para.join(" "), `p${k}`)}</p>);
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      const Tag = list.ordered ? "ol" : "ul";
      blocks.push(
        <Tag key={k++} className={`${list.ordered ? "list-decimal" : "list-disc"} space-y-2 pl-5`}>
          {list.items.map((it, i) => <li key={i}>{inline(it, `l${k}-${i}`)}</li>)}
        </Tag>
      );
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    const bullet = /^[-*]\s+(.*)$/.exec(line);
    const numbered = /^\d+[.)]\s+(.*)$/.exec(line);
    const heading = /^(#{2,3})\s+(.*)$/.exec(line);
    if (!line) {
      flushPara();
      flushList();
    } else if (heading) {
      flushPara();
      flushList();
      blocks.push(
        heading[1].length === 2 ? (
          <h2 key={k++} className="font-display text-xl text-primary-text pt-2">{inline(heading[2], `h${k}`)}</h2>
        ) : (
          <h3 key={k++} className="font-semibold text-primary-text pt-1">{inline(heading[2], `h${k}`)}</h3>
        )
      );
    } else if (bullet || numbered) {
      flushPara();
      const ordered = !!numbered;
      if (list && list.ordered !== ordered) flushList();
      if (!list) list = { ordered, items: [] };
      list.items.push((bullet ?? numbered)![1]);
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return <div className={`space-y-4 ${className}`}>{blocks}</div>;
}
