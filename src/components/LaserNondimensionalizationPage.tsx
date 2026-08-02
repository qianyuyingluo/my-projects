import { ArrowLeft, BookOpenText, Github } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { laserNondimensionalizationSections } from "../data/pinnResearch";
import { categoryById } from "../data/projects";
import ResearchSectionBody from "./ResearchSectionBody";
import SectionWheelNav from "./SectionWheelNav";

const imageUrl = (path: string) => new URL(path, document.baseURI).toString();

export default function LaserNondimensionalizationPage() {
  const reduceMotion = useReducedMotion();
  const category = categoryById("pinn");

  return (
    <div
      className="research-page theme-pinn detail-portrait derivation-page"
      style={
        {
          "--hero-image": `url("${imageUrl(category.detailBackground)}")`,
          "--hero-backdrop": `url("${imageUrl(category.background)}")`,
        } as React.CSSProperties
      }
    >
      <main className="research-main">
        <motion.section
          className="research-hero"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.42 }}
        >
          <div className="research-hero-backdrop" aria-hidden="true" />
          <div className="research-hero-image" aria-hidden="true" />
          <div className="research-hero-shade" aria-hidden="true" />
          <div className="research-nav-actions">
            <a className="nav-back" href="#/projects/semiconductor-laser-pinn">
              <ArrowLeft size={16} aria-hidden="true" />
              <span>Laser project</span>
            </a>
            <a
              className="nav-repository"
              href="https://github.com/qianyuyingluo/Semiconductor-Laser-PINN"
              target="_blank"
              rel="noreferrer"
            >
              <Github size={16} aria-hidden="true" />
              <span>Repository</span>
            </a>
          </div>
          <div className="research-hero-content">
            <div className="research-kicker">
              <BookOpenText size={16} aria-hidden="true" />
              <span>Semiconductor Laser PINN · Original Derivation</span>
            </div>
            <h1>Nondimensionalization of the Semiconductor-Laser Rate Equations</h1>
            <p className="research-hero-summary">
              Following the original course-design paper, this derivation starts from the dimensional rate equations and
              obtains the dimensionless system used by the state and current-correction networks.
            </p>
            <div className="research-status">
              <span className="status-dot" aria-hidden="true" />
              Original derivation · Typeset with KaTeX
            </div>
          </div>
        </motion.section>

        <div className="research-layout">
          <SectionWheelNav label="Derivation outline" sections={laserNondimensionalizationSections} />

          <article className="research-content">
            {laserNondimensionalizationSections.map((section, index) => (
              <motion.section
                id={section.id}
                key={section.id}
                className="research-section"
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ amount: 0.25, once: true }}
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
        <span>Semiconductor Laser PINN</span>
        <a href="#/projects/semiconductor-laser-pinn">Return to project overview</a>
      </footer>
    </div>
  );
}
