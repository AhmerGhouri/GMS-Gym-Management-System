"use client"

import { useToast } from "@/components/ui/use-toast"
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm">
      {toasts.map((toast) => {
        const Icon = toast.variant === "destructive" ? AlertCircle
          : toast.variant === "success" ? CheckCircle2
          : Info

        return (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto relative flex w-full items-start gap-3 rounded-lg border p-4 shadow-lg backdrop-blur-sm transition-all animate-in slide-in-from-bottom-5",
              toast.variant === "destructive"
                ? "border-red-500/30 bg-red-950/90 text-red-200"
                : toast.variant === "success"
                ? "border-emerald-500/30 bg-emerald-950/90 text-emerald-200"
                : "border-slate-700 bg-slate-900/95 text-slate-200"
            )}
          >
            <Icon className={cn(
              "h-5 w-5 mt-0.5 shrink-0",
              toast.variant === "destructive" ? "text-red-400"
                : toast.variant === "success" ? "text-emerald-400"
                : "text-cyan-400"
            )} />
            <div className="flex-1">
              {toast.title && (
                <div className="text-sm font-semibold">{toast.title}</div>
              )}
              {toast.description && (
                <div className="text-sm opacity-80 mt-0.5">{toast.description}</div>
              )}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="shrink-0 rounded-md p-1 opacity-50 hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
