import { TextMessageResenderMessage } from "../types";

export const EnTextMessageResenderMessages: TextMessageResenderMessage = {
  resendToUserFromCustomer: `Hi {{user.name}}, {{customer.name}} has replied from {{reply.from}}:
{{reply.message}}
You can reply to this message directly`,
  resendToUserFromUnknown: `Hi {{user.name}}, You have text message from {{reply.from}}:
{{reply.message}}
You can reply to this message directly`,
};
