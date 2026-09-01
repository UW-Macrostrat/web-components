/** States of the map interface shell, rendered around a real Mapbox map.
 *
 * These complement the box-based stories in `map-interface.stories.ts`, which
 * exercise the same layout with colored placeholders instead of a live map.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import h from "@macrostrat/hyper";
import { buildMacrostratStyle } from "@macrostrat/map-styles";
import { LoremIpsum } from "lorem-ipsum";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  DetailPanelStyle,
  FloatingNavbar,
  LocationPanel,
  MapAreaContainer,
  MapLoadingButton,
  MapMarker,
  MapView,
  PanelCard,
  useBasicMapStyle,
} from "../src";

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;
const macrostratOverlayStyles = [buildMacrostratStyle()];

const lorem = new LoremIpsum();

function blurbFor(nParagraphs: number): ReactNode[] {
  return lorem
    .generateParagraphs(nParagraphs)
    .split("\n")
    .map((p) => h("p", p));
}

const denver = {
  camera: { lat: 39.7392, lng: -104.9903, altitude: 400000 },
};

interface MapShellProps {
  detailPanelStyle?: DetailPanelStyle;
  /** Show the detail panel on load */
  detailPanelOpen?: boolean;
  contextPanelOpen?: boolean;
  contextPanel?: ReactNode;
  bottomPanel?: ReactNode;
  overlayStyles?: any[];
  showPanelOutlines?: boolean;
  style?: Record<string, any>;
  title?: string;
}

/** A minimal but realistic map page: navbar, context panel, and a detail
 * panel that opens when a location is picked. */
function MapShell(props: MapShellProps) {
  const {
    detailPanelStyle = DetailPanelStyle.FLOATING,
    detailPanelOpen = true,
    contextPanelOpen: initialContextPanelOpen = true,
    contextPanel,
    bottomPanel,
    overlayStyles = macrostratOverlayStyles,
    title = "Macrostrat",
    ...rest
  } = props;

  const [contextPanelOpen, setContextPanelOpen] = useState(
    initialContextPanelOpen,
  );
  const [position, setPosition] = useState<any>(
    detailPanelOpen ? { lng: -104.9903, lat: 39.7392 } : null,
  );

  const mapStyle = useBasicMapStyle({ styleType: "standard" });

  let detailPanel: ReactNode = null;
  if (position != null) {
    detailPanel = h(
      LocationPanel,
      { position, onClose: () => setPosition(null) },
      blurbFor(4),
    );
  }

  let _contextPanel: ReactNode = contextPanel;
  if (_contextPanel === undefined) {
    _contextPanel = h(PanelCard, [h("h3", "Layers"), ...blurbFor(2)]);
  }

  return h(
    MapAreaContainer,
    {
      navbar: h(FloatingNavbar, {
        title,
        rightElement: h(MapLoadingButton, {
          large: true,
          active: contextPanelOpen,
          onClick: () => setContextPanelOpen(!contextPanelOpen),
          icon: contextPanelOpen ? "chevron-left" : "chevron-right",
        }),
      }),
      contextPanel: _contextPanel,
      contextPanelOpen,
      detailPanel,
      detailPanelStyle,
      bottomPanel,
      ...rest,
    },
    h(
      MapView,
      {
        style: mapStyle,
        mapPosition: denver,
        projection: { name: "globe" },
        mapboxToken,
        overlayStyles,
      },
      h(MapMarker, { position, setPosition }),
    ),
  );
}

const meta: Meta<typeof MapShell> = {
  title: "Map interface/Panel layouts",
  component: MapShell,
  parameters: {
    layout: "fullscreen",
    docs: { story: { inline: false, iframeHeight: 500 } },
  },
  argTypes: {
    detailPanelStyle: {
      control: "inline-radio",
      options: [DetailPanelStyle.FLOATING, DetailPanelStyle.FIXED],
    },
  },
};

export default meta;

type Story = StoryObj<typeof MapShell>;

/** Panels float above the map, which extends underneath them. */
export const FloatingPanels: Story = {
  args: { detailPanelStyle: DetailPanelStyle.FLOATING },
};

/** The detail panel is docked to the right and the map area shrinks to fit,
 * so the visible map is a well-defined rectangle. */
export const FixedDetailPanel: Story = {
  args: { detailPanelStyle: DetailPanelStyle.FIXED },
};

/** The fixed panel closed: the map reclaims the full width. */
export const FixedDetailPanelClosed: Story = {
  args: {
    detailPanelStyle: DetailPanelStyle.FIXED,
    detailPanelOpen: false,
  },
};

/** Only the navbar remains in the context stack. Toggle it with the
 * navbar button. */
export const ContextPanelCollapsed: Story = {
  args: { contextPanelOpen: false },
};

/** No context panel at all — just a floating navbar over the map. */
export const NavbarOnly: Story = {
  args: { contextPanel: null, detailPanelOpen: false },
};

/** A bottom panel below the map row, e.g. for a cross-section. */
export const WithBottomPanel: Story = {
  args: {
    detailPanelOpen: false,
    bottomPanel: h(
      PanelCard,
      { style: { height: 150, overflowY: "auto" } },
      blurbFor(1),
    ),
  },
};

/** Panel regions outlined, for checking the layout geometry. */
export const WithPanelOutlines: Story = {
  args: {
    detailPanelStyle: DetailPanelStyle.FIXED,
    showPanelOutlines: true,
  },
};

/** Panel widths driven by CSS custom properties. */
export const NarrowPanels: Story = {
  args: {
    detailPanelStyle: DetailPanelStyle.FIXED,
    style: {
      "--map-context-stack-width": "18em",
      "--map-detail-stack-width": "20em",
    },
  },
};

/** The basic Mapbox style, with no Macrostrat geology overlaid. */
export const NoGeologicOverlay: Story = {
  args: { overlayStyles: [] },
};
