module.exports = {
  someSidebar: {
    Macrostrat: [
      "macrostrat-base",
      {
        type: "category",
        label: "API Helpers",
        items: ["API/provider", "API/paged", "API/frontend"],
      },
      {
        type: "category",
        label: "Citations",
        items: ["Citations/author-list"],
      },
      {
        type: "category",
        label: "U.I Editing",
        items: ["Editing/editable-fields", "Editing/model-editor"],
      },
      {
        type: "category",
        label: "xDD (GeoDeepDive)",
        items: ["xDD/xDD"],
      },
      {
        type: "category",
        label: "U.I Components",
        items: [
          "Utils/Buttons/buttons",
          "Utils/File-Uploads/file-upload",
          "Utils/collapse-panel",
          "Utils/Form-Controls/form-controls",
          "Utils/image",
          "Utils/infinite",
          "Utils/link-card",
          "Utils/toast",
          "Utils/search-interface",
          "Utils/text",
          {
            type: "category",
            label: "Utility Helpers",
            items: [
              "Utils/Utilities/queryString",
              "Utils/Utilities/hooks",
              "Utils/Utilities/stateful",
              "Utils/Utilities/local-storage",
            ],
          },
          {
            type: "category",
            label: "Context Managers",
            items: ["Utils/Context/settings", "Utils/Context/darkmode"],
          },
        ],
      },
    ],
  },
};
