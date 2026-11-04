---
description: Insert names, formatted dates, and currency amounts into texts and emails with Mustache placeholders.
---

# Using template expressions

Template expressions insert booking details into a text or email for you. You write the sentence once. Hacado fills in the name, service, date, or business name when it sends that message.

You do not need to write code. Copy an expression and put it where that detail should appear.

For a customer named Sarah, booked for a Haircut on November 10, this:

```
Hi {{customer.name}}! Your {{service.name}} is confirmed for {{dateTime.date}}.
```

is sent as:

```
Hi Sarah! Your Haircut is confirmed for November 10.
```

Expressions use [Mustache](https://mustache.github.io/mustache.5.html). The same rules apply in a text template and in an email subject or block.

## Writing an expression

An expression is a path inside two opening braces and two closing braces:

```
{{customer.name}}
```

The path is case-sensitive. `{{customer.name}}` works. `{{Customer.Name}}` does not. Copy the path from the list instead of typing it when you can.

| Expression | What it inserts |
| --- | --- |
| `{{customer.name}}` | Customer's name |
| `{{customer.email}}` | Customer's email |
| `{{fields.name}}` | Name entered on the booking |
| `{{service.name}}` | Service name |
| `{{dateTime.date}}` | Appointment date |
| `{{dateTime.time}}` | Appointment time |
| `{{dateTime.full}}` | Date, time, and time zone |
| `{{member.name}}` | Staff member |
| `{{config.name}}` | Your business name |
| `{{otp}}` | Sign-in code, only on a sign-in message |

The full list depends on the message. A sign-in text has `{{otp}}`. A booking text has the appointment. Type `{{` in the editor, or open **View context**, and use only paths that appear there. See [Text message templates](/docs/communications/templates/text-messages) and [Email builder](/docs/communications/templates/emails).

## Dates

A date is not one string. Hacado turns every date into the same set of pieces, written in your business language and time zone. Use a piece in the sentence. `{{dateTime}}` by itself is the whole set, not a line of text.

These examples are the sample booking, November 20, 2024 at 9:00 AM Eastern time. Your preview uses your time zone.

| Expression | Sample |
| --- | --- |
| `{{dateTime.full}}` | November 20, 2024 at 9:00 AM EST |
| `{{dateTime.huge}}` | Wednesday, November 20, 2024 at 9:00 AM Eastern Standard Time |
| `{{dateTime.medium}}` | Nov 20, 2024, 9:00 AM |
| `{{dateTime.short}}` | 11/20/2024, 9:00 AM |
| `{{dateTime.date}}` | November 20, 2024 |
| `{{dateTime.dateHuge}}` | Wednesday, November 20, 2024 |
| `{{dateTime.time}}` | 9:00 AM |
| `{{dateTime.timeWithSeconds}}` | 9:00:00 AM |
| `{{dateTime.sms}}` | Wed, Nov 20, 9:00 AM |
| `{{dateTime.day.text}}` | Wednesday |
| `{{dateTime.day.short}}` | Wed |
| `{{dateTime.month.name}}` | November |
| `{{dateTime.month.short}}` | Nov |
| `{{dateTime.relative}}` | How far away it is from now, such as "in 3 days" |

`{{dateTime.sms}}` is the short form meant for a text. `{{dateTime.full}}` is the form to use in an email when you want the time zone named.

`{{dateTime.isTomorrow}}` is true only when the appointment is tomorrow. Use it as a section:

```
{{#dateTime.isTomorrow}}See you tomorrow.{{/dateTime.isTomorrow}}
```

The same pieces exist on every other date in the message. The appointment end is `{{endAt.time}}`. A payment's paid time, inside the payments list, is `{{paidAt.date}}`.

The length of the appointment is split into hours and minutes, not a date: `{{duration.hours}}` and `{{duration.minutes}}`.

## Prices and amounts

A price or amount is stored as a number and also as a formatted string. The formatted path is the same name with `Formatted` on the end. It uses your currency and language, so a US dollar amount of 90 is `$90.00`. Use the formatted path in a sentence. The plain number has no symbol.

| Expression | What it inserts |
| --- | --- |
| `{{totalPriceFormatted}}` | Total for the booking |
| `{{service.priceFormatted}}` | Service price |
| `{{subTotalAmountFormatted}}` | Total before the discount |
| `{{discount.discountAmountFormatted}}` | Discount amount |
| `{{totalAmountPaidFormatted}}` | Amount already paid |
| `{{totalAmountLeftToPayFormatted}}` | Amount still due |

Inside a Mustache list, the formatted name is the field on that item. An add-on's price is `{{priceFormatted}}` between `{{#addons}}` and `{{/addons}}`. A payment's amount is `{{amountFormatted}}` between `{{#payments}}` and `{{/payments}}`.

The email **Loop container** is a different list. Its **Value** is a JavaScript expression, and the row uses `{{_item.priceFormatted}}`. See [Loop container](/docs/communications/templates/emails/blocks/loop).

Any other field whose name contains "price" or "amount" follows the same rule. If **View context** shows `totalPrice`, it also shows `totalPriceFormatted`.

## Addresses

An address is available as separate pieces (`streetAddress`, `addressLocality`, `addressRegion`, `postalCode`) and as one line, `formatted`. The business address is `{{config.address.formatted}}`.

## In a sentence

Put an expression at the start, middle, or end of a sentence, and use as many as you need.

Greeting:

```
Hello {{customer.name}},
```

Reminder:

```
Your {{service.name}} appointment is on {{dateTime.date}} at {{dateTime.time}}.
```

Sign-off:

```
Thank you for choosing {{config.name}}.
```

## Show something only when it exists

Mustache does not use `if` or `else`. A section shows its contents only when the path has a value:

```
{{#member.jobTitle}} ({{member.jobTitle}}){{/member.jobTitle}}
```

If the staff member has a job title, the title is sent, including the parentheses. If the title is empty, that whole piece is left out.

To show different words when the value is missing, add an inverted section with `^`:

```
{{#member.jobTitle}}With {{member.name}}, {{member.jobTitle}}.{{/member.jobTitle}}{{^member.jobTitle}}With {{member.name}}.{{/member.jobTitle}}
```

## Repeat a list

A section also repeats once for each item in a list. Inside the section, paths refer to the current item, not to `this`.

```
{{#addons}}
{{name}}
{{/addons}}
```

That writes one line per add-on, using that add-on's name.

When the placeholder list shows `[]` under a path, choosing it inserts a repeat with `{{.}}`, which is the current item itself:

```
{{#payments}}{{.}}{{/payments}}
```

Use `{{.}}` when the list items are single values. Use `{{name}}` when each item is a record with its own fields, as add-ons are.

## If an expression is not replaced

If the customer sees the braces instead of a value:

1. Check for two opening braces and two closing braces.
2. Check the spelling and capitalization against **View context**.
3. Check that this message has that information. A sign-in text has no appointment, so `{{service.name}}` stays empty there.

### Good to know

- Preview, when the editor has one, fills the expressions with sample data before you save.
- The sample is not the customer who will receive the message. The send uses that customer's booking.
- Do not paste one customer's name or time into a template you will reuse. Use an expression.

## Related

- [Excellent text templates](./text-messages)
- [Excellent email templates](./emails)
- [Text message templates](/docs/communications/templates/text-messages)
- [Email builder](/docs/communications/templates/emails)
