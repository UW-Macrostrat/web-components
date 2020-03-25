/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import h from 'react-hyperscript';

const Markdown = ({src, ...rest}) => h('div', {dangerouslySetInnerHTML: {__html: src, ...rest}});

const HTML = Markdown;

export {Markdown, HTML};
