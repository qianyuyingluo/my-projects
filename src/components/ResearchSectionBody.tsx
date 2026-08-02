import { ArrowRight, ArrowUpRight } from "lucide-react";
import { BlockFormula } from "./Formula";
import ZoomableResearchImage from "./ZoomableResearchImage";
import type { ResearchSection } from "../data/projects";

interface ResearchSectionBodyProps {
  section: ResearchSection;
}

const imageUrl = (path: string) => new URL(path, document.baseURI).toString();

export default function ResearchSectionBody({ section }: ResearchSectionBodyProps) {
  const hasContent = Boolean(
    section.content ||
      section.paragraphs?.length ||
      section.bullets?.length ||
      section.code ||
      section.facts?.length ||
      section.formulas?.length ||
      section.media?.length ||
      section.note ||
      section.tags?.length ||
      section.links?.length,
  );

  if (!hasContent) {
    return (
      <div className="empty-section">
        <span className="empty-line" aria-hidden="true" />
        <p>Content in preparation</p>
      </div>
    );
  }

  return (
    <div className="research-section-body" data-content-state="complete">
      {section.content && <p className="research-lead">{section.content}</p>}

      {section.paragraphs?.length ? (
        <div className="research-prose">
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      ) : null}

      {section.facts?.length ? (
        <dl className="research-facts">
          {section.facts.map((fact) => (
            <div key={`${fact.label}-${fact.value}`}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {section.formulas?.length ? (
        <div className="research-formulas">
          {section.formulas.map((formula) => (
            <figure className="research-formula" key={formula.label}>
              {formula.caption && <figcaption>{formula.caption}</figcaption>}
              <BlockFormula latex={formula.latex} label={formula.label} />
            </figure>
          ))}
        </div>
      ) : null}

      {section.media?.length ? (
        <div className="research-media" data-count={section.media.length}>
          {section.media.map((media) => (
            <figure
              className="research-figure"
              data-aspect={media.aspect ?? "wide"}
              data-fit={media.fit ?? "cover"}
              key={media.src}
            >
              <ZoomableResearchImage
                src={imageUrl(media.src)}
                alt={media.alt}
                caption={media.caption}
              />
              {media.caption && <figcaption>{media.caption}</figcaption>}
            </figure>
          ))}
        </div>
      ) : null}

      {section.bullets?.length ? (
        <ul className="research-bullets">
          {section.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      ) : null}

      {section.tags?.length ? (
        <div className="research-tags" aria-label="Technology tags">
          {section.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      ) : null}

      {section.links?.length ? (
        <div className="research-links">
          {section.links.map((link) => (
            <a
              href={link.href}
              key={`${link.label}-${link.href}`}
              rel={link.external ? "noreferrer" : undefined}
              target={link.external ? "_blank" : undefined}
            >
              {link.label}
              {link.external ? <ArrowUpRight size={16} aria-hidden="true" /> : <ArrowRight size={16} aria-hidden="true" />}
            </a>
          ))}
        </div>
      ) : null}

      {section.code && (
        <pre className="research-code">
          <code>{section.code}</code>
        </pre>
      )}

      {section.note && <p className="research-note">{section.note}</p>}
    </div>
  );
}
