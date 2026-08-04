/**
 * Demo waitlist entry for template preview (e.g. email templates with waitlist placeholders).
 * Used by getDemoEmailArguments when the waitlist app implements demo-email-arguments-provider.
 */
const customerId = "customer-1234";

export const demoWaitlistEntry = {
  _id: "waitlist-entry-1234",
  createdAt: new Date(),
  updatedAt: new Date(),
  customerId,
  status: "active",
  customer: {
    _id: customerId,
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "+1 (555)555-5555",
    knownEmails: ["johnsmith@example.com"],
    knownNames: ["Dr. John Smith"],
    knownPhones: ["+1 (555)555-6666"],
    requireDeposit: "inherit",
    dateOfBirth: new Date(),
    avatar: "https://via.placeholder.com/150",
    note: "Demo note",
    dontAllowBookings: false,
  },
  member: {
    _id: "member-1",
    name: "Demo Employee",
    email: "demo@example.com",
    phone: "+1 (555)555-7777",
  },
  email: "johnsmith@example.com",
  name: "Dr. John Smith",
  phone: "+1 (555)555-6666",
  asSoonAsPossible: false,
  optionId: "option-1234",
  addonsIds: [],
  duration: 100,
  option: {
    _id: "option-1234",
    name: "Demo option",
    duration: 100,
    price: 50,
    durationType: "fixed",
  },
  addons: [],
  dates: [],
};
