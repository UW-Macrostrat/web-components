import {Component} from 'react'
import h from 'react-hyperscript'
import {LinkCard, APIResultView} from '@macrostrat/ui-components'

AuthorList = (props)->
  {authors} = props
  postfix = null
  if authors.length >= 4
    authors = authors.slice(0,2)
    etAl = ' et al.'
  _ = []
  for author, ix in authors
    name = author.name.split(',')
    isLast = (ix == authors.length-1 and not etAl?)
    if isLast
      _.pop()
      _.push ' and '
    _.push h 'span.author', name[1].trim()+" "+name[0].trim()
    if not isLast
      _.push ', '
  if etAl?
    _.pop()
    _.push etAl
  h 'span.authors', _

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


class GeoDeepDiveSwatchInner extends Component
  render: ->
    {title, author, doi, link, journal, identifier, volume, number, year} = @props
    {url} = link.find (d)->d.type == 'publisher'
    {id: doi} = identifier.find (d)->d.type == 'doi'
    console.log @props

    h LinkCard, {href: url, target: '_blank', interactive: true, className: 'gdd-article'}, [
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

class GDDReferenceCard extends Component
  render: ->
    {docid} = @props
    h APIResultView, {
      route: "http://geodeepdive.org/api/articles"
      params: {docid}
      opts: {
        unwrapResponse: (res)->res.success.data[0]
        memoize: true
      }
    }, (data)=>
      h GeoDeepDiveSwatchInner, data

export {GDDReferenceCard, AuthorList}
