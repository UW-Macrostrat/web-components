import h from 'react-hyperscript';

var HTML, Markdown;

Markdown = function({src, ...rest}) {
  return h('div', {
    dangerouslySetInnerHTML: {
      __html: src,
      ...rest
    }
  });
};

HTML = Markdown;

export { HTML, Markdown };
