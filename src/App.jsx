import { useState, useMemo, memo, useEffect, useRef } from 'react';
import { FaRegEnvelope } from 'react-icons/fa';
import { Sunrise, Sun, Sunset, Moon } from 'lucide-react';
import { motion, useScroll, useSpring, useTransform, useMotionValue, AnimatePresence, useMotionValueEvent } from 'framer-motion';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import AlgoDocs from './AlgoDocs';
import DfaTool from './minimizer/DfaTool';

const AnimatedDFA = () => {
  const transitionProps = { duration: 1.5, delay: 1.5, ease: "easeInOut", repeat: Infinity, repeatType: "reverse", repeatDelay: 2 };

  return (
    <div className="w-full h-full bg-[#0a0a0f] relative overflow-hidden flex items-center justify-center font-bold font-body text-xs md:text-sm">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        
        {/* q0 -> q1 (a) */}
        <motion.path d="M 15 50 L 45 20" stroke="rgba(218,185,255,0.4)" strokeWidth="0.5" fill="none"
          animate={{ d: ["M 15 50 L 45 20", "M 30 50 L 45 20"] }} transition={transitionProps} />
        
        {/* q0 -> q2 (b) -> turns into a loop */}
        <motion.path d="M 15 50 Q 30 65 45 80" stroke="rgba(218,185,255,0.4)" strokeWidth="0.5" fill="none"
          animate={{ d: ["M 15 50 Q 30 65 45 80", "M 30 50 Q 15 75 30 50"] }} transition={transitionProps} />
        
        {/* q1 -> q1 (a) */}
        <path d="M 45 20 C 35 0 55 0 45 20" stroke="rgba(218,185,255,0.4)" strokeWidth="0.5" fill="none" />
        
        {/* q1 -> q3 (b) */}
        <path d="M 45 20 L 80 20" stroke="rgba(218,185,255,0.4)" strokeWidth="0.5" fill="none" />
        
        {/* q2 -> q1 (a) */}
        <motion.path d="M 45 80 L 45 20" stroke="rgba(218,185,255,0.4)" strokeWidth="0.5" fill="none"
          animate={{ d: ["M 45 80 L 45 20", "M 30 50 L 45 20"] }} transition={transitionProps} />
        
        {/* q2 -> q2 (b) -> shifts to be loop on merged state */}
        <motion.path d="M 45 80 C 35 100 55 100 45 80" stroke="rgba(218,185,255,0.4)" strokeWidth="0.5" fill="none"
          animate={{ d: ["M 45 80 C 35 100 55 100 45 80", "M 30 50 C 20 70 40 70 30 50"] }} transition={transitionProps} />
          
        {/* q3 -> q1 (a) */}
        <path d="M 80 20 Q 62.5 0 45 20" stroke="rgba(218,185,255,0.4)" strokeWidth="0.5" fill="none" />
        
        {/* q3 -> q4 (b) */}
        <path d="M 80 20 L 80 80" stroke="rgba(218,185,255,0.4)" strokeWidth="0.5" fill="none" />
        
        {/* q4 -> q1 (a) */}
        <path d="M 80 80 L 45 20" stroke="rgba(218,185,255,0.4)" strokeWidth="0.5" fill="none" />
        
        {/* q4 -> q2 (b) */}
        <motion.path d="M 80 80 L 45 80" stroke="rgba(218,185,255,0.4)" strokeWidth="0.5" fill="none"
          animate={{ d: ["M 80 80 L 45 80", "M 80 80 L 30 50"] }} transition={transitionProps} />

      </svg>
      
      {/* Edge Labels */}
      <motion.div className="absolute text-[#dab9ff] font-bold z-0" animate={{ left: ['28%', '36%'], top: ['32%', '32%'] }} transition={transitionProps}>a</motion.div>
      <motion.div className="absolute text-[#dab9ff] font-bold z-0" animate={{ left: ['28%', '21%'], top: ['65%', '60%'] }} transition={transitionProps}>b</motion.div>
      <div className="absolute text-[#dab9ff] font-bold z-0" style={{ left: '44%', top: '6%' }}>a</div>
      <div className="absolute text-[#dab9ff] font-bold z-0" style={{ left: '62%', top: '16%' }}>b</div>
      <motion.div className="absolute text-[#dab9ff] font-bold z-0" animate={{ left: ['46%', '39%'], top: ['50%', '39%'] }} transition={transitionProps}>a</motion.div>
      <motion.div className="absolute text-[#dab9ff] font-bold z-0" animate={{ left: ['44%', '36%'], top: ['90%', '60%'] }} transition={transitionProps}>b</motion.div>
      <div className="absolute text-[#dab9ff] font-bold z-0" style={{ left: '62%', top: '6%' }}>a</div>
      <div className="absolute text-[#dab9ff] font-bold z-0" style={{ left: '81%', top: '50%' }}>b</div>
      <div className="absolute text-[#dab9ff] font-bold z-0" style={{ left: '55%', top: '45%' }}>a</div>
      <motion.div className="absolute text-[#dab9ff] font-bold z-0" animate={{ left: ['62%', '55%'], top: ['81%', '67%'] }} transition={transitionProps}>b</motion.div>

      {/* Nodes */}
      {/* N0 (q0) -> Start state */}
      <motion.div className="absolute w-[35px] h-[35px] md:w-[45px] md:h-[45px] rounded-full border border-[#dab9ff] bg-[#0a0a0f] text-[#dab9ff] flex items-center justify-center z-10"
        animate={{ left: ['calc(15% - 22.5px)', 'calc(30% - 22.5px)'] }} transition={transitionProps}
        style={{ top: 'calc(50% - 22.5px)' }}>
          {/* Incoming start arrow stays attached */}
          <div className="absolute -left-[30px] border-t border-[#dab9ff] w-[30px]">
             <div className="absolute -right-[2px] -top-[4.5px] border-t-[4px] border-b-[4px] border-l-[6px] border-t-transparent border-b-transparent border-l-[#dab9ff]"></div>
          </div>
          q0
      </motion.div>
      
      {/* N1 (q1) */}
      <div className="absolute w-[35px] h-[35px] md:w-[45px] md:h-[45px] rounded-full border border-[#dab9ff] bg-[#0a0a0f] text-[#dab9ff] flex items-center justify-center z-10 shadow-[0_0_15px_rgba(218,185,255,0.4)]"
        style={{ left: 'calc(45% - 22.5px)', top: 'calc(20% - 22.5px)' }}>q1</div>

      {/* N2 (q2) */}
      <motion.div className="absolute w-[35px] h-[35px] md:w-[45px] md:h-[45px] rounded-full border border-[#dab9ff] bg-[#0a0a0f] text-[#dab9ff] flex items-center justify-center z-10"
        animate={{ left: ['calc(45% - 22.5px)', 'calc(30% - 22.5px)'], top: ['calc(80% - 22.5px)', 'calc(50% - 22.5px)'] }} transition={transitionProps}>q2</motion.div>

      {/* N3 (q3) */}
      <div className="absolute w-[35px] h-[35px] md:w-[45px] md:h-[45px] rounded-full border border-[#dab9ff] bg-[#0a0a0f] text-[#dab9ff] flex items-center justify-center z-10 shadow-[0_0_15px_rgba(218,185,255,0.4)]"
        style={{ left: 'calc(80% - 22.5px)', top: 'calc(20% - 22.5px)' }}>q3</div>

      {/* N4 (q4) - Accept state */}
      <div className="absolute w-[43px] h-[43px] md:w-[55px] md:h-[55px] rounded-full border-[2px] border-[#dab9ff] bg-[#0a0a0f] text-[#dab9ff] flex items-center justify-center z-10 shadow-[0_0_15px_rgba(218,185,255,0.4)]"
        style={{ left: 'calc(80% - 27.5px)', top: 'calc(80% - 27.5px)' }}>
        <div className="w-[33px] h-[33px] md:w-[43px] md:h-[43px] rounded-full border border-[#dab9ff] flex items-center justify-center">q4</div>
      </div>

      <motion.div className="absolute bottom-4 left-0 right-0 text-center text-[10px] md:text-xs uppercase font-bold tracking-widest text-[#dab9ff] z-20 pointer-events-none"
        animate={{ opacity: [1, 0, 1] }} transition={transitionProps}>
        <span className="bg-[#0a0a0f]/90 px-4 py-2 rounded-full border border-[#dab9ff]/40 inline-block shadow-lg">Optimizing: (q0 ≈ q2)</span>
      </motion.div>
    </div>
  );
};

