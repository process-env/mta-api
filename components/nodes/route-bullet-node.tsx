"use client";

import { Handle, Position } from "reactflow";
import { cn } from "@/lib/utils";

export interface RouteBulletNodeData {
  label: string;
  color: string;
}

export function RouteBulletNode({ data }: { data: RouteBulletNodeData }) {
  return (
    <div
      className={cn(
        "flex h-16 w-16 items-center justify-center rounded-full border-4 border-white text-2xl font-black text-white shadow-lg",
      )}
      style={{ backgroundColor: data.color }}
    >
      <Handle type="target" position={Position.Left} className="hidden" />
      {data.label}
    </div>
  );
}
