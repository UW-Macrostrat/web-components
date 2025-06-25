import { create } from "storybook/theming";

export default create({
  base: "light",
  brandTitle: `<h1 class="page-title"><img src="https://storage.macrostrat.org/assets/web/macrostrat-icons/macrostrat-icon.svg" width="36px" height="36px"/><span>Macrostrat</span></h1>`,
  brandUrl: "https://macrostrat.org",
  brandTarget: "_self",
});
