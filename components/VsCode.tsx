"use client";

import { Fragment, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  FileText,
  Lock,
  Download,
  GitBranch,
  CheckCircle2,
} from "lucide-react";
import type { CodeFile } from "@/lib/codebase";
import { BRAND } from "@/lib/brand";

/* ---------- file tree ---------- */
type TreeNode = {
  name: string;
  path: string;
  children: Map<string, TreeNode>;
  fileIndex?: number;
};

function buildTree(files: CodeFile[]): TreeNode {
  const root: TreeNode = { name: "", path: "", children: new Map() };
  files.forEach((f, idx) => {
    const parts = f.path.split("/");
    let node = root;
    parts.forEach((part, i) => {
      let child = node.children.get(part);
      if (!child) {
        child = { name: part, path: parts.slice(0, i + 1).join("/"), children: new Map() };
        node.children.set(part, child);
      }
      if (i === parts.length - 1) child.fileIndex = idx;
      node = child;
    });
  });
  return root;
}

/* ---------- minimal syntax highlighting ---------- */
const KEYWORDS = new Set([
  "const", "let", "var", "function", "return", "if", "else", "for", "while",
  "import", "from", "export", "default", "class", "new", "async", "await",
  "try", "catch", "throw", "typeof", "instanceof", "this", "super", "extends",
  "def", "self", "lambda", "pass", "with", "as", "in", "is", "not", "and", "or",
  "true", "false", "null", "undefined", "None", "True", "False", "public",
  "private", "interface", "type", "enum", "void", "string", "number", "boolean",
]);

function colorWords(s: string, keyBase: string) {
  return s.split(/(\b)/).map((w, i) => {
    if (KEYWORDS.has(w)) return <span key={keyBase + i} className="text-[#569CD6]">{w}</span>;
    if (/^\d+(\.\d+)?$/.test(w)) return <span key={keyBase + i} className="text-[#B5CEA8]">{w}</span>;
    return <Fragment key={keyBase + i}>{w}</Fragment>;
  });
}

function highlight(line: string, lineNo: number) {
  if (!line) return " ";
  const nodes: React.ReactNode[] = [];
  const re = /(\/\/.*|#.*|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(line))) {
    if (m.index > last) nodes.push(<Fragment key={`u${lineNo}-${k++}`}>{colorWords(line.slice(last, m.index), `w${lineNo}-${k}`)}</Fragment>);
    const t = m[0];
    const cls = t.startsWith("//") || t.startsWith("#") ? "text-[#6A9955]" : "text-[#CE9178]";
    nodes.push(<span key={`t${lineNo}-${k++}`} className={cls}>{t}</span>);
    last = re.lastIndex;
  }
  if (last < line.length) nodes.push(<Fragment key={`u${lineNo}-${k++}`}>{colorWords(line.slice(last), `w${lineNo}-${k}`)}</Fragment>);
  return nodes;
}

/* ---------- explorer rows ---------- */
function Rows({
  node, depth, active, onPick, open, toggle,
}: {
  node: TreeNode; depth: number; active: number;
  onPick: (i: number) => void; open: Set<string>; toggle: (p: string) => void;
}) {
  const kids = [...node.children.values()].sort((a, b) => {
    const ad = a.children.size > 0 ? 0 : 1;
    const bd = b.children.size > 0 ? 0 : 1;
    return ad !== bd ? ad - bd : a.name.localeCompare(b.name);
  });
  return (
    <>
      {kids.map((child) => {
        const isDir = child.children.size > 0;
        const isOpen = open.has(child.path);
        const isActive = child.fileIndex === active;
        return (
          <div key={child.path}>
            <button
              onClick={() => (isDir ? toggle(child.path) : onPick(child.fileIndex!))}
              style={{ paddingLeft: 12 + depth * 12 }}
              className={`flex w-full items-center gap-1 truncate py-[3px] pr-2 text-left text-[13px] transition ${
                isActive ? "bg-[#37373d] text-white" : "text-[#cccccc] hover:bg-[#2a2d2e]"
              }`}
            >
              <span className="flex w-3 justify-center text-[#858585]">
                {isDir ? (isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />) : null}
              </span>
              {isDir ? (
                isOpen ? <FolderOpen size={14} className="shrink-0 text-[#dcb67a]" /> : <Folder size={14} className="shrink-0 text-[#dcb67a]" />
              ) : (
                <FileText size={14} className="shrink-0 text-[#9cdcfe]" />
              )}
              <span className="truncate">{child.name}</span>
            </button>
            {isDir && isOpen && (
              <Rows node={child} depth={depth + 1} active={active} onPick={onPick} open={open} toggle={toggle} />
            )}
          </div>
        );
      })}
    </>
  );
}

