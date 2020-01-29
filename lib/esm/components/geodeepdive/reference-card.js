import { inherits as _inherits, createClass as _createClass, classCallCheck as _classCallCheck, possibleConstructorReturn as _possibleConstructorReturn, getPrototypeOf as _getPrototypeOf } from '../../_virtual/_rollupPluginBabelHelpers.js';
import { Component } from 'react';
import h from 'react-hyperscript';
import { APIResultView } from '../api-frontend.js';
import { LinkCard } from '../link-card.js';

var AuthorList, GDDReferenceCard, GeoDeepDiveSwatchInner, VolumeNumber;

AuthorList = function AuthorList(props) {
  var _, author, authors, etAl, i, isLast, ix, len, name, newName;

  authors = props.authors;

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

    isLast = ix === authors.length - 1 && etAl == null;

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

VolumeNumber = function VolumeNumber(props) {
  var _, number, volume;

  volume = props.volume;
  number = props.number;
  _ = [];

  if (volume != null && volume !== "") {
    _.push(h('span.volume', null, volume));
  }

  if (number != null && number !== "") {
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

GeoDeepDiveSwatchInner =
/*#__PURE__*/
function (_Component) {
  _inherits(GeoDeepDiveSwatchInner, _Component);

  function GeoDeepDiveSwatchInner() {
    _classCallCheck(this, GeoDeepDiveSwatchInner);

    return _possibleConstructorReturn(this, _getPrototypeOf(GeoDeepDiveSwatchInner).apply(this, arguments));
  }

  _createClass(GeoDeepDiveSwatchInner, [{
    key: "render",
    value: function render() {
      var author, doi, identifier, journal, link, number, title, url, volume, year;
      var _this$props = this.props;
      title = _this$props.title;
      author = _this$props.author;
      doi = _this$props.doi;
      link = _this$props.link;
      journal = _this$props.journal;
      identifier = _this$props.identifier;
      volume = _this$props.volume;
      number = _this$props.number;
      year = _this$props.year;

      try {
        var _link$find = link.find(function (d) {
          return d.type === 'publisher';
        });

        url = _link$find.url;
      } catch (error) {
        url = null;
      }

      try {
        var _identifier$find = identifier.find(function (d) {
          return d.type === 'doi';
        });

        doi = _identifier$find.id;
      } catch (error) {
        doi = null;
      }

      return h(LinkCard, {
        href: url,
        target: '_blank',
        interactive: true,
        className: 'gdd-article'
      }, [h(AuthorList, {
        authors: author
      }), ", ", h('span.title', title), ", ", h('span.journal', journal), ", ", h(VolumeNumber, {
        volume: volume,
        number: number
      }), h('span.year', year), ", ", h('span.doi-title', 'doi: '), h('span.doi', doi)]);
    }
  }]);

  return GeoDeepDiveSwatchInner;
}(Component);

GDDReferenceCard =
/*#__PURE__*/
function (_Component2) {
  _inherits(GDDReferenceCard, _Component2);

  function GDDReferenceCard() {
    _classCallCheck(this, GDDReferenceCard);

    return _possibleConstructorReturn(this, _getPrototypeOf(GDDReferenceCard).apply(this, arguments));
  }

  _createClass(GDDReferenceCard, [{
    key: "render",
    value: function render() {
      var docid;
      docid = this.props.docid;
      return h(APIResultView, {
        route: "http://geodeepdive.org/api/articles",
        params: {
          docid: docid
        },
        opts: {
          unwrapResponse: function unwrapResponse(res) {
            return res.success.data[0];
          },
          memoize: true,
          onError: console.error
        }
      }, function (data) {
        try {
          return h(GeoDeepDiveSwatchInner, data);
        } catch (error) {
          return null;
        }
      });
    }
  }]);

  return GDDReferenceCard;
}(Component);

export { AuthorList, GDDReferenceCard, GeoDeepDiveSwatchInner };
//# sourceMappingURL=reference-card.js.map
