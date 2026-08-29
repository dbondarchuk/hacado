export type WaitlistOfferPrefill = {
  optionId: string;
  addonsIds?: string[];
  memberId: string;
  /** Offered slot start (ISO string, or `Date` after client JSON date revival). */
  dateTime: string | Date;
  duration: number;
  fields: {
    name: string;
    email: string;
    phone: string;
  };
};
