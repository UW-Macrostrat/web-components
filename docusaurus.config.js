module.exports = {
  title: "Macrostrat-UI Components",
  tagline: "Easy to use Components for Frontend Development",
  url: "https://docusaurus-2.netlify.com",
  baseUrl: "/",
  onBrokenLinks: "throw",
  favicon: "img/favicon.ico",
  organizationName: "Macrostrat", // Usually your GitHub org/user name.
  projectName: "Macrostrat-UI-Components", // Usually your repo name.
  themeConfig: {
    navbar: {
      title: "Macrostrat-UI Components",
      // logo: {
      //   alt: "My Site Logo",
      //   src: "img/logo.svg",
      // },
      items: [
        {
          to: "docs/",
          activeBasePath: "docs",
          label: "Docs",
          position: "left",
        },
        {
          href: "https://github.com/UW-Macrostrat/ui-components",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Projects",
          items: [
            {
              label: "Macrostrat",
              href: "https://macrostrat.org/",
            },
            {
              label: "Sparrow",
              href: "https://sparrow-data.org/",
            },
          ],
        },
        {
          title: "Community",
          items: [
            {
              label: "EarthCube",
              href: "https://www.earthcube.org/",
            },
            {
              label: "Github",
              href:
                "https://github.com/UW-Macrostrat/ui-components/tree/72fcba180bbbdac2884e3a50bd84b97e680c7884",
            },
          ],
        },
        {
          title: "People",
          items: [
            {
              label: "Daven Quinn",
              href: "https://davenquinn.com/",
            },
            {
              label: "Ian Ross",
              href: "https://github.com/iross",
            },
            {
              label: "Shanan Peters",
              href: "http://strata.geology.wisc.edu/index.html",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} My Project, Inc. Built with Docusaurus.`,
    },
  },
  presets: [
    [
      "@docusaurus/preset-classic",
      {
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          // Please change this to your repo.
          editUrl:
            "https://github.com/facebook/docusaurus/edit/master/website/",
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          editUrl:
            "https://github.com/facebook/docusaurus/edit/master/website/blog/",
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      },
    ],
  ],
};
