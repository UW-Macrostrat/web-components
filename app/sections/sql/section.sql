SELECT
  "start",
  "end",
  "offset",
  coalesce("clip_end","end") real_end
FROM section.section WHERE id=$1;

