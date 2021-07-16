import axios from "axios"
import { apiBaseURL } from "../config"
import { writeJSON } from "./utils"

async function buildMacrostratMeasurements() {
  // Get the measurements associated with the medium column
  const { data: res } = await axios.get(apiBaseURL + "/measurements", {
    params: {
      col_id: 2163,
      project_id: 10,
      show_values: true,
      response: "long",
    },
  })

  const targetCol = 1481

  let data = []

  // get all the units in the macrostrat column
  const { data: units } = await axios.get(apiBaseURL + "/units", {
    params: { col_id: targetCol },
  })

  for (const meas of res.success?.data ?? []) {
    const unit = units.success?.data?.find(
      u => u.strat_name_id === meas.strat_name_id
    )
    if (unit != null) {
      const { unit_id } = unit
      data.push({ ...meas, unit_id, col_id: targetCol })
    }
  }

  let res2 = { ...res }
  res2.success.data = data

  return res2
}

buildMacrostratMeasurements().then(data => {
  writeJSON("macrostrat/measurements", data)
})
