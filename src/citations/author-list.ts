/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import h from 'react-hyperscript';

const Author = function(props){
  const {name, highlight} = props;

  if (name === highlight) {
    return h('b.author', name);
  }
  return h('span.author', name);
};

interface AuthorListProps {
  names: string[],
  highlight: string
}

const AuthorList = function(props: AuthorListProps){
  const {names, highlight} = props;
  const A = name => h(Author, {name, highlight});

  if (!Array.isArray(names)) {
    return A(names);
  }

  const n = names.length;
  if (n === 0) {
    return null;
  }
  if (n === 1) {
    return A(names[0]);
  }

  const L = [];
  for (const [i, name] of names.entries()) {
    L.push(A(name));
    if (i <= (n-2)) {
      L.push(n > 2 ? ", " : " ");
    }
    if (i === (n-2) && n != 1) {
      L.push("and ");
    }
  }

  return h('span.author-list', L);
};

export {AuthorList};
