/** Replacement for vite/client declaration that handles hyperscript-enhanced stylesheets
 * from the vite-plugin-hyperstyles module
 */
type CSSModuleClasses = { readonly [key: string]: string };

declare module "*.module.css" {
  import type { Hyper } from "@macrostrat/hyper";
  const h: Hyper & CSSModuleClasses;
  export default h;
}
declare module "*.module.scss" {
  import type { Hyper } from "@macrostrat/hyper";
  const h: Hyper & CSSModuleClasses;
  export default h;
}
declare module "*.module.sass" {
  import type { Hyper } from "@macrostrat/hyper";
  const h: Hyper & CSSModuleClasses;
  export default h;
}
declare module "*.module.less" {
  import type { Hyper } from "@macrostrat/hyper";
  const h: Hyper & CSSModuleClasses;
  export default h;
}
declare module "*.module.styl" {
  import type { Hyper } from "@macrostrat/hyper";
  const h: Hyper & CSSModuleClasses;
  export default h;
}
declare module "*.module.stylus" {
  import type { Hyper } from "@macrostrat/hyper";
  const h: Hyper & CSSModuleClasses;
  export default h;
}
declare module "*.module.pcss" {
  import type { Hyper } from "@macrostrat/hyper";
  const h: Hyper & CSSModuleClasses;
  export default h;
}
declare module "*.module.sss" {
  import type { Hyper } from "@macrostrat/hyper";
  const h: Hyper & CSSModuleClasses;
  export default h;
}
