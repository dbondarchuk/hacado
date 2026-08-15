export const pageDefault = (items: any[], title: string) => ({
  data: {
    fontFamily: "PRIMARY",
    fullWidth: true,
    children: [
      {
        type: "Container",
        data: {
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
            display: [
              {
                value: "flex",
              },
            ],
            flexDirection: [
              {
                value: "column",
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
            width: [
              {
                breakpoint: [],
                state: [],
                value: {
                  value: 100,
                  unit: "%",
                },
              },
            ],
            maxWidth: [
              {
                breakpoint: [],
                state: [],
                value: {
                  value: 640,
                  unit: "px",
                },
              },
              {
                breakpoint: ["sm"],
                state: [],
                value: {
                  value: 768,
                  unit: "px",
                },
              },
              {
                breakpoint: ["md"],
                state: [],
                value: {
                  value: 1024,
                  unit: "px",
                },
              },
              {
                breakpoint: ["lg"],
                state: [],
                value: {
                  value: 1280,
                  unit: "px",
                },
              },
              {
                breakpoint: ["xl"],
                state: [],
                value: {
                  value: 1536,
                  unit: "px",
                },
              },
              {
                breakpoint: ["2xl"],
                state: [],
                value: {
                  value: 1536,
                  unit: "px",
                },
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
            fontStyle: [],
          },
          props: {
            children: [
              {
                type: "Heading",
                data: {
                  props: {
                    level: "h2",
                    children: [
                      {
                        type: "InlineContainer",
                        id: "block-950aab9f-b795-42cf-8e9c-8c23d81f1e8d",
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
                                id: "block-0fa84072-28b7-42c9-adc9-3792fcfca60e",
                                data: {
                                  props: {
                                    text: title,
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
                    padding: [
                      {
                        value: {
                          top: {
                            value: 2,
                            unit: "rem",
                          },
                          bottom: {
                            value: 2,
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
                    textAlign: [
                      {
                        value: "center",
                      },
                    ],
                    fontWeight: [
                      {
                        value: "bold",
                      },
                    ],
                    fontFamily: [
                      {
                        value: "SECONDARY",
                      },
                    ],
                    fontSize: [
                      {
                        breakpoint: [],
                        state: [],
                        value: {
                          value: 3,
                          unit: "rem",
                        },
                      },
                    ],
                    margin: [
                      {
                        breakpoint: [],
                        state: [],
                        value: {
                          top: "auto",
                          bottom: {
                            value: 1.5,
                            unit: "rem",
                          },
                          left: "auto",
                          right: "auto",
                        },
                      },
                    ],
                  },
                },
                id: "block-be6ed9c6-07ef-4688-b48c-0ff189748282",
              },
              ...items,
            ],
          },
        },
        id: "block-ca049ec5-632e-47f4-8e5b-c6dd6f3f547f",
      },
    ],
    textColor: "var(--value-foreground-color)",
    backgroundColor: "var(--value-background-color)",
  },
  id: "block-a17e3d79-e370-497b-bbb7-c359b33d8e6b",
  type: "PageLayout",
});
