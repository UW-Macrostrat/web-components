import {Component} from 'react';
import h from '@macrostrat/hyper';
import {Card} from '@blueprintjs/core';

import {APIResultView} from '../api-frontend';
import {LinkCard} from '../link-card';
import {AuthorList} from '../citations';

const AuthorList2 = function(props){
  let etAl;
  let {authors} = props;
  const postfix = null;
  if (authors.length >= 4) {
    authors = authors.slice(0,2);
    etAl = ' et al.';
  }
  const _ = [];
  for (let ix = 0; ix < authors.length; ix++) {
    var name;
    const author = authors[ix];
    try {
      name = author.name.split(',');
      const newName = name[1].trim()+" "+name[0].trim();
    } catch (error) {
      ({
        name
      } = author);
    }
    const isLast = ((ix === (authors.length-1)) && (etAl == null));
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

const VolumeNumber = function(props){
  const {volume, number} = props;
  const _ = [];
  if ((volume != null) && (volume !== "")) {
    _.push(h('span.volume', null, volume));
  }
  if ((number != null) && (number !== "")) {
    _.push("(");
    _.push(h('span.number', number));
    _.push(")");
  }
  if (_.length === 0) { return null; }
  _.push(", ");
  return h('span', null, _);
};


const InnerCard = props => {
    let {title, author, doi, journal, identifier, volume, number, year} = props;
    try {
      ({id: doi} = identifier.find(d => d.type === 'doi'));
    } catch (error) {
      doi = null;
    }

    const names = author.map(function(d){
      const n = d.name.split(", ");
      n.reverse();
      return n.join(" ");
    });

    return h([
      h(AuthorList, {names}),
      ", ",
      h('span.title', title),
      ", ",
      h('span.journal', journal),
      ", ",
      h(VolumeNumber, {volume, number}),
      h('span.year', year),
      ", ",
      h('span.doi-title', 'doi: '),
      h('span.doi', doi)
    ]);
  };

class GeoDeepDiveSwatchInnerBare extends Component {
  render() {
    return h(Card, {interactive: false, className: 'gdd-article'}, h(InnerCard, this.props));
  }
}

class GeoDeepDiveSwatchInner extends Component {
  render() {
    let url;
    const {link, ...rest} = this.props;
    try {
      ({url} = link.find(d => d.type === 'publisher'));
    } catch (error) {
      url = null;
    }
    console.log("Render GDD swatch")
    return h(LinkCard, {href: url, target: '_blank', interactive: true, className: 'gdd-article'}, h(InnerCard, rest));
  }
}

class GeoDeepDiveRelatedTerms extends Component {
  render() {
    const {data} = this.props;
    return h([
      h('h1', "Related Terms"),
      h('ul#related_terms', data.map(item => h('li', item[0])))
    ]);
  }
}

class GDDReferenceCard extends Component {
  render() {
    const {docid} = this.props;
    return h(APIResultView, {
      route: "http://geodeepdive.org/api/articles",
      params: {docid},
      opts: {
        unwrapResponse(res){ return res.success.data[0]; },
        memoize: true,
        onError: console.error
      }
    }, data=> {
      try {
        return h(GeoDeepDiveSwatchInner, data);
      } catch (error) {
        return null;
      }
    });
  }
}

export {GDDReferenceCard, GeoDeepDiveSwatchInner, AuthorList, GeoDeepDiveSwatchInnerBare, GeoDeepDiveRelatedTerms};
