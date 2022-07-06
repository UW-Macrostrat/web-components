import h from "@macrostrat/hyper";
import { render } from "@testing-library/react";
import { Button } from "./index";

describe("Button", () => {
  test("renders the Button component", () => {
    render(h(Button, { label: "Hello world!" }));
  });
});
