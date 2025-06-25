import { DocsContainer as BaseContainer } from "@storybook/addon-docs";
import { themes } from "storybook/theming";
import h from "@macrostrat/hyper";
import { useEffect, useState } from "react";

export const DocsContainer = ({ children, context }) => {
  // Check for body class changes
  const [dark, setDark] = useState(
    document.body.classList.contains("bp5-dark")
  );

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          const dark = document.body.classList.contains("bp5-dark");
          setDark(dark);
        }
      });
    });
    observer.observe(document.body, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const theme = dark ? themes.dark : themes.light;

  let ctx1 = context;
  ctx1.storyById = (id) => {
    const storyContext = context.storyById(id);
    return {
      ...storyContext,
      parameters: {
        ...(storyContext?.parameters ?? {}),
        docs: {
          ...(storyContext?.parameters?.docs ?? {}),
          theme,
        },
      },
    };
  };

  return h(
    BaseContainer,
    {
      theme,
      context: ctx1,
    },
    children
  );
};
