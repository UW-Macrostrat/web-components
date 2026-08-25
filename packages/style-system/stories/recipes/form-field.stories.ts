import { Meta } from "@storybook/react-vite";
import classNames from "classnames";
import h from "./form-field.module.sass";

function Field({ label, placeholder, help, error }) {
  return h("div.field", { className: classNames({ error }) }, [
    h("label.label", label),
    h("input.input", { placeholder }),
    h("span.help", help),
  ]);
}

function FormField() {
  return h("div.frame", [
    h(Field, {
      label: "Column name",
      placeholder: "e.g. Green River Formation",
      help: "Shown in the stratigraphic column header.",
    }),
    h(Field, {
      label: "Age (Ma)",
      placeholder: "0",
      help: "Must be a positive number.",
      error: true,
    }),
  ]);
}

export default {
  title: "Style system/Recipes/Form field",
  component: FormField,
} as Meta<typeof FormField>;

export const Default = { args: {} };
