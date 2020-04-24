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
  highlight: string,
  limit?: number
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

  const limit = props.limit ?? n
  const truncated = n > limit

  const penultimateIx = limit-1
  const L = [];
  for (const [i, name] of names.entries()) {
    L.push(A(name));
    L.push(i < penultimateIx ? ", " : " ");
    if (i === penultimateIx && n != 1 && !truncated) {
      L.push("and ");
    }
    if (i >= limit-1) {
      L.push("et al.")
      break
    }
  }

  return h('span.author-list', L);
};

export {AuthorList};