export default function VsCode({
  files,
  locked,
  onLockedInteract,
}: {
  files: CodeFile[];
  locked: boolean;
  onLockedInteract: () => void;
}) {
  const tree = useMemo(() => buildTree(files), [files]);
  const defaultIndex = useMemo(() => {
    const readme = files.findIndex((f) => f.path.toLowerCase() === "readme.md");
    if (readme >= 0) return readme;
    const nonEnv = files.findIndex((f) => !f.path.toLowerCase().includes(".env"));
    return nonEnv >= 0 ? nonEnv : 0;
  }, [files]);
  const [active, setActive] = useState(defaultIndex);
  const [open, setOpen] = useState<Set<string>>(() => new Set()); // folders closed by default
  const [rootOpen, setRootOpen] = useState(false); // project folder closed by default

  const file = files[active];
  const lines = file ? file.content.split("\n") : [];

  function toggle(p: string) {
    setOpen((prev) => {
      const n = new Set(prev);
      n.has(p) ? n.delete(p) : n.add(p);
      return n;
    });
  }

  function clickRoot() {
    if (locked) {
      onLockedInteract();
      return;
    }
    setRootOpen((o) => !o);
  }

  return (
    <div className="flex h-full flex-col bg-[#1e1e1e] text-[#cccccc]">
      <div className="flex min-h-0 flex-1">
        {/* Explorer */}
        <div className="flex w-64 shrink-0 flex-col border-r border-[#1e1e1e] bg-[#252526]">
          <div className="px-4 py-2 text-[11px] uppercase tracking-wide text-[#bbbbbb]">Explorer</div>
          <div className="min-h-0 flex-1 overflow-auto pb-4">
            {/* Project root folder — closed by default, locked until paid */}
            <button
              onClick={clickRoot}
              className="flex w-full items-center gap-1 px-2 py-[3px] text-left text-[12px] font-semibold uppercase tracking-wide text-[#cccccc] hover:bg-[#2a2d2e]"
            >
              <span className="flex w-3 justify-center text-[#858585]">
                {rootOpen && !locked ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </span>
              {rootOpen && !locked ? (
                <FolderOpen size={14} className="text-[#dcb67a]" />
              ) : (
                <Folder size={14} className="text-[#dcb67a]" />
              )}
              <span>{BRAND.product.title}</span>
              {locked && <Lock size={12} className="ml-auto text-[#e2c08d]" />}
            </button>
            {rootOpen && !locked && (
              <Rows node={tree} depth={0} active={active} onPick={setActive} open={open} toggle={toggle} />
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="flex min-w-0 flex-1 flex-col bg-[#1e1e1e]">
          {/* Toolbar / tabs */}
          <div className="flex h-9 shrink-0 items-center justify-between border-b border-[#252526] bg-[#252526] text-[13px]">
            <div className="flex h-full items-center gap-2 border-r border-[#1e1e1e] bg-[#1e1e1e] px-4 text-white">
              <FileText size={14} className="text-[#9cdcfe]" />
              <span>{file ? file.path.split("/").pop() : "—"}</span>
              {locked && <Lock size={12} className="text-[#e2c08d]" />}
            </div>
            {!locked && (
              <a
                href="/api/download"
                className="mr-3 inline-flex items-center gap-1.5 rounded bg-lime px-3 py-1 text-[11px] font-semibold text-ink transition hover:bg-lime-soft"
              >
                <Download size={14} /> Download .zip
              </a>
            )}
          </div>
          {/* Breadcrumb */}
          <div className="shrink-0 border-b border-[#252526] px-4 py-1 text-[11px] text-[#858585]">
            {file ? file.path.split("/").join("  ›  ") : ""}
          </div>
          {/* Code + lock overlay */}
          <div className="relative min-h-0 flex-1 overflow-auto">
            <pre
              className={`min-w-full p-0 text-[13px] leading-[20px] transition ${
                locked ? "pointer-events-none select-none blur-[5px]" : ""
              }`}
            >
              <code className="block font-mono">
                {lines.map((line, i) => (
                  <div key={i} className="flex hover:bg-[#2a2a2a]">
                    <span className="sticky left-0 mr-4 w-12 shrink-0 select-none bg-[#1e1e1e] pr-3 text-right text-[#6e7681]">
                      {i + 1}
                    </span>
                    <span className="whitespace-pre pr-6 text-[#d4d4d4]">{highlight(line, i)}</span>
                  </div>
                ))}
              </code>
            </pre>

            {locked && (
              <button
                onClick={onLockedInteract}
                className="absolute inset-0 grid place-items-center bg-[#1e1e1e]/40"
              >
                <span className="flex flex-col items-center rounded-xl border border-edge bg-[#252526]/95 px-8 py-6 text-center shadow-2xl">
                  <Lock size={40} className="text-[#e2c08d]" />
                  <span className="mt-3 block text-lg font-semibold text-white">
                    This project is locked
                  </span>
                  <span className="mt-1 block text-sm text-[#9d9d9d]">
                    Pay to unlock the full source and download.
                  </span>
                  <span className="mt-4 inline-block rounded-md bg-lime px-5 py-2 text-sm font-semibold text-ink">
                    Pay to unlock
                  </span>
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div
        className={`flex h-6 shrink-0 items-center justify-between px-3 text-[11px] text-white ${
          locked ? "bg-[#a1260d]" : "bg-[#007acc]"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1"><GitBranch size={12} /> main</span>
          <span className="inline-flex items-center gap-1">
            {locked ? <Lock size={12} /> : <CheckCircle2 size={12} />}
            {locked ? "Locked — payment required" : "Unlocked"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>{files.length} files</span>
          <span>{file?.language ?? "text"}</span>
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
}
