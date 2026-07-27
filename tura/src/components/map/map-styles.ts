import type { MapStyleId } from "@/lib/types";

export interface MapStyleDefinition {
  id: MapStyleId;
  label: string;
  description: string;
  url: string;
  attribution: string;
  maxZoom: number;
  /** Applied to the tile pane so the theme stays coherent over the imagery. */
  filter?: string;
}

/**
 * Raster tile sources that need no API key and no account.
 *
 * All three are usable under their own attribution terms, which is why the
 * attribution control is left switched on rather than hidden.
 */
export const MAP_STYLES: Record<MapStyleId, MapStyleDefinition> = {
  terrain: {
    id: "terrain",
    label: "Terrain",
    description: "Contours, crags and paths — the one to plan a route on",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
    maxZoom: 17,
  },
  satellite: {
    id: "satellite",
    label: "Satellite",
    description: "Real imagery — see the actual ground before you commit",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Imagery &copy; Esri, Maxar, Earthstar Geographics and the GIS User Community",
    maxZoom: 18,
  },
  outdoors: {
    id: "outdoors",
    label: "Outdoors",
    description: "Trails, bridleways and access land, drawn plainly",
    url: "https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, tiles by <a href="https://www.cyclosm.org">CyclOSM</a>',
    maxZoom: 18,
  },
};

export const MAP_STYLE_LIST = Object.values(MAP_STYLES);
