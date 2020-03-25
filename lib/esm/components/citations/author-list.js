import h from 'react-hyperscript';

var Author, AuthorList;

Author = function Author(props) {
  var highlight, name;
  name = props.name;
  highlight = props.highlight;

  if (name === highlight) {
    return h('b.author', name);
  }

  return h('span.author', name);
};

AuthorList = function AuthorList(props) {
  var A, L, highlight, i, j, len, n, name, names;
  names = props.names;
  highlight = props.highlight;

  A = function A(name) {
    return h(Author, {
      name: name,
      highlight: highlight
    });
  };

  if (!Array.isArray(names)) {
    return A(names);
  }

  n = names.length;

  if (n === 0) {
    return null;
  }

  if (n === 1) {
    return A(names[0]);
  }

  L = [];

  for (i = j = 0, len = names.length; j < len; i = ++j) {
    name = names[i];
    L.push(A(name));

    if (i <= n - 2) {
      L.push(n > 2 ? ", " : " ");
    }

    if (i === n - 2) {
      L.push("and ");
    }
  }

  return h('span.author-list', L);
};

export { AuthorList };
//# sourceMappingURL=author-list.js.map
