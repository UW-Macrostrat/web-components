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
  A: -180
  B: -55
  C: 90
  D: 230
  E: 80
  F: 200
  G: -10
  H: 310
  I: 30
  J: -5
}


groupOrder = [
  'Onis'
  'Ubisis'
  'Tsams'
]

stackGroups = ['BED','AC','GF','HI']

module.exports = {stackGroups, groupOrder, sectionOffsets, tectonicSectionOffsets}
