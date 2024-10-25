import { Plugin } from "vite";

const cssModuleMatcher = /\.module\.(css|scss|sass|styl)$/;

export default function hyperStyles(): Plugin {
  return {
    name: "hyper-styles",
    enforce: "post",
    // Post-process the output to add the hyperStyled import
    transform(code, id) {
      const code1 = code.replace("export default", "const styles =");
      if (cssModuleMatcher.test(id)) {
        //const code2 = code1 + "\nexport default styles\n";
        return `import hyper from "@macrostrat/hyper";
        ${code1}
        let h = hyper.styled(styles);
        // Keep backwards compatibility with the existing default style object.
        Object.assign(h, styles);
        export default h;`;
      }
    },
  };
}
