"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavApp from "@/components/NavApp";
import VsCode from "@/components/VsCode";
import LockPrompt from "@/components/LockPrompt";
import type { CodeFile } from "@/lib/codebase";
import type { AccessStatus } from "@/lib/supabase";

export default function Workspace() {
  const router = useRouter();
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [accessStatus, setAccessStatus] = useState<AccessStatus>("locked");
  const [loaded, setLoaded] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);

  const locked = accessStatus !== "granted";

  const refresh = useCallback(async () => {
    const meRes = await fetch("/api/me");
    if (meRes.status === 401) {
      router.push("/login");
      return;
    }
    const me = await meRes.json();
    setAccessStatus(me.accessStatus);
    if (files.length === 0) {
      const cb = await fetch("/api/codebase");
      if (cb.ok) setFiles((await cb.json()).files);
    }
    setLoaded(true);
  }, [router, files.length]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 4000); // unlock appears automatically once granted
    return () => clearInterval(t);
  }, [refresh]);

  if (!loaded) {
    return (
      <div className="grid h-screen place-items-center bg-[#1e1e1e] text-sm text-[#858585]">
        Opening workspace…
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <NavApp />
      <div className="min-h-0 flex-1">
        <VsCode files={files} locked={locked} onLockedInteract={() => setPromptOpen(true)} />
      </div>
      <LockPrompt
        open={promptOpen}
        onClose={() => setPromptOpen(false)}
        onPay={() => router.push("/payment")}
      />
    </div>
  );
}
