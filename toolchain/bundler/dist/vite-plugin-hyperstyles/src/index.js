import MagicString from "magic-string";
const cssModuleMatcher = /\.module\.(css|scss|sass|less|styl|stylus|pcss|sss)$/;
export default function hyperStyles() {
    return {
        name: "hyper-styles",
        enforce: "post",
        // Post-process the output to add the hyperStyled import
        transform(code, id) {
            if (!cssModuleMatcher.test(id)) {
                return;
            }
            const code0 = new MagicString(code);
            // Just add sourcemaps
            ///dd https://github.com/Rich-Harris/magic-string/issues/13
            code0.replace("export default ", "const styles = ");
            code0.prepend(`import hyper from "@macrostrat/hyper";\n`);
            code0.append(`
        let h = hyper.styled(styles);
        // Keep backwards compatibility with the existing default style object.
        Object.assign(h, styles);
        export default h;`);
            // Generate source map
            const map = code0.generateMap();
            const codeString = code0.toString();
            return {
                code: codeString,
                map,
            };
        },
    };
}
