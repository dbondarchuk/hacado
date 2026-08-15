import { Availability } from "@hacado/types";
import {
  AvailabilitySearchParams,
  serializeAvailabilitySearchParams,
} from "../search-params";
import { fetchClientApi } from "./utils";

export const getAvailability = async (params: AvailabilitySearchParams) => {
  console.debug("Getting availability", {
    params,
  });

  const serializedParams = serializeAvailabilitySearchParams(params);
  const response = await fetchClientApi(`/availability${serializedParams}`, {
    method: "GET",
  });

  const data = await response.json<Availability>();
  console.debug("Availability retrieved successfully", {
    data,
  });

  return data;
};