const AnimatedStaircase = () => {
  const steps = [
    [],
    ["0-0", "1-0", "1-1", "3-2", "4-0", "4-1"],
    ["0-0", "1-0", "1-1", "3-2", "4-0", "4-1", "2-0", "2-1", "3-0", "3-1", "4-4"],
    ["0-0", "1-0", "1-1", "3-2", "4-0", "4-1", "2-0", "2-1", "3-0", "3-1", "4-4", "4-2", "4-3", "2-2"]
  ];

  const getTimeline = (row, col) => {
    const id = `${row}-${col}`;
    const timeline = [];
    for (let i = 0; i < steps.length; i++) {
       timeline.push(steps[i].includes(id) ? "rgba(218,185,255,0.4)" : "rgba(255,255,255,0.05)");
    }
    timeline.push("rgba(255,255,255,0.05)");
    return timeline;
  };

  const getOpacityTimeline = (row, col) => {
    const id = `${row}-${col}`;
    const timeline = [];
    for (let i = 0; i < steps.length; i++) {
       timeline.push(steps[i].includes(id) ? 1 : 0);
    }
    timeline.push(0);
    return timeline;
  }

  const rows = ['B', 'C', 'D', 'E', 'F'];
  const cols = ['A', 'B', 'C', 'D', 'E'];

  return (
    <div className="w-full h-full bg-[#0a0a0f] relative flex flex-col items-center justify-center p-6 gap-2 overflow-hidden">
      <div className="flex flex-col relative z-10 scale-90 md:scale-100">
        {rows.map((rowLabel, rIndex) => (
          <div key={`row-${rIndex}`} className="flex items-center">
            <div className="w-6 text-right pr-3 text-white/50 font-bold font-body text-[10px] md:text-xs uppercase">{rowLabel}</div>
            <div className="flex gap-1 mb-1">
              {cols.slice(0, rIndex + 1).map((colLabel, cIndex) => (
                <motion.div 
                  key={`cell-${rIndex}-${cIndex}`}
                  className="w-10 h-10 md:w-12 md:h-12 rounded border border-white/10 flex items-center justify-center text-secondary font-black text-lg shadow-[0_0_10px_rgba(218,185,255,0.1)]"
                  animate={{ backgroundColor: getTimeline(rIndex, cIndex), borderColor: getOpacityTimeline(rIndex, cIndex).map(o => o ? 'rgba(218,185,255,0.4)': 'rgba(255,255,255,0.1)') }}
                  transition={{ duration: 6, ease: "linear", repeat: Infinity }}
                >
                  <motion.span animate={{ opacity: getOpacityTimeline(rIndex, cIndex), scale: getOpacityTimeline(rIndex, cIndex).map(o => o ? 1 : 0.5) }} transition={{ duration: 6, ease: "linear", repeat: Infinity }}>
                    ×
                  </motion.span>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
        {/* X-axis labels */}
        <div className="flex items-center mt-1">
          <div className="w-6 pr-3"></div>
          <div className="flex gap-1">
            {cols.map((colLabel, cIndex) => (
              <div key={`col-${cIndex}`} className="w-10 md:w-12 text-center text-white/50 font-bold font-body text-[10px] md:text-xs uppercase">{colLabel}</div>
            ))}
          </div>
        </div>
      </div>
      
      <motion.div className="absolute bottom-6 left-0 right-0 text-center text-[10px] md:text-xs uppercase font-bold tracking-widest text-[#dab9ff]"
        animate={{ opacity: [1, 1, 1, 0, 0] }}
        transition={{ duration: 6, ease: "linear", repeat: Infinity }}
      >
        <span className="bg-black/80 px-4 py-2 rounded-full border border-[#dab9ff]/40 inline-block shadow-lg">
          Table-Filling Inference
        </span>
      </motion.div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#dab9ff]/5 via-transparent to-transparent pointer-events-none"></div>
    </div>
  )
}


const ExpandableCard = ({ children, className = '', defaultExpanded = false, hoverReveal = false }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <div 
      className={`glass-card ${hoverReveal ? 'group' : 'cursor-pointer'} ${expanded && !hoverReveal ? 'expanded' : ''} ${className}`}
      onClick={() => { if (!hoverReveal) setExpanded(!expanded); }}
    >
      {children}
    </div>
  );
};

const CustomScrollbar = () => {
  const { scrollYProgress } = useScroll();

  // Snappier spring for more responsive node movement
  const smoothProgress = useSpring(scrollYProgress, { damping: 30, stiffness: 200 });

  const colors = ["#4F46E5", "#F59E0B", "#0EA5E9", "#EF4444", "#1E1B4B"];
  const shadowColors = [
    "rgba(79, 70, 229, 0.4)", 
    "rgba(245, 158, 11, 0.4)", 
    "rgba(14, 165, 233, 0.4)", 
    "rgba(239, 68, 68, 0.4)", 
    "rgba(30, 27, 75, 0.4)"
  ];

  const activeColor = useTransform(smoothProgress, [0, 0.25, 0.5, 0.75, 1], colors);
  const activeShadow = useTransform(smoothProgress, [0, 0.25, 0.5, 0.75, 1], shadowColors);

  // Opacity transforms for each icon
  const moon1Opacity = useTransform(smoothProgress, [0, 0.1, 0.2], [1, 1, 0]);
  const sunriseOpacity = useTransform(smoothProgress, [0.1, 0.3, 0.45], [0, 1, 0]);
  const sunOpacity = useTransform(smoothProgress, [0.35, 0.5, 0.65], [0, 1, 0]);
  const sunsetOpacity = useTransform(smoothProgress, [0.55, 0.8, 0.9], [0, 1, 0]);
  const moon2Opacity = useTransform(smoothProgress, [0.8, 0.9, 1], [0, 1, 1]);

  return (
    <div className="fixed right-2 md:right-8 top-[15%] bottom-[15%] w-12 z-50 flex items-center justify-center pointer-events-none hidden md:flex">
      {/* Tracker line container */}
      <div className="relative h-full w-1.5 pt-8 pb-8">
        {/* Background track */}
        <div className="absolute inset-x-0 top-0 bottom-0 bg-white/5 rounded-full z-0 overflow-hidden">
           <motion.div 
             className="absolute top-0 left-0 w-full origin-top"
             style={{ 
               scaleY: smoothProgress, 
               height: '100%',
               backgroundColor: activeColor,
               opacity: 0.3
             }}
           />
        </div>
        
        {/* Animated tracing node */}
        <motion.div 
          className="absolute left-1/2 w-8 h-8 rounded-full z-30 flex items-center justify-center border-2 border-white/20"
          style={{
            top: useTransform(smoothProgress, [0, 1], ['0%', '100%']),
            x: '-50%',
            y: '-50%',
            backgroundColor: activeColor,
            boxShadow: useTransform(activeShadow, s => `0 0 30px ${s}`)
          }}
        >
            <motion.div style={{ position: 'absolute', opacity: moon1Opacity }} className="text-white drop-shadow-md flex items-center justify-center"><Moon size={14} fill="white" /></motion.div>
            <motion.div style={{ position: 'absolute', opacity: sunriseOpacity }} className="text-white drop-shadow-md flex items-center justify-center"><Sunrise size={14} strokeWidth={2.5} /></motion.div>
            <motion.div style={{ position: 'absolute', opacity: sunOpacity }} className="text-white drop-shadow-md flex items-center justify-center"><Sun size={14} fill="white" /></motion.div>
            <motion.div style={{ position: 'absolute', opacity: sunsetOpacity }} className="text-white drop-shadow-md flex items-center justify-center"><Sunset size={14} strokeWidth={2.5} /></motion.div>
            <motion.div style={{ position: 'absolute', opacity: moon2Opacity }} className="text-white drop-shadow-md flex items-center justify-center"><Moon size={14} fill="white" /></motion.div>
        </motion.div>
        
        {/* Waypoint Icons along the track */}
        <div className="absolute inset-0 w-full h-full flex flex-col justify-between items-center pointer-events-none z-10 py-0">
           <div className="flex flex-col items-center justify-between h-full w-full">
              <Moon size={14} className="text-white/20 translate-y-[-50%]" />
              <Sunrise size={14} className="text-white/20" />
              <Sun size={14} className="text-white/20" />
              <Sunset size={14} className="text-white/20" />
              <Moon size={14} className="text-white/20 translate-y-[50%]" />
           </div>
        </div>
      </div>
    </div>
  );
};

const InteractiveParticle = ({ p, mouseX, mouseY }) => {
  const particleX = useMotionValue(0);
  const particleY = useMotionValue(0);
  
  // Smooth springs for the repulsion effect
  const springConfig = { damping: 25, stiffness: 200 };
  const dx = useSpring(0, springConfig);
  const dy = useSpring(0, springConfig);

  useEffect(() => {
    const unsubscribeX = mouseX.on("change", (latestX) => {
      const rect = { left: window.innerWidth * (parseFloat(p.left) / 100), top: window.innerHeight * (parseFloat(p.top) / 100) };
      const dist = Math.sqrt(Math.pow(latestX - rect.left, 2) + Math.pow(mouseY.get() - rect.top, 2));
      
      if (dist < 200) {
        const angle = Math.atan2(rect.top - mouseY.get(), rect.left - latestX);
        const force = (200 - dist) / 200;
        dx.set(Math.cos(angle) * force * 100);
        dy.set(Math.sin(angle) * force * 100);
      } else {
        dx.set(0);
        dy.set(0);
      }
    });

    return () => unsubscribeX();
  }, [mouseX, mouseY, p.left, p.top, dx, dy]);

  return (
    <motion.div
      className="absolute rounded-full bg-[#dab9ff]"
      style={{
        width: p.size,
        height: p.size,
        left: p.left,
        top: p.top,
        opacity: p.opacity,
        x: dx,
        y: dy,
      }}
      animate={{
        translateX: [0, p.floatX, 0],
        translateY: [0, p.floatY, 0],
        opacity: [p.opacity, p.opacity * 0.4, p.opacity],
      }}
      transition={{
        duration: p.duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay: p.delay,
      }}
    />
  );
};


const LandingPage = () => {
    const navigate = useNavigate();
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const scrollToCenter = (e, id) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [mouseX, mouseY]);

    return (
        <>
            <InteractiveBackground mouseX={mouseX} mouseY={mouseY} />
            <CustomScrollbar />
            <main className="pt-8 pb-12 px-6 md:px-12 max-w-7xl mx-auto space-y-16 relative z-10 min-h-screen">
                {/* Hero Section: Asymmetric 2x2 Bento Grid */}
                <section className="flex flex-col gap-6 min-h-[700px]">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 flex-1">
                        {/* Top Left: Logo Symbol */}
                        <ExpandableCard className="md:col-span-2 rounded-[2.5rem] p-10 flex flex-col items-center justify-center overflow-hidden">
                            <motion.h2 
                                animate={{ 
                                    y: [0, -10, 0],
                                    filter: ["drop-shadow(0 0 10px rgba(218,185,255,0.2))", "drop-shadow(0 0 25px rgba(218,185,255,0.6))", "drop-shadow(0 0 10px rgba(218,185,255,0.2))"]
                                }}
                                transition={{ 
                                    duration: 6, 
                                    repeat: Infinity, 
                                    ease: "easeInOut" 
                                }}
                                className="text-5xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-[#dab9ff] via-[#d19fff] to-[#6a1b9a] drop-shadow-[0_0_20px_rgba(218,185,255,0.3)]">
                                Min-Aton
                            </motion.h2>
                        </ExpandableCard>

                        {/* Top Right: "DFA Minimizer" Full Logo */}
                        <ExpandableCard className="md:col-span-3 rounded-[2.5rem] p-10 relative overflow-hidden" hoverReveal={true}>
                            <div className="h-full flex flex-col justify-center pointer-events-none">
                                <h1 className="text-6xl md:text-7xl font-bold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-white via-white/70 to-white/40">DFA Minimizer</h1>
                                <div className="expand-content flex gap-4 w-64 mt-8 pointer-events-auto" onClick={e => e.stopPropagation()}>
                                    <button onClick={(e) => scrollToCenter(e, 'feature-dfa')} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-full text-[10px] uppercase tracking-widest font-bold no-underline text-center flex items-center justify-center">Info</button>
                                    <button onClick={() => navigate('/tool')} className="flex-1 py-3 bg-secondary text-black rounded-full text-[10px] uppercase tracking-widest font-bold shadow-lg shadow-[#dab9ff]/20">Use Tool</button>
                                </div>
                            </div>
                        </ExpandableCard>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 flex-1">
                        {/* Bottom Left: "ALGO DOCS" */}
                        <ExpandableCard className="md:col-span-3 rounded-[2.5rem] p-10 relative overflow-hidden flex flex-col justify-center" hoverReveal={true}>
                            <div className="pointer-events-none">
                                <div>
                                    <h2 className="text-6xl md:text-7xl font-bold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-white via-white/70 to-white/40 uppercase">ALGO DOCS</h2>
                                    <div className="expand-content flex gap-4 mt-8 pointer-events-auto" onClick={e => e.stopPropagation()}>
                                        <button onClick={(e) => scrollToCenter(e, 'feature-docs')} className="px-10 py-3 bg-white/5 border border-white/10 rounded-full text-[10px] uppercase tracking-widest font-bold no-underline inline-block">Details</button>
                                        <Link to="/docs" className="px-10 py-3 bg-secondary text-black rounded-full text-[10px] uppercase tracking-widest font-bold shadow-lg shadow-[#dab9ff]/20 no-underline inline-block text-center">Study</Link>
                                    </div>
                                </div>
                            </div>
                        </ExpandableCard>

                        {/* Bottom Right: Contact Us Link */}
                        <button onClick={(e) => scrollToCenter(e, 'contact')} className="md:col-span-2 glass-card rounded-[2.5rem] p-10 relative overflow-hidden flex flex-col items-center justify-center group hover:border-[#dab9ff]/50 transition-all text-center no-underline cursor-pointer bg-transparent border-white/10">
                            <FaRegEnvelope className="text-6xl text-[#dab9ff]/50 group-hover:text-[#dab9ff] transition-colors mb-6 group-hover:scale-110 duration-500 delay-75" />
                            <h3 className="text-2xl font-bold text-white tracking-tight mb-2">Reach Out</h3>
                            <p className="text-gray-400 font-body text-sm max-w-[200px] mt-2">Drop a line to sync with our system architecture collective.</p>
                        </button>
                    </div>
                </section>

                {/* Slide 2: Detailed Info */}
                <section className="space-y-12 py-12 border-t border-white/5">
                    <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-8">
                        <h2 className="text-5xl font-headline font-black text-[#dab9ff] tracking-tighter uppercase mb-6">System<br/>Architecture</h2>
                        <div className="w-16 h-1.5 bg-[#dab9ff] mb-8 shadow-[0_0_15px_rgba(218,185,255,0.4)]"></div>
                        <p className="text-xl font-body text-gray-400 leading-relaxed">
                            Deploying state-of-the-art computational logic to solve the most complex finite-state problems.
                        </p>
                    </div>

                    {/* DFA Minimizer Details */}
                    <div id="feature-dfa" className="glass-card rounded-3xl p-10 md:p-16 flex flex-col lg:flex-row gap-12 group">
                        <div className="lg:w-1/2">
                            <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 relative shadow-2xl">
                                <AnimatedDFA />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none"></div>
                            </div>
                        </div>
                        <div className="lg:w-1/2 flex flex-col justify-center">
                            <span className="text-secondary font-black text-[10px] tracking-[0.5em] uppercase mb-4">Feature 1</span>
                            <h3 className="text-4xl font-headline font-bold mb-6 text-white tracking-tight">DFA Minimizer</h3>
                            <p className="text-gray-400 leading-relaxed mb-10 text-lg">
                                Our minimization engine utilizes the MyHill-Nerode Theorem through an interactive table-filling approach to identify and merge indistinguishable states, producing a minimal Deterministic Finite Automaton with absolute precision.
                            </p>
                            <div className="flex">
                                <button onClick={() => navigate('/tool')} className="bg-secondary text-black px-10 py-4 rounded-full font-headline font-black uppercase tracking-widest text-sm hover:scale-105 transition-all shadow-[0_15px_45px_rgba(218,185,255,0.3)]">Try It Out</button>
                            </div>
                        </div>
                    </div>

                    {/* Algo Docs Details */}
                    <div id="feature-docs" className="glass-card rounded-3xl p-10 md:p-16 flex flex-col lg:flex-row-reverse gap-12 group">
                        <div className="lg:w-1/2">
                            <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 relative shadow-2xl">
                                <AnimatedStaircase />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none"></div>
                            </div>
                        </div>
                        <div className="lg:w-1/2 flex flex-col justify-center">
                            <span className="text-secondary font-black text-[10px] tracking-[0.5em] uppercase mb-4">Feature 2</span>
                            <h3 className="text-4xl font-headline font-bold mb-6 text-white tracking-tight">Algo Docs</h3>
                            <p className="text-gray-400 leading-relaxed mb-10 text-lg">
                                Comprehensive documentation of the computational theory, table-filling mechanics, and logical proofs governing the MyHill-Nerode minimization process, rendered in high-definition markdown.
                            </p>
                            <div className="flex">
                                <Link to="/docs" className="bg-secondary text-black px-10 py-4 rounded-full font-headline font-black uppercase tracking-widest text-sm hover:scale-105 transition-all shadow-[0_15px_45px_rgba(218,185,255,0.3)] no-underline text-center">Read Docs</Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer CTA */}
                <section className="py-12 relative" id="contact">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-concord-accent rounded-[3.5rem] blur-2xl opacity-10 group-hover:opacity-30 transition duration-1000"></div>
                        <div className="relative glass-card rounded-[3.5rem] p-8 md:p-12 flex flex-col items-center text-center border-white/10 shadow-2xl">
                            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-6 uppercase" style={{textShadow: "0 10px 30px rgba(0,0,0,0.8)"}}>Connect with me</h2>
                            <p className="max-w-2xl text-gray-400 text-lg font-body mb-10 leading-relaxed">I'm open for suggestions and reviews. Please share your thoughts below.</p>
                            
                            <div className="flex flex-col gap-6 w-full max-w-xl">
                                <div className="flex flex-col sm:flex-row gap-6 w-full">
                                    <input className="flex-1 bg-white/5 border-2 border-white/10 rounded-full px-8 py-5 focus:ring-4 focus:ring-secondary/20 focus:border-secondary/40 outline-none text-white font-body transition-all placeholder:text-white/20" placeholder="EMAIL_ADDRESS" type="email"/>
                                </div>
                                <textarea className="w-full bg-white/5 border-2 border-white/10 rounded-3xl px-8 py-5 focus:ring-4 focus:ring-secondary/20 focus:border-secondary/40 outline-none text-white font-body transition-all placeholder:text-white/20 resize-none h-32" placeholder="YOUR_REVIEWS_OR_SUGGESTIONS"></textarea>
                                <button className="w-full bg-secondary text-black px-12 py-5 rounded-full font-headline font-black uppercase tracking-widest text-sm hover:scale-105 transition-all shadow-[0_15px_45px_rgba(218,185,255,0.3)]">Submit</button>
                            </div>
                            
                            <div className="mt-20 text-white/40 font-headline font-black uppercase tracking-[0.6em] text-xs">
                                HARSH KUMAR | 2024UCS1725
                            </div>
                        </div>
                    </div>
                </section>

                {/* Global Footer */}
                <footer className="bg-black border-t border-white/5 w-full relative z-10 py-6">
                    <div className="flex flex-col items-center gap-5 w-full max-w-[1920px] mx-auto">
                        <div className="text-base font-black tracking-tighter text-[#dab9ff] font-headline uppercase">Min-Aton</div>
                        <div className="h-px w-32 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                        <p className="font-body text-[10px] tracking-[0.5em] uppercase text-white/20 font-bold">© 2024 MIN-ATON. ALL RIGHTS RESERVED.</p>
                    </div>
                </footer>
            </main>
        </>
    );
};

export const InteractiveBackground = memo(({ mouseX, mouseY }) => {
    const particles = useMemo(() => {
        return Array.from({ length: 120 }).map((_, i) => ({
            id: i,
            size: Math.random() * 3 + 1.5,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            duration: Math.random() * 15 + 10,
            delay: Math.random() * -20,
            floatX: (Math.random() - 0.5) * 60,
            floatY: (Math.random() - 0.5) * 60,
            opacity: Math.random() * 0.4 + 0.3
        }));
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {particles.map((p) => (
                <InteractiveParticle key={p.id} p={p} mouseX={mouseX} mouseY={mouseY} />
            ))}
        </div>
    );
});

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/docs" element={<AlgoDocs />} />
                <Route path="/tool" element={<DfaTool />} />
            </Routes>
        </Router>
    );
}

export default App;
