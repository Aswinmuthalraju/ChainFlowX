import React, { useRef, useEffect, useState } from 'react';
import Globe from 'react-globe.gl';

export default function SupplyChainGlobe({ routes, chokepoints, eventState, onRouteSelect }) {
  const globeRe = useRef();

  // Create arc data
  const arcsData = routes;

  const arcColor = (route) => {
    if (route.status === 'critical') return '#ef4444';
    if (route.status === 'warning' || route.status === 'severe') return '#f59e0b';
    return 'rgba(16, 185, 129, 0.4)';
  };

  const arcStroke = (route) => route.currentRisk > 60 ? 2 : 1;
  const arcDashAnimateTime = (route) => route.status === 'critical' ? 1500 : 3000;

  useEffect(() => {
    if (globeRe.current) {
        globeRe.current.controls().autoRotate = true;
        globeRe.current.controls().autoRotateSpeed = 0.5;
    }
  }, []);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Globe
        ref={globeRe}
        backgroundColor="#060912"
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        atmosphereColor="#00d4ff"
        atmosphereAltitude={0.25}
        showGraticules={true}
        
        arcsData={arcsData}
        arcStartLat={d => d.from.lat}
        arcStartLng={d => d.from.lng}
        arcEndLat={d => d.to.lat}
        arcEndLng={d => d.to.lng}
        arcColor={arcColor}
        arcStroke={arcStroke}
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={arcDashAnimateTime}
        onArcClick={onRouteSelect}

        pointsData={chokepoints}
        pointLat="lat"
        pointLng="lng"
        pointColor={() => '#00d4ff'}
        pointAltitude={0.02}
        pointRadius={0.8}
      />
    </div>
  );
}
