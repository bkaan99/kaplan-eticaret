import Link from "next/link";
import {
  parseSimpleMarkdown,
  type Block,
  type Inline,
} from "@/modules/content/simple-markdown";

function Inlines({ items }: { items: Inline[] }) {
  return (
    <>
      {items.map((item, index) => {
        if (item.type === "bold")
          return <strong key={index} className="font-bold text-slate-900">{item.text}</strong>;
        if (item.type === "link") {
          const external = item.href.startsWith("http");
          return external ? (
            <a
              key={index}
              href={item.href}
              className="text-primary underline hover:text-emerald-800 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              {item.text}
            </a>
          ) : (
            <Link key={index} href={item.href} className="text-primary underline hover:text-emerald-800 transition-colors">
              {item.text}
            </Link>
          );
        }
        return <span key={index}>{item.text}</span>;
      })}
    </>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "heading":
      return block.level === 1 ? (
        <h2 className="mt-8 mb-3 text-lg sm:text-xl font-bold tracking-tight text-slate-900 border-b border-slate-100 pb-2">
          <Inlines items={block.inlines} />
        </h2>
      ) : (
        <h3 className="mt-5 mb-2 text-base font-bold text-slate-800">
          <Inlines items={block.inlines} />
        </h3>
      );
    case "list":
      return (
        <ul className="list-disc pl-5 space-y-1.5 text-sm sm:text-base text-slate-600 my-2">
          {block.items.map((item, index) => (
            <li key={index} className="leading-relaxed">
              <Inlines items={item} />
            </li>
          ))}
        </ul>
      );
    case "paragraph":
      return (
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed my-1">
          <Inlines items={block.inlines} />
        </p>
      );
  }
}

/** Yönetim panelinden girilen metni güvenli biçimde (HTML basmadan) gösterir. */
export function RichText({ source }: { source: string }) {
  const blocks = parseSimpleMarkdown(source);

  return (
    <div className="flex flex-col gap-2">
      {blocks.map((block, index) => (
        <BlockView key={index} block={block} />
      ))}
    </div>
  );
}
