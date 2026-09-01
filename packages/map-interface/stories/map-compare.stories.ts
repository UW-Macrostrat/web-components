/** "Swipe to compare" between two synchronized maps, inside the map interface
 * shell with a fixed detail panel. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import h from "@macrostrat/hyper";
import { buildMacrostratStyle } from "@macrostrat/map-styles";
import { LoremIpsum } from "lorem-ipsum";
import type { ReactNode } from "react";
import { useState } from "react";
import { Switch } from "@blueprintjs/core";
import {
  CompareMapView,
  DetailPanelStyle,
  FloatingNavbar,
  MapAreaContainer,
  PanelCard,
  getBasicMapStyle,
  useBasicMapStyle,
} from "../src";
import { MapboxMapProvider } from "@macrostrat/mapbox-react";
import type { CompareMapViewProps, CompareOrientation } from "../src";

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;
const macrostratOverlayStyles = [buildMacrostratStyle()];

const lorem = new LoremIpsum();

const grandCanyon = {
  camera: { lat: 36.1069, lng: -112.1129, altitude: 200000 },
};

/** Low and pitched, which puts both maps into 3D terrain mode */
const grandCanyonOblique = {
  camera: {
    lat: 36.0968,
    lng: -112.1129,
    altitude: 6000,
    pitch: 65,
    bearing: 30,
  },
};

interface CompareDemoProps {
  orientation?: CompareOrientation;
  detailPanelStyle?: DetailPanelStyle;
  showDetailPanel?: boolean;
  showPanelOutlines?: boolean;
  /** Controlled slider position, as a fraction of the map's width/height */
  sliderPosition?: number;
  mapPosition?: any;
  /** Passed through to both maps */
  enableTerrain?: boolean;
}

const blurb = lorem
  .generateParagraphs(2)
  .split("\n")
  .map((p) => h("p", p));

function CompareDemo(props: CompareDemoProps) {
  const {
    orientation = "vertical",
    detailPanelStyle = DetailPanelStyle.FIXED,
    showDetailPanel = true,
    sliderPosition,
    mapPosition = grandCanyon,
    enableTerrain,
    ...rest
  } = props;

  const [geologyOnRight, setGeologyOnRight] = useState(true);
  const [position, setPosition] = useState<number | null>(null);

  const baseStyle = useBasicMapStyle({ styleType: "standard" });

  // Shared map props go to both sides; only the overlay differs between them.
  const plain: Partial<CompareMapViewProps> = { overlayStyles: [] };
  const geology: Partial<CompareMapViewProps> = {
    overlayStyles: macrostratOverlayStyles,
  };

  let before = plain;
  let after = geology;
  if (!geologyOnRight) {
    before = geology;
    after = plain;
  }

  let detailPanel: ReactNode = null;
  if (showDetailPanel) {
    detailPanel = h(PanelCard, [
      h("h3", "Comparison"),
      h(Switch, {
        checked: geologyOnRight,
        label: "Geology on the far side of the divider",
        onChange: () => setGeologyOnRight(!geologyOnRight),
      }),
      h("p", `Divider position: ${formatPosition(position)}`),
      ...blurb,
    ]);
  }

  return h(
    MapAreaContainer,
    {
      navbar: h(FloatingNavbar, { title: "Compare maps" }),
      contextPanel: null,
      detailPanel,
      detailPanelStyle,
      ...rest,
    },
    h(CompareMapView, {
      // Props shared by both maps, exactly as they'd be passed to `MapView`
      style: baseStyle,
      mapPosition,
      mapboxToken,
      enableTerrain,
      before,
      after,
      orientation,
      sliderPosition,
      onSlide: setPosition,
    }),
  );
}

function formatPosition(position: number | null): string {
  if (position == null) return "—";
  return `${Math.round(position * 100)}%`;
}

const meta: Meta<typeof CompareDemo> = {
  title: "Map interface/Compare maps",
  component: CompareDemo,
  parameters: {
    layout: "fullscreen",
    docs: { story: { inline: false, iframeHeight: 500 } },
  },
  argTypes: {
    orientation: {
      control: "inline-radio",
      options: ["vertical", "horizontal"],
    },
    detailPanelStyle: {
      control: "inline-radio",
      options: [DetailPanelStyle.FLOATING, DetailPanelStyle.FIXED],
    },
  },
};

export default meta;

type Story = StoryObj<typeof CompareDemo>;

/** A vertical divider inside the fixed-panel layout, where the map region is a
 * well-defined rectangle beside the detail panel. */
export const FixedPanel: Story = {
  args: { detailPanelStyle: DetailPanelStyle.FIXED },
};

/** Comparing top against bottom rather than left against right. */
export const HorizontalDivider: Story = {
  args: { orientation: "horizontal" },
};

/** The divider position is driven from outside the component. */
export const ControlledSlider: Story = {
  args: { sliderPosition: 0.25 },
};

/** Without the detail panel, the compare view fills the whole frame. */
export const NoDetailPanel: Story = {
  args: { showDetailPanel: false },
};

/** Both maps pitched down over the Grand Canyon, low enough that `MapView`
 * switches them into 3D terrain mode. Terrain is applied per map, so each pane
 * drapes its own style over the DEM. */
export const Terrain3D: Story = {
  args: { mapPosition: grandCanyonOblique },
};

/** The same oblique camera with terrain switched off, for comparison. */
export const ObliqueWithoutTerrain: Story = {
  args: { mapPosition: grandCanyonOblique, enableTerrain: false },
};

/** In the floating layout the panels overlay the map, so the divider spans the
 * full frame and passes beneath them. */
export const FloatingPanel: Story = {
  args: { detailPanelStyle: DetailPanelStyle.FLOATING },
};

/** `CompareMapView` takes `MapView`'s props, so it can also be dropped into a
 * page at a fixed size rather than filling a map interface. `standalone` opts
 * out of overflowing the surrounding map UI, exactly as it does on `MapView`. */
export const SmallStandalone: Story = {
  parameters: { layout: "centered" },
  render() {
    return h(
      MapboxMapProvider,
      h(CompareMapView, {
        standalone: true,
        height: 400,
        width: 600,
        style: getBasicMapStyle({ styleType: "standard" }),
        mapPosition: grandCanyon,
        mapboxToken,
        after: { overlayStyles: macrostratOverlayStyles },
      }),
    );
  },
};
