"use client"

import { useState } from "react"
import { RADChat } from "@/components/shared/RADChat"

export function RADFloatingButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Only show the trigger when chat is closed */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open RAD chat"
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 38,
            width: 52,
            height: 52,
            borderRadius: "50%",
            backgroundColor: "#CC0000",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px rgba(204,0,0,0.35)",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path
              d="M2 2h18a1 1 0 011 1v11a1 1 0 01-1 1H6l-4 3V3a1 1 0 011-1z"
              fill="#ffffff"
            />
          </svg>
        </button>
      )}

      <RADChat isOpen={open} onClose={() => setOpen(false)} />
    </>
  )
}
