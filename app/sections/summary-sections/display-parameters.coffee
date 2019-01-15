tectonicSectionOffsets = {
  A: 0
  B: 105
  C: 270
  D: 415
  E: 255
  F: 268
  G: 0
  H: 378
  I: 50
  J: -5
}

# A more stratigraphically focused set of section offsets
# (shows progradation downdip)
sectionOffsets = {
  A: -220
  B: -60
  C: 50
  D: 200
  E: 65
  F: 200
  G: -10
  H: 310
  I: 30
  J: -5
}

groupOffsets = {
  Tsams: 200
  Onis: -5
  Ubisis: 310
}

groupOrder = [
  'Onis'
  'Ubisis'
  'Tsams'
]

stackGroups = ['BD','E','AC','HG','IF']

module.exports = {stackGroups, groupOrder, sectionOffsets, tectonicSectionOffsets}
