import React, { useRef, useEffect } from 'react';
import { classNames } from '~/utils/classNames'; 

interface AnimatedSphereProps {
  size?: number; 
  color?: string;
  secondaryColor?: string;
  tertiaryColor?: string; 
  speed?: number;
  particleCount?: number;
  className?: string; 
}

export default function AnimatedSphere({
  size = 300, 
  color = '#0096FF', 
  secondaryColor = '#0044BB', 
  tertiaryColor = '#0E4B54', 
  speed = 0.0005,
  particleCount = 200, // Increased particle count
  className = '',
}: AnimatedSphereProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    
    const particles: {
      x: number; y: number; z: number;
      baseSize: number; pulsePhase: number; pulseSpeed: number;
      orbitSpeed: number; orbitRadius: number; orbitPhase: number;
      isCore: boolean; color: string; 
      targetConnections: { index: number; strength: number }[]; // For dynamic connections
      lastConnectionCheck: number;
    }[] = [];

    const coreCount = 3; 
    const sphereRadius = size / 2 * 0.9; 

    const coreBase = (size / 200) * (0.8 + Math.random() * 0.4); 
    const midTierBase = (size / 250) * (0.5 + Math.random() * 0.3); 
    const regularBase = (size / 300) * (0.3 + Math.random() * 0.2);

    for (let i = 0; i < coreCount; i++) {
      const r = sphereRadius * (0.05 + Math.random() * 0.15); 
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      particles.push({
        x: r * Math.sin(phi) * Math.cos(theta), y: r * Math.sin(phi) * Math.sin(theta), z: r * Math.cos(phi),
        baseSize: coreBase, 
        pulsePhase: Math.random() * Math.PI * 2, pulseSpeed: 0.03 + Math.random() * 0.02,
        orbitSpeed: 0.0005 + Math.random() * 0.0005, orbitRadius: r * 2, orbitPhase: Math.random() * Math.PI * 2,
        isCore: true, color: secondaryColor, targetConnections: [], lastConnectionCheck: 0,
      });
    }

    for (let i = 0; i < particleCount - coreCount; i++) {
      const r = sphereRadius * (0.6 + Math.random() * 0.4); 
      const theta = Math.random() * Math.PI * 2; const phi = Math.random() * Math.PI;
      const isMidTier = Math.random() > 0.75; 
      const useTertiary = Math.random() > 0.7;  

      particles.push({
        x: r * Math.sin(phi) * Math.cos(theta), y: r * Math.sin(phi) * Math.sin(theta), z: r * Math.cos(phi),
        baseSize: isMidTier ? midTierBase : regularBase,
        pulsePhase: Math.random() * Math.PI * 2, pulseSpeed: 0.01 + Math.random() * 0.03,
        orbitSpeed: 0.0004 + Math.random() * 0.0008, orbitRadius: r, orbitPhase: Math.random() * Math.PI * 2,
        isCore: false, color: isMidTier ? secondaryColor : (useTertiary ? tertiaryColor : color),
        targetConnections: [], lastConnectionCheck: 0,
      });
    }

    let rotation = 0; let lastTime = 0;
    const projectionCenter_x = size / 2; const projectionCenter_y = size / 2; 
    const focalLength = size * 1.2; 
    const MAX_CONNECTIONS_PER_PARTICLE = 3; // Max dynamic connections
    const CONNECTION_CHECK_INTERVAL = 1.5; // Seconds

    const animate = (timestamp: number) => {
      const currentTime = timestamp / 1000; 
      const deltaTime = lastTime ? (currentTime - lastTime) : 0.016;
      lastTime = currentTime;
      timeRef.current = currentTime;
      
      ctx.clearRect(0, 0, size, size); 
      rotation += speed * deltaTime * 20; 
      
      particles.forEach(particle => {
        const orbitFactor = particle.isCore ? 0.01 : 0.03;
        const orbitAngle = currentTime * particle.orbitSpeed + particle.orbitPhase;
        particle.x += Math.cos(orbitAngle) * orbitFactor * (size/300); 
        particle.y += Math.sin(orbitAngle) * orbitFactor * (size/300);
        if (!particle.isCore) particle.z += Math.sin(orbitAngle * 0.7) * orbitFactor * 0.3 * (size/300);
        
        const dist = Math.sqrt(particle.x**2 + particle.y**2 + particle.z**2);
        if (dist > particle.orbitRadius * 1.3) { 
          const correction = particle.orbitRadius / dist;
          particle.x *= correction; particle.y *= correction; particle.z *= correction;
        }
      });
      
      const sortedParticles = [...particles].sort((a, b) => a.z - b.z);
      
      sortedParticles.forEach((particle, i) => {
        const cosR = Math.cos(rotation); const sinR = Math.sin(rotation);
        const rotatedX_p1 = particle.x * cosR + particle.z * sinR;
        const rotatedZ_p1 = particle.z * cosR - particle.x * sinR;
        const perspective_p1 = focalLength / (focalLength + rotatedZ_p1 + (size*0.1));
        const projectedX_p1 = rotatedX_p1 * perspective_p1 + projectionCenter_x;
        const projectedY_p1 = particle.y * perspective_p1 + projectionCenter_y;

        // Dynamic "snap" connections
        if (currentTime - particle.lastConnectionCheck > CONNECTION_CHECK_INTERVAL * (0.8 + Math.random() * 0.4) ) {
            particle.targetConnections = [];
            const potentialTargets: {index: number, distSq: number}[] = [];
            for(let k=0; k < sortedParticles.length; k++) {
                if (i === k) continue;
                const p2 = sortedParticles[k];
                const dx = particle.x - p2.x; // Use 3D distance for selection
                const dy = particle.y - p2.y;
                const dz = particle.z - p2.z;
                potentialTargets.push({index: k, distSq: dx*dx + dy*dy + dz*dz});
            }
            potentialTargets.sort((a,b) => a.distSq - b.distSq);
            for(let k=0; k < Math.min(MAX_CONNECTIONS_PER_PARTICLE, potentialTargets.length); k++) {
                if (potentialTargets[k].distSq < (size*0.4)**2) { // Max 3D connection range
                    particle.targetConnections.push({index: potentialTargets[k].index, strength: Math.random()});
                }
            }
            particle.lastConnectionCheck = currentTime;
        }
        
        particle.targetConnections.forEach(conn => {
            const p2 = sortedParticles[conn.index];
            if (!p2) return;

            const rotatedX_p2 = p2.x * cosR + p2.z * sinR; const rotatedZ_p2 = p2.z * cosR - p2.x * sinR;
            const perspective_p2 = focalLength / (focalLength + rotatedZ_p2 + (size*0.1));
            const projectedX_p2 = rotatedX_p2 * perspective_p2 + projectionCenter_x;
            const projectedY_p2 = p2.y * perspective_p2 + projectionCenter_y;

            // Line "beaming" - sharper pulse
            const beamPhase = (currentTime * 3 + conn.strength * Math.PI) % Math.PI; 
            const beamIntensity = Math.max(0.2, Math.pow(Math.sin(beamPhase), 2)); // Smoother, stronger beam
            let lineOpacity = 0.15 * beamIntensity; // Base opacity for "snap" lines
            if (particle.isCore || p2.isCore) lineOpacity *= 1.2;
            
            const gradient = ctx.createLinearGradient(projectedX_p1, projectedY_p1, projectedX_p2, projectedY_p2);
            const cS = particle.color; const cE = p2.color;
            const aS = Math.floor(lineOpacity * 255).toString(16).padStart(2, "0");
            const aE = Math.floor(lineOpacity * 255).toString(16).padStart(2, "0");
            gradient.addColorStop(0, `${cS}${aS}`); gradient.addColorStop(1, `${cE}${aE}`);
            ctx.beginPath(); ctx.moveTo(projectedX_p1, projectedY_p1); ctx.lineTo(projectedX_p2, projectedY_p2);
            ctx.strokeStyle = gradient; 
            ctx.lineWidth = particle.isCore || p2.isCore ? Math.max(0.4, size/1200) : Math.max(0.15, size/2500);
            ctx.stroke();
        });
      });
      
      sortedParticles.forEach((particle) => {
        const cosR = Math.cos(rotation); const sinR = Math.sin(rotation);
        const rotatedX = particle.x * cosR + particle.z * sinR;
        const rotatedZ = particle.z * cosR - particle.x * sinR;
        const perspective = focalLength / (focalLength + rotatedZ + (size*0.1));
        const projectedX = rotatedX * perspective + projectionCenter_x;
        const projectedY = particle.y * perspective + projectionCenter_y;
        const opacity = Math.min(1, ((rotatedZ + sphereRadius*1.2) / (2.4 * sphereRadius)) * 1.5); 
        const pulsePhase = currentTime * particle.pulseSpeed + particle.pulsePhase;
        const pulseFactor = particle.isCore ? 0.8 + 0.2 * Math.sin(pulsePhase) : 0.95 + 0.05 * Math.sin(pulsePhase);
        let finalSize = particle.baseSize * pulseFactor * perspective;
        
        finalSize = Math.max(0.1, finalSize); 

        if (particle.isCore) {
          const glowSize = finalSize * 2.0;
          const glowOpacity = opacity * 0.3;
          const glow = ctx.createRadialGradient(projectedX, projectedY, 0, projectedX, projectedY, glowSize);
          const glowAlpha = Math.floor(glowOpacity * 255).toString(16).padStart(2, "0");
          glow.addColorStop(0, `${particle.color}${glowAlpha}`);
          glow.addColorStop(1, `${particle.color}00`);
          ctx.beginPath(); ctx.arc(projectedX, projectedY, glowSize, 0, Math.PI * 2);
          ctx.fillStyle = glow; ctx.fill();
        }
        ctx.beginPath(); ctx.arc(projectedX, projectedY, finalSize, 0, Math.PI * 2);
        const particleAlpha = Math.floor(opacity * 255).toString(16).padStart(2, "0");
        ctx.fillStyle = `${particle.color}${particleAlpha}`;
        ctx.fill();
      });
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [size, color, secondaryColor, tertiaryColor, speed, particleCount]); 
  
  return (
    <canvas 
      ref={canvasRef}
      className={classNames(className)} 
      style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: `${size}px`, height: `${size}px`, 
        maxWidth: '100vw', maxHeight: '100vh',
      }}
    />
  );
}
