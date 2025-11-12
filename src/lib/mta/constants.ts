export const ROUTE_COLORS: Record<string, string> = {
  "1": "#EE352E",
  "2": "#EE352E",
  "3": "#EE352E",
  "4": "#00933C",
  "5": "#00933C",
  "6": "#00933C",
  "7": "#B933AD",
  "A": "#0039A6",
  "C": "#0039A6",
  "E": "#0039A6",
  "B": "#FF6319",
  "D": "#FF6319",
  "F": "#FF6319",
  "M": "#FF6319",
  "G": "#6CBE45",
  "J": "#996633",
  "Z": "#996633",
  "L": "#A7A9AC",
  "N": "#FCCC0A",
  "Q": "#FCCC0A",
  "R": "#FCCC0A",
  "W": "#FCCC0A",
  "S": "#808183",
};

export const FEED_GROUPS = [
  "ACE",
  "BDFM",
  "G",
  "JZ",
  "NQRW",
  "L",
  "SI",
  "1234567",
] as const;

export type FeedGroupId = (typeof FEED_GROUPS)[number];

export const FEED_PATHS: Record<FeedGroupId, string> = {
  ACE: "nyct/subway/gtfs-ace",
  BDFM: "nyct/subway/gtfs-bdfm",
  G: "nyct/subway/gtfs-g",
  JZ: "nyct/subway/gtfs-jz",
  NQRW: "nyct/subway/gtfs-nqrw",
  L: "nyct/subway/gtfs-l",
  SI: "nyct/subway/gtfs-si",
  "1234567": "nyct/subway/gtfs",
};
