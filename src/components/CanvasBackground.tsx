import { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  shape: 'circle' | 'triangle';
}

interface CanvasBackgroundProps {
  className?: string;
}

export function CanvasBackground({ className = '' }: CanvasBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Initialize particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles with random positions and velocities
    const particleCount = 88;
    const particles: Particle[] = [];

    const colors = [
      'rgba(20, 184, 166, 0.4)', // teal
      'rgba(6, 182, 212, 0.4)',  // cyan
      'rgba(34, 197, 94, 0.3)',  // green
      'rgba(59, 130, 246, 0.3)', // blue
    ];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.01,
        shape: Math.random() > 0.85 ? 'triangle' : 'circle', // 15% triangles
      });
    }

    particlesRef.current = particles;

    // Connection threshold - maximum distance to draw a line
    const connectionDistance = 150;
    const maxLineOpacity = 0.15;

    // Animation loop
    let lastTime = 0;
    let gradientOffset = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;

    const animate = (currentTime: number) => {
      if (prefersReducedMotion) {
        // Static background for reduced motion
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGradient(ctx, canvas.width, canvas.height, 0);
        drawStaticConnections(ctx, particles, connectionDistance, maxLineOpacity);
        drawParticles(ctx, particles);
        return;
      }

      const deltaTime = currentTime - lastTime;

      if (deltaTime >= frameInterval) {
        lastTime = currentTime - (deltaTime % frameInterval);

        // Update gradient offset for subtle shift
        gradientOffset += 0.001;
        if (gradientOffset > Math.PI * 2) gradientOffset = 0;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw gradient background with subtle shift
        drawGradient(ctx, canvas.width, canvas.height, gradientOffset);

        // Update and draw particles
        updateParticles(particles, canvas.width, canvas.height);

        // Draw connections between nearby particles (optimized)
        drawConnectionsOptimized(ctx, particles, connectionDistance, maxLineOpacity);

        // Draw particles
        drawParticles(ctx, particles);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [prefersReducedMotion]);

  // Draw gradient background with subtle rotation
  const drawGradient = (ctx: CanvasRenderingContext2D, width: number, height: number, offset: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const angle = offset;
    const length = Math.sqrt(width * width + height * height);
    
    const x1 = centerX + Math.cos(angle) * length * 0.5;
    const y1 = centerY + Math.sin(angle) * length * 0.5;
    const x2 = centerX - Math.cos(angle) * length * 0.5;
    const y2 = centerY - Math.sin(angle) * length * 0.5;
    
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    gradient.addColorStop(0, 'hsl(212, 86.40%, 8.60%)');
    gradient.addColorStop(0.5, 'hsl(199, 63.90%, 16.30%)');
    gradient.addColorStop(1, 'hsl(211, 90.30%, 12.20%)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  };

  // Update particle positions
  const updateParticles = (particles: Particle[], width: number, height: number) => {
    particles.forEach((particle) => {
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Update rotation for triangles
      if (particle.shape === 'triangle') {
        particle.rotation += particle.rotationSpeed;
      }

      // Wrap around edges for continuous motion
      if (particle.x < 0) particle.x = width;
      if (particle.x > width) particle.x = 0;
      if (particle.y < 0) particle.y = height;
      if (particle.y > height) particle.y = 0;
    });
  };

  // Optimized connection drawing - only check nearby particles
  const drawConnectionsOptimized = (
    ctx: CanvasRenderingContext2D,
    particles: Particle[],
    maxDistance: number,
    maxOpacity: number
  ) => {
    ctx.lineWidth = 3;

    // Use spatial partitioning for better performance
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distanceSquared = dx * dx + dy * dy;
        const maxDistanceSquared = maxDistance * maxDistance;

        // Early exit if too far (using squared distance to avoid sqrt)
        if (distanceSquared > maxDistanceSquared) continue;

        const distance = Math.sqrt(distanceSquared);
        // Calculate opacity based on distance (closer = more opaque)
        const opacity = (1 - distance / maxDistance) * maxOpacity;
        
        // Vary line color slightly based on particle colors
        const colorMix = opacity * 0.8;
        ctx.strokeStyle = `rgba(20, 184, 166, ${colorMix})`;
        
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  };

  // Draw static connections for reduced motion
  const drawStaticConnections = (
    ctx: CanvasRenderingContext2D,
    particles: Particle[],
    maxDistance: number,
    maxOpacity: number
  ) => {
    ctx.strokeStyle = 'rgba(25, 173, 156, 0.86)';
    ctx.lineWidth = 5;

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < maxDistance) {
          const opacity = (1 - distance / maxDistance) * maxOpacity * 0.5;
          ctx.strokeStyle = `rgba(20, 184, 166, ${opacity})`;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
  };

  // Draw particles as dots or triangles
  const drawParticles = (ctx: CanvasRenderingContext2D, particles: Particle[]) => {
    particles.forEach((particle) => {
      ctx.save();
      ctx.translate(particle.x, particle.y);

      if (particle.shape === 'triangle') {
        // Draw triangle
        ctx.rotate(particle.rotation);
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        const size = particle.size * 2;
        ctx.moveTo(0, -size);
        ctx.lineTo(-size * 0.866, size * 0.5);
        ctx.lineTo(size * 0.866, size * 0.5);
        ctx.closePath();
        ctx.fill();
      } else {
        // Draw circle
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Add subtle glow effect
      ctx.shadowBlur = 6;
      ctx.shadowColor = particle.color;
      if (particle.shape === 'triangle') {
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  };

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 -z-10 ${className}`}
      style={{ 
        pointerEvents: 'none',
        imageRendering: 'auto',
      }}
      aria-hidden="true"
    />
  );
}

