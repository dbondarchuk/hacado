import { ShortcutOption } from "./types";
import { applyShortcutOption, getShortcutCurrentValue } from "./utils";

// Mock shortcut options for testing
const mockShortcutOptions: ShortcutOption<any>[] = [
  {
    value: "full",
    label: "builder.pageBuilder.blocks.container.widths.full" as any,
    targetStyles: {
      width: { value: 100, unit: "%" },
      margin: {
        top: "auto",
        right: "auto",
        bottom: "auto",
        left: "auto",
      },
    },
  },
  {
    value: "contained",
    label: "builder.pageBuilder.blocks.container.widths.contained" as any,
    targetStyles: {
      width: { value: 100, unit: "%" },
      maxWidth: {
        variants: [
          { value: { value: 640, unit: "px" }, breakpoint: [] },
          { value: { value: 768, unit: "px" }, breakpoint: ["sm"] },
          { value: { value: 1024, unit: "px" }, breakpoint: ["md"] },
          { value: { value: 1280, unit: "px" }, breakpoint: ["lg"] },
          { value: { value: 1536, unit: "px" }, breakpoint: ["xl"] },
          { value: { value: 1536, unit: "px" }, breakpoint: ["2xl"] },
        ],
      },
      margin: {
        top: "auto",
        right: "auto",
        bottom: "auto",
        left: "auto",
      },
    },
  },
  {
    value: "dynamic",
    label: "builder.pageBuilder.blocks.container.widths.large" as any,
    targetStyles: {
      width: { value: 100, unit: "%" },
      maxWidth: {
        variants: [
          {
            value: (prev: any) =>
              prev
                ? { value: prev.value + 100, unit: "px" }
                : { value: 500, unit: "px" },
            breakpoint: [],
          },
          {
            value: (prev: any) =>
              prev
                ? { value: prev.value + 200, unit: "px" }
                : { value: 700, unit: "px" },
            breakpoint: ["sm"],
          },
        ],
      },
    },
  },
];

// Test cases
const testCases = [
  {
    name: "Full width styles should match 'full' option",
    styles: {
      width: [{ value: { value: 100, unit: "%" }, breakpoint: [], state: [] }],
      margin: [
        {
          value: { top: "auto", right: "auto", bottom: "auto", left: "auto" },
          breakpoint: [],
          state: [],
        },
      ],
    },
    expected: "full",
  },
  {
    name: "Contained styles should match 'contained' option",
    styles: {
      width: [{ value: { value: 100, unit: "%" }, breakpoint: [], state: [] }],
      maxWidth: [
        { value: { value: 640, unit: "px" }, breakpoint: [], state: [] },
        { value: { value: 768, unit: "px" }, breakpoint: ["sm"], state: [] },
        { value: { value: 1024, unit: "px" }, breakpoint: ["md"], state: [] },
      ],
      margin: [
        {
          value: { top: "auto", right: "auto", bottom: "auto", left: "auto" },
          breakpoint: [],
          state: [],
        },
      ],
    },
    expected: "contained",
  },
  {
    name: "Partial contained styles should still match 'contained' option",
    styles: {
      width: [{ value: { value: 100, unit: "%" }, breakpoint: [], state: [] }],
      maxWidth: [
        { value: { value: 640, unit: "px" }, breakpoint: [], state: [] },
        { value: { value: 768, unit: "px" }, breakpoint: ["sm"], state: [] },
      ],
    },
    expected: "contained",
  },
  {
    name: "Contained with only base variant should still prefer 'contained' over 'full'",
    styles: {
      width: [{ value: { value: 100, unit: "%" }, breakpoint: [], state: [] }],
      maxWidth: [
        { value: { value: 640, unit: "px" }, breakpoint: [], state: [] },
      ],
    },
    expected: "contained",
  },
];

// Mock shortcut for testing
const mockShortcut = {
  inputType: "combobox",
  options: mockShortcutOptions,
} as any;

// Run tests
console.log("🧪 Testing Shortcuts Utilities\n");

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);

  const result = getShortcutCurrentValue(mockShortcut, testCase.styles);

  if (result === testCase.expected) {
    console.log(`✅ PASS: Expected "${testCase.expected}", got "${result}"`);
  } else {
    console.log(`❌ FAIL: Expected "${testCase.expected}", got "${result}"`);
  }

  console.log("");
});

// Test value functions in variants
console.log("🧪 Testing Value Functions in Variants\n");

