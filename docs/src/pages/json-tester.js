import React from "react";
import { useState, useEffect } from "react";
import { Button, TextArea } from "@blueprintjs/core";
import Layout from "@theme/Layout";
import styles from "./styles.module.css";
import { FormatListNumberedRtlOutlined } from "@material-ui/icons";

const data = [
  {
    id: 18,
    igsn: null,
    name: "M2C",
    material: "Lava Flows",
    geometry: {
      type: "Point",
      coordinates: [-149.66, -17.66],
    },
    location_name: null,
    location_precision: 0,
    location_name_autoset: null,
    project_id: null,
    project_name: null,
    is_public: true,
  },
  {
    id: 19,
    igsn: null,
    name: "90T151A",
    material: "Baslt",
    geometry: {
      type: "Point",
      coordinates: [-156.2311, 20.6368],
    },
    location_name: null,
    location_precision: 0,
    location_name_autoset: null,
    project_id: null,
    project_name: null,
    is_public: true,
  },
];

const baseUrl = "https://sparrow-data.org/labs/wiscar/api/v1/";

const routes = [
  "session",
  "analysis",
  "attribute",
  "datum",
  "age_datum",
  "material",
  "sample",
  "age_context",
  "sample_data",
  "project_sample_session",
  "project_extent",
  "project",
];

function FormatedJson(json) {
  return JSON.stringify(json, undefined, 2);
}

function JsonTester(props) {
  const [json, setJSON] = useState(null);
  const [disabled, setDisabled] = useState(false);

  const handleClick = () => {
    if (json) {
      setJSON(null);
    } else {
      setJSON(FormatedJson(data));
    }
    setDisabled(!disabled);
  };

  const editJson = (e) => {
    setJSON(e.target.value);
  };

  return (
    <Layout>
      <div>
        <h1>Hello</h1>
        <button onClick={handleClick} className={styles.button}>
          {disabled ? "Undo" : "Click Me"}
        </button>
        {json && <pre>{json}</pre>}
      </div>
    </Layout>
  );
}
export default JsonTester;
