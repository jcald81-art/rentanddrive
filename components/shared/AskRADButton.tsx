"use client"

import { useState } from "react"
import { RADChat } from "@/components/shared/RADChat"

export function AskRADButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open RAD chat"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 14px",
          backgroundColor: "#CC0000",
          color: "#ffffff",
          border: "none",
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M1 1h12a1 1 0 011 1v7a1 1 0 01-1 1H4l-3 2V2a1 1 0 011-1z"
            fill="#ffffff"
            opacity="0.9"
          />
        </svg>
        Ask RAD
      </button>

      <RADChat isOpen={open} onClose={() => setOpen(false)} />
    </>
  )
}
