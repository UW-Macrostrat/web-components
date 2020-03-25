'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var __chunk_1 = require('../../_virtual/_rollupPluginBabelHelpers.js');
var react = require('react');
var h = _interopDefault(require('react-hyperscript'));
var core = require('@blueprintjs/core');
var __chunk_4 = require('../api-frontend.js');
var __chunk_14 = require('../link-card.js');
var __chunk_20 = require('../citations/author-list.js');

var InnerCard, VolumeNumber;

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

InnerCard = function InnerCard(props) {
  var author, doi, identifier, journal, names, number, title, volume, year;
  title = props.title;
  author = props.author;
  doi = props.doi;
  journal = props.journal;
  identifier = props.identifier;
  volume = props.volume;
  number = props.number;
  year = props.year;

  try {
    var _identifier$find = identifier.find(function (d) {
      return d.type === 'doi';
    });

    doi = _identifier$find.id;
  } catch (error) {
    doi = null;
  }

  names = author.map(function (d) {
    var n;
    n = d.name.split(", ");
    n.reverse();
    return n.join(" ");
  });
  return h([h(__chunk_20.AuthorList, {
    names: names
  }), ", ", h('span.title', title), ", ", h('span.journal', journal), ", ", h(VolumeNumber, {
    volume: volume,
    number: number
  }), h('span.year', year), ", ", h('span.doi-title', 'doi: '), h('span.doi', doi)]);
};

exports.GeoDeepDiveSwatchInnerBare =
/*#__PURE__*/
function (_Component) {
  __chunk_1.inherits(GeoDeepDiveSwatchInnerBare, _Component);

  function GeoDeepDiveSwatchInnerBare() {
    __chunk_1.classCallCheck(this, GeoDeepDiveSwatchInnerBare);

    return __chunk_1.possibleConstructorReturn(this, __chunk_1.getPrototypeOf(GeoDeepDiveSwatchInnerBare).apply(this, arguments));
  }

  __chunk_1.createClass(GeoDeepDiveSwatchInnerBare, [{
    key: "render",
    value: function render() {
      return h(core.Card, {
        interactive: false,
        className: 'gdd-article'
      }, h(InnerCard, this.props));
    }
  }]);

  return GeoDeepDiveSwatchInnerBare;
}(react.Component);

exports.GeoDeepDiveSwatchInner =
/*#__PURE__*/
function (_Component2) {
  __chunk_1.inherits(GeoDeepDiveSwatchInner, _Component2);

  function GeoDeepDiveSwatchInner() {
    __chunk_1.classCallCheck(this, GeoDeepDiveSwatchInner);

    return __chunk_1.possibleConstructorReturn(this, __chunk_1.getPrototypeOf(GeoDeepDiveSwatchInner).apply(this, arguments));
  }

  __chunk_1.createClass(GeoDeepDiveSwatchInner, [{
    key: "render",
    value: function render() {
      var link, rest, url;
      var _this$props = this.props;
      link = _this$props.link;
      rest = __chunk_1.objectWithoutProperties(_this$props, ["link"]);

      try {
        var _link$find = link.find(function (d) {
          return d.type === 'publisher';
        });

        url = _link$find.url;
      } catch (error) {
        url = null;
      }

      return h(__chunk_14.LinkCard, {
        href: url,
        target: '_blank',
        interactive: true,
        className: 'gdd-article'
      }, h(InnerCard, rest));
    }
  }]);

  return GeoDeepDiveSwatchInner;
}(react.Component);

exports.GeoDeepDiveRelatedTerms =
/*#__PURE__*/
function (_Component3) {
  __chunk_1.inherits(GeoDeepDiveRelatedTerms, _Component3);

  function GeoDeepDiveRelatedTerms() {
    __chunk_1.classCallCheck(this, GeoDeepDiveRelatedTerms);

    return __chunk_1.possibleConstructorReturn(this, __chunk_1.getPrototypeOf(GeoDeepDiveRelatedTerms).apply(this, arguments));
  }

  __chunk_1.createClass(GeoDeepDiveRelatedTerms, [{
    key: "render",
    value: function render() {
      var data;
      data = this.props.data;
      return h([h('h1', "Related Terms"), h('ul#related_terms', data.map(function (item) {
        return h('li', item[0]);
      }))]);
    }
  }]);

  return GeoDeepDiveRelatedTerms;
}(react.Component);

exports.GDDReferenceCard =
/*#__PURE__*/
function (_Component4) {
  __chunk_1.inherits(GDDReferenceCard, _Component4);

  function GDDReferenceCard() {
    __chunk_1.classCallCheck(this, GDDReferenceCard);

    return __chunk_1.possibleConstructorReturn(this, __chunk_1.getPrototypeOf(GDDReferenceCard).apply(this, arguments));
  }

  __chunk_1.createClass(GDDReferenceCard, [{
    key: "render",
    value: function render() {
      var docid;
      docid = this.props.docid;
      return h(__chunk_4.APIResultView, {
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
          return h(exports.GeoDeepDiveSwatchInner, data);
        } catch (error) {
          return null;
        }
      });
    }
  }]);

  return GDDReferenceCard;
}(react.Component);

Object.defineProperty(exports, 'AuthorList', {
  enumerable: true,
  get: function () {
    return __chunk_20.AuthorList;
  }
});
//# sourceMappingURL=reference-card.js.map
