namespace global {
  declare module "*.module.scss" {
    const content: { [className: string]: string };
    export default content;
  }

  declare module "*.module.sass" {
    const content: { [className: string]: string };
    export default content;
  }
}
