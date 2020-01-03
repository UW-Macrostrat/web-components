const symbolIndex = {
  'dolomite-limestone': 641
  'lime_mudstone': 627
  'sandstone': 607
  'siltstone': 616
  'dolomitic siltstone': 616
  'shale': 620
  'limestone': 627
  'dolomite': 642
  'conglomerate': 602
  'dolomite-mudstone': 642
  'mudstone': 620
  'sandy-dolomite': 645
  'quartzite': 702
  'halite': 668
}

const resolveID = (d: object)=>{
  let liths = d.lith
  let environs = d.environ.map(d=>d.name).join(" ")
  liths.sort((a,b)=>b.prop-a.prop)

  console.log(d.unit_name, liths.map(d => d.name),
              environs)

  let sym = null

  for (const k of liths) {
    if (k.name == 'sandstone') {
      // Special cases for sandstone
      if (environs.includes("dune")) {
        return "609"
      }
      if (environs.includes("marine")) {
        return "608"
      }
      if (environs.includes("shore")) {
        return "611"
      }
    }

    if (k.name == 'conglomerate') {
      // Special cases for sandstone
      if (environs.includes("fluvial")) {
        return "603"
      }
    }

    sym = symbolIndex[k.name]
    if (sym != null) {
      return sym
    }
  }
  return sym
}

const patternScale = {
  "609": 1.5
  "603": 1.5
}

const scalePattern = (id)=> {
  return patternScale[`${id}`] ?? 1
}

export {resolveID, scalePattern}
