/**
 * Keep ICU variable names stable across machine translation.
 *
 * Cached Ukrainian strings sometimes rewrote the identifier inside `{...}`
 * (`{title}` → `{назва}`, `{filename}` → `{ім'я файлу}`) while still translating
 * real plural/select branch text. Shielding stops a fresh request from seeing
 * those tokens; this restores them when a cached or returned string already
 * changed the names.
 */

const ICU_KEYWORDS = new Set(["zero", "one", "two", "few", "many", "other"]);

function isIcuSelector(selector) {
  return ICU_KEYWORDS.has(selector) || /^=\d+$/.test(selector);
}

function splitByTopLevelBraces(text) {
  const parts = [];
  let start = 0;

  for (let i = 0; i < text.length; i++) {
    if (text[i] !== "{") continue;

    let depth = 1;
    let j = i + 1;
    for (; j < text.length && depth > 0; j++) {
      if (text[j] === "{") depth++;
      else if (text[j] === "}") depth--;
    }

    if (depth !== 0) return null;

    if (i > start) parts.push({ type: "text", value: text.slice(start, i) });

    const raw = text.slice(i, j);
    parts.push({ type: "brace", value: raw, inner: raw.slice(1, -1) });
    start = j;
    i = j - 1;
  }

  if (start < text.length) {
    parts.push({ type: "text", value: text.slice(start) });
  }

  return parts;
}

function parseIcu(inner) {
  const head = inner.match(
    /^(\p{L}[\p{L}\p{N}_]*)\s*,\s*(\p{L}+)\s*(?:,\s*|\s+|$)/u,
  );

  if (!head) return null;

  const name = head[1];
  const type = head[2];
  const typeKnown = /^(plural|select|selectordinal|number|date|time)$/.test(
    type,
  );

  if (type === "number" || type === "date" || type === "time") {
    return { name, type, branches: null, offsetText: "", typeKnown: true };
  }

  let i = head[0].length;
  let offsetText = "";
  const offset = inner.slice(i).match(/^offset\s*:\s*\d+\s*/);
  if (offset) {
    offsetText = offset[0];
    i += offset[0].length;
  }

  const branches = [];
  while (i < inner.length) {
    while (i < inner.length && /\s/.test(inner[i])) i++;
    if (i >= inner.length) break;

    const selectorMatch = inner.slice(i).match(/^(=\d+|\p{L}+)/u);
    if (!selectorMatch) return null;

    const selector = selectorMatch[0];
    i += selector.length;
    while (i < inner.length && /\s/.test(inner[i])) i++;
    if (inner[i] !== "{") return null;

    const messageStart = i + 1;
    let depth = 1;
    i++;
    for (; i < inner.length && depth > 0; i++) {
      if (inner[i] === "{") depth++;
      else if (inner[i] === "}") depth--;
    }

    if (depth !== 0) return null;

    branches.push({
      selector,
      message: inner.slice(messageStart, i - 1),
      messageStart,
      messageEnd: i - 1,
    });
  }

  if (branches.length === 0) return null;

  return { name, type, branches, offsetText, typeKnown };
}

function collectVariableNames(text, names) {
  const parts = splitByTopLevelBraces(text);
  if (!parts) return;

  for (const part of parts) {
    if (part.type === "brace") collectFromBrace(part.inner, names);
  }
}

function collectFromBrace(inner, names) {
  if (/^\w+$/.test(inner) || inner === "#") {
    names.add(inner);
    return;
  }

  const icu = parseIcu(inner);
  if (icu?.branches) {
    names.add(icu.name);
    for (const branch of icu.branches) {
      collectVariableNames(branch.message, names);
    }

    return;
  }

  if (icu) {
    names.add(icu.name);
    return;
  }

  collectVariableNames(inner, names);
}

function withBranchMessages(inner, parsed, messages) {
  let out = "";
  let cursor = 0;

  for (let i = 0; i < parsed.branches.length; i++) {
    const branch = parsed.branches[i];
    out += inner.slice(cursor, branch.messageStart);
    out += messages[i];
    cursor = branch.messageEnd;
  }

  return out + inner.slice(cursor);
}

