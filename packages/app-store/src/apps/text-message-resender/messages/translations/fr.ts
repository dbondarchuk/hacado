import { TextMessageResenderMessage } from "../types";

export const FrTextMessageResenderMessages: TextMessageResenderMessage = {
  resendToUserFromCustomer: `Bonjour {{user.name}}, {{customer.name}} a répondu depuis {{reply.from}} :
{{reply.message}}
Vous pouvez répondre directement à ce message`,
  resendToUserFromUnknown: `Bonjour {{user.name}}, Vous avez un message texte de {{reply.from}} :
{{reply.message}}
Vous pouvez répondre directement à ce message`,
};
