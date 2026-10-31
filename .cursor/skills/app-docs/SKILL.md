---
name: app-docs
description: >-
  Write Hacado product docs as Nextra pages in docs/content. Browses the
  running app, saves screenshots under docs/public/img, and adds or updates
  Markdown pages with frontmatter, _meta.ts sidebar entries, and /docs links.
  Use when the user asks to document the app, write a user guide, add help
  docs, screenshot a flow, or update the Nextra documentation.
---

# App docs for the Hacado Nextra site

Browse the product, then publish the guide as pages in the Nextra app at `docs/`. Do not write `docs/USER_GUIDE.md`, a single combined guide, or an HTML export.

The docs app is `docs/` (port 3003). Prefer `.md` pages. Use `.mdx` only when the page needs a registered docs component such as `PlanRequirement`. Do not invent JSX outside those registered components.

## Depth

| Depth          | What to publish                                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **quick**      | One page for the happy path. A few screenshots.                                                                              |
| **standard**   | Default. Every page the task needs, primary actions, and a screenshot for each control or result the reader is told to find. |
| **thorough**   | Standard, plus empty, error, and important alternate states on those same pages.                                             |
| **exhaustive** | Thorough, plus settings tables and a short troubleshooting section. Still separate Nextra pages.                             |

Ask for the depth only when the request does not imply one. Default to **exhaustive**.

## Where pages go

Update an existing page when the topic already has one. Add a page only when nothing covers it.

| Topic                           | Folder                          | Public URL                                                      |
| ------------------------------- | ------------------------------- | --------------------------------------------------------------- |
| Account, plan, first-time setup | `docs/content/getting-started/` | `/docs/getting-started/...`                                     |
| Checklist after setup           | `docs/content/first-steps/`     | `/docs/first-steps/...` (`index.md` is the section landing)     |
| Catalog definitions             | `docs/content/catalog/`         | `/docs/catalog/...` (three levels: section → entity → task)     |
| Settings and custom domain      | `docs/content/daily-use/`       | `/docs/daily-use/...` (sidebar title is "Using your workspace") |
| An optional integration         | `docs/content/apps/`            | `/docs/apps/<slug>` (flat; groups are separators, not folders)  |

### Catalog section

Catalog uses nested folders: `docs/content/catalog/<entity>/` with an entity hub `index.md` and task pages named as actions (`creating-a-new-service.md`, `updating-an-existing-service.md`, `listing-services.md`, `deleting-a-service.md`, `good-to-know.md`, `field-types.md`). Sidebar labels use the human titles.

Depth for Catalog is **exhaustive**: before writing an entity, inventory every tab, switch, radio, dialog, row menu, and empty state in the live admin UI. Document and screenshot every branch the reader can click or toggle—not only the happy path. Prefer tight crops of each control state.

Solo+ Catalog pages (discounts, gift cards, packages, sold packages) use `.mdx` and start with:

```mdx
<PlanRequirement plan="Solo" />
```

`PlanRequirement` is registered in `docs/mdx-components.tsx`. Do not use raw callout JSX.

Do not create a new top-level section unless the user asks. Register a new section in `docs/content/_meta.ts` with the existing `sectionTheme` (`timestamp: false`, `typesetting: "article"`).

`/docs` redirects to `/docs/getting-started/introduction`. `/docs/daily-use/first-steps-after-setup` redirects to `/docs/first-steps`. Keep those URLs working.

The homepage is `docs/app/page.tsx`, not a content file.

## Page file

```md
---
description: One sentence for search. Say what the page helps the reader do.
---

# Page title

One or two sentences: what this is for and when to use it.

## Section

Steps or explanation.

![What the screenshot shows](/img/getting-started/sign-up.png)
```

- Frontmatter is only `description`.
- The `#` heading is the article title. The sidebar label lives in `_meta.ts` and can be shorter.
- Bold the UI label the reader must find: **Apps**, **Save**.
- One action per numbered step.
- Tips are a `### Good to know` heading, matching existing pages. Do not use callout syntax. The only allowed JSX is registered docs components such as `PlanRequirement` in `.mdx` files.
- Match the voice of the surrounding pages: plain language for a business owner, short paragraphs, no filler.

### Task page

Use this for getting started, first steps, and daily use.

```md
## Before you start

- What the reader needs first.

## Do the task

1. Open **Screen** and click **Action**.

![Result of the action](/img/first-steps/example.png)

## What happens next

- [Next page](./next-page)
```

### App page

Every App guide uses the same sections. Read `docs/content/apps/overview.md` and match it.

```md
## Adding the App

1. Open **Apps**, then **Store**.
2. Install **App name** and finish the prompts.

If setup fails, read **[Apps troubleshooting](/docs/apps/troubleshooting)**.

### Good to know

One non-obvious constraint.

## Usage

### Name the outcome

**Use this when:** The situation.

**You need:** What must already be true.

## Removing the App

1. Open **Apps**, then **Installed apps**.
2. Open the App and disconnect it.

### What changes afterward

What stops working, and what the other company still stores.
```

## Sidebar

Add the page to that folder's `_meta.ts`. Put it where a reader would look, not at the bottom by default.

```ts
"sign-up": "Sign up",
```

App groups are separators, not folders:

```ts
"--payments": separator("Payments"),
stripe: "Stripe",
```

A new App page joins the matching separator group. Do not add a folder under `apps/`.

## Links

- Same folder: `./workspace-install-wizard` with no extension.
- Another section: `/docs/apps/overview`.
- Never link a `.md` or `.mdx` file.

## Screenshots

