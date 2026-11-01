const { describe, it } = require("node:test");
const { RuleTester } = require("eslint");
const tsParser = require("@typescript-eslint/parser");
const rule = require("./padding-lines");

const tester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
});

/**
 * @param {string} code
 */
function valid(code) {
  return { code, filename: "test.ts" };
}

/**
 * @param {string} code
 * @param {string} output
 * @param {string | string[]} messageId
 */
function invalid(code, output, messageId) {
  const messageIds = Array.isArray(messageId) ? messageId : [messageId];

  return {
    code,
    output,
    filename: "test.ts",
    errors: messageIds.map((id) => ({ messageId: id })),
  };
}

describe("hacado/padding-lines", () => {
  it("matches the blank-line style", () => {
    tester.run("padding-lines", rule, {
      valid: [
        valid(`const customer = await getCustomer(customerId);
const appointment = await getAppointment(appointmentId);
`),
        valid(`const customer = await findCustomer(input.customerId);
const service = await getService(input.serviceId);

const appointment = buildAppointment(customer, service, input);

await saveAppointment(appointment);

return appointment;
`),
        valid(`const availableSlots = slots.filter(
  (slot) => slot.start >= startTime && slot.end <= endTime,
);

const firstAvailableSlot = availableSlots[0];
`),
        valid(`const activeStaff = staff.filter((staff) => staff.active);
const availableStaff = activeStaff.filter((staff) =>
  isStaffAvailable(staff, date),
);

const firstAvailableStaff = availableStaff[0];
`),
        valid(`if (isAnySpecialist && !selectedMemberId) {
  return activeStaff.some((staff) =>
    isAddonAvailableForMember(addon.staff, staff.member.id),
  );
}

return isAddonAvailableForMember(addon.staff, selectedMemberId);
`),
        valid(`if (!user) {
  return null;
}
if (!user.companyId) {
  return null;
}

const company = await getCompany(user.companyId);
return company;
`),
        valid(`if (!customer) {
  return null;
}

const appointments = await getAppointments(customer.id);
`),
        valid(`if (status === "pending") {
  handlePending();
} else if (status === "confirmed") {
  handleConfirmed();
} else {
  handleOther();
}

sendNotification();
`),
        valid(`try {
  await operation();
} catch (error) {
  handleError(error);
}

await continueProcessing();
`),
        valid(`if (customer) {
  if (customer.isActive) {
    processCustomer(customer);
  }

  updateCustomerMetadata(customer);
}

sendNotification();
`),
        valid(`function getCustomer(id: string) {
  return customers.get(id);
}

function getAppointment(id: string) {
  return appointments.get(id);
}
`),
        valid(`import { a } from "a";
import { b } from "b";

export function build() {
  return a + b;
}
`),
        valid(`import {
  a,
  b,
} from "mod";
import { c } from "other";
`),
        valid(`const value = {
  a: 1,

  b: 2,
};
`),
        valid(`function foo(value: string): string;
function foo(value: number): number;
function foo(value: string | number) {
  return value;
}
`),
        valid(`for (const item of items.filter(
  (item) => item.active,
)) {
  process(item);
}

return;
`),
        valid(`claim(
  organizationId,
  eventId,
);
`),
      ],
      invalid: [
        invalid(
          `const claimed = await claimEventHandler(
  redis,
  organizationId,
  eventId,
  handlerName,
);
if (!claimed) return;
`,
          `const claimed = await claimEventHandler(
  redis,
  organizationId,
  eventId,
  handlerName,
);

if (!claimed) return;
`,
          "expectedBlankLine",
        ),
        invalid(
          `if (hasChanges) {
  await saveChanges();
}
await invalidateCache();
`,
          `if (hasChanges) {
  await saveChanges();
}

await invalidateCache();
`,
          "expectedBlankLine",
        ),
        invalid(
          `if (!user) {
  return null;
}

if (!user.companyId) {
  return null;
}
const company = await getCompany(user.companyId);
`,
          `if (!user) {
  return null;
}
if (!user.companyId) {
  return null;
}

const company = await getCompany(user.companyId);
`,
          ["unexpectedBlankLine", "expectedBlankLine"],
        ),
        invalid(
          `if (!user) return null;
const company = await getCompany(user.companyId);
`,
          `if (!user) return null;

const company = await getCompany(user.companyId);
`,
          "expectedBlankLine",
        ),
        invalid(
          `function getCustomer(id: string) {
  return customers.get(id);
}
function getAppointment(id: string) {
  return appointments.get(id);
}
`,
          `function getCustomer(id: string) {
  return customers.get(id);
}

function getAppointment(id: string) {
  return appointments.get(id);
}
`,
          "expectedBlankLine",
        ),
        invalid(
          `function getCustomer(id: string) { return customers.get(id); }
function getAppointment(id: string) { return appointments.get(id); }
`,
          `function getCustomer(id: string) { return customers.get(id); }

function getAppointment(id: string) { return appointments.get(id); }
`,
          "expectedBlankLine",
        ),
        invalid(
          `class Customer {}
class Appointment {}
`,
          `class Customer {}

class Appointment {}
`,
          "expectedBlankLine",
        ),
        invalid(
          `function foo(value: string): string;

function foo(value: string) {
  return value;
}
`,
          `function foo(value: string): string;
function foo(value: string) {
  return value;
}
`,
          "unexpectedBlankLine",
        ),
        invalid(
          `claim(
  organizationId,

  eventId,
);
`,
          `claim(
  organizationId,
  eventId,
);
`,
          "unexpectedArgumentBlankLine",
        ),
        invalid(
          `new Service(
  options,

  logger,
);
`,
          `new Service(
  options,
  logger,
);
`,
          "unexpectedArgumentBlankLine",
        ),
        invalid(
          `try {
  await operation();
} catch (error) {
  handleError(error);
}
await continueProcessing();
`,
          `try {
  await operation();
} catch (error) {
  handleError(error);
}

await continueProcessing();
`,
          "expectedBlankLine",
        ),
        invalid(
          `if (customer) {
  if (customer.isActive) {
    processCustomer(customer);
  }
  updateCustomerMetadata(customer);
}
`,
          `if (customer) {
  if (customer.isActive) {
    processCustomer(customer);
  }

  updateCustomerMetadata(customer);
}
`,
          "expectedBlankLine",
        ),
        invalid(
          `import {
  a,
  b,
} from "mod";
const value = a + b;
`,
          `import {
  a,
  b,
} from "mod";

const value = a + b;
`,
          "expectedBlankLine",
        ),
        invalid(
          `switch (status) {
  case "pending":
    handlePending(
      order,
    );
    return;
}
`,
          `switch (status) {
  case "pending":
    handlePending(
      order,
    );

    return;
}
`,
          "expectedBlankLine",
        ),
        invalid(
          `if (!user) {\r\n  return null;\r\n}\r\nconst company = await getCompany(user.companyId);\r\n`,
          `if (!user) {\r\n  return null;\r\n}\r\n\r\nconst company = await getCompany(user.companyId);\r\n`,
          "expectedBlankLine",
        ),
      ],
    });
  });
});
