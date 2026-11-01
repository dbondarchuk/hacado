type MergeOptions = {
  override?: boolean;
  mergeArrays?: boolean;
  uniqueArrayItems?: boolean;
  deepClone?: boolean;
};

export const mergeObjects = <T extends object, U extends object>(
  target: T,
  source: U,
  options: MergeOptions = {},
): T & U => {
  const {
    override = false,
    mergeArrays = true,
    uniqueArrayItems = true,
    deepClone = false,
  } = options;

  const result = deepClone ? deepCloneValue(target) : { ...target };

  for (const [key, value] of Object.entries(source)) {
    const targetValue = (result as any)[key];

    // Case 1: Key missing → add (cloned if requested)
    if (!(key in result)) {
      (result as any)[key] = deepClone ? deepCloneValue(value) : value;
      continue;
    }

    // Case 2: Both plain objects → recurse
    if (isPlainObject(targetValue) && isPlainObject(value)) {
      (result as any)[key] = mergeObjects(targetValue, value, options);
      continue;
    }

    // Case 3: Both arrays
    if (Array.isArray(targetValue) && Array.isArray(value)) {
      if (!mergeArrays) {
        if (override)
          (result as any)[key] = deepClone ? deepCloneValue(value) : value;

        continue;
      }

      const combined = override
        ? [...targetValue, ...value]
        : [...targetValue, ...value.filter((v) => !targetValue.includes(v))];

      const finalArr = uniqueArrayItems
        ? Array.from(new Set(combined))
        : combined;

      (result as any)[key] = deepClone ? deepCloneValue(finalArr) : finalArr;
      continue;
    }

    // Case 4: Primitive or non-object values
    if (override) {
      (result as any)[key] = deepClone ? deepCloneValue(value) : value;
    }
  }

  return result as T & U;
};

// --- Helpers ---
function isPlainObject(value: any): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function deepCloneValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => deepCloneValue(v)) as unknown as T;
  }

  if (isPlainObject(value)) {
    const cloned: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      cloned[k] = deepCloneValue(v);
    }

    return cloned as T;
  }

  return value;
}