Save files in `docs/public/img/<section>/` and reference them as `/img/<section>/file.png`.

Take as many shots as the page needs. A step that points at a control gets a picture of that control. Prefer a tight crop of a dialog, menu, field, switch, or button over a shot of the whole screen. Use a full page only when the reader needs to see where something sits, such as a sidebar group or a finished screen.

- Name by subject: `service-name-field.png`, `publish-switch.png`. No numeric prefixes.
- Size follows the subject. A dialog or a single field can be a small image. Do not pad a crop up to a fixed resolution, and do not require 1280×720.
- When the same screen uses a different layout on a phone, document both. Show the desktop layout, then the phone layout, and say how to use each one. Name the files `subject-desktop.png` and `subject-mobile.png`. Clear the phone-sized viewport before you leave that screen.
- Frame the shot so the label and the control are both in it. Leave a little padding around the element. Cut away the rest of the page, including empty margins.
- A dialog, popover, or open menu is its own image. Do not also ship the full page behind it unless that page is a separate step.
- Wait until data has loaded. No spinners or skeletons.
- Use realistic data. Do not ship a shot of "Test" or lorem ipsum.
- Keep one theme per section. Switch before the first shot of that section.
- Replace a placeholder SVG when you have a real shot of the same subject. Leave unrelated placeholders alone.
- The in-editor browser captures the page only. Do not switch to a desktop screenshot; that would include the address bar.
- Crop from the page screenshot using the element's box. Do not invent a picture of a control you did not open.
- The admin sidebar prints the workspace host under the business name. Hide it before every admin screenshot that still shows the sidebar. In the page, set `display: none` on `[data-sidebar="header"] .text-xs`. Leave the business name visible. If the host is still readable, retake the shot. A crop that does not include the sidebar does not need this hide.
- Do not publish a dev host, `localhost`, a port, a workspace URL, the docs account email, or a phone number in the guide text or in an image. Say "your Hacado web address" when the reader needs to know one exists. If a field shows one of those values, crop it out or hide that text before the shot.

Use the Cursor browser tools: lock the tab, navigate, snapshot, hide anything that must not be published, then screenshot. For a tight shot, read the element's box and crop the saved image to it. Copy the file into `docs/public/img/...`. Clear any viewport override before you finish.

The product server is `https://app.dev.bondarchuk.me`. Open sign-up at `https://app.dev.bondarchuk.me/auth/signup`. Do not use localhost for the product, and do not write that host into the published guide.

Preview the docs site at `http://localhost:3003` (`yarn dev` from `docs/`). Confirm the new page, image, and sidebar entry. The product you document is the Hacado admin or booking site, not the docs site, unless the user asks for docs-site screenshots.

## Docs account

Sign-up and the install wizard are already documented. Later passes use the same account, sign in, and open the dashboard and the booking site. Do not create a second account.

The getting-started pages stop at **Your Hacado is ready**. Do not add dashboard or booking-page shots to those pages. First steps and everything after that start from the dashboard.

Path:

1. Sign up: profile, email and password, email code, phone, phone code.
2. Checkout. This opens Polar. Finish it with the sandbox payment method that environment already accepts. Do not put a card number in the guide.
3. Install, in the order the wizard shows: business (name and industry, plus the other required fields on that screen), services, schedule, integrations, payments, website, then the ready screen.

Wait until **Your Hacado is ready** is on screen before that screenshot. The building spinner is not the last step.

Later passes sign in as this same account. Do not create a second one.

Save the account at `.cursor/skills/app-docs/account.local.json` as soon as you invent the values, and update it after each step that succeeds. That file is gitignored. Never commit it, and never copy the email or password into a docs page.

```json
{
  "email": "northline-docs@hacado.com",
  "password": "generated-password",
  "name": "Alex Rivera",
  "phone": "",
  "businessName": "Northline Studio",
  "industry": "The industry chosen in the wizard",
  "plan": "The plan chosen at checkout"
}
```

- Email is a new address ending in `@hacado.com`.
- Password is at least 8 characters.
- Pick a plausible person name, business name, and industry. Not "Test" or "Docs".
- If the file already exists, sign in with it. Getting started is done once **Your Hacado is ready** has been reached. Keep going into the dashboard when the task is first steps or later.
- If a verification code or Polar challenge blocks you, leave the saved account in place and ask.

Update `docs/content/getting-started/sign-up.md`, `subscription-and-checkout.md`, and `workspace-install-wizard.md` from the screens you actually saw. The live wizard does not include a separate look-and-feel step.

## Workflow

1. Read the matching existing pages and `_meta.ts` before writing.
2. Ask only for what you cannot see: product URL, auth if the session is logged out, and depth when it is ambiguous. Audience is a Hacado business owner unless the user says otherwise.
3. Inventory the screens the task needs. Skip pages that already say the same thing.
4. Screenshot each control the steps mention, then write or update the `.md` page. Put each image next to the step it illustrates.
5. Register new pages in `_meta.ts`.
6. Open the public URL and check the heading, image, links, and sidebar.

Navigate, screenshot, and write without stopping for each page. Sign in as the saved docs account. Ask before paying with a real card, connecting a personal Google, Stripe, PayPal, or Square account, deleting data, or submitting a form for anyone other than that account.

## Quality bar

- A new user can finish the task from the page alone.
- Every screenshot sits next to the step it illustrates and has a sentence that says what it shows. A page can have many small images.
- Steps are one action each.
- The page is scannable: short sections, images next to the step they illustrate, links to the next task.
- Troubleshooting describes a failure you actually saw, not a guessed FAQ.
