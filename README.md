# Research Portfolio

An independent Vite site for thirteen research and software projects across four directions:

- Physics-Informed Neural Networks
- Scientific Simulation
- Utility Tools
- AI Agents

The home page opens with an enhanced profile portrait, daily token heatmap, and GitHub contribution heatmap, followed by four full-screen research sections. Every screen snaps to the nearest section after scrolling. Each project opens a dedicated research-page shell through a static-safe Hash route. Research text and equations are intentionally left as structured placeholders for the next content phase.

## Run locally

```powershell
npm.cmd install
npm.cmd run dev
```

## Production build

```powershell
npm.cmd run build
npm.cmd run preview
```

## Publish with GitHub Pages

The repository includes `.github/workflows/deploy-pages.yml`. It builds and deploys the site whenever `main` is pushed, and it can also be started manually from the Actions tab.

1. Create a GitHub repository and push this folder as the repository root.
2. Open **Settings → Pages** in GitHub.
3. Set **Source** to **GitHub Actions**.
4. Push to `main`, then follow the deployment in the **Actions** tab.

The Vite build uses relative asset paths and Hash routes, so both user sites and repository sites are supported without changing the repository name.

## Browser QA

The QA script expects Python Playwright and Microsoft Edge:

```powershell
python tools\qa_site.py
```

Screenshots are written to `qa-output/`.

## Content structure

Project names, routes, category assignments, repository links, and empty research sections are defined in `src/data/projects.ts`. Reusable KaTeX renderers are available in `src/components/Formula.tsx` for the later equation-writing phase.
