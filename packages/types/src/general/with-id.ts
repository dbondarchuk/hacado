export type Id = {
  id: string;
};

export type WithId<T> = T & Id;

export type WithEmail<T> = T & {
  email: string;
};
