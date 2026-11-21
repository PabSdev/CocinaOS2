"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cn } from "cn"

function Tabs({ className, ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-3", className)}
      {...props}
    />
  )
}

function TabsList({ className, ...props }: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-10 items-center justify-start gap-1 rounded-full border border-[#e1e9f0] bg-[#eff4f8] p-1 text-[#465870]",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "group/trigger inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#112747]/40 disabled:pointer-events-none disabled:opacity-50 text-[#465870] hover:bg-[#e1e9f0]/70 hover:text-[#112747] data-[selected]:bg-[#112747] data-[selected]:font-semibold data-[selected]:text-white data-[selected]:shadow-[0_4px_12px_-2px_rgba(17,39,71,0.28)] aria-selected:bg-[#112747] aria-selected:font-semibold aria-selected:text-white aria-selected:shadow-[0_4px_12px_-2px_rgba(17,39,71,0.28)] cursor-pointer",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("outline-none focus-visible:ring-0", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
