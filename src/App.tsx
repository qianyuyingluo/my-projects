import { useEffect, useState } from "react";
import HomePage from "./components/HomePage";
import LaserNondimensionalizationPage from "./components/LaserNondimensionalizationPage";
import ProjectPage from "./components/ProjectPage";

const readHashPath = () => {
  const rawPath = window.location.hash.slice(1) || "/";
  return rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
};

function useHashPath() {
  const [path, setPath] = useState(readHashPath);

  useEffect(() => {
    const handleHashChange = () => setPath(readHashPath());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return path;
}

export default function App() {
  const path = useHashPath();

  useEffect(() => {
    if (path !== "/") window.scrollTo({ top: 0, behavior: "instant" });
  }, [path]);

  if (path === "/") return <HomePage />;

  if (path === "/projects/semiconductor-laser-pinn/nondimensionalization") {
    return <LaserNondimensionalizationPage />;
  }

  const projectMatch = path.match(/^\/projects\/([^/]+)\/?$/);
  if (projectMatch) return <ProjectPage slug={decodeURIComponent(projectMatch[1])} />;

  return <ProjectPage notFound />;
}
