export const footerDefaultPage = (
  hasAddress: boolean,
  footerLabels: Record<string, string>,
  isMyCabinetEnabled: boolean,
  isCancelRescheduleEnabled: boolean,
  myCabinetLabel: string,
  manageAppointmentLabel: string,
) => {
  const showSecondaryNav = isMyCabinetEnabled || isCancelRescheduleEnabled;
  const secondaryNavUrl = isMyCabinetEnabled ? "/my-cabinet" : "/book/modify";
  const secondaryNavLabel = isMyCabinetEnabled
    ? myCabinetLabel
    : manageAppointmentLabel;
  const secondaryNavIcon = isMyCabinetEnabled ? "user" : "calendar-sync";

  return {
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
                  breakpoint: [],
                  state: [],
                  value: {
                    top: {
                      value: 16,
                      unit: "px",
                    },
                    bottom: {
                      value: 16,
                      unit: "px",
                    },
                    left: {
                      value: 24,
                      unit: "px",
                    },
                    right: {
                      value: 24,
                      unit: "px",
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
            },
            props: {
              children: [
                {
                  type: "GridContainer",
                  data: {
                    style: {
                      padding: [],
                      display: [
                        {
                          value: "grid",
                        },
                      ],
                      gridTemplateColumns: [
                        {
                          value: "repeat(2, 1fr)",
                        },
                        {
                          breakpoint: ["max-md"],
                          state: [],
                          value: "repeat(1, 1fr)",
                        },
                      ],
                      gap: [
                        {
                          value: {
                            value: 1,
                            unit: "rem",
                          },
                        },
                      ],
                    },
                    props: {
                      children: [
                        {
                          type: "Container",
                          data: {
                            style: {
                              padding: [],
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
                                          id: "block-e85476a1-9058-4b25-87bd-bf662a22ca24",
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
                                                  id: "block-9f691ebf-a6b3-4dc7-97a7-fae773408d6c",
                                                  data: {
                                                    props: {
                                                      text: [
                                                        {
                                                          type: "paragraph",
                                                          content: [
                                                            {
                                                              text: footerLabels.contactUsLabel,
                                                            },
                                                          ],
                                                        },
                                                      ],
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
                                              value: 1,
                                              unit: "rem",
                                            },
                                            bottom: {
                                              value: 1,
                                              unit: "rem",
                                            },
                                            left: {
                                              unit: "rem",
                                              value: 0,
                                            },
                                            right: {
                                              unit: "rem",
                                              value: 0,
                                            },
                                          },
                                        },
                                      ],
                                      textAlign: [
                                        {
                                          value: "left",
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
                                            unit: "px",
                                            value: 27,
                                          },
                                        },
                                      ],
                                    },
                                  },
                                  id: "block-1659da93-7727-484a-b65a-d42f7db6bdf8",
                                },
                                {
                                  type: "Container",
                                  data: {
                                    style: {
                                      padding: [
                                        {
                                          value: {
                                            top: {
                                              unit: "rem",
                                              value: 0.5,
                                            },
                                            bottom: {
                                              unit: "rem",
                                              value: 0.5,
                                            },
                                            left: {
                                              unit: "rem",
                                              value: 0,
                                            },
                                            right: {
                                              unit: "rem",
                                              value: 0,
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
                                            unit: "rem",
                                            value: 0.1,
                                          },
                                        },
                                      ],
                                    },
                                    props: {
                                      children: [
                                        {
                                          type: "Heading",
                                          data: {
                                            props: {
                                              level: "h3",
                                              children: [
                                                {
                                                  type: "InlineContainer",
                                                  id: "block-af49e60a-1a26-472b-8cec-f5af4c5bb723",
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
                                                          id: "block-7fdfd18d-cbd2-4fab-ba5c-d780dc018270",
                                                          data: {
                                                            props: {
                                                              text: footerLabels.phoneLabel,
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
                                                      unit: "rem",
                                                      value: 0.2,
                                                    },
                                                    bottom: {
                                                      unit: "rem",
                                                      value: 0.2,
                                                    },
                                                    left: {
                                                      unit: "rem",
                                                      value: 0,
                                                    },
                                                    right: {
                                                      unit: "rem",
                                                      value: 0,
                                                    },
                                                  },
                                                },
                                              ],
                                              textAlign: [
                                                {
                                                  value: "left",
                                                },
                                              ],
                                              fontWeight: [
                                                {
                                                  value: "bold",
                                                },
                                              ],
                                              fontFamily: [
                                                {
                                                  value: "INHERIT",
                                                },
                                              ],
                                              fontSize: [
                                                {
                                                  breakpoint: [],
                                                  state: [],
                                                  value: {
                                                    unit: "px",
                                                    value: 16,
                                                  },
                                                },
                                              ],
                                            },
                                          },
                                          id: "block-474f579e-eb8a-49da-895a-5dcba33b2b4b",
                                        },
                                        {
                                          id: "block-bcbed288-9898-4385-ac0e-fd89278d41fb",
                                          type: "Link",
                                          data: {
                                            props: {
                                              url: "tel:{{general.phone}}",
                                              target: "_self",
                                              children: [
                                                {
                                                  type: "InlineText",
                                                  id: "block-e236962d-dd07-4350-a386-813a45a4f1e6",
                                                  data: {
                                                    props: {
                                                      text: [
                                                        {
                                                          type: "paragraph",
                                                          content: [
                                                            {
                                                              text: "{{general.phone}}",
                                                            },
                                                          ],
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
                                                  value:
                                                    "var(--value-primary-color)",
                                                },
                                              ],
                                              fontSize: [
                                                {
                                                  value: {
                                                    unit: "px",
                                                    value: 14,
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
                                                  value: "left",
                                                },
                                              ],
                                              display: [
                                                {
                                                  value: "inline",
                                                },
                                              ],
                                              transition: [
                                                {
                                                  value: "color 0.2s ease",
                                                },
                                              ],
                                            },
                                          },
                                        },
                                      ],
                                    },
                                  },
                                  id: "block-8e1f4835-064b-454c-a802-d0dc592793ce",
                                },
                                {
                                  type: "Container",
                                  data: {
                                    style: {
                                      padding: [
                                        {
                                          value: {
                                            top: {
                                              unit: "rem",
                                              value: 0.5,
                                            },
                                            bottom: {
                                              unit: "rem",
                                              value: 0.5,
                                            },
                                            left: {
                                              unit: "rem",
                                              value: 0,
                                            },
                                            right: {
                                              unit: "rem",
                                              value: 0,
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
                                            unit: "rem",
                                            value: 0.1,
                                          },
                                        },
                                      ],
                                    },
                                    props: {
                                      children: [
                                        {
                                          type: "Heading",
                                          data: {
                                            props: {
                                              level: "h3",
                                              children: [
                                                {
                                                  type: "InlineContainer",
                                                  id: "block-29e60c65-5988-403b-beba-1de777b31783",
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
                                                          id: "block-31ed010e-5074-47c4-ab95-67903a9f37ab",
                                                          data: {
                                                            props: {
                                                              text: footerLabels.emailLabel,
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
                                                      unit: "rem",
                                                      value: 0.2,
                                                    },
                                                    bottom: {
                                                      unit: "rem",
                                                      value: 0.2,
                                                    },
                                                    left: {
                                                      unit: "rem",
                                                      value: 0,
                                                    },
                                                    right: {
                                                      unit: "rem",
                                                      value: 0,
                                                    },
                                                  },
                                                },
                                              ],
                                              textAlign: [
                                                {
                                                  value: "left",
                                                },
                                              ],
                                              fontWeight: [
                                                {
                                                  value: "bold",
                                                },
                                              ],
                                              fontFamily: [
                                                {
                                                  value: "INHERIT",
                                                },
                                              ],
                                              fontSize: [
                                                {
                                                  breakpoint: [],
                                                  state: [],
                                                  value: {
                                                    unit: "px",
                                                    value: 16,
                                                  },
                                                },
                                              ],
                                            },
                                          },
                                          id: "block-60cfecea-35fd-4a4f-9bbc-a05a25c7b036",
                                        },
                                        {
                                          id: "block-b87eb658-7653-4ba8-bfce-c0c12d9a7b4b",
                                          type: "Link",
                                          data: {
                                            props: {
                                              url: "mailto:{{general.email}}",
                                              target: "_self",
                                              children: [
                                                {
                                                  type: "InlineText",
                                                  id: "block-cafb6ee4-1994-4cdc-805f-bb22c013fc30",
                                                  data: {
                                                    props: {
                                                      text: [
                                                        {
                                                          type: "paragraph",
                                                          content: [
                                                            {
                                                              text: "{{general.email}}",
                                                            },
                                                          ],
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
                                                  value:
                                                    "var(--value-primary-color)",
                                                },
                                              ],
                                              fontSize: [
                                                {
                                                  value: {
                                                    unit: "px",
                                                    value: 14,
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
                                                  value: "left",
                                                },
                                              ],
                                              display: [
                                                {
                                                  value: "inline",
                                                },
                                              ],
                                              transition: [
                                                {
                                                  value: "color 0.2s ease",
                                                },
                                              ],
                                            },
                                          },
                                        },
                                      ],
                                    },
                                  },
                                  id: "block-c4208ac8-d210-4c73-b465-239c209c8745",
                                },
                                ...(hasAddress
                                  ? [
                                      {
                                        type: "Container",
                                        data: {
                                          style: {
                                            padding: [
                                              {
                                                value: {
                                                  top: {
                                                    unit: "rem",
                                                    value: 0.5,
                                                  },
                                                  bottom: {
                                                    unit: "rem",
                                                    value: 0.5,
                                                  },
                                                  left: {
                                                    unit: "rem",
                                                    value: 0,
                                                  },
                                                  right: {
                                                    unit: "rem",
                                                    value: 0,
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
                                                  unit: "rem",
                                                  value: 0.1,
                                                },
                                              },
                                            ],
                                          },
                                          props: {
                                            children: [
                                              {
                                                type: "Heading",
                                                data: {
                                                  props: {
                                                    level: "h3",
                                                    children: [
                                                      {
                                                        type: "InlineContainer",
                                                        id: "block-5549e789-59fd-4f62-8faa-338226fb7ba3",
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
                                                                value:
                                                                  "inline-flex",
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
                                                                id: "block-1d187b83-dc97-40e9-a8cb-7b7bb52dfbd2",
                                                                data: {
                                                                  props: {
                                                                    text: footerLabels.addressLabel,
                                                                  },
                                                                  style: {
                                                                    fontSize:
                                                                      [],
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
                                                            unit: "rem",
                                                            value: 0.2,
                                                          },
                                                          bottom: {
                                                            unit: "rem",
                                                            value: 0.2,
                                                          },
                                                          left: {
                                                            unit: "rem",
                                                            value: 0,
                                                          },
                                                          right: {
                                                            unit: "rem",
                                                            value: 0,
                                                          },
                                                        },
                                                      },
                                                    ],
                                                    textAlign: [
                                                      {
                                                        value: "left",
                                                      },
                                                    ],
                                                    fontWeight: [
                                                      {
                                                        value: "bold",
                                                      },
                                                    ],
                                                    fontFamily: [
                                                      {
                                                        value: "INHERIT",
                                                      },
                                                    ],
                                                    fontSize: [
                                                      {
                                                        breakpoint: [],
                                                        state: [],
                                                        value: {
                                                          value: 16,
                                                          unit: "px",
                                                        },
                                                      },
                                                    ],
                                                  },
                                                },
                                                id: "block-bed68bc2-2b86-4f23-a1dd-d3766d33f0b5",
                                              },
                                              {
                                                id: "block-b1bfa263-c692-4287-813e-c59bc13855e7",
                                                type: "Link",
                                                data: {
                                                  props: {
                                                    url: "https://maps.app.goo.gl/JNCukRZSchRmZFJc6",
                                                    target: "_blank",
                                                    children: [
                                                      {
                                                        type: "InlineText",
                                                        id: "block-f434fe78-cd99-4465-b6c0-01bca4f488ae",
                                                        data: {
                                                          props: {
                                                            text: [
                                                              {
                                                                type: "paragraph",
                                                                content: [
                                                                  {
                                                                    text: "{{general.address}}",
                                                                  },
                                                                ],
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
                                                        value:
                                                          "var(--value-primary-color)",
                                                      },
                                                    ],
                                                    fontSize: [
                                                      {
                                                        value: {
                                                          unit: "px",
                                                          value: 14,
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
                                                        value: "left",
                                                      },
                                                    ],
                                                    display: [
                                                      {
                                                        value: "inline",
                                                      },
                                                    ],
                                                    transition: [
                                                      {
                                                        value:
                                                          "color 0.2s ease",
                                                      },
                                                    ],
                                                  },
                                                },
                                              },
                                            ],
                                          },
                                        },
                                        id: "block-338c80d5-e341-4204-bc2b-4847b692f72c",
                                      },
                                    ]
                                  : []),
                              ],
                            },
                          },
                          id: "block-fcb047d0-7b6c-4233-9910-7738f1117049",
                        },
                        {
                          type: "Container",
                          data: {
                            style: {
                              padding: [],
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
                              justifyContent: [
                                {
                                  breakpoint: [],
                                  state: [],
                                  value: "center",
                                },
                              ],
                              alignItems: [
                                {
                                  breakpoint: [],
                                  state: [],
                                  value: "flex-end",
                                },
                                {
                                  breakpoint: ["max-sm"],
                                  state: [],
                                  value: "center",
                                },
                              ],
                              justifyItems: [
                                {
                                  breakpoint: [],
                                  state: [],
                                  value: "end",
                                },
                              ],
                              height: [
                                {
                                  breakpoint: [],
                                  state: [],
                                  value: {
                                    value: 100,
                                    unit: "%",
                                  },
                                },
                              ],
                            },
                            props: {
                              children: [
                                {
                                  type: "Link",
                                  data: {
                                    props: {
                                      url: "/book",
                                      target: "_self",
                                      children: [
                                        {
                                          type: "InlineContainer",
                                          id: "block-9905ed27-131c-48c9-af3f-0be1a1ea2c73",
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
                                              textDecoration: [
                                                {
                                                  value: "underline",
                                                },
                                              ],
                                            },
                                            props: {
                                              children: [
                                                {
                                                  type: "Icon",
                                                  data: {
                                                    props: {
                                                      icon: "calendar",
                                                    },
                                                    style: {
                                                      display: [
                                                        {
                                                          value: "inline-block",
                                                        },
                                                      ],
                                                      width: [
                                                        {
                                                          value: {
                                                            value: 1,
                                                            unit: "rem",
                                                          },
                                                        },
                                                      ],
                                                      height: [
                                                        {
                                                          value: {
                                                            value: 1,
                                                            unit: "rem",
                                                          },
                                                        },
                                                      ],
                                                    },
                                                  },
                                                  id: "block-99f21f64-0a41-41ba-894f-55c9d96f5b5f",
                                                },
                                                {
                                                  type: "InlineText",
                                                  id: "block-71bb81ec-1fcc-49ca-85ce-5d83d5bf8b87",
                                                  data: {
                                                    props: {
                                                      text: footerLabels.bookNowLabel,
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
                                          value: "var(--value-primary-color)",
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
                                          value: "left",
                                        },
                                      ],
                                      display: [
                                        {
                                          value: "inline",
                                        },
                                      ],
                                      transition: [
                                        {
                                          value: "color 0.2s ease",
                                        },
                                      ],
                                    },
                                  },
                                  id: "block-6a1bae34-fa6c-4ca7-8a87-a97a8618ab47",
                                },
                                ...(showSecondaryNav
                                  ? [
                                      {
                                        type: "Link",
                                        data: {
                                          props: {
                                            url: secondaryNavUrl,
                                            target: "_self",
                                            children: [
                                              {
                                                type: "InlineContainer",
                                                id: "block-44714013-701e-4847-9730-7de0f5043871",
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
                                                      { value: "inline-flex" },
                                                    ],
                                                    flexDirection: [
                                                      { value: "row" },
                                                    ],
                                                    alignItems: [
                                                      { value: "center" },
                                                    ],
                                                    justifyContent: [
                                                      { value: "center" },
                                                    ],
                                                    gap: [
                                                      {
                                                        value: {
                                                          value: 0.5,
                                                          unit: "rem",
                                                        },
                                                      },
                                                    ],
                                                    textDecoration: [
                                                      { value: "underline" },
                                                    ],
                                                  },
                                                  props: {
                                                    children: [
                                                      {
                                                        type: "Icon",
                                                        data: {
                                                          props: {
                                                            icon: secondaryNavIcon,
                                                          },
                                                          style: {
                                                            display: [
                                                              {
                                                                value:
                                                                  "inline-block",
                                                              },
                                                            ],
                                                            width: [
                                                              {
                                                                value: {
                                                                  value: 1,
                                                                  unit: "rem",
                                                                },
                                                              },
                                                            ],
                                                            height: [
                                                              {
                                                                value: {
                                                                  value: 1,
                                                                  unit: "rem",
                                                                },
                                                              },
                                                            ],
                                                          },
                                                        },
                                                        id: "block-d3fcc9af-ef3c-44b7-b9ce-d7f10977bc78",
                                                      },
                                                      {
                                                        type: "InlineText",
                                                        id: "block-237e1845-30cb-415b-9eb2-5a82bcd72c78",
                                                        data: {
                                                          props: {
                                                            text: secondaryNavLabel,
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
                                                value:
                                                  "var(--value-primary-color)",
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
                                            fontWeight: [{ value: "normal" }],
                                            textAlign: [{ value: "left" }],
                                            display: [{ value: "inline" }],
                                            transition: [
                                              { value: "color 0.2s ease" },
                                            ],
                                          },
                                        },
                                        id: "block-fac422b8-d62e-44ad-8b80-2fe0421f7515",
                                      },
                                    ]
                                  : []),
                              ],
                            },
                          },
                          id: "block-ad1aad5b-59ea-4409-95f5-758e7eb51e23",
                        },
                      ],
                    },
                  },
                  id: "block-fb1fe3a2-57fa-4b15-a36b-b8714e24e5fd",
                },
              ],
            },
          },
          id: "block-b3e150f9-f386-4b15-8904-96c81ab59711",
        },
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
              alignItems: [
                {
                  breakpoint: [],
                  state: [],
                  value: "center",
                },
              ],
            },
            props: {
              children: [
                {
                  type: "InlineText",
                  data: {
                    props: {
                      text: "© {{now.year}} {{general.name}}",
                    },
                    style: {
                      textAlign: [
                        {
                          value: "left",
                        },
                      ],
                      fontFamily: [
                        {
                          value: "PRIMARY",
                        },
                      ],
                    },
                  },
                  id: "block-a74a7eb1-caf1-4438-b9d7-084ee4629450",
                },
                {
                  id: "block-23fb4d28-b36b-456c-89b3-7137c10a95b7",
                  type: "InlineContainer",
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
                          id: "block-7bf35ac5-5580-4511-92a1-468f40cc2904",
                          type: "InlineText",
                          data: {
                            props: {
                              text: [
                                {
                                  type: "paragraph",
                                  content: [
                                    {
                                      text: "Created using",
                                    },
                                  ],
                                },
                              ],
                            },
                            style: {},
                          },
                        },
                        {
                          id: "block-6b94bb08-b7bb-4003-bf58-09446dcce72e",
                          type: "Link",
                          data: {
                            props: {
                              url: "https://hacado.com",
                              target: "_blank",
                              children: [
                                {
                                  type: "InlineText",
                                  id: "block-899b53eb-03ae-42f1-aad7-8cdfd82fe8da",
                                  data: {
                                    props: {
                                      text: [
                                        {
                                          type: "paragraph",
                                          content: [
                                            {
                                              text: "Hacado",
                                            },
                                          ],
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
                                  value: "var(--value-primary-color)",
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
                                  value: "left",
                                },
                              ],
                              display: [
                                {
                                  value: "inline",
                                },
                              ],
                              transition: [
                                {
                                  value: "color 0.2s ease",
                                },
                              ],
                            },
                          },
                        },
                      ],
                    },
                  },
                },
                {
                  type: "Container",
                  data: {
                    style: {
                      padding: [],
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
                    },
                    props: {
                      children: [
                        {
                          type: "Button",
                          data: {
                            props: {
                              url: "https://instagram.com/",
                              target: "_self",
                              children: [
                                {
                                  type: "InlineContainer",
                                  id: "block-03d23b30-7e3b-4cd7-ba3c-1efae8c8095c",
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
                                          type: "Icon",
                                          data: {
                                            props: {
                                              icon: "instagram",
                                            },
                                            style: {
                                              display: [
                                                {
                                                  value: "inline-block",
                                                },
                                              ],
                                              width: [
                                                {
                                                  value: {
                                                    value: 1,
                                                    unit: "rem",
                                                  },
                                                },
                                              ],
                                              height: [
                                                {
                                                  value: {
                                                    value: 1,
                                                    unit: "rem",
                                                  },
                                                },
                                              ],
                                            },
                                          },
                                          id: "block-482cebad-90e5-4b36-adce-2bcce5a47eb1",
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
                                  breakpoint: [],
                                  state: [],
                                  value: "var(--value-foreground-color)",
                                },
                                {
                                  breakpoint: [],
                                  state: [
                                    {
                                      state: "hover",
                                      parentLevel: 0,
                                    },
                                    {
                                      state: "focus",
                                      parentLevel: 0,
                                    },
                                    {
                                      state: "active",
                                      parentLevel: 0,
                                    },
                                  ],
                                  value:
                                    "var(--value-secondary-foreground-color)",
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
                                      unit: "rem",
                                      value: 0.7,
                                    },
                                    bottom: {
                                      value: 0.75,
                                      unit: "rem",
                                    },
                                    left: {
                                      unit: "rem",
                                      value: 0.7,
                                    },
                                  },
                                },
                              ],
                              backgroundColor: [
                                {
                                  breakpoint: [],
                                  state: [],
                                  value: "transparent",
                                },
                                {
                                  breakpoint: [],
                                  state: [
                                    {
                                      state: "hover",
                                      parentLevel: 0,
                                    },
                                    {
                                      state: "focus",
                                      parentLevel: 0,
                                    },
                                    {
                                      state: "active",
                                      parentLevel: 0,
                                    },
                                  ],
                                  value: "var(--value-secondary-color)",
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
                                    {
                                      state: "focus",
                                      parentLevel: 0,
                                    },
                                    {
                                      state: "active",
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
                              width: [
                                {
                                  value: "min-content",
                                },
                              ],
                              display: [
                                {
                                  value: "inline-flex",
                                },
                              ],
                              borderStyle: [
                                {
                                  breakpoint: [],
                                  state: [],
                                  value: "none",
                                },
                              ],
                              borderRadius: [
                                {
                                  breakpoint: [],
                                  state: [],
                                  value: {
                                    value: 10,
                                    unit: "px",
                                  },
                                },
                              ],
                            },
                          },
                          id: "block-cd3027d7-ac74-4bbc-a5be-e524e62869ca",
                        },
                      ],
                    },
                  },
                  id: "block-c4df5567-22de-4046-b018-c4efc756cc36",
                },
              ],
            },
          },
          id: "block-1db8bbb0-8839-4aef-ab10-6eb23233a020",
        },
      ],
      textColor: "var(--value-foreground-color)",
    },
    id: "block-7f5d1479-f2b1-4d51-9de1-aeea631a0e3c",
    type: "PageLayout",
  };
};
