import React from "react";
import clsx from "clsx";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import useBaseUrl from "@docusaurus/useBaseUrl";
import styles from "./styles.module.css";

const features = [
  {
    title: "Easy to Use",
    // imageUrl: 'img/undraw_docusaurus_mountain.svg',
    description: (
      <>
        Macrostrat-UI Components was designed to leverage the power of React Js
        and other frontend libraries to make components easy to use and seamless
        to implement.
      </>
    ),
  },
  {
    title: "Focus on What Matters",
    //imageUrl: 'img/undraw_docusaurus_tree.svg',
    description: (
      <>
        The U.I can be laborious to create and is only needed to display your
        lab's analytical data. Macrostrat-UI Components does all the heavy
        lifting for you so you can focus on what matters, the science.
      </>
    ),
  },
  {
    title: "From the People Who Created Sparrow",
    //imageUrl: 'img/undraw_docusaurus_react.svg',
    description: (
      <>
        Macrostrat-UI Components was widely used in the creation of{" "}
        <a href="https://sparrow-data.org/">Sparrow</a>, a software designed to
        handle geochemical data.
      </>
    ),
  },
];

function Feature({ imageUrl, title, description }) {
  const imgUrl = useBaseUrl(imageUrl);
  return (
    <div className={clsx("col col--4", styles.feature)}>
      {imgUrl && (
        <div className="text--center">
          <img className={styles.featureImage} src={imgUrl} alt={title} />
        </div>
      )}
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function Home() {
  const context = useDocusaurusContext();
  const { siteConfig = {} } = context;
  return (
    <Layout
      title={`Hello from ${siteConfig.title}`}
      description="Description will go into a meta tag in <head />"
    >
      <header className={clsx("hero hero--primary", styles.heroBanner)}>
        <div className="container">
          <h1 className="hero__title">{siteConfig.title}</h1>
          <p className="hero__subtitle">{siteConfig.tagline}</p>
          <div className={styles.buttons}>
            <Link
              className={clsx(
                "button button--outline button--secondary button--lg",
                styles.getStarted
              )}
              to={useBaseUrl("docs/")}
            >
              Getting Started
            </Link>
          </div>
        </div>
      </header>
      <main>
        {features && features.length > 0 && (
          <section className={styles.features}>
            <div className="container">
              <div className="row">
                {features.map((props, idx) => (
                  <Feature key={idx} {...props} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </Layout>
  );
}

export default Home;
