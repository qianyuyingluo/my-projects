import { ArrowLeft, ArrowUpRight, FlaskConical, Github } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { categoryById, projects } from "../data/projects";
import AgentEvolutionPage from "./AgentEvolutionPage";
import ResearchSectionBody from "./ResearchSectionBody";
import SectionWheelNav from "./SectionWheelNav";

const imageUrl = (path: string) => new URL(path, document.baseURI).toString();

interface ProjectPageProps {
  notFound?: boolean;
  slug?: string;
}

export default function ProjectPage({ notFound = false, slug }: ProjectPageProps) {
  const reduceMotion = useReducedMotion();
  const project = notFound ? undefined : projects.find((item) => item.slug === slug);

  if (!project) {
    return (
      <main className="not-found-page">
        <div className="not-found-card">
          <span className="not-found-code">404</span>
          <h1>Project not found</h1>
          <p>The requested research page is not available.</p>
          <a className="primary-link" href="#/">
            <ArrowLeft size={17} aria-hidden="true" />
            Return to all projects
          </a>
        </div>
      </main>
    );
  }

  const category = categoryById(project.category);

  if (category.id === "agents") {
    return <AgentEvolutionPage activeSlug={project.slug} />;
  }

  return (
    <div
      className={`research-page theme-${category.id} detail-${category.detailPresentation} project-${project.slug}`}
      style={
        {
          "--hero-image": `url("${imageUrl(category.detailBackground)}")`,
          "--hero-backdrop": `url("${imageUrl(category.background)}")`,
        } as React.CSSProperties
      }
    >
      <div className="research-nav-actions">
        <a className="nav-back" href="#/">
          <ArrowLeft size={16} aria-hidden="true" />
          <span>All projects</span>
        </a>
        <a className="nav-repository" href={project.repositoryUrl} target="_blank" rel="noreferrer">
          <Github size={16} aria-hidden="true" />
          <span>Repository</span>
        </a>
      </div>

      <main className="research-main">
        {category.detailPresentation !== "portrait" && (
          <motion.section
            className="research-hero"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.42 }}
          >
            <div className="research-hero-backdrop" aria-hidden="true" />
            <div className="research-hero-image" aria-hidden="true" />
            <div className="research-hero-shade" aria-hidden="true" />
            <div className="research-hero-content">
              <div className="research-kicker">
                <FlaskConical size={16} aria-hidden="true" />
                <span>{category.title}</span>
              </div>
              <h1>{project.title}</h1>
              <div className="research-status">
                <span className="status-dot" aria-hidden="true" />
                {project.status ?? "Research page in preparation"}
              </div>
              {category.detailPresentation === "artwork" && (
                <a
                  className="hero-repository hero-repository-inline"
                  href={project.repositoryUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  View source
                  <ArrowUpRight size={17} aria-hidden="true" />
                </a>
              )}
            </div>
            {category.detailPresentation !== "artwork" && (
              <a className="hero-repository" href={project.repositoryUrl} target="_blank" rel="noreferrer">
                View source
                <ArrowUpRight size={17} aria-hidden="true" />
              </a>
            )}
          </motion.section>
        )}

        {project.launches?.length ? (
          <motion.section
            className="simulation-launch-deck"
            aria-labelledby="simulation-launch-title"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.38, delay: 0.06 }}
          >
            <div className="simulation-launch-heading">
              <div>
                <p>Interactive laboratory</p>
                <h2 id="simulation-launch-title">Open one of seven simulations</h2>
              </div>
              <span>6 x 2D · 1 x 3D</span>
            </div>
            <div className="simulation-launch-grid">
              {project.launches.map((launch) => (
                <a
                  className="simulation-launch-card"
                  data-simulation={launch.index}
                  href={imageUrl(launch.href)}
                  key={launch.index}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span className="simulation-launch-index">{launch.index}</span>
                  <span className="simulation-launch-copy">
                    <strong>{launch.label}</strong>
                    <small>{launch.description}</small>
                  </span>
                  <span className="simulation-launch-mode">{launch.mode}</span>
                  <ArrowUpRight className="simulation-launch-arrow" size={18} aria-hidden="true" />
                </a>
              ))}
            </div>
          </motion.section>
        ) : null}

        <div className="research-layout">
          <SectionWheelNav label="On this page" sections={project.sections} />

          <article className="research-content">
            {project.sections.map((section, index) => (
              <motion.section
                id={section.id}
                key={section.id}
                className="research-section"
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ amount: "some", once: true }}
                transition={{ type: "spring", bounce: 0, duration: 0.38, delay: index * 0.02 }}
              >
                <div className="research-section-heading">
                  <span>{(index + 1).toString().padStart(2, "0")}</span>
                  <h2>{section.label}</h2>
                </div>
                <ResearchSectionBody section={section} />
              </motion.section>
            ))}
          </article>
        </div>
      </main>

      <footer className="research-footer">
        <a href="#/">Explore all projects</a>
      </footer>
    </div>
  );
}
