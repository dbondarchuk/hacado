import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Heading from "@theme/Heading";
import Layout from "@theme/Layout";
import clsx from "clsx";
import type { ReactNode } from "react";

import styles from "./index.module.css";

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx("hero hero--primary", styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/getting-started/introduction"
          >
            Open the guides
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <HomepageHeader />
      <main>
        <div className="container margin-vert--lg">
          <div className="row">
            <div className="col col--8 col--offset-2">
              <p className="text--lead">
                <a href="https://hacado.com">Hacado</a> is an all-in-one
                booking platform: accept appointments, automate notifications,
                process payments, and build a complete website from one admin
                dashboard. No tech skills needed-if you can use email, you can
                use <a href="https://hacado.com">Hacado</a>.
              </p>
              <p>
                <a href="https://hacado.com">Hacado</a> is a comprehensive
                appointment scheduling and business management platform built
                for service providers, coaches, clinics, salons, and any
                business that relies on bookings. From a drag-and-drop website
                builder to automated SMS reminders and integrated payment
                processing, <a href="https://hacado.com">Hacado</a> brings
                every part of your booking workflow into one place.
              </p>
              <p>
                Start with the{" "}
                <Link to="/docs/getting-started/introduction">
                  introduction
                </Link>
                , then{" "}
                <Link to="/docs/getting-started/what-is-hacado">
                  what Hacado is
                </Link>
                , <Link to="/docs/getting-started/sign-up">sign up</Link>,{" "}
                <Link to="/docs/getting-started/subscription-and-checkout">
                  choose a plan
                </Link>
                , and{" "}
                <Link to="/docs/getting-started/workspace-install-wizard">
                  set up your workspace
                </Link>
                . After that, explore{" "}
                <Link to="/docs/first-steps">first steps</Link>
                , <Link to="/docs/daily-use/settings">settings</Link>,{" "}
                <Link to="/docs/daily-use/connect-domain">your domain</Link>,
                and <Link to="/docs/apps/overview">Apps</Link>.
              </p>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
