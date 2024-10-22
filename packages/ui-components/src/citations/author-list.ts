import h from "@macrostrat/hyper";

const Author = function (props) {
  const { name, highlight } = props;

  if (name === highlight) {
    return h("b.author", name);
  }
  return h("span.author", name);
};

export interface AuthorListProps {
  names: string[];
  highlight?: string;
  limit?: number;
}

const AuthorList = function (props: AuthorListProps) {
  const { names, highlight } = props;
  const A = (name) => h(Author, { name, highlight });

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

  const limit = props.limit ?? n;
  const truncated = n > limit;

  const penultimateIx = limit - 2;
  const L = [];

  for (const [i, name] of names.entries()) {
    L.push(A(name));
    L.push(i < penultimateIx && n != 2 ? ", " : " ");
    if (i === penultimateIx - 1 && n != 1 && !truncated) {
      const lastAuthor = names[penultimateIx];
      if (!lastAuthor.startsWith("and ")) {
        L.push("and ");
      }
    }
    if (i >= limit - 1 && truncated) {
      L.push("et al.");
      break;
    }
  }

  return h("span.author-list", L);
};

export { AuthorList };
