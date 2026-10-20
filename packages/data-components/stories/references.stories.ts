import { Meta, StoryObj } from "@storybook/react-vite";
import "@macrostrat/style-system";
import { citationText, ReferenceList, type ReferenceRecord } from "../src";

/** `/defs/refs` records, as the unit details panel fetches them */
const records: ReferenceRecord[] = [
  {
    ref_id: 1,
    pub_year: 1985,
    author: "Childs, O.E.",
    ref: "Correlation of stratigraphic units of North America; COSUNA. AAPG Bulletin 69:173-180.",
    doi: null,
    url: null,
  },
  {
    ref_id: 16,
    pub_year: 2003,
    author: "IODP",
    ref: "Integrated Ocean Drilling Program",
    doi: null,
    url: "http://www.iodp.org",
  },
  {
    ref_id: 84,
    pub_year: 2012,
    author:
      "Dorais, M.J., Wintsch, R.P., Kunk, M.J., Aleinikoff, J., Burton, W., Underdown, C., Kerwin, C.M.",
    ref: "P-T-t Conditions, Nd, and Pb, Isotopic Compositions and Detrital Zircon Geochronology of the Massabesic Gneiss Complex, New Hampshire: Isotopic and Metamorphic Evidence for the Identification of Gander Basement, Central New England. American Journal of Science, 312, 1049-1097",
    doi: "10.2475/10.2012.01",
    url: "",
  },
];

/** Parts of one drilling expedition's volume, in the form the API formats
 * them (illustrative) */
const volumeParts = [
  "Shipboard Scientific Party. Site 1126. In Feary, D.A., Hine, A.C., Malone, M.J., et al., Proc. ODP, Init. Repts., 182: College Station, TX (Ocean Drilling Program), 1–96. 2000. doi:10.2973/odp.proc.ir.182.104.2000",
  "Shipboard Scientific Party. Site 1127. In Feary, D.A., Hine, A.C., Malone, M.J., et al., Proc. ODP, Init. Repts., 182: College Station, TX (Ocean Drilling Program), 1–76. 2000. doi:10.2973/odp.proc.ir.182.105.2000",
  "Shipboard Scientific Party. Site 1130. In Feary, D.A., Hine, A.C., Malone, M.J., et al., Proc. ODP, Init. Repts., 182: College Station, TX (Ocean Drilling Program), 1–80. 2000. doi:10.2973/odp.proc.ir.182.108.2000",
];

const meta: Meta<typeof ReferenceList> = {
  title: "Data components/References",
  component: ReferenceList,
};

export default meta;

type Story = StoryObj<typeof ReferenceList>;

export const FromReferenceRecords: Story = {
  args: { refs: records.map(citationText) },
};

export const SingleReference: Story = {
  args: { refs: [citationText(records[0])] },
};

export const VolumeParts: Story = {
  args: { refs: [...volumeParts, citationText(records[1])] },
};
