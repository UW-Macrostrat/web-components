import { inherits as _inherits, createClass as _createClass, classCallCheck as _classCallCheck, possibleConstructorReturn as _possibleConstructorReturn, getPrototypeOf as _getPrototypeOf, objectWithoutProperties as _objectWithoutProperties } from '../../_virtual/_rollupPluginBabelHelpers.js';
import { Component } from 'react';
import h from 'react-hyperscript';
import { Card } from '@blueprintjs/core';
import { APIResultView } from '../api-frontend.js';
import { LinkCard } from '../link-card.js';
import { AuthorList } from '../citations/author-list.js';
export { AuthorList } from '../citations/author-list.js';

var GDDReferenceCard, GeoDeepDiveRelatedTerms, GeoDeepDiveSwatchInner, GeoDeepDiveSwatchInnerBare, InnerCard, VolumeNumber;

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
  return h([h(AuthorList, {
    names: names
  }), ", ", h('span.title', title), ", ", h('span.journal', journal), ", ", h(VolumeNumber, {
    volume: volume,
    number: number
  }), h('span.year', year), ", ", h('span.doi-title', 'doi: '), h('span.doi', doi)]);
};

GeoDeepDiveSwatchInnerBare =
/*#__PURE__*/
function (_Component) {
  _inherits(GeoDeepDiveSwatchInnerBare, _Component);

  function GeoDeepDiveSwatchInnerBare() {
    _classCallCheck(this, GeoDeepDiveSwatchInnerBare);

    return _possibleConstructorReturn(this, _getPrototypeOf(GeoDeepDiveSwatchInnerBare).apply(this, arguments));
  }

  _createClass(GeoDeepDiveSwatchInnerBare, [{
    key: "render",
    value: function render() {
      return h(Card, {
        interactive: false,
        className: 'gdd-article'
      }, h(InnerCard, this.props));
    }
  }]);

  return GeoDeepDiveSwatchInnerBare;
}(Component);

GeoDeepDiveSwatchInner =
/*#__PURE__*/
function (_Component2) {
  _inherits(GeoDeepDiveSwatchInner, _Component2);

  function GeoDeepDiveSwatchInner() {
    _classCallCheck(this, GeoDeepDiveSwatchInner);

    return _possibleConstructorReturn(this, _getPrototypeOf(GeoDeepDiveSwatchInner).apply(this, arguments));
  }

  _createClass(GeoDeepDiveSwatchInner, [{
    key: "render",
    value: function render() {
      var link, rest, url;
      var _this$props = this.props;
      link = _this$props.link;
      rest = _objectWithoutProperties(_this$props, ["link"]);

      try {
        var _link$find = link.find(function (d) {
          return d.type === 'publisher';
        });

        url = _link$find.url;
      } catch (error) {
        url = null;
      }

      return h(LinkCard, {
        href: url,
        target: '_blank',
        interactive: true,
        className: 'gdd-article'
      }, h(InnerCard, rest));
    }
  }]);

  return GeoDeepDiveSwatchInner;
}(Component);

GeoDeepDiveRelatedTerms =
/*#__PURE__*/
function (_Component3) {
  _inherits(GeoDeepDiveRelatedTerms, _Component3);

  function GeoDeepDiveRelatedTerms() {
    _classCallCheck(this, GeoDeepDiveRelatedTerms);

    return _possibleConstructorReturn(this, _getPrototypeOf(GeoDeepDiveRelatedTerms).apply(this, arguments));
  }

  _createClass(GeoDeepDiveRelatedTerms, [{
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
}(Component);

GDDReferenceCard =
/*#__PURE__*/
function (_Component4) {
  _inherits(GDDReferenceCard, _Component4);

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

export { GDDReferenceCard, GeoDeepDiveRelatedTerms, GeoDeepDiveSwatchInner, GeoDeepDiveSwatchInnerBare };
//# sourceMappingURL=reference-card.js.map
