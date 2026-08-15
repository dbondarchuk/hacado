import { pageDefault } from "./page";

export const modifyDefaultPage = (bookLabels: Record<string, string>) =>
  pageDefault(
    [
      {
        id: "block-9bb3d87a-a5a9-497f-b348-a954389bf5ef",
        type: "ModifyAppointmentFormModern",
        data: {
          style: {},
          props: {
            hideTitle: true,
            hideSteps: false,
            scrollToTop: true,
          },
        },
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
                    fontSize: "0.75rem",
                    italic: true,
                    backgroundColor: "rgb(255, 255, 255)",
                    color: "rgb(2, 8, 23)",
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
        id: "block-47e1ae74-bd68-4d2f-97c7-891d4600e1df",
      },
    ],
    bookLabels.manageYourAppointment,
  );
