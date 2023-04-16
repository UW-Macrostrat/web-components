declare module "*.module.scss" {
  const classes: { [key: string]: string };
  export = classes;
}

declare module "*.scss";
declare module "*.sass";
