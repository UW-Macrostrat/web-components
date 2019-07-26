import { Component } from 'react';
import h from 'react-hyperscript';
import { APIResultView } from '../api-frontend.coffee';
import { LinkCard } from '../link-card.coffee';

var AuthorList, GDDReferenceCard, GeoDeepDiveSwatchInner, VolumeNumber;

AuthorList = function(props) {
  var _, author, authors, etAl, i, isLast, ix, len, name, newName;
  ({authors} = props);
  if (authors.length >= 4) {
    authors = authors.slice(0, 2);
    etAl = ' et al.';
  }
  _ = [];
  for (ix = i = 0, len = authors.length; i < len; ix = ++i) {
    author = authors[ix];
    try {
      name = author.name.split(',');
      newName = name[1].trim() + " " + name[0].trim();
    } catch (error) {
      name = author.name;
    }
    isLast = ix === authors.length - 1 && (etAl == null);
    if (isLast) {
      _.pop();
      _.push(' and ');
    }
    _.push(h('span.author', name));
    if (!isLast) {
      _.push(', ');
    }
  }
  if (etAl != null) {
    _.pop();
    _.push(etAl);
  }
  return h('span.authors', _);
};

VolumeNumber = function(props) {
  var _, number, volume;
  ({volume, number} = props);
  _ = [];
  if ((volume != null) && volume !== "") {
    _.push(h('span.volume', null, volume));
  }
  if ((number != null) && number !== "") {
    _.push("(");
    _.push(h('span.number', number));
    _.push(")");
  }
  if (_.length === 0) {
    return null;
  }
  _.push(", ");
  return h('span', null, _);
};

GeoDeepDiveSwatchInner = class GeoDeepDiveSwatchInner extends Component {
  render() {
    var author, doi, identifier, journal, link, number, title, url, volume, year;
    ({title, author, doi, link, journal, identifier, volume, number, year} = this.props);
    try {
      ({url} = link.find(function(d) {
        return d.type === 'publisher';
      }));
    } catch (error) {
      url = null;
    }
    try {
      ({
        id: doi
      } = identifier.find(function(d) {
        return d.type === 'doi';
      }));
    } catch (error) {
      doi = null;
    }
    return h(LinkCard, {
      href: url,
      target: '_blank',
      interactive: true,
      className: 'gdd-article'
    }, [
      h(AuthorList,
      {
        authors: author
      }),
      ", ",
      h('span.title',
      title),
      ", ",
      h('span.journal',
      journal),
      ", ",
      h(VolumeNumber,
      {volume,
      number}),
      h('span.year',
      year),
      ", ",
      h('span.doi-title',
      'doi: '),
      h('span.doi',
      doi)
    ]);
  }

};

GDDReferenceCard = class GDDReferenceCard extends Component {
  render() {
    var docid;
    ({docid} = this.props);
    return h(APIResultView, {
      route: "http://geodeepdive.org/api/articles",
      params: {docid},
      opts: {
        unwrapResponse: function(res) {
          return res.success.data[0];
        },
        memoize: true,
        onError: console.error
      }
    }, (data) => {
      try {
        return h(GeoDeepDiveSwatchInner, data);
      } catch (error) {
        return null;
      }
    });
  }

};

export { AuthorList, GDDReferenceCard };
