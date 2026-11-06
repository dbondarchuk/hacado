import { CustomerTextMessageBodies } from "../types";

export const UkCustomerTextMessageBodies: CustomerTextMessageBodies = {
  pending:
    "{{config.name}}: {{#customerName}}Привіт, {{customerName}}, ми{{/customerName}}{{^customerName}}Ми{{/customerName}} отримали ваш запит на {{service.name}} {{dateTime.sms}}." /* {{#manageLink}} Керувати: {{manageLink}}{{/manageLink}} */,
  confirmed:
    "{{config.name}}: {{#customerName}}Привіт, {{customerName}}, ваш{{/customerName}}{{^customerName}}Ваш{{/customerName}} {{service.name}} підтверджено на {{dateTime.sms}}." /* {{#manageLink}} Керувати: {{manageLink}}{{/manageLink}} */,
  declined:
    "{{config.name}}: {{#customerName}}Привіт, {{customerName}}, ваш{{/customerName}}{{^customerName}}Ваш{{/customerName}} запис на {{service.name}} {{dateTime.sms}} відхилено. Зателефонуйте нам або запишіться на інший час.",
  canceled:
    "{{config.name}}: {{#customerName}}Привіт, {{customerName}}, ваш{{/customerName}}{{^customerName}}Ваш{{/customerName}} {{service.name}} {{dateTime.sms}} скасовано.",
  noShow:
    "{{config.name}}: {{#customerName}}Привіт, {{customerName}}, вас{{/customerName}}{{^customerName}}Вас{{/customerName}} позначено як неявку на {{service.name}} {{dateTime.sms}}.",
  rescheduled:
    "{{config.name}}: {{#customerName}}Привіт, {{customerName}}, ваш{{/customerName}}{{^customerName}}Ваш{{/customerName}} {{service.name}} перенесено на {{dateTime.sms}}." /* {{#manageLink}} Керувати: {{manageLink}}{{/manageLink}} */,
};
