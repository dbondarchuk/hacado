import type { WithTotal } from "@hacado/types/database";
import type { AddressSuggestion } from "@hacado/types/utils";
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
