import { PageUpdateModel } from "@hacado/types";
import { getBlogPostReadMoreLinkBlock } from "../blocks/read-more-link-block";

export const BLOG_PAGES: (
  appId: string,
  headerId?: string,
  footerId?: string,
) => PageUpdateModel[] = (appId, headerId, footerId) => [
  {
    title: "Blog",
    content: {
      data: {
        fontFamily: "PRIMARY",
        fullWidth: true,
        children: [
          {
            id: "block-75029ea8-8eed-4320-ad40-61dbb298de84",
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
                width: [
                  {
                    value: {
                      value: 100,
                      unit: "%",
                    },
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
                maxWidth: [
                  {
                    breakpoint: [],
                    state: [],
                    value: {
                      value: 100,
                      unit: "%",
                    },
                  },
                  {
                    breakpoint: ["sm"],
                    state: [],
                    value: {
                      value: 640,
                      unit: "px",
                    },
                  },
                  {
                    breakpoint: ["md"],
                    state: [],
                    value: {
                      value: 768,
                      unit: "px",
                    },
                  },
                  {
                    breakpoint: ["lg"],
                    state: [],
                    value: {
                      value: 1024,
                      unit: "px",
                    },
                  },
                  {
                    breakpoint: ["xl"],
                    state: [],
                    value: {
                      value: 1280,
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
                    id: "block-92109995-f9b5-4c67-88c0-05ead90f719b",
                    type: "Heading",
                    data: {
                      props: {
                        level: "h1",
                        children: [
                          {
                            type: "InlineContainer",
                            id: "block-980bbc9c-bcd7-4572-a827-d474f9bb72ca",
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
                                    id: "block-eab58ae4-24e0-489f-b39f-537792b48108",
                                    data: {
                                      props: {
                                        text: "Blog",
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
                  },
                  {
                    id: "block-f14a2caf-27c0-4a72-b9d5-d98859f636e0",
                    type: "BlogPostsContainer",
                    metadata: {
                      blogAppName: "blog",
                      blogAppId: appId,
                    },
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
                        width: [
                          {
                            value: {
                              value: 100,
                              unit: "%",
                            },
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
                            id: "block-f20edeb0-e150-4c7d-8e0b-1557ff761259",
                            type: "ForeachContainer",
                            data: {
                              props: {
                                value: "posts",
                                itemName: "post",
                                children: [
                                  {
                                    id: "block-c97b7e42-53f7-406b-94b6-bae3fd6c5a95",
                                    type: "BlogPostContainer",
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
                                        width: [
                                          {
                                            value: {
                                              value: 100,
                                              unit: "%",
                                            },
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
                                            id: "block-e28e8c1d-aa15-46a2-a89a-0b187596b8ee",
                                            type: "Link",
                                            data: {
                                              props: {
                                                url: "{{postLink}}",
                                                target: "_self",
                                                children: [
                                                  {
                                                    type: "Heading",
                                                    id: "block-a4952e0a-b61a-479a-a6ce-6cfab13555d7",
                                                    data: {
                                                      props: {
                                                        level: "h2",
                                                        children: [
                                                          {
                                                            type: "BlogPostTitle",
                                                            id: "block-f4fe4493-132b-4a7e-bfd2-abc41e8d8870",
                                                            data: {
                                                              props: {},
                                                              style: {
                                                                fontSize: [
                                                                  {
                                                                    value: {
                                                                      value: 2,
                                                                      unit: "rem",
                                                                    },
                                                                  },
                                                                ],
                                                                fontWeight: [
                                                                  {
                                                                    value:
                                                                      "bold",
                                                                  },
                                                                ],
                                                              },
                                                            },
                                                          },
                                                        ],
                                                      },
                                                      style: {
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
                                          {
                                            type: "BlogPostPublishDate",
                                            id: "block-d7605b29-b7d3-4f2f-a20e-021e26276c0b",
                                            data: {
                                              props: {
                                                format: "MMMM d, yyyy",
                                              },
                                              style: {
                                                fontSize: [
                                                  {
                                                    value: {
                                                      value: 0.875,
                                                      unit: "rem",
                                                    },
                                                  },
                                                ],
                                              },
                                            },
                                          },
                                          {
                                            type: "BlogPostContent",
                                            id: "block-653b3d0a-e7c2-47c5-b873-75a66feaa937",
                                            data: {
                                              props: {
                                                showShort: true,
                                                maxParagraphs: 5,
                                                showOnlyTextParagraphs: true,
                                              },
                                              style: {},
                                            },
                                          },
                                          getBlogPostReadMoreLinkBlock(
                                            "Read more",
                                          ),
                                          {
                                            id: "block-24e9e3f2-70e9-45ed-8025-955881ad4df7",
                                            type: "ForeachContainer",
                                            data: {
                                              props: {
                                                value: "post.tags",
                                                itemName: "tag",
                                                children: [
                                                  {
                                                    type: "BlogPostTag",
                                                    id: "block-524438cd-9b79-470b-bb2b-2f6d7a384475",
                                                    data: {
                                                      props: {},
                                                      style: {
                                                        padding: [
                                                          {
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
                                                                value: 1,
                                                                unit: "rem",
                                                              },
                                                              right: {
                                                                value: 1,
                                                                unit: "rem",
                                                              },
                                                            },
                                                          },
                                                        ],
                                                        borderRadius: [
                                                          {
                                                            value: {
                                                              value: 0.5,
                                                              unit: "rem",
                                                            },
                                                          },
                                                        ],
                                                        backgroundColor: [
                                                          {
                                                            value:
                                                              "var(--value-secondary-color)",
                                                          },
                                                        ],
                                                        color: [
                                                          {
                                                            value:
                                                              "var(--value-secondary-foreground-color)",
                                                          },
                                                        ],
                                                        fontSize: [
                                                          {
                                                            value: {
                                                              value: 0.875,
                                                              unit: "rem",
                                                            },
                                                          },
                                                        ],
                                                        fontWeight: [
                                                          {
                                                            value: "500",
                                                          },
                                                        ],
                                                        display: [
                                                          {
                                                            value:
                                                              "inline-block",
                                                          },
                                                        ],
                                                        width: [
                                                          {
                                                            value:
                                                              "fit-content",
                                                          },
                                                        ],
                                                        textAlign: [
                                                          {
                                                            value: "center",
                                                          },
                                                        ],
                                                      },
                                                    },
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
                                                    value: "row",
                                                  },
                                                ],
                                                width: [
                                                  {
                                                    value: {
                                                      value: 100,
                                                      unit: "%",
                                                    },
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
                                                flexWrap: [
                                                  {
                                                    value: "wrap",
                                                  },
                                                ],
                                              },
                                            },
                                          },
                                        ],
                                        postUrl: "/blog/[slug]",
                                      },
                                    },
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
                                ],
                                width: [
                                  {
                                    value: {
                                      value: 100,
                                      unit: "%",
                                    },
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
                            },
                          },
                          {
                            id: "block-a79f52cb-031b-4f91-975a-a88a3e808b7e",
                            type: "Container",
                            data: {
                              style: {
                                display: [
                                  {
                                    value: "flex",
                                  },
                                ],
                                flexDirection: [
                                  {
                                    value: "row",
                                  },
                                ],
                                justifyContent: [
                                  {
                                    value: "space-between",
                                  },
                                ],
                                width: [
                                  {
                                    value: {
                                      value: 100,
                                      unit: "%",
                                    },
                                  },
                                ],
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
                              },
                              props: {
                                children: [
                                  {
                                    type: "BlogPostNavigationButton",
                                    id: "block-d1300f34-5426-4b62-aba7-2ef043d7524a",
                                    data: {
                                      props: {
                                        direction: "prev",
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
                                            value: "brightness(1.1)",
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
                                      },
                                    },
                                  },
                                  {
                                    type: "BlogPostNavigationButton",
                                    id: "block-a2437949-7a03-4ca8-be6b-d3ec91db7344",
                                    data: {
                                      props: {
                                        direction: "next",
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
                                            value: "brightness(1.1)",
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
                                      },
                                    },
                                  },
                                ],
                              },
                            },
                          },
                        ],
                        postsPerPage: 10,
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
      },
      id: "block-36f06d5b-7f61-4a2c-a358-2fc3571b689d",
      type: "PageLayout",
    },
    slug: "blog",
    description: "Blog",
    keywords: "blog",
    tags: ["blog"],
    published: true,
    publishDate: new Date(),
    doNotCombine: {},
    headerId,
    footerId,
  },
  {
    title: "{{postTitle}}",
    content: {
      data: {
        fontFamily: "PRIMARY",
        fullWidth: true,
        children: [
          {
            id: "block-d65e7bf9-2639-4820-a62f-0af729031f3a",
            type: "BlogPostContainer",
            metadata: {
              blogAppName: "blog",
              blogAppId: appId,
            },
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
                width: [
                  {
                    value: {
                      value: 100,
                      unit: "%",
                    },
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
                maxWidth: [
                  {
                    breakpoint: [],
                    state: [],
                    value: {
                      value: 100,
                      unit: "%",
                    },
                  },
                  {
                    breakpoint: ["sm"],
                    state: [],
                    value: {
                      value: 640,
                      unit: "px",
                    },
                  },
                  {
                    breakpoint: ["md"],
                    state: [],
                    value: {
                      value: 768,
                      unit: "px",
                    },
                  },
                  {
                    breakpoint: ["lg"],
                    state: [],
                    value: {
                      value: 1024,
                      unit: "px",
                    },
                  },
                  {
                    breakpoint: ["xl"],
                    state: [],
                    value: {
                      value: 1280,
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
                    id: "block-aaf47f88-aef1-4d4a-bde0-1233078317e7",
                    data: {
                      props: {
                        level: "h1",
                        children: [
                          {
                            type: "BlogPostTitle",
                            id: "block-8bfab7e7-7d60-4104-9b18-0675c9afc924",
                            data: {
                              props: {},
                              style: {
                                fontSize: [
                                  {
                                    value: {
                                      value: 2,
                                      unit: "rem",
                                    },
                                  },
                                ],
                                fontWeight: [
                                  {
                                    value: "bold",
                                  },
                                ],
                              },
                            },
                          },
                        ],
                      },
                      style: {
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
                      },
                    },
                  },
                  {
                    type: "BlogPostPublishDate",
                    id: "block-63c1fb7d-b54f-4777-b170-9eb2fc906fc3",
                    data: {
                      props: {
                        format: "MMMM d, yyyy",
                      },
                      style: {
                        fontSize: [
                          {
                            value: {
                              value: 0.875,
                              unit: "rem",
                            },
                          },
                        ],
                      },
                    },
                  },
                  {
                    type: "BlogPostContent",
                    id: "block-a539ede0-2acc-4c4e-af6f-4e2668e2257a",
                    data: {
                      props: {
                        showShort: false,
                      },
                      style: {},
                    },
                  },
                  {
                    id: "block-258833cb-7a41-439b-b25f-892502d1301c",
                    type: "ForeachContainer",
                    data: {
                      props: {
                        value: "post.tags",
                        itemName: "tag",
                        children: [
                          {
                            type: "BlogPostTag",
                            id: "block-0b235ada-c309-4723-934b-5147cb9f9090",
                            data: {
                              props: {
                                blogListUrl: "/blog",
                              },
                              style: {
                                padding: [
                                  {
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
                                        value: 1,
                                        unit: "rem",
                                      },
                                      right: {
                                        value: 1,
                                        unit: "rem",
                                      },
                                    },
                                  },
                                ],
                                borderRadius: [
                                  {
                                    value: {
                                      value: 0.5,
                                      unit: "rem",
                                    },
                                  },
                                ],
                                backgroundColor: [
                                  {
                                    value: "var(--value-secondary-color)",
                                  },
                                ],
                                color: [
                                  {
                                    value:
                                      "var(--value-secondary-foreground-color)",
                                  },
                                ],
                                fontSize: [
                                  {
                                    value: {
                                      value: 0.875,
                                      unit: "rem",
                                    },
                                  },
                                ],
                                fontWeight: [
                                  {
                                    value: "500",
                                  },
                                ],
                                display: [
                                  {
                                    value: "inline-block",
                                  },
                                ],
                                width: [
                                  {
                                    value: "fit-content",
                                  },
                                ],
                                textAlign: [
                                  {
                                    value: "center",
                                  },
                                ],
                              },
                            },
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
                            value: "row",
                          },
                        ],
                        width: [
                          {
                            value: {
                              value: 100,
                              unit: "%",
                            },
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
                        flexWrap: [
                          {
                            value: "wrap",
                          },
                        ],
                      },
                    },
                  },
                ],
                postUrl: "/blog/[slug]",
              },
            },
          },
        ],
      },
      id: "block-f4a3e0de-4f60-4833-bf4d-d083eef4daa3",
      type: "PageLayout",
    },
    slug: "blog/[slug]",
    description: "{{postDescription}}",
    keywords: "blog",
    published: true,
    publishDate: new Date(),
    tags: ["blog"],
    doNotCombine: {},
    headerId,
    footerId,
  },
];
