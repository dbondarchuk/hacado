export type TemplateServiceArg = {
  id: string;
  name: string;
  description: any;
  slug: string;
  pageSlug: string;
};

export const homeDefaultPage = (
  services: TemplateServiceArg[],
  homeLabels: Record<string, string>,
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

  return {
    data: {
      fontFamily: "PRIMARY",
      fullWidth: true,
      children: [
        {
          type: "PageHero",
          data: {
            style: {
              padding: [
                {
                  value: {
                    top: {
                      unit: "vw",
                      value: 11,
                    },
                    right: {
                      value: 6,
                      unit: "vw",
                    },
                    bottom: {
                      unit: "vw",
                      value: 12,
                    },
                    left: {
                      value: 6,
                      unit: "vw",
                    },
                  },
                },
              ],
              backgroundColor: [
                {
                  value: "var(--value-accent-color)",
                },
              ],
              backgroundSize: [
                {
                  breakpoint: [],
                  state: [],
                  value: "cover",
                },
              ],
              backgroundRepeat: [
                {
                  breakpoint: [],
                  state: [],
                  value: "no-repeat",
                },
              ],
              backgroundColorOpacity: [
                {
                  value: 50,
                },
              ],
              backgroundPosition: [
                {
                  breakpoint: [],
                  state: [],
                  value: "center",
                },
              ],
              backgroundBlendMode: [
                {
                  value: "overlay",
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
              textAlign: [
                {
                  value: "center",
                },
              ],
              gap: [
                {
                  value: {
                    value: 2.5,
                    unit: "rem",
                  },
                },
              ],
              animation: [],
            },
            props: {
              title: {
                children: [
                  {
                    type: "Heading",
                    data: {
                      props: {
                        level: "h2",
                        children: [
                          {
                            type: "InlineContainer",
                            id: "block-f02be591-d13c-4ec0-99a5-f8a5222d76a9",
                            data: {
                              props: {
                                children: [
                                  {
                                    type: "InlineText",
                                    id: "block-a3bda682-554c-4402-aff4-b723953ea6c8",
                                    data: {
                                      props: {
                                        text: homeLabels.title,
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
                        fontFamily: [
                          {
                            value: "PRIMARY",
                          },
                        ],
                        fontSize: [
                          {
                            value: {
                              unit: "rem",
                              value: 2.35,
                            },
                          },
                          {
                            breakpoint: ["max-sm"],
                            state: [],
                            value: {
                              unit: "rem",
                              value: 1.5,
                            },
                          },
                        ],
                        fontWeight: [
                          {
                            breakpoint: [],
                            state: [],
                            value: "500",
                          },
                        ],
                        textAlign: [
                          {
                            breakpoint: [],
                            state: [],
                            value: "center",
                          },
                        ],
                        margin: [
                          {
                            breakpoint: [],
                            state: [],
                            value: {
                              top: "auto",
                              bottom: {
                                value: 0.75,
                                unit: "rem",
                              },
                              left: "auto",
                              right: "auto",
                            },
                          },
                        ],
                        padding: [
                          {
                            breakpoint: [],
                            state: [],
                            value: {
                              top: {
                                value: 0.5,
                                unit: "rem",
                              },
                              bottom: {
                                value: 0.5,
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
                        animation: [],
                      },
                    },
                    id: "block-1e84db69-b755-4644-b4ce-c4f1634467d3",
                  },
                ],
              },
              subtitle: {
                children: [
                  {
                    type: "Heading",
                    data: {
                      props: {
                        level: "h1",
                        children: [
                          {
                            type: "InlineContainer",
                            id: "block-f68e181e-8d38-4e8a-9437-03b7b791af03",
                            data: {
                              props: {
                                children: [
                                  {
                                    type: "InlineText",
                                    id: "block-17ce639d-c591-409f-bb7c-f8cd785c9cc8",
                                    data: {
                                      props: {
                                        text: homeLabels.description,
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
                        fontFamily: [
                          {
                            value: "SECONDARY",
                          },
                        ],
                        fontSize: [
                          {
                            value: {
                              unit: "rem",
                              value: 2.8,
                            },
                          },
                          {
                            breakpoint: ["max-md"],
                            state: [],
                            value: {
                              unit: "rem",
                              value: 2,
                            },
                          },
                        ],
                        fontWeight: [
                          {
                            breakpoint: [],
                            state: [],
                            value: "bold",
                          },
                        ],
                        textAlign: [
                          {
                            breakpoint: [],
                            state: [],
                            value: "center",
                          },
                        ],
                        margin: [
                          {
                            breakpoint: [],
                            state: [],
                            value: {
                              top: "auto",
                              bottom: {
                                value: 1,
                                unit: "rem",
                              },
                              left: "auto",
                              right: "auto",
                            },
                          },
                        ],
                        padding: [
                          {
                            breakpoint: [],
                            state: [],
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
                        animation: [],
                      },
                    },
                    id: "block-959f9b5a-8e8b-4995-a29b-013e2f34be41",
                  },
                ],
              },
              buttons: {
                children: [
                  {
                    type: "Container",
                    data: {
                      props: {
                        children: [
                          ...(showSecondaryNav
                            ? [
                                {
                                  type: "Button",
                                  data: {
                                    props: {
                                      children: [
                                        {
                                          type: "InlineContainer",
                                          id: "block-c13ef416-68c4-4953-9caa-feb2c259f8dd",
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
                                              flexDirection: [{ value: "row" }],
                                              alignItems: [{ value: "center" }],
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
                                            },
                                            props: {
                                              children: [
                                                {
                                                  type: "InlineText",
                                                  id: "block-93ec131d-d25d-499e-aaa6-e40a25e47243",
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
                                      url: secondaryNavUrl,
                                    },
                                    style: {
                                      color: [
                                        {
                                          value:
                                            "var(--value-primary-foreground-color)",
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
                                          value: "var(--value-primary-color)",
                                        },
                                      ],
                                      filter: [
                                        {
                                          breakpoint: [],
                                          state: [
                                            {
                                              state: "hover",
                                              target: { type: "self" },
                                            },
                                            {
                                              state: "focus",
                                              target: { type: "self" },
                                            },
                                            {
                                              state: "active",
                                              target: { type: "self" },
                                            },
                                          ],
                                          value: "brightness(0.9)",
                                        },
                                      ],
                                      transition: [{ value: "all 0.3s ease" }],
                                      fontSize: [
                                        {
                                          value: { value: 1, unit: "rem" },
                                        },
                                      ],
                                      fontWeight: [{ value: "normal" }],
                                      textAlign: [{ value: "center" }],
                                      display: [{ value: "inline-flex" }],
                                      borderStyle: [
                                        {
                                          breakpoint: [],
                                          state: [],
                                          value: "none",
                                        },
                                      ],
                                    },
                                  },
                                  id: "block-d8fb3571-f86d-42b9-987e-9912804727b2",
                                },
                              ]
                            : []),
                          {
                            type: "Button",
                            data: {
                              props: {
                                children: [
                                  {
                                    type: "InlineContainer",
                                    id: "block-5c81ef65-0d2e-48d5-b7a3-c34c280cbe8c",
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
                                            id: "block-a7aa7768-8054-477e-88fb-b60c2fc9d0a1",
                                            data: {
                                              props: {
                                                text: [
                                                  {
                                                    type: "paragraph",
                                                    content: [
                                                      {
                                                        text: homeLabels.bookNowLabel,
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
                                url: "/book",
                              },
                              style: {
                                color: [
                                  {
                                    value:
                                      "var(--value-destructive-foreground-color)",
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
                                        target: {
                                          type: "self",
                                        },
                                      },
                                      {
                                        state: "focus",
                                        target: {
                                          type: "self",
                                        },
                                      },
                                      {
                                        state: "active",
                                        target: {
                                          type: "self",
                                        },
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
                              },
                            },
                            id: "block-19d48f1a-0d11-41f9-8d6e-23f14bbbd11b",
                          },
                        ],
                      },
                      style: {
                        display: [
                          {
                            value: "flex",
                          },
                        ],
                        flexDirection: [
                          {
                            value: "column",
                          },
                          {
                            value: "row",
                            breakpoint: ["sm"],
                          },
                        ],
                        justifyContent: [
                          {
                            value: "center",
                          },
                        ],
                        alignItems: [
                          {
                            value: "center",
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
                        animation: [],
                      },
                      id: "block-2db2d899-4648-4ada-a590-1352b51cc6eb",
                    },
                    id: "block-24a2b93b-eef6-438e-a50d-9b73054ef42c",
                  },
                ],
              },
            },
          },
          id: "block-155c5cf8-367c-46f0-a683-3da5412a8eb2",
        },
        {
          type: "Spacer",
          data: {
            props: {
              height: {
                value: 1,
                unit: "rem",
              },
              display: "block",
            },
            style: {
              height: [
                {
                  breakpoint: [],
                  state: [],
                  value: {
                    value: 3,
                    unit: "rem",
                  },
                },
              ],
            },
          },
          id: "block-2287ac5c-4098-43a8-8577-38fba7d0d330",
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
                    unit: "rem",
                    value: 3,
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
                          id: "block-50286852-2088-49d5-b2cf-a5912d409a99",
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
                                  id: "block-f896bebd-7e52-400d-9f1f-a7e08bf7097f",
                                  data: {
                                    props: {
                                      text: homeLabels.ourServicesLabel,
                                    },
                                  },
                                },
                              ],
                            },
                          },
                          base: {
                            id: "services",
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
                          value: "PRIMARY",
                        },
                      ],
                      fontSize: [
                        {
                          breakpoint: [],
                          state: [],
                          value: {
                            unit: "rem",
                            value: 2.6,
                          },
                        },
                      ],
                      animation: [],
                    },
                  },
                  id: "block-43fe6a4f-6a10-4a4c-b047-d31c79eb4a0c",
                },
                ...services.map((service) => ({
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
                              level: "h4",
                              children: [
                                {
                                  type: "InlineContainer",
                                  id: `block-service-${service.id}-heading-inline`,
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
                                          id: `block-service-${service.id}-headinginline-text`,
                                          data: {
                                            props: {
                                              text: service.name,
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
                                  value: "400",
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
                                    unit: "rem",
                                    value: 2.2,
                                  },
                                },
                              ],
                              animation: [],
                            },
                          },
                          id: `block-service-${service.id}-heading`,
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
                                  value: "row",
                                },
                                {
                                  breakpoint: ["max-sm"],
                                  state: [],
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
                                  type: "Image",
                                  data: {
                                    props: {
                                      src: "/assets/placeholder/300x400.jpg",
                                      alt: service.name,
                                      linkHref: null,
                                    },
                                    style: {
                                      textAlign: [
                                        {
                                          value: "center",
                                        },
                                      ],
                                      objectFit: [
                                        {
                                          value: "cover",
                                        },
                                      ],
                                      objectPosition: [
                                        {
                                          value: {
                                            x: 50,
                                            y: 50,
                                          },
                                        },
                                      ],
                                      verticalAlign: [
                                        {
                                          value: "middle",
                                        },
                                      ],
                                      maxWidth: [
                                        {
                                          value: {
                                            unit: "px",
                                            value: 400,
                                          },
                                        },
                                      ],
                                      display: [
                                        {
                                          value: "inline-block",
                                        },
                                      ],
                                      textDecoration: [
                                        {
                                          value: "none",
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
                                      animation: [],
                                    },
                                  },
                                  id: `block-service-${service.id}-image`,
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
                                      animation: [],
                                    },
                                    props: {
                                      children: [
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
                                          type: "Text",
                                          data: {
                                            props: {
                                              value: [
                                                {
                                                  type: "p",
                                                  id: "8avldAUN0v",
                                                  children: [
                                                    {
                                                      text: "",
                                                    },
                                                    {
                                                      children: [
                                                        {
                                                          text: homeLabels.learnMoreLabel,
                                                          fontSize: "20px",
                                                        },
                                                      ],
                                                      type: "a",
                                                      url: `/${service.pageSlug}`,
                                                      id: "HpOUEl0B2V",
                                                    },
                                                    {
                                                      text: "",
                                                    },
                                                  ],
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
                                          id: `block-service-${service.id}-learn-more`,
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
                                                              text: homeLabels.bookNowLabel,
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
                                                    "var(--value-destructive-foreground-color)",
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
                                                  value:
                                                    "var(--value-destructive-color)",
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
                                    },
                                  },
                                  id: `block-service-${service.id}-container-inner`,
                                },
                              ],
                            },
                          },
                          id: `block-service-${service.id}-container`,
                        },
                      ],
                    },
                  },
                  id: `block-service-${service.id}`,
                })),
                {
                  type: "Heading",
                  data: {
                    props: {
                      level: "h3",
                      children: [
                        {
                          type: "InlineContainer",
                          id: "block-32d8526b-6810-49e9-947b-3ee9edd6c04c",
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
                                  id: "block-18f25c98-7c2e-439d-bdb9-eda1cb85bde7",
                                  data: {
                                    props: {
                                      text: homeLabels.galleryLabel,
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
                          value: "500",
                        },
                      ],
                      fontFamily: [
                        {
                          value: "PRIMARY",
                        },
                      ],
                      fontSize: [
                        {
                          breakpoint: [],
                          state: [],
                          value: {
                            unit: "px",
                            value: 36,
                          },
                        },
                      ],
                    },
                  },
                  id: "block-9e68bcbf-635c-4647-9f94-6c875c3f8ae7",
                },
                {
                  id: "block-20d836d6-49f4-40c4-8cd1-8fa55b87100b",
                  type: "Lightbox",
                  data: {
                    props: {
                      overlay: "blur",
                      showAltAsDescription: true,
                      navigation: true,
                      loop: true,
                      autoPlay: null,
                      children: [
                        {
                          type: "Carousel",
                          data: {
                            style: {
                              gap: [
                                {
                                  value: {
                                    value: 0.5,
                                    unit: "rem",
                                  },
                                },
                              ],
                              justifyItems: [
                                {
                                  value: "center",
                                },
                              ],
                              carouselChildrenItemsPerSlide: [
                                {
                                  breakpoint: [],
                                  state: [],
                                  value: 1,
                                },
                                {
                                  breakpoint: ["md"],
                                  state: [],
                                  value: 2,
                                },
                                {
                                  breakpoint: ["lg"],
                                  state: [],
                                  value: 2,
                                },
                                {
                                  breakpoint: ["xl"],
                                  state: [],
                                  value: 3,
                                },
                              ],
                              carouselChildrenAlign: [
                                {
                                  breakpoint: [],
                                  state: [],
                                  value: "center",
                                },
                              ],
                            },
                            props: {
                              orientation: "horizontal",
                              navigation: true,
                              children: [
                                {
                                  type: "Image",
                                  id: "block-d67db2f3-dd6f-4e25-839f-c9e39752fd23",
                                  data: {
                                    props: {
                                      src: "/assets/placeholder/300x512.jpg",
                                      alt: "Iamge 1",
                                    },
                                    style: {
                                      objectPosition: [
                                        {
                                          value: {
                                            x: 50,
                                            y: 50,
                                          },
                                        },
                                      ],
                                      height: [
                                        {
                                          breakpoint: [],
                                          state: [],
                                          value: {
                                            unit: "px",
                                            value: 512,
                                          },
                                        },
                                      ],
                                    },
                                  },
                                },
                                {
                                  type: "Image",
                                  id: "block-b9d21650-1cf8-469c-a352-d9e9cb08b4ac",
                                  data: {
                                    props: {
                                      src: "/assets/placeholder/300x512.jpg",
                                      alt: "Image 2",
                                    },
                                    style: {
                                      objectPosition: [
                                        {
                                          value: {
                                            x: 50,
                                            y: 50,
                                          },
                                        },
                                      ],
                                      height: [
                                        {
                                          breakpoint: [],
                                          state: [],
                                          value: {
                                            unit: "px",
                                            value: 512,
                                          },
                                        },
                                      ],
                                    },
                                  },
                                },
                                {
                                  type: "Image",
                                  id: "block-930cb8ca-f5be-4971-8e00-e4b2f8cbf0dc",
                                  data: {
                                    props: {
                                      src: "/assets/placeholder/300x512.jpg",
                                      alt: "Image 3",
                                    },
                                    style: {
                                      objectPosition: [
                                        {
                                          value: {
                                            x: 50,
                                            y: 50,
                                          },
                                        },
                                      ],
                                      height: [
                                        {
                                          breakpoint: [],
                                          state: [],
                                          value: {
                                            unit: "px",
                                            value: 512,
                                          },
                                        },
                                      ],
                                    },
                                  },
                                },
                                {
                                  type: "Image",
                                  id: "block-bec14e8e-44c3-499b-b719-387642b5dbfd",
                                  data: {
                                    props: {
                                      src: "/assets/placeholder/300x512.jpg",
                                      alt: "Image 4",
                                    },
                                    style: {
                                      objectPosition: [
                                        {
                                          value: {
                                            x: 50,
                                            y: 50,
                                          },
                                        },
                                      ],
                                      height: [
                                        {
                                          breakpoint: [],
                                          state: [],
                                          value: {
                                            unit: "px",
                                            value: 512,
                                          },
                                        },
                                      ],
                                    },
                                  },
                                },
                                {
                                  type: "Image",
                                  id: "block-8ff5b4b0-abf5-4ac5-a59d-17264c12bea3",
                                  data: {
                                    props: {
                                      src: "/assets/placeholder/300x512.jpg",
                                      alt: "Image 5",
                                    },
                                    style: {
                                      objectPosition: [
                                        {
                                          value: {
                                            x: 50,
                                            y: 50,
                                          },
                                        },
                                      ],
                                      height: [
                                        {
                                          breakpoint: [],
                                          state: [],
                                          value: {
                                            unit: "px",
                                            value: 512,
                                          },
                                        },
                                      ],
                                    },
                                  },
                                },
                                {
                                  type: "Image",
                                  id: "block-c9b7b626-c0a1-46fa-b8b6-2ed6ef619f2a",
                                  data: {
                                    props: {
                                      src: "/assets/placeholder/300x512.jpg",
                                      alt: "Image 6",
                                    },
                                    style: {
                                      objectPosition: [
                                        {
                                          value: {
                                            x: 50,
                                            y: 50,
                                          },
                                        },
                                      ],
                                      height: [
                                        {
                                          breakpoint: [],
                                          state: [],
                                          value: {
                                            unit: "px",
                                            value: 512,
                                          },
                                        },
                                      ],
                                    },
                                  },
                                },
                              ],
                              loop: true,
                              autoPlay: 4,
                            },
                          },
                          id: "block-c0edebcc-444c-474b-a50b-375241dd69ea",
                        },
                      ],
                    },
                  },
                },
              ],
            },
          },
          id: "block-05373c18-6a76-4445-b51f-956f12eafd6a",
        },
      ],
      textColor: "var(--value-foreground-color)",
    },
    id: "block-c6b42086-9883-400c-94a0-aa7bdc50da7c",
    type: "PageLayout",
  };
};
