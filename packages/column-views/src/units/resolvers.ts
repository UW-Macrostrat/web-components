const symbolIndex = {
  "dolomite-limestone": 641,
  lime_mudstone: 627,
  sandstone: 607,
  "quartz arenite": 607,
  litharenite: 608,
  sand: 608,
  siltstone: 616,
  silt: 616,
  "dolomitic siltstone": 616,
  shale: 620,
  limestone: 627,
  dolomite: 642,
  conglomerate: 602,
  carbonate: 627,
  "dolomite-mudstone": 642,
  dolostone: 642,
  mudstone: 620,
  "sandy-dolomite": 645,
  quartzite: 702,
  halite: 668,
  basalt: 717,
  diabase: 717,
  rhyolite: 722,
  andesite: 723,
  till: 681,
  loess: 684,
  "calcareous ooze": 653,
  chalk: 626,
  gravel: 601,
  plutonic: 721,
  granite: 719,
  clay: 660,
  syenite: 722,
  tuff: 711,
  volcanic: 725,
  metamorphic: 707,
  volcaniclastic: 714,
  migmatite: 709,
  gneiss: 708,
  tonalite: 727,
  granodiorite: 725,
  monzonite: 723,
  argillite: 624,
  diamictite: 681,
};

const resolveID = (d: any) => {
  let liths = d.lith;
  let environs = d.environ.map((d) => d.name).join(" ");
  liths.sort((a, b) => b.prop - a.prop);

  //console.log(d, d.unit_name, liths.map(d => d.name), environs)

  let sym = null;

  // overrides for IODP columns
  if (d.unit_name == "clay") {
    return "650";
  }
  if (d.unit_name == "calcareous clay") {
    return "651";
  }

  for (const k of liths) {
    if (k.name == "sandstone") {
      // Special cases for sandstone
      if (environs.includes("dune")) {
        return "609";
      }
      if (environs.includes("marine")) {
        return "608";
      }
      if (environs.includes("shore")) {
        return "611";
      }
      if (environs.includes("loess")) {
        return "686";
      }
    }

    if (k.name == "conglomerate") {
      // Special cases for sandstone
      if (environs.includes("fluvial")) {
        return "603";
      }
    }

    if (k.name.includes("tuff")) {
      return "711";
    }
    sym = symbolIndex[k.name];
    if (sym != null) {
      return sym;
    }

    if (k.type == "volcanic") {
      return "725";
    }
  }
  return sym;
};

const patternScale = {
  "609": 1.5,
  "603": 1.5,
};

const scalePattern = (id) => {
  return patternScale[`${id}`] ?? 1;
};

export { resolveID, scalePattern };
