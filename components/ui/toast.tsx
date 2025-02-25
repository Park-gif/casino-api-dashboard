"use client"

import * as React from "react"
import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
  return <SonnerToaster />
}

export function useToast() {
  return {
    toast: (props: { title?: string; description?: string; variant?: "default" | "destructive" }) => {
      console.log(props.title, props.description);
    }
  }
} 