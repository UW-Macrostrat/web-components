import axios from "axios"
import { apiBaseURL } from "../config"

async function buildMacrostratMeasurements() {
  // Get the measurements associated with the medium column
  const res = await axios.get(apiBaseURL + "/measurements", {
    params: {
      col_id: 2163,
      project_id: 10,
      show_values: true,
      response: "long",
    },
  })
  console.log(res)

  const units = await axios.get(apiBaseURL + "/units", {
    params: { col_id: 1481 },
  })

  console.log(units)

  return res
}

buildMacrostratMeasurements()
