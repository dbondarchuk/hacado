import { TextMessageResenderMessage } from "../types";

export const UkTextMessageResenderMessages: TextMessageResenderMessage = {
  resendToUserFromCustomer: `Привіт {{user.name}}, {{customer.name}} відповів з {{reply.from}}:
{{reply.message}}
Ви можете відповісти на це повідомлення безпосередньо`,
  resendToUserFromUnknown: `Привіт {{user.name}}, У вас є текстове повідомлення від {{reply.from}}:
{{reply.message}}
Ви можете відповісти на це повідомлення безпосередньо`,
};
