/**
 * Progressive text shortening: a label and the shorter forms it can fall back
 * to when space runs out. Shared by the page header's title and meant for any
 * label that must fit a measured space (e.g. column unit labels, which could
 * try shorter forms before `SizeAwareLabel` hides them).
 */

/** From a label, its shorter forms: one, or several in order of decreasing
 * length. The original may be included or not; forms that aren't shorter are
 * discarded downstream. */
export type Shortener = (text: string) => string | string[] | null | undefined;

/** Short forms given directly (one string, or several, longest first) or
 * derived from the full text by a `Shortener`. */
export type ShortForms = string | string[] | Shortener;

/** When a label switches to a short form: `never`; only when the full label
 * doesn't fit (`narrow`); or `always`, starting from the first short form. */
export type ShortenMode = "never" | "narrow" | "always";

/**
 * The full text followed by its short forms, longest first. Forms are trimmed,
 * empty or non-shortening ones dropped, and duplicates removed, so each entry
 * is strictly shorter than the one before. A shortener needs a string `text`;
 * explicit forms work with any label (pass `text` as null).
 */
export function shortenedForms(
  text: string | null | undefined,
  shortForms?: ShortForms | null,
): string[] {
  let candidates: string[] = [];
  if (typeof shortForms == "function") {
    if (text != null) {
      candidates = asList(shortForms(text));
    }
  } else if (shortForms != null) {
    candidates = asList(shortForms);
  }

  const forms: string[] = [];
  let previous = text?.trim();
  if (previous != null && previous != "") {
    forms.push(previous);
  }
  for (const raw of candidates) {
    const form = raw?.trim();
    if (form == null || form == "") continue;
    if (previous != null && form.length >= previous.length) continue;
    forms.push(form);
    previous = form;
  }
  return forms;
}

/**
 * Chain shorteners into one progressive shortener: each is applied to the
 * shortest form so far, so `[dropAfter(","), dropParenthetical]` turns
 * "Tapeats Sandstone (Tonto Group), Arizona" into
 * ["Tapeats Sandstone (Tonto Group)", "Tapeats Sandstone"].
 */
export function composeShorteners(...shorteners: Shortener[]): Shortener {
  return (text: string) => {
    const forms: string[] = [];
    let current = text;
    for (const shorten of shorteners) {
      for (const form of asList(shorten(current))) {
        if (form == null) continue;
        forms.push(form);
        current = form;
      }
    }
    return forms;
  };
}

/**
 * The longest form that fits `available`, given a way to measure each. Starts
 * from the first short form when `mode` is `always`, and returns the shortest
 * form when none fit (to be truncated). Returns an index into `forms`.
 */
export function fittingFormIndex(
  forms: string[],
  measure: (form: string, index: number) => number,
  available: number,
  mode: ShortenMode = "narrow",
): number {
  if (forms.length <= 1 || mode == "never") return 0;
  let start = 0;
  if (mode == "always") {
    start = 1;
  }
  for (let i = start; i < forms.length; i++) {
    if (measure(forms[i], i) <= available) return i;
  }
  return forms.length - 1;
}

// Standard shorteners

/** "Tapeats Sandstone (Tonto Group)" → "Tapeats Sandstone". */
export const dropParenthetical: Shortener = (text) =>
  text.replace(/\s*[([][^)\]]*[)\]]\s*$/, "");

/** Everything before the last `separator`, repeatedly: with ",",
 * "Sierra Estrella, Maricopa County, Arizona" →
 * ["Sierra Estrella, Maricopa County", "Sierra Estrella"]. */
export function dropAfter(separator = ","): Shortener {
  return (text) => {
    const forms: string[] = [];
    let current = text;
    let ix = current.lastIndexOf(separator);
    while (ix > 0) {
      current = current.slice(0, ix);
      forms.push(current);
      ix = current.lastIndexOf(separator);
    }
    return forms;
  };
}

/** Remove the first matching leading phrase (case-insensitive), e.g.
 * `dropPrefix("Geologic map of the", "Geologic map of")`. */
export function dropPrefix(...prefixes: string[]): Shortener {
  return (text) => {
    const lower = text.toLowerCase();
    for (const prefix of prefixes) {
      if (lower.startsWith(prefix.toLowerCase())) {
        return capitalize(text.slice(prefix.length).trimStart());
      }
    }
    return null;
  };
}

/** Remove the first matching trailing word or phrase (case-insensitive), e.g.
 * `dropSuffix("Formation", "Group")`: "Tapeats Formation" → "Tapeats". */
export function dropSuffix(...suffixes: string[]): Shortener {
  return (text) => {
    const lower = text.toLowerCase();
    for (const suffix of suffixes) {
      const s = suffix.toLowerCase();
      if (lower.endsWith(" " + s) && lower.length > s.length + 1) {
        return text.slice(0, text.length - suffix.length).trimEnd();
      }
    }
    return null;
  };
}

function asList(value: string | string[] | null | undefined): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
