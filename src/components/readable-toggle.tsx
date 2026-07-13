"use client"

import * as React from "react"
import { Type, CaseSensitive } from "lucide-react"
import { useReadableMode } from "@/components/readable-mode"

import { Button } from "@/components/ui/button"

export function ReadableToggle() {
  const { readable, toggleReadable } = useReadableMode()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleReadable}
      aria-pressed={readable}
      className="rounded-full w-9 h-9 border border-border"
    >
      <Type className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all [.readable_&]:rotate-90 [.readable_&]:scale-0" />
      <CaseSensitive className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all [.readable_&]:rotate-0 [.readable_&]:scale-100" />
      <span className="sr-only">Toggle readable mode</span>
    </Button>
  )
}
