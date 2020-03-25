import h from 'react-hyperscript'

Author = (props)->
  {name, highlight} = props

  if name == highlight
    return h 'b.author', name
  h 'span.author', name

AuthorList = (props)->
  {names, highlight} = props
  A = (name)->h(Author, {name, highlight})

  if not Array.isArray(names)
    return A(names)

  n = names.length
  if n == 0
    return null
  if n == 1
    return A(names[0])

  L = []
  for name,i in names
    L.push A(name)
    if i <= n-2
      L.push if n > 2 then ", " else " "
    if i == n-2
      L.push "and "

  h 'span.author-list', L

export {AuthorList}