const testStyles = {
  maxWidth: [
    { value: { value: 400, unit: "px" }, breakpoint: [], state: [] },
    { value: { value: 600, unit: "px" }, breakpoint: ["sm"], state: [] },
  ],
};

const dynamicOption = mockShortcutOptions[2];
console.log(
  "Before applying dynamic option:",
  JSON.stringify(testStyles, null, 2),
);

const newStyles = applyShortcutOption(dynamicOption, {
  styles: testStyles,
  onStylesChange: (styles) => {
    console.log(
      "After applying dynamic option:",
      JSON.stringify(styles, null, 2),
    );
  },
});

console.log("✅ Value functions in variants test completed\n");

// Test the scoring system
console.log("🧪 Testing Scoring System\n");

const scoringTestCases = [
  {
    name: "Perfect match should have highest score",
    styles: {
      width: [{ value: { value: 100, unit: "%" }, breakpoint: [], state: [] }],
      maxWidth: [
        { value: { value: 640, unit: "px" }, breakpoint: [], state: [] },
        { value: { value: 768, unit: "px" }, breakpoint: ["sm"], state: [] },
      ],
    },
  },
  {
    name: "Partial match should have lower score",
    styles: {
      width: [{ value: { value: 100, unit: "%" }, breakpoint: [], state: [] }],
      maxWidth: [
        { value: { value: 640, unit: "px" }, breakpoint: [], state: [] },
      ],
    },
  },
];

scoringTestCases.forEach((testCase, index) => {
  console.log(`Scoring Test ${index + 1}: ${testCase.name}`);
  const result = getShortcutCurrentValue(mockShortcut, testCase.styles);
  console.log(`Result: "${result}"`);
  console.log("");
});

// Test scoring comparison between full and contained
console.log("🧪 Testing Full vs Contained Scoring\n");

const fullVsContainedTest = {
  styles: {
    width: [{ value: { value: 100, unit: "%" }, breakpoint: [], state: [] }],
    maxWidth: [
      { value: { value: 640, unit: "px" }, breakpoint: [], state: [] },
    ],
  },
};

console.log("Testing styles that could match both 'full' and 'contained':");
console.log(JSON.stringify(fullVsContainedTest.styles, null, 2));
const result = getShortcutCurrentValue(
  mockShortcut,
  fullVsContainedTest.styles,
);

console.log(`Result: "${result}" (should be 'contained' due to variant bonus)`);
console.log("");

// Test style removal with undefined
console.log("🧪 Testing Style Removal\n");

const removalTestStyles = {
  maxWidth: [
    { value: { value: 640, unit: "px" }, breakpoint: [], state: [] },
    { value: { value: 768, unit: "px" }, breakpoint: ["sm"], state: [] },
  ],
  backgroundColor: [{ value: "red", breakpoint: [], state: [] }],
  width: [{ value: { value: 100, unit: "%" }, breakpoint: [], state: [] }],
};

const removalOption = {
  label: "test" as any,
  value: "test",
  targetStyles: {
    maxWidth: undefined, // Explicitly remove maxWidth
    backgroundColor: undefined, // Explicitly remove backgroundColor
  },
};

console.log("Before removal:", JSON.stringify(removalTestStyles, null, 2));

const afterRemoval = applyShortcutOption(removalOption, {
  styles: removalTestStyles,
  onStylesChange: (styles) => {
    console.log("After removal:", JSON.stringify(styles, null, 2));
  },
});

console.log("✅ Style removal test completed\n");

// Test variant removal with undefined values
console.log("🧪 Testing Variant Removal\n");

const variantRemovalTestStyles = {
  maxWidth: [
    { value: { value: 640, unit: "px" }, breakpoint: [], state: [] },
    { value: { value: 768, unit: "px" }, breakpoint: ["sm"], state: [] },
    { value: { value: 1024, unit: "px" }, breakpoint: ["md"], state: [] },
    { value: { value: 1280, unit: "px" }, breakpoint: ["lg"], state: [] },
  ],
  backgroundColor: [
    { value: "red", breakpoint: [], state: [] },
    { value: "blue", breakpoint: ["sm"], state: [] },
  ],
};

// Test 1: Remove specific variant (sm breakpoint)
const removeSpecificVariantOption = {
  label: "test" as any,
  value: "test",
  targetStyles: {
    maxWidth: { value: undefined, breakpoint: ["sm"] }, // Remove only sm variant
  },
};

