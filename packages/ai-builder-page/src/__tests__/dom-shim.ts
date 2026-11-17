/** Minimal browser globals so style editor deps load under node:test. */
const g = globalThis as typeof globalThis & {
  window?: typeof globalThis;
  document?: Record<string, unknown>;
  HTMLElement?: new () => object;
  Element?: new () => object;
  Node?: new () => object;
  navigator?: { userAgent: string };
  getComputedStyle?: () => Record<string, string>;
  requestAnimationFrame?: (cb: FrameRequestCallback) => number;
  cancelAnimationFrame?: (id: number) => void;
  matchMedia?: (query: string) => {
    matches: boolean;
    media: string;
    addListener: () => void;
    removeListener: () => void;
    addEventListener: () => void;
    removeEventListener: () => void;
    dispatchEvent: () => boolean;
  };
};

const element = () => {
  const node: Record<string, unknown> = {
    style: {},
    classList: { add() {}, remove() {}, contains: () => false },
    setAttribute() {},
    getAttribute: () => null,
    appendChild(child: unknown) {
      return child;
    },
    removeChild(child: unknown) {
      return child;
    },
    addEventListener() {},
    removeEventListener() {},
  };

  return node;
};

if (!g.window) {
  g.window = g;
}

if (!g.document) {
  g.document = {
    head: element(),
    body: element(),
    documentElement: element(),
    createElement: () => element(),
    createElementNS: () => element(),
    createTextNode: () => ({}),
    getElementsByTagName: () => [element()],
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createEvent: () => ({ initEvent() {} }),
  };
}

if (!g.HTMLElement) {
  g.HTMLElement = class HTMLElement {};
}

if (!g.Element) {
  g.Element = class Element {};
}

if (!g.Node) {
  g.Node = class Node {};
}

if (!g.navigator) {
  g.navigator = { userAgent: "node" };
}

if (!g.getComputedStyle) {
  g.getComputedStyle = () =>
    new Proxy({}, { get: () => "" }) as Record<string, string>;
}

if (!g.requestAnimationFrame) {
  g.requestAnimationFrame = (cb) =>
    setTimeout(() => cb(Date.now()), 0) as unknown as number;
}

if (!g.cancelAnimationFrame) {
  g.cancelAnimationFrame = (id) => clearTimeout(id);
}

if (!g.matchMedia) {
  g.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false,
  });
}
