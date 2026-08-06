import { pageDefault } from "./page";

export const bookDefaultPage = (
  waitlistAppId: string | undefined | null,
  bookLabels: Record<string, string>,
) =>
  pageDefault(
    [
      {
        id: "block-f6507cd3-f0c6-41cd-b92e-4504117c0010",
        type: "BookingModern",
        data: {
          style: {},
          props: {
            hideTitle: true,
            hideSteps: false,
            scrollToTop: true,
          },
        },
        ...(waitlistAppId
          ? {
              metadata: {
                waitlistAppId: waitlistAppId,
              },
            }
          : {}),
      },
      {
        type: "Text",
        data: {
          props: {
            value: [
              {
                children: [
                  {
                    text: bookLabels.policiesText,
                  },
                ],
                type: "p",
                id: "KsqOqwpH7a",
              },
            ],
          },
          style: {
            padding: [
              {
                value: {
                  top: {
                    value: 1,
                    unit: "rem",
                  },
                  bottom: {
                    value: 1,
                    unit: "rem",
                  },
                  left: {
                    value: 1.5,
                    unit: "rem",
                  },
                  right: {
                    value: 1.5,
                    unit: "rem",
                  },
                },
              },
            ],
            fontSize: [
              {
                value: {
                  value: 1,
                  unit: "rem",
                },
              },
            ],
            textAlign: [
              {
                breakpoint: [],
                state: [],
                value: "center",
              },
            ],
          },
        },
        id: "block-b32f4ab4-427d-4191-b06e-3d15250eb984",
      },
    ],
    bookLabels.bookNowLabel,
  );
