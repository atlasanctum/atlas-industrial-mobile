import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from "react";

import { initialTasks, type AtlasTask, type TaskStatus } from "@/lib/atlas-data";
import { haptic } from "@/lib/haptics";

type AtlasContextValue = {
  tasks: AtlasTask[];
  toast: string | null;
  setToast: (message: string | null) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  createTask: (title: string, type?: string) => void;
  notify: (message: string, tone?: "normal" | "success" | "warning") => void;
};

const AtlasContext = createContext<AtlasContextValue | null>(null);

export function AtlasProvider({ children }: PropsWithChildren) {
  const [tasks, setTasks] = useState<AtlasTask[]>(initialTasks);
  const [toast, setToast] = useState<string | null>(null);

  const notify = useCallback((message: string, tone: "normal" | "success" | "warning" = "normal") => {
    if (tone === "success") haptic.success();
    else if (tone === "warning") haptic.warning();
    else haptic.light();
    setToast(message);
  }, []);

  const updateTaskStatus = useCallback((id: string, status: TaskStatus) => {
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, status } : task)));
    const message = status === "Completed" ? "Work verified and event recorded." : status === "In progress" ? "Work started. Your shift context is updated." : "Work status updated.";
    notify(message, status === "Completed" ? "success" : "normal");
  }, [notify]);

  const createTask = useCallback((title: string, type = "Field action") => {
    const newTask: AtlasTask = {
      id: `AT-${String(tasks.length + 120).padStart(3, "0")}`,
      title,
      type,
      location: "North Plant · Current context",
      owner: "You",
      due: "Added to this shift",
      severity: "attention",
      status: "Ready",
      resources: "Context to be confirmed",
      procedure: "Review the operational context and complete the required verification.",
      evidence: "Attach evidence before closing the task.",
    };
    setTasks((current) => [newTask, ...current]);
    notify("New work created and assigned to you.", "success");
  }, [notify, tasks.length]);

  const value = useMemo(() => ({ tasks, toast, setToast, updateTaskStatus, createTask, notify }), [tasks, toast, updateTaskStatus, createTask, notify]);
  return <AtlasContext.Provider value={value}>{children}</AtlasContext.Provider>;
}

export function useAtlas() {
  const context = useContext(AtlasContext);
  if (!context) throw new Error("useAtlas must be used within AtlasProvider");
  return context;
}
