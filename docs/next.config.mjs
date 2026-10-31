import nextra from "nextra";

const withNextra = nextra({
  contentDirBasePath: "/docs",
  search: {
    codeblocks: false,
  },
});

export default withNextra({
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/docs",
        destination: "/docs/getting-started/introduction",
        permanent: false,
      },
      {
        source: "/docs/daily-use/first-steps-after-setup",
        destination: "/docs/first-steps",
        permanent: true,
      },
    ];
  },
});
