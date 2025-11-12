import type { Node } from "reactflow";
import type { RouteBulletNodeData } from "@/components/nodes/route-bullet-node";
import type { StationPlaqueNodeData } from "@/components/nodes/station-plaque-node";

const PLAQUE_ID = "station";
const PLAQUE_WIDTH = 360;
const NODE_GAP = 24;
const BULLET_SIZE = 64;

export function createSignNodes(
  title: string,
  routes: string[],
  resolveColor: (route: string) => string
): Node<RouteBulletNodeData | StationPlaqueNodeData>[] {
  const nodes: Node<RouteBulletNodeData | StationPlaqueNodeData>[] = [];

  nodes.push({
    id: PLAQUE_ID,
    type: "stationPlaque",
    position: { x: 0, y: 40 },
    data: { title },
    draggable: false,
  });

  const startX = PLAQUE_WIDTH + NODE_GAP;
  routes.forEach((route, index) => {
    nodes.push({
      id: `${route}-${index}`,
      type: "routeBullet",
      position: { x: startX + index * (BULLET_SIZE + NODE_GAP), y: 60 },
      data: {
        label: route,
        color: resolveColor(route),
      },
      draggable: false,
    });
  });

  return nodes;
}
