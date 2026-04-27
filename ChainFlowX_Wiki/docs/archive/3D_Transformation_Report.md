# ChainFlowX: Web-Based 3D Transformation Report

**Submission Date:** April 2026
**Project Identifier:** ChainFlowX
**Objective Fulfillment:** Design a website with a 3D transformation using open source software.

---

## 1. Executive Summary
This report outlines the **ChainFlowX** application, a real-time web platform designed to monitor global supply chain operations and visually map critical chokepoints and disruptive events. The project successfully fulfills the core requirements by employing an impressive suite of open-source tools to deliver complex **3D transformations** and visualizations within a standard browser environment.

## 2. Requirement Verification
- **Website Requirement:** The application is built using standard modern web paradigms, leveraging **React 18** and **Vite** as a robust, single-page application (SPA).
- **Open-Source Software Requirement:** The software pipeline runs entirely on open-source frameworks. The 3D view is powered by **Three.js** and **globe.gl** under the hood, running atop **WebGL**.
- **3D Transformation Requirement:** Geo-spatial supply-chain data (2D coordinate arrays of Latitude/Longitude) are mathematically projected and transformed into interactive, rotatable 3D objects mapping directly to a WebGL sphere.

## 3. The 3D Transformation Technology (Three.js & Globe.gl)
The primary visual element of the application is a responsive 3D Earth model. The transformation from 2D web elements to a 3D environment depends on the following mechanisms located in the `SupplyChainGlobe.jsx` module:

### A. Coordinate Space Transformation (Spherical to Cartesian 3D)
The core 3D transformation takes raw mapping coordinates (spherical space) and converts them into 3D cartesian vectors $(x, y, z)$ on a geometric canvas. 
- The open-source library maps routes and points to specific distances from the origin (Earth's core). 
- To render flight paths and maritime trade routes, coordinates undergo a 3D translation where elements receive an `altitude` parameter (e.g., flight coordinates are transformed to hover above the globe model via `alt: 0.18` multipliers).

### B. Dynamic Point-Of-View (Camera Transformations)
The 3D space uses camera matrices to rotate, zoom, and transform the user's viewport perspective in real-time. Wait states and real-time triggers update the globe's rotation to automatically pan to global chokepoints dynamically (e.g., smoothly adjusting the 3D viewing angle to focus on the Suez Canal or Strait of Hormuz).

### C. 3D Arc Projections
Trade lines are rendered utilizing **great-circle arc** interpolations. Calculating the shortest path over a sphere requires mathematically bending the 2D path so that it maps cleanly onto the curved surface of the 3D globe. Both altitude mapping and spherical interpolation transformations occur dynamically using web browser GPUs.

## 4. Software Architecture & Pipeline
Beyond 3D transformations, the website architecture is constructed through a 6-layer data-ingestion pipeline:
1. **Event Ingest:** GDELT + RSS feeds aggregate live global events.
2. **Graph Build:** Compiles the port and route dependency models.
3. **AI Classify:** Local LLM categorizes the risk level and origin chokepoint.
4. **Ripple Score™:** Processes event cascades via a Breadth-First-Search algorithm.
5. **AI Synthesize:** Formulates strategic insights predicting downstream supply chain impact.
6. **UI Render (The 3D Layer):** Reactivity loops feed updated data states to the Three.js globe layer, where risk levels manipulate the 3D UI parameters (e.g., path colors, sizes, and dynamic ring radii).

## 5. Conclusion
**ChainFlowX** stands as a robust example of utilizing modern open-source technology to bring complex 3D transformations to the web. By converting raw data sets into an interactive WebGL sphere using Three.js paradigms, the project comprehensively fulfills all academic requirements regarding web design, open-source technology usage, and the execution of geometric 3D transformations.
