"use client";

import { useEffect } from "react";
import { useToast } from "@/components/ui/toast";
import { onSyncError } from "@/lib/budget/store";

/** Surfaces failed database writes as toasts. The store resyncs on its own. */
export function SyncErrors() {
  const toast = useToast();
  useEffect(() => onSyncError((message) => toast.show(`Couldn’t save — ${message}`)), [toast]);
  return null;
}
