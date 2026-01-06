import { UnitLong } from "@macrostrat/api-types";

interface UnitOutput extends UnitLong {
  covered: boolean;
  age_source: string | null;
}

export function convertGBDBUnitToMacrostrat(
  unit: any,
  lithNamesMap: Map<string, any>,
): UnitOutput {
  /* Convert a GBDB unit to a Macrostrat UnitLong type  required for plotting columns */
  const {
    unit_id,
    section_id,
    unit_thickness,
    unit_sum,
    lithology1,
    lithology2,
    paleoenvironment,
    min_ma,
    max_ma,
    min_model_ma,
    max_model_ma,
    age_source,
  } = unit;

  let { formation, member, group } = unit;
  if (formation == null || formation === "") formation = undefined;
  if (member == null || member === "") member = undefined;
  if (group == null || group === "") group = undefined;

  let atts = undefined;
  if (lithology2 != null && lithology2 !== "") {
    atts = [lithology2];
  }

  const lithName = lithology1.toLowerCase();

  let lith = lithNamesMap.get(lithName) ?? {
    name: lithName,
  };
  lith = { ...lith, atts };

  let environ = [];
  if (paleoenvironment != null && paleoenvironment !== "") {
    environ = [{ name: paleoenvironment }];
  }
  const b_pos = unit_sum - unit_thickness;
  const t_pos = unit_sum;

  return {
    unit_id,
    col_id: section_id,
    unit_name: `Unit ${unit_id}`,
    lith: [lith],
    b_pos,
    t_pos,
    min_thick: unit_thickness,
    max_thick: unit_thickness,
    b_age: max_model_ma ?? max_ma,
    t_age: min_model_ma ?? min_ma,
    Fm: formation,
    Mbr: member,
    Gp: group,
    environ,
    covered: lithology1 == "covered",
    age_source,
  };
}

export function createFormationUnits(units: UnitLong[]): UnitLong[] {
  // Create a new array of units condensed on formation names
  const formationMap = new Map<string, UnitLong>();
  const unitsWithFormation = units.filter((u) => u.Fm != null);

  let uid = -1;
  for (const u of unitsWithFormation) {
    const formationName = u.Fm;
    if (!formationMap.has(formationName)) {
      formationMap.set(formationName, {
        ...u,
        lith: [],
        environ: [],
        unit_id: uid, // Indicate it's a formation unit
        unit_name: formationName + " Formation",
        column: 0,
      });
      uid -= 1;
    } else {
      const existing = formationMap.get(formationName)!;
      // Update the existing formation unit to extend its age range
      existing.t_age = Math.min(existing.t_age, u.t_age);
      existing.b_age = Math.max(existing.b_age, u.b_age);
      existing.min_thick += u.min_thick;
      existing.max_thick += u.max_thick;
      existing.t_pos = Math.max(existing.t_pos, u.t_pos);
      existing.b_pos = Math.min(existing.b_pos, u.b_pos);
    }
  }

  return Array.from(formationMap.values()).sort((a, b) => b.b_age - a.b_age);
}
