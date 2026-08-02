import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ChevronDown, Github, MoveUpRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { categories, projectRepositoryName, projects, projectsByCategory, type CategoryId } from "../data/projects";
import ProjectFerrisWheel from "./ProjectFerrisWheel";

const imageUrl = (path: string) => new URL(path, document.baseURI).toString();

export default function HomePage() {
  const reduceMotion = useReducedMotion();
  const [activeSection, setActiveSection] = useState("github");
  const sectionIds = useMemo(() => ["github", ...categories.map((category) => category.id)], []);
  const navigationSections = useMemo(
    () => [
      { id: "github", index: "01", title: "GitHub Profile" },
      ...categories.map(({ id, index, title }) => ({ id, index, title })),
    ],
    [],
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target.id) {
          setActiveSection(visible.target.id as CategoryId | "github");
        }
      },
      { threshold: [0.35, 0.6, 0.8] },
    );

    sectionIds.forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, [sectionIds]);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <div className="portfolio-shell">
      <header className="site-header" aria-label="Site header">
        <div className="header-meta">
          <span>13 projects</span>
          <a
            className="header-link"
            href="https://github.com/qianyuyingluo"
            target="_blank"
            rel="noreferrer"
          >
            <Github size={16} aria-hidden="true" />
            <span>GitHub</span>
          </a>
        </div>
      </header>

      <nav className="section-dots" aria-label="Research directions">
        {navigationSections.map((category) => (
          <button
            key={category.id}
            className={activeSection === category.id ? "section-dot is-active" : "section-dot"}
            type="button"
            aria-label={`Go to ${category.title}`}
            aria-current={activeSection === category.id ? "true" : undefined}
            onClick={() => scrollToSection(category.id)}
          >
            <span>{category.index}</span>
          </button>
        ))}
      </nav>

      <main className="project-sections">
        <section
          id="github"
          className="project-stage theme-github profile-stage"
          style={{ "--profile-image": `url("${imageUrl("images/profile-background.jpg")}")` } as React.CSSProperties}
          aria-labelledby="github-heading"
        >
          <div className="profile-stage-art" aria-hidden="true" />
          <div className="profile-stage-wash" aria-hidden="true" />
          <h1 id="github-heading" className="visually-hidden">Profile activity</h1>
          <motion.aside
            className="profile-intro"
            initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", bounce: 0, duration: 0.42 }}
          >
            <p>Physics &amp; Intelligence</p>
            <h2>Research Portfolio</h2>
            <strong>Bridging Physical Laws and Artificial Intelligence</strong>
            <span>
              Exploring scientific computing,<br />
              physics-informed learning,<br />
              and intelligent systems.
            </span>
          </motion.aside>
          <ProjectFerrisWheel projects={projects} />
          <motion.div
            className="profile-dashboard"
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.42 }}
          >
            <figure className="profile-card profile-portrait-card">
              <img src={imageUrl("images/profile-sr.jpg")} alt="qianyuyingluo profile portrait" />
            </figure>
            <div className="profile-activity-grid">
              <figure className="profile-card activity-card token-card">
                <figcaption>
                  <span>Daily Token Activity</span>
                  <small>January — August</small>
                </figcaption>
                <img src={imageUrl("images/token-heatmap-sr.jpg")} alt="Daily token usage heatmap from January to August" />
              </figure>
              <figure className="profile-card activity-card github-activity-card">
                <figcaption>
                  <span>GitHub Contributions</span>
                  <small>Last year</small>
                </figcaption>
                <img src={imageUrl("images/github-heatmap-sr.jpg")} alt="GitHub contribution heatmap for the last year" />
              </figure>
            </div>
          </motion.div>
          <button className="scroll-cue" type="button" onClick={() => scrollToSection("pinn")}>
            <span>Continue to research directions</span>
            <ChevronDown size={17} aria-hidden="true" />
          </button>
        </section>

        {categories.map((category, categoryIndex) => {
          const categoryProjects = projectsByCategory(category.id);
          const background = imageUrl(category.background);

          return (
            <section
              id={category.id}
              key={category.id}
              className={`project-stage theme-${category.id}`}
              style={
                {
                  "--stage-image": `url("${background}")`,
                  "--focal-point": category.focalPoint,
                } as React.CSSProperties
              }
              aria-labelledby={`${category.id}-heading`}
            >
              <div className="stage-backdrop" aria-hidden="true" />
              <div className="stage-art" aria-hidden="true" />
              <div className="stage-shade" aria-hidden="true" />

              <motion.div
                className="project-panel"
                initial={reduceMotion ? false : { opacity: 0, y: 22, scale: 0.985 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ amount: 0.45, once: false }}
                transition={{ type: "spring", bounce: 0, duration: 0.42 }}
              >
                <div className="panel-heading">
                  <div>
                    <p className="section-eyebrow">{category.eyebrow}</p>
                    <h1 id={`${category.id}-heading`}>{category.title}</h1>
                  </div>
                  <span className="project-count">{categoryProjects.length.toString().padStart(2, "0")}</span>
                </div>

                <div className="project-actions">
                  {categoryProjects.map((project) => (
                    <motion.div
                      key={project.slug}
                      className="project-action-wrap"
                      whileHover={reduceMotion ? undefined : { y: -2, scale: 1.006 }}
                      whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                      transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                    >
                      <a className="project-action" href={`#/projects/${project.slug}`}>
                        <span>{projectRepositoryName(project)}</span>
                        <MoveUpRight size={17} strokeWidth={1.8} aria-hidden="true" />
                      </a>
                    </motion.div>
                  ))}
                </div>

                <div className="panel-footer">
                  <span>{category.index} / 05</span>
                  <span>Open a project to view its research page</span>
                </div>
              </motion.div>

              {categoryIndex === categories.length - 1 && (
                <button className="scroll-cue scroll-cue-top" type="button" onClick={() => scrollToSection("github")}>
                  <span>Back to GitHub profile</span>
                  <ArrowRight className="arrow-up" size={17} aria-hidden="true" />
                </button>
              )}
            </section>
          );
        })}
      </main>
    </div>
  );
}
