import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Expand, ExternalLink, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

interface ZoomableResearchImageProps {
  src: string;
  alt: string;
  caption?: string;
}

export default function ZoomableResearchImage({ src, alt, caption }: ZoomableResearchImageProps) {
  const reduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.documentElement.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    window.requestAnimationFrame(() => closeRef.current?.focus());

    return () => {
      document.documentElement.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    };
  }, [isOpen]);

  const lightbox = (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="image-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`Original image: ${alt}`}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <motion.div
            className="image-lightbox-toolbar"
            initial={reduceMotion ? false : { opacity: 0, y: -8, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.99 }}
            transition={{ type: "spring", bounce: 0, duration: reduceMotion ? 0 : 0.32 }}
          >
            <span>{caption ?? alt}</span>
            <a href={src} target="_blank" rel="noreferrer">
              <ExternalLink size={16} aria-hidden="true" />
              <span>Open original</span>
            </a>
            <button ref={closeRef} type="button" aria-label="Close original image" onClick={() => setIsOpen(false)}>
              <X size={18} aria-hidden="true" />
            </button>
          </motion.div>

          <motion.figure
            className="image-lightbox-figure"
            initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            transition={{ type: "spring", bounce: 0, duration: reduceMotion ? 0 : 0.36 }}
          >
            <img src={src} alt={alt} />
            {caption ? <figcaption>{caption}</figcaption> : null}
          </motion.figure>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return (
    <>
      <button
        ref={triggerRef}
        className="research-figure-frame research-figure-open"
        type="button"
        aria-label={`View original image: ${alt}`}
        onClick={() => setIsOpen(true)}
      >
        <img src={src} alt={alt} loading="lazy" />
        <span className="research-image-zoom-badge" aria-hidden="true">
          <Expand size={15} />
          <span>View original</span>
        </span>
      </button>
      {typeof document !== "undefined" ? createPortal(lightbox, document.body) : null}
    </>
  );
}
