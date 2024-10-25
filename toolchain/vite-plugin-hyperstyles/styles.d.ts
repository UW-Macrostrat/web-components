import { Hyper } from "@macrostrat/hyper";

type Classes = { readonly [key: string]: string };

type StyledHyper = Classes & Hyper;

// Style modules
declare module "*.module.styl" {
  const classes: { readonly [key: string]: string };
  export default StyledHyper;
}

// Override declarations for sass module
declare module "*.module.sass" {
  const classes: Classes;
  export default StyledHyper;
}

// Override declarations for sass module
declare module "*.module.scss" {
  const classes: { [key: string]: string };
  export default StyledHyper;
}

declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default StyledHyper;
}

export {};