function restoreString(source, translated, names) {
  const srcParts = splitByTopLevelBraces(source);
  const dstParts = splitByTopLevelBraces(translated);
  if (!srcParts || !dstParts) return null;

  const srcBraces = srcParts.filter((part) => part.type === "brace");
  const dstBraces = dstParts.filter((part) => part.type === "brace");
  if (srcBraces.length !== dstBraces.length) return null;
  if (srcBraces.length === 0) return translated;

  let braceIndex = 0;
  const out = [];

  for (const part of dstParts) {
    if (part.type === "text") {
      out.push(part.value);
      continue;
    }

    const restored = restoreBrace(
      srcBraces[braceIndex].inner,
      part.inner,
      names,
    );

    braceIndex++;
    if (restored == null) return null;

    out.push(restored);
  }

  return out.join("");
}

function restoreBrace(srcInner, dstInner, names) {
  if (/^\w+$/.test(srcInner) || srcInner === "#") {
    if (dstInner === srcInner) return `{${srcInner}}`;
    if (/^\w+$/.test(dstInner) && names.has(dstInner)) return `{${dstInner}}`;

    return `{${srcInner}}`;
  }

  const srcIcu = parseIcu(srcInner);
  if (srcIcu?.branches) {
    return restoreIcuBrace(dstInner, srcIcu, names);
  }

  if (srcIcu) return `{${srcInner}}`;

  const restored = restoreString(srcInner, dstInner, names);
  if (restored == null) return null;

  return `{${restored}}`;
}

function restoreIcuBrace(dstInner, srcIcu, names) {
  const dstIcu = parseIcu(dstInner);
  if (!dstIcu?.branches) return null;

  const selectorsValid = dstIcu.branches.every((branch) =>
    isIcuSelector(branch.selector),
  );

  const typeOk = dstIcu.typeKnown && dstIcu.type === srcIcu.type;
  if (!selectorsValid || !typeOk) {
    if (dstIcu.branches.length !== srcIcu.branches.length) return null;

    return rebuildIcu(srcIcu, dstIcu, names);
  }

  if (dstIcu.branches.length !== srcIcu.branches.length) {
    if (dstIcu.name === srcIcu.name || names.has(dstIcu.name)) {
      return `{${dstInner}}`;
    }

    return `{${srcIcu.name}${dstInner.slice(dstIcu.name.length)}}`;
  }

  const restoredMessages = [];
  for (let i = 0; i < srcIcu.branches.length; i++) {
    const restored = restoreString(
      srcIcu.branches[i].message,
      dstIcu.branches[i].message,
      names,
    );

    if (restored == null) return null;

    restoredMessages.push(restored);
  }

  const messagesChanged = restoredMessages.some(
    (message, index) => message !== dstIcu.branches[index].message,
  );

  let inner = messagesChanged
    ? withBranchMessages(dstInner, dstIcu, restoredMessages)
    : dstInner;

  if (dstIcu.name !== srcIcu.name && !names.has(dstIcu.name)) {
    inner = srcIcu.name + inner.slice(dstIcu.name.length);
  }

  return `{${inner}}`;
}

function rebuildIcu(srcIcu, dstIcu, names) {
  const branches = [];

  for (let i = 0; i < srcIcu.branches.length; i++) {
    const restored = restoreString(
      srcIcu.branches[i].message,
      dstIcu.branches[i].message,
      names,
    );

    if (restored == null) return null;

    branches.push(`${srcIcu.branches[i].selector} {${restored}}`);
  }

  return `{${srcIcu.name}, ${srcIcu.type}, ${srcIcu.offsetText}${branches.join(" ")}}`;
}

/**
 * @param {string} source English message
 * @param {string} translated Machine translation of `source`
 * @returns {string | null} Translation with `{token}` names restored, or null
 *   when brace structure was damaged and the string should not be reused.
 */
export function restorePlaceholderTokens(source, translated) {
  if (typeof source !== "string" || typeof translated !== "string") return null;

  const names = new Set();
  collectVariableNames(source, names);
  return restoreString(source, translated, names);
}

/**
 * Rewrite cache entries whose `{token}` names drifted from the English key.
 * Drops entries whose braces no longer line up with the source.
 * @param {Record<string, string>} cache
 */
export function repairTranslationCache(cache) {
  let repaired = 0;
  let dropped = 0;

  for (const [key, value] of Object.entries(cache)) {
    const match = key.match(/^en\|[^|]+\|[^|]+\|([\s\S]*)$/);
    if (!match || typeof value !== "string") continue;

    const restored = restorePlaceholderTokens(match[1], value);
    if (restored == null) {
      delete cache[key];
      dropped++;
      continue;
    }

    if (restored !== value) {
      cache[key] = restored;
      repaired++;
    }
  }

  return { repaired, dropped };
}
