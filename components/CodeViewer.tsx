"use client";

import { useMemo, useState } from "react";
import type { CodeFile } from "@/lib/codebase";

type TreeNode = {
  name: string;
  path: string;
  children: Map<string, TreeNode>;
  fileIndex?: number; // index into files[] if this node is a file
};

function buildTree(files: CodeFile[]): TreeNode {
  const root: TreeNode = { name: "", path: "", children: new Map() };
  files.forEach((f, idx) => {
    const parts = f.path.split("/");
    let node = root;
    parts.forEach((part, i) => {
      const isLeaf = i === parts.length - 1;
      let child = node.children.get(part);
      if (!child) {
        child = {
          name: part,
          path: parts.slice(0, i + 1).join("/"),
          children: new Map(),
        };
        node.children.set(part, child);
      }
      if (isLeaf) child.fileIndex = idx;
      node = child;
    });
  });
  return root;
}

function Row({
  node,
  depth,
  active,
  onPick,
  openDirs,
  toggle,
}: {
  node: TreeNode;
  depth: number;
  active: number;
  onPick: (i: number) => void;
  openDirs: Set<string>;
  toggle: (p: string) => void;
}) {
  // Sort: folders first, then files, alphabetical.
  const kids = [...node.children.values()].sort((a, b) => {
    const aDir = a.children.size > 0 ? 0 : 1;
    const bDir = b.children.size > 0 ? 0 : 1;
    if (aDir !== bDir) return aDir - bDir;
    return a.name.localeCompare(b.name);
  });

  return (
    <ul>
      {kids.map((child) => {
        const isDir = child.children.size > 0;
        const open = openDirs.has(child.path);
        const isActive = child.fileIndex === active;
        return (
          <li key={child.path}>
            <button
              onClick={() =>
                isDir ? toggle(child.path) : onPick(child.fileIndex!)
              }
              style={{ paddingLeft: 8 + depth * 12 }}
              className={`flex w-full items-center gap-1.5 truncate rounded py-1 pr-2 text-left font-mono text-xs transition ${
                isActive
                  ? "bg-lime/10 text-lime"
                  : "text-muted hover:bg-edge/40 hover:text-white"
              }`}
              title={child.path}
            >
              {isDir ? (
                <span className="text-[9px] text-muted">{open ? "▾" : "▸"}</span>
              ) : (
                <span className="text-[9px] opacity-0">•</span>
              )}
              <span className="truncate">{child.name}</span>
            </button>
            {isDir && open && (
              <Row
                node={child}
                depth={depth + 1}
                active={active}
                onPick={onPick}
                openDirs={openDirs}
                toggle={toggle}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function CodeViewer({ files }: { files: CodeFile[] }) {
  const tree = useMemo(() => buildTree(files), [files]);
  const [active, setActive] = useState(0);
  // Open the top-level folders by default.
  const [openDirs, setOpenDirs] = useState<Set<string>>(
    () => new Set([...tree.children.keys()].map((k) => k))
  );

  if (files.length === 0) {
    return (
      <div className="rounded-xl border border-edge bg-panel p-8 text-center text-sm text-muted">
        No source files found to display.
      </div>
    );
  }

  const file = files[active];

  function toggle(p: string) {
    setOpenDirs((prev) => {
      const next = new Set(prev);
      next.has(p) ? next.delete(p) : next.add(p);
      return next;
    });
  }

  return (
    <div className="grid overflow-hidden rounded-xl border border-edge bg-panel md:grid-cols-[280px_1fr]">
      <aside className="max-h-[600px] overflow-auto border-b border-edge bg-ink/50 p-2 md:border-b-0 md:border-r">
        <p className="px-2 pb-2 pt-1 font-mono text-[11px] uppercase tracking-widest text-muted">
          {files.length} files
        </p>
        <Row
          node={tree}
          depth={0}
          active={active}
          onPick={setActive}
          openDirs={openDirs}
          toggle={toggle}
        />
      </aside>

      <div className="min-w-0">
        <div className="flex items-center justify-between border-b border-edge px-4 py-2.5">
          <span className="truncate font-mono text-xs text-white">{file.path}</span>
          <span className="ml-2 shrink-0 rounded border border-edge px-2 py-0.5 font-mono text-[10px] uppercase text-muted">
            {file.language}
          </span>
        </div>
        <pre className="max-h-[600px] overflow-auto p-4 text-sm leading-relaxed">
          <code className="font-mono">
            {file.content.split("\n").map((line, i) => (
              <div key={i} className="flex">
                <span className="mr-4 w-10 shrink-0 select-none text-right text-edge">
                  {i + 1}
                </span>
                <span className="whitespace-pre text-[#e9ecdf]">{line || " "}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
