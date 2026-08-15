import type { TemplateServiceArg } from "./home";
import { pageDefault } from "./page";

export const serviceDefaultPage = (
  service: TemplateServiceArg,
  bookLabels: Record<string, string>,
) =>
  pageDefault(
    [
      {
        type: "Text",
        data: {
          props: {
            value: service.description,
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
                  unit: "rem",
                  value: 0.8,
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
            fontWeight: [
              {
                breakpoint: [],
                state: [],
                value: "200",
              },
            ],
          },
        },
        id: `block-service-${service.id}-description`,
      },
      {
        type: "Button",
        data: {
          props: {
            url: "/book",
            target: "_self",
            children: [
              {
                type: "InlineContainer",
                id: `block-service-${service.id}-button-inline`,
                data: {
                  style: {
                    padding: [
                      {
                        value: {
                          top: {
                            value: 0,
                            unit: "rem",
                          },
                          bottom: {
                            value: 0,
                            unit: "rem",
                          },
                          left: {
                            value: 0,
                            unit: "rem",
                          },
                          right: {
                            value: 0,
                            unit: "rem",
                          },
                        },
                      },
                    ],
                    display: [
                      {
                        value: "inline-flex",
                      },
                    ],
                    flexDirection: [
                      {
                        value: "row",
                      },
                    ],
                    alignItems: [
                      {
                        value: "center",
                      },
                    ],
                    justifyContent: [
                      {
                        value: "center",
                      },
                    ],
                    gap: [
                      {
                        value: {
                          value: 0.5,
                          unit: "rem",
                        },
                      },
                    ],
                  },
                  props: {
                    children: [
                      {
                        type: "InlineText",
                        id: `block-service-${service.id}-button-inline-text`,
                        data: {
                          props: {
                            text: bookLabels.bookNowLabel,
                          },
                        },
                      },
                    ],
                  },
                },
              },
            ],
          },
          style: {
            color: [
              {
                value: "var(--value-destructive-foreground-color)",
              },
            ],
            padding: [
              {
                value: {
                  top: {
                    value: 0.75,
                    unit: "rem",
                  },
                  right: {
                    value: 1.5,
                    unit: "rem",
                  },
                  bottom: {
                    value: 0.75,
                    unit: "rem",
                  },
                  left: {
                    value: 1.5,
                    unit: "rem",
                  },
                },
              },
            ],
            backgroundColor: [
              {
                value: "var(--value-destructive-color)",
              },
            ],
            filter: [
              {
                breakpoint: [],
                state: [
                  {
                    state: "hover",
                    parentLevel: 0,
                  },
                ],
                value: "brightness(0.9)",
              },
            ],
            transition: [
              {
                value: "all 0.3s ease",
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
            fontWeight: [
              {
                value: "normal",
              },
            ],
            textAlign: [
              {
                value: "center",
              },
            ],
            display: [
              {
                value: "block",
              },
            ],
            margin: [
              {
                breakpoint: [],
                state: [],
                value: {
                  top: "auto",
                  right: "auto",
                  bottom: "auto",
                  left: "auto",
                },
              },
            ],
            borderStyle: [
              {
                breakpoint: [],
                state: [],
                value: "none",
              },
            ],
          },
        },
        id: `block-service-${service.id}-button`,
      },
    ],
    service.name,
  );
