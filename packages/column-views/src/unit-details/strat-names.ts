import {
  DataField,
  isClickable,
  ItemInteractionProps,
  useInteractionProps,
} from "@macrostrat/data-components";
import h from "./panel.module.sass";
import classNames from "classnames";
import { useStratNames } from "@macrostrat/data-provider";
import { Identifier } from "./identifiers.ts";

function useStratNameData(strat_name_id: number) {
  const stratNames = useStratNames([strat_name_id]);
  return stratNames?.[0];
}

export function StratNameField(
  props: {
    strat_name_id: number;
    className?: string;
  } & ItemInteractionProps,
) {
  /** Handling for stratigraphic name field */
  const { strat_name_id, className, ...rest } = props;

  const data = useStratNameData(strat_name_id);

  const baseInteractionProps = useInteractionProps({ strat_name_id });

  const coreProps = {
    ...baseInteractionProps,
    ...rest,
  };

  let inner: any = h(Identifier, { id: strat_name_id });
  const name = data?.strat_name_long;
  if (name != null) {
    inner = h("span.strat-name", name);
  }

  const clickable = isClickable(coreProps);

  return h(
    DataField,
    {
      label: "Stratigraphic name",
    },
    h(
      clickable ? "a" : "span",
      {
        className: classNames({ clickable }, className),
        ...coreProps,
      },
      inner,
    ),
  );
}