console.log("Test 1: Remove specific variant (sm breakpoint)");
console.log(
  "Before:",
  JSON.stringify(variantRemovalTestStyles.maxWidth, null, 2),
);

const afterSpecificRemoval = applyShortcutOption(removeSpecificVariantOption, {
  styles: variantRemovalTestStyles,
  onStylesChange: (styles) => {
    console.log(
      "After removing sm variant:",
      JSON.stringify(styles.maxWidth, null, 2),
    );
  },
});

// Test 2: Remove variant from variants array
const removeFromArrayOption = {
  label: "test" as any,
  value: "test",
  targetStyles: {
    backgroundColor: {
      variants: [
        { value: undefined, breakpoint: ["sm"] }, // Remove sm variant
        { value: "green", breakpoint: ["md"] }, // Add new variant
      ],
    },
  },
};

console.log("\nTest 2: Remove variant from variants array");
console.log(
  "Before:",
  JSON.stringify(variantRemovalTestStyles.backgroundColor, null, 2),
);

const afterArrayRemoval = applyShortcutOption(removeFromArrayOption, {
  styles: variantRemovalTestStyles,
  onStylesChange: (styles) => {
    console.log(
      "After array removal:",
      JSON.stringify(styles.backgroundColor, null, 2),
    );
  },
});

// Test 3: Remove all variants of a style
const removeAllVariantsOption = {
  label: "test" as any,
  value: "test",
  targetStyles: {
    maxWidth: { value: undefined, breakpoint: [] }, // Remove base variant
  },
};

console.log("\nTest 3: Remove all variants (should remove entire style)");
console.log(
  "Before:",
  JSON.stringify(variantRemovalTestStyles.maxWidth, null, 2),
);

const afterAllRemoval = applyShortcutOption(removeAllVariantsOption, {
  styles: variantRemovalTestStyles,
  onStylesChange: (styles) => {
    console.log(
      "After removing all variants:",
      JSON.stringify(styles.maxWidth, null, 2),
    );

    console.log("Style property exists:", "maxWidth" in styles);
  },
});

console.log("✅ Variant removal test completed\n");

// Test practical example: Selective container width
console.log("🧪 Testing Practical Example: Selective Container Width\n");

const practicalTestStyles = {
  maxWidth: [
    { value: { value: 640, unit: "px" }, breakpoint: [], state: [] },
    { value: { value: 768, unit: "px" }, breakpoint: ["sm"], state: [] },
    { value: { value: 1024, unit: "px" }, breakpoint: ["md"], state: [] },
    { value: { value: 1280, unit: "px" }, breakpoint: ["lg"], state: [] },
    { value: { value: 1536, unit: "px" }, breakpoint: ["xl"], state: [] },
  ],
  width: [{ value: { value: 100, unit: "%" }, breakpoint: [], state: [] }],
  margin: [
    {
      value: { top: "auto", right: "auto", bottom: "auto", left: "auto" },
      breakpoint: [],
      state: [],
    },
  ],
};

// Create a "medium-contained" option that removes large breakpoints
const mediumContainedOption = {
  label: "Medium Contained" as any,
  value: "medium-contained",
  targetStyles: {
    width: { value: 100, unit: "%" },
    maxWidth: {
      variants: [
        { value: { value: 640, unit: "px" }, breakpoint: [] },
        { value: { value: 768, unit: "px" }, breakpoint: ["sm"] },
        { value: { value: 1024, unit: "px" }, breakpoint: ["md"] },
        { value: undefined, breakpoint: ["lg"] }, // Remove lg variant
        { value: undefined, breakpoint: ["xl"] }, // Remove xl variant
      ],
    },
    margin: {
      top: "auto",
      right: "auto",
      bottom: "auto",
      left: "auto",
    },
  },
};

console.log("Practical Example: Creating 'medium-contained' option");
console.log("Before:", JSON.stringify(practicalTestStyles.maxWidth, null, 2));

const afterPracticalRemoval = applyShortcutOption(mediumContainedOption, {
  styles: practicalTestStyles,
  onStylesChange: (styles) => {
    console.log(
      "After applying medium-contained:",
      JSON.stringify(styles.maxWidth, null, 2),
    );

    console.log(
      "This creates a container that's contained up to md breakpoint, then full width",
    );
  },
});

console.log("✅ Practical example test completed\n");

console.log("🎉 All tests completed!");
