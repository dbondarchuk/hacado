export type CustomerSessionPayload = {
  organizationId: string;
  customerId: string;
  sessionId: string;
  exp: number;
};

export type CustomerSession = {
  customerId: string;
  sessionId: string;
  organizationId: string;
};
