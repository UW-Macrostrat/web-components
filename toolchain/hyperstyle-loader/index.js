module.exports = function (source) {
  const options = this.getOptions();

  const lines = splitLines(source);

  let newLines = lines.filter((line) => {
    return !line.match(/^\s*export default/);
  });

  const addedLines = [
    `import hyper from "@macrostrat/hyper";`,
    `const styles = content && content.locals ? content.locals : {}`,
    `let h = hyper.styled(styles);`,
    // Keep backwards compatibility with the existing default style object.
    `Object.assign(h, styles);`,
    `export default h;`,
  ];

  newLines = [...newLines, ...addedLines];

  const newSrc = newLines.join("\n");

  return newSrc;
  // Apply some transformations to the source...
};

const splitLines = (str) => str.split(/\r\n|\r|\n/);
