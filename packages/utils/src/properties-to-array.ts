export type KeyValuePair = { id: string; display: any };
export const propertiesToArray = (obj: Record<string, any>) => {
  if (!obj) return [];

  const isObject = (val: any) => !!val && typeof val === "object";

  const addDelimiter = (a: string, b: string) => (a ? `${a}.${b}` : b);

  const paths = (obj: Record<string, any> = {}, head = "") => {
    return Object.entries(obj).reduce((product, [key, value]) => {
      let fullPath = addDelimiter(head, key);
      if (Array.isArray(value)) {
        product.push({ id: fullPath, display: "[]" });
      }

      if (isObject(value)) {
        product.push(...paths(value, fullPath));
      } else {
        product.push({ id: fullPath, display: value?.toString() });
      }

      return product;
    }, [] as KeyValuePair[]);
  };

  return paths(obj);
};
