import {Component} from 'react'
import h from 'react-hyperscript'
import {APIResultView} from '../api-frontend'
import {LinkCard} from '../link-card'
import {Card} from '@blueprintjs/core'

AuthorList = (props)->
  {authors} = props
  postfix = null
  if authors.length >= 4
    authors = authors.slice(0,2)
    etAl = ' et al.'
  _ = []
  for author, ix in authors
    try
      name = author.name.split(',')
      newName = name[1].trim()+" "+name[0].trim()
    catch
      name = author.name
    isLast = (ix == authors.length-1 and not etAl?)
    if isLast
      _.pop()
      _.push ' and '
    _.push h 'span.author', name
    if not isLast
      _.push ', '
  if etAl?
    _.pop()
    _.push etAl
  return h 'span.authors', _

VolumeNumber = (props)->
  {volume, number} = props
  _ = []
  if volume? and volume != ""
    _.push h('span.volume', null, volume)
  if number? and number != ""
    _.push "("
    _.push h('span.number', number)
    _.push ")"
  return null if _.length == 0
  _.push ", "
  h 'span', null, _


InnerCard = (props) =>
    {title, author, doi, journal, identifier, volume, number, year} = props
    try
      {id: doi} = identifier.find (d)->d.type == 'doi'
    catch
      doi = null

    h [
      h AuthorList, {authors: author}
      ", "
      h 'span.title', title
      ", "
      h 'span.journal', journal
      ", "
      h VolumeNumber, {volume, number}
      h 'span.year', year
      ", "
      h 'span.doi-title', 'doi: '
      h 'span.doi', doi
    ]

class GeoDeepDiveSwatchInnerBare extends Component
  render: ->
    h Card, {interactive: false, className: 'gdd-article'}, h(InnerCard, @props)

class GeoDeepDiveSwatchInner extends Component
  render: ->
    {link, ...rest} = @props
    try
      {url} = link.find (d)->d.type == 'publisher'
    catch
      url = null
    h LinkCard, {href: url, target: '_blank', interactive: true, className: 'gdd-article'}, h(InnerCard, rest)

class GDDReferenceCard extends Component
  render: ->
    {docid} = @props
    h APIResultView, {
      route: "http://geodeepdive.org/api/articles"
      params: {docid}
      opts: {
        unwrapResponse: (res)->res.success.data[0]
        memoize: true
        onError: console.error
      }
    }, (data)=>
      try
        return h GeoDeepDiveSwatchInner, data
      catch
        return null

export {GDDReferenceCard, GeoDeepDiveSwatchInner, AuthorList, GeoDeepDiveSwatchInnerBare}
