import { hyperStyled } from "@macrostrat/hyper";
import styles from "./main.module.scss";
import noteStyles from "./notes/notes.module.sass";

const styles1 = { ...styles, ...noteStyles };

const h = hyperStyled(styles1);

console.log("Styles", styles1);

export default h;
