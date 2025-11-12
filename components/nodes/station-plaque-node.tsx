"use client";

import { Handle, Position } from "reactflow";

export interface StationPlaqueNodeData {
  title: string;
  subtitle?: string;
}

export function StationPlaqueNode({ data }: { data: StationPlaqueNodeData }) {
  return (
    <div className="flex h-40 w-[360px] flex-col justify-center rounded-2xl bg-black px-8 py-6 shadow-lg">
      <Handle type="source" position={Position.Right} className="hidden" />
      <div className="text-2xl font-bold text-white md:text-3xl">{data.title}</div>
      {data.subtitle ? (
        <div className="mt-2 text-lg font-semibold text-zinc-300">{data.subtitle}</div>
      ) : null}
    </div>
  );
}
