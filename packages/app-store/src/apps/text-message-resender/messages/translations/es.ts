import { TextMessageResenderMessage } from "../types";

export const EsTextMessageResenderMessages: TextMessageResenderMessage = {
  resendToUserFromCustomer: `Hola {{user.name}}, {{customer.name}} ha respondido desde {{reply.from}}:
{{reply.message}}
Puedes responder a este mensaje directamente`,
  resendToUserFromUnknown: `Hola {{user.name}}, tienes un mensaje de texto de {{reply.from}}:
{{reply.message}}
Puedes responder a este mensaje directamente`,
};
