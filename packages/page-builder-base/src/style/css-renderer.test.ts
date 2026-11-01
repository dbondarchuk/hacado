import { renderStylesToCSS } from "./css-renderer";

// Mock style definitions for testing
const mockStyleDefinitions: any = {
  color: {
    name: "color",
    label: "Color",
    category: "typography",
    icon: () => null,
    schema: {},
    renderToCSS: (value: any) => (value ? `color: ${value};` : null),
    component: () => null,
  },
  backgroundColor: {
    name: "backgroundColor",
    label: "Background Color",
    category: "background",
    icon: () => null,
    schema: {},
    renderToCSS: (value: any) => (value ? `background-color: ${value};` : null),
    component: () => null,
  },
  fontSize: {
    name: "fontSize",
    label: "Font Size",
    category: "typography",
    icon: () => null,
    schema: {},
    renderToCSS: (value: any) => (value ? `font-size: ${value};` : null),
    component: () => null,
  },
};

// Test cases
console.log("🧪 Testing Nested/Children Styles\n");

// Test 1: Basic nested styles
console.log("Test 1: Basic nested styles");
const basicNestedStyles: any = {
  color: [{ value: "black", breakpoint: [], state: [] }],
  children: {
    ".header": {
      color: [{ value: "red", breakpoint: [], state: [] }],
      fontSize: [{ value: "1.5rem", breakpoint: [], state: [] }],
    },
    ".footer": {
      backgroundColor: [{ value: "gray", breakpoint: [], state: [] }],
    },
  },
};

const basicCSS = renderStylesToCSS(
  mockStyleDefinitions,
  basicNestedStyles,
  undefined,
  false,
  "my-block",
);

console.log("Generated CSS:");
console.log(basicCSS);
console.log(
  "\nExpected: .my-block with color: black, .my-block .header with color: red and font-size: 1.5rem, .my-block .footer with background-color: gray",
);

console.log("✅ Basic nested styles test completed\n");

// Test 2: Nested styles with variants
console.log("Test 2: Nested styles with variants");
const nestedWithVariants: any = {
  color: [{ value: "black", breakpoint: [], state: [] }],
  children: {
    ".header": {
      color: [
        { value: "red", breakpoint: [], state: [] },
        { value: "blue", breakpoint: ["sm"], state: [] },
      ],
    },
  },
};

const variantsCSS = renderStylesToCSS(
  mockStyleDefinitions,
  nestedWithVariants,
  undefined,
  false,
  "my-block",
);

console.log("Generated CSS:");
console.log(variantsCSS);
console.log(
  "\nExpected: .my-block with color: black, .my-block .header with color: red, and @media (min-width: 40rem) with .my-block .header color: blue",
);

console.log("✅ Nested styles with variants test completed\n");

// Test 3: Deep nesting
console.log("Test 3: Deep nesting");
const deepNested: any = {
  color: [{ value: "black", breakpoint: [], state: [] }],
  children: {
    ".header": {
      color: [{ value: "red", breakpoint: [], state: [] }],
      children: {
        ".title": {
          fontSize: [{ value: "2rem", breakpoint: [], state: [] }],
        },
      },
    },
  },
};

const deepCSS = renderStylesToCSS(
  mockStyleDefinitions,
  deepNested,
  undefined,
  false,
  "my-block",
);

console.log("Generated CSS:");
console.log(deepCSS);
console.log(
  "\nExpected: .my-block, .my-block .header, and .my-block .header .title",
);

console.log("✅ Deep nesting test completed\n");

// Test 4: Empty children (should not generate CSS)
console.log("Test 4: Empty children");
const emptyChildren: any = {
  color: [{ value: "black", breakpoint: [], state: [] }],
  children: {
    ".empty": {},
  },
};

const emptyCSS = renderStylesToCSS(
  mockStyleDefinitions,
  emptyChildren,
  undefined,
  false,
  "my-block",
);

console.log("Generated CSS:");
console.log(emptyCSS);
console.log(
  "\nExpected: Only .my-block with color: black, no .my-block .empty",
);

console.log("✅ Empty children test completed\n");

console.log("🎉 All nested styles tests completed!");
