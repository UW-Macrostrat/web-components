import { Dialog } from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";
import styles from "./page-admin.module.sass";

const h = hyper.styled(styles);

export function PageAdminInner({ isOpen, setIsOpen, children }) {
  return h([
    h(
      Dialog,
      {
        isOpen,
        onClose: () => setIsOpen(false),
        title: "Developer tools",
        className: "page-admin",
      },
      h("div.dialog-content.bp5-dialog-content", children),
    ),
    h("span.__render_alarm__"),
  ]);
}
