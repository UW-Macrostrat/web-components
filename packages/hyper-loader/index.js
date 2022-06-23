const splitLines = (str) => str.split(/\r\n|\r|\n/);

module.exports = function (source) {
  const options = this.getOptions();

  const lines = splitLines(source);

  let newLines = lines.filter((line) => {
    return !line.match(/^\s*export default/);
  });

  const addedLines = [
    `import hyper from "@macrostrat/hyper";`,
    `const h = hyper.styled(content && content.locals ? content.locals : {});`,
    `export default h;`,
  ];

  newLines = [...newLines, ...addedLines];

  const newSrc = newLines.join("\n");

  return newSrc;
  // Apply some transformations to the source...
};
