import type { AddressSuggestion, WithTotal } from "@hacado/types";
import {
  AddressesSearchParams,
  addressesSearchParamsSerializer,
} from "../search-params";
import { fetchAdminApi } from "./utils";

export const getAddressSuggestions = async (
  params: AddressesSearchParams = {},
): Promise<WithTotal<AddressSuggestion>> => {
  const serializedParams = addressesSearchParamsSerializer(params);
  const response = await fetchAdminApi(
    `/addresses/suggestions${serializedParams}`,
  );

  return response.json<WithTotal<AddressSuggestion>>();
};
