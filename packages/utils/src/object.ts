import { Leaves } from "@hacado/types";

export const resolve = (
  obj: any,
  path: string | string[],
  create = false,
  error = false,
  setValue = false,
  newValue: any = undefined,
  separator = ".",
) => {
  var properties = Array.isArray(path) ? path : path.split(separator);

  let current = obj;
  for (let i = 0; i < properties.length; i++) {
    const prop = properties[i];
    if (i === properties.length - 1) {
      if (!setValue) return current[prop];
      else {
        current[prop] = newValue;
        return current[prop];
      }
    }

    if (current[prop] && typeof current[prop] !== "object") {
      if (error) {
        throw new Error(`invalid property ${prop}`);
      } else {
        return undefined;
      }
    }

    if (current[prop]) {
      current = current[prop];
    } else if (create) {
      const newValue = /^[0-9]+$/g.test(prop) ? [] : {};
      current[prop] = newValue;

      current = current[prop];
    } else if (error) {
      throw new Error(`Property is missing: ${prop}`);
    } else {
      return undefined;
    }
  }

  return current;
};

export const resolveProperty = <T>(obj: T, property: Leaves<T>) =>
  resolve(obj, property);

const recursiveDestructAndReplace = (
  obj: any,
  property: string,
  newValue: any,
  currentPath: string,
) => {
  if (currentPath === property) return newValue;

  if (!obj || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((o: any, i: number): any =>
      recursiveDestructAndReplace(o, property, newValue, `${currentPath}.${i}`),
    );
  }

  const newObj: any = {};
  const nextPath = (key: string) =>
    `${currentPath.length > 0 ? `${currentPath}.` : ""}${key}`;

  const currentPart = property.substring(
    currentPath.length > 0 ? currentPath.length + 1 : 0,
  );

  const currentProperty =
    currentPart.indexOf(".") >= 0
      ? currentPart.substring(0, currentPart.indexOf("."))
      : currentPart;

  if (typeof obj[currentProperty] === "undefined") {
    if (nextPath(currentProperty) === property) {
      newObj[currentProperty] = newValue;
    } else {
      const val = /^[0-9]+$/g.test(currentProperty) ? [] : {};
      newObj[currentProperty] = recursiveDestructAndReplace(
        val,
        property,
        newValue,
        nextPath(currentProperty),
      );
    }
  }

  for (const [key, value] of Object.entries(obj)) {
    newObj[key] = recursiveDestructAndReplace(
      value,
      property,
      newValue,
      nextPath(key),
    );
  }

  return newObj;
};

export const destructAndReplace = <T>(
  obj: T,
  property: Leaves<T>,
  newValue: any,
): T => {
  const newObj = JSON.parse(JSON.stringify(obj));
  resolve(newObj, property, true, false, true, newValue);
  return newObj;
};
