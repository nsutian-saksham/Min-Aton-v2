import React, { useState, useMemo, memo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { FaHome, FaInfoCircle, FaTerminal, FaProjectDiagram, FaBolt, FaArrowLeft, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { InteractiveBackground } from './App';

const InteractiveWalkthrough = ({ isDark }) => {
  const [step, setStep] = useState(0);

  const states = ['q0', 'q1', 'q2', 'q3', 'q4'];
  const alphabet = ['a', 'b'];
  const finals = ['q4'];
  
  const transitions = {
    q0: { a: 'q1', b: 'q2' },
    q1: { a: 'q1', b: 'q3' },
    q2: { a: 'q1', b: 'q2' },
    q3: { a: 'q1', b: 'q4' },
    q4: { a: 'q1', b: 'q2' }
  };

  const nodePositions = {
    q0: { x: 100, y: 150 }, q1: { x: 300, y: 70 }, q2: { x: 300, y: 230 },
    q3: { x: 550, y: 70 }, q4: { x: 680, y: 230 }
  };

  const minTransitions = {
    'q0,q2': { a: 'q1', b: 'q0,q2' },
    q1: { a: 'q1', b: 'q3' },
    q3: { a: 'q1', b: 'q4' },
    q4: { a: 'q1', b: 'q0,q2' }
  };

  const minNodePositions = {
    'q0,q2': { x: 100, y: 150 },
    q1: { x: 300, y: 70 },
    q3: { x: 550, y: 70 },
    q4: { x: 680, y: 150 }
  };

  const minimizationSteps = useMemo(() => [
    { title: "Initial System", pair: null, reasoning: "Initializing Myhill-Nerode analysis for q0-q4. Current Partitions: {q0,q1,q2,q3} and {q4}.", marked: [], eval: null },
    // Phase 1: Base Checks (Final vs Non-Final)
    { title: "Base Check", pair: ['q1', 'q0'], reasoning: "Both are non-accepting states. No mark.", marked: [], eval: ['q1', 'q0'] },
    { title: "Base Check", pair: ['q2', 'q0'], reasoning: "Both are non-accepting states. No mark.", marked: [], eval: ['q2', 'q0'] },
    { title: "Base Check", pair: ['q2', 'q1'], reasoning: "Both are non-accepting states. No mark.", marked: [], eval: ['q2', 'q1'] },
    { title: "Base Check", pair: ['q3', 'q0'], reasoning: "Both are non-accepting states. No mark.", marked: [], eval: ['q3', 'q0'] },
    { title: "Base Check", pair: ['q3', 'q1'], reasoning: "Both are non-accepting states. No mark.", marked: [], eval: ['q3', 'q1'] },
    { title: "Base Check", pair: ['q3', 'q2'], reasoning: "Both are non-accepting states. No mark.", marked: [], eval: ['q3', 'q2'] },
    { title: "Base Check", pair: ['q4', 'q0'], reasoning: "q4 is Final, q0 is not. BASE MARK.", marked: ['q0-q4'], eval: ['q4', 'q0'] },
    { title: "Base Check", pair: ['q4', 'q1'], reasoning: "q4 is Final, q1 is not. BASE MARK.", marked: ['q0-q4', 'q1-q4'], eval: ['q4', 'q1'] },
    { title: "Base Check", pair: ['q4', 'q2'], reasoning: "q4 is Final, q2 is not. BASE MARK.", marked: ['q0-q4', 'q1-q4', 'q2-q4'], eval: ['q4', 'q2'] },
    { title: "Base Check", pair: ['q4', 'q3'], reasoning: "q4 is Final, q3 is not. BASE MARK.", marked: ['q0-q4', 'q1-q4', 'q2-q4', 'q3-q4'], eval: ['q4', 'q3'] },
    // Phase 2: Propagation
    { title: "Propagation Pass 1", pair: ['q1', 'q0'], reasoning: "δ(q1,b)=q3, δ(q0,b)=q2. (q3,q2) is currently unmarked.", marked: ['q0-q4', 'q1-q4', 'q2-q4', 'q3-q4'], eval: ['q1', 'q0'] },
    { title: "Propagation Pass 1", pair: ['q2', 'q0'], reasoning: "Identical behavior: δ(q2,a)=q1, δ(q0,a)=q1; δ(q2,b)=q2, δ(q0,b)=q2.", marked: ['q0-q4', 'q1-q4', 'q2-q4', 'q3-q4'], eval: ['q2', 'q0'] },
    { title: "Propagation Pass 1", pair: ['q2', 'q1'], reasoning: "δ(q2,b)=q2, δ(q1,b)=q3. (q2,q3) currently unmarked.", marked: ['q0-q4', 'q1-q4', 'q2-q4', 'q3-q4'], eval: ['q2', 'q1'] },
    { title: "Propagation Pass 1", pair: ['q3', 'q0'], reasoning: "δ(q3,b)=q4, δ(q0,b)=q2. (q4,q2) IS marked. MARK.", marked: ['q0-q4', 'q1-q4', 'q2-q4', 'q3-q4', 'q0-q3'], eval: ['q3', 'q0'] },
    { title: "Propagation Pass 1", pair: ['q3', 'q1'], reasoning: "δ(q3,b)=q4, δ(q1,b)=q3. (q4,q3) IS marked. MARK.", marked: ['q0-q4', 'q1-q4', 'q2-q4', 'q3-q4', 'q0-q3', 'q1-q3'], eval: ['q3', 'q1'] },
    { title: "Propagation Pass 1", pair: ['q3', 'q2'], reasoning: "δ(q3,b)=q4, δ(q2,b)=q2. (q4,q2) IS marked. MARK.", marked: ['q0-q4', 'q1-q4', 'q2-q4', 'q3-q4', 'q0-q3', 'q1-q3', 'q2-q3'], eval: ['q3', 'q2'] },
    // Phase 3: Recursive Refinement
    { title: "Propagation Pass 2", pair: ['q1', 'q0'], reasoning: "δ(q1,b)=q3, δ(q0,b)=q2. (q3,q2) IS marked now. MARK.", marked: ['q0-q4', 'q1-q4', 'q2-q4', 'q3-q4', 'q0-q3', 'q1-q3', 'q2-q3', 'q0-q1'], eval: ['q1', 'q0'] },
    { title: "Propagation Pass 2", pair: ['q2', 'q1'], reasoning: "δ(q2,b)=q2, δ(q1,b)=q3. (q2,q3) IS marked now. MARK.", marked: ['q0-q4', 'q1-q4', 'q2-q4', 'q3-q4', 'q0-q3', 'q1-q3', 'q2-q3', 'q0-q1', 'q1-q2'], eval: ['q2', 'q1'] },
    { title: "Convergence", pair: null, reasoning: "No more marking possible. (q2,q0) remain indistinguishable.", marked: ['q0-q4', 'q1-q4', 'q2-q4', 'q3-q4', 'q0-q3', 'q1-q3', 'q2-q3', 'q0-q1', 'q1-q2'], eval: null },
    { title: "Conclusion", pair: null, reasoning: "Minimal result achieved. States {q0, q2} have been merged into a single state.", marked: ['q0-q4', 'q1-q4', 'q2-q4', 'q3-q4', 'q0-q3', 'q1-q3', 'q2-q3', 'q0-q1', 'q1-q2'], eval: null, isFinal: true },
    
    // Phase 4: Minimality Check (On Minimized DFA)
    { title: "Minimality Check", pair: null, reasoning: "Phase 2: Verifying the new DFA. Current states: {q0,q2}, {q1}, {q3}, {q4}.", marked: [], eval: null, isCheck: true },
    { title: "Base Check (Min)", pair: ['q4', 'q0,q2'], reasoning: "q4 is Final, {q0,q2} is not. BASE MARK.", marked: ['q0,q2-q4'], eval: ['q4', 'q0,q2'], isCheck: true },
    { title: "Base Check (Min)", pair: ['q4', 'q1'], reasoning: "q4 is Final, q1 is not. BASE MARK.", marked: ['q0,q2-q4', 'q1-q4'], eval: ['q4', 'q1'], isCheck: true },
    { title: "Base Check (Min)", pair: ['q4', 'q3'], reasoning: "q4 is Final, q3 is not. BASE MARK.", marked: ['q0,q2-q4', 'q1-q4', 'q3-q4'], eval: ['q4', 'q3'], isCheck: true },
    { title: "Propagation (Min)", pair: ['q3', 'q0,q2'], reasoning: "δ(q3,b)=q4, δ(q0,q2,b)=q0,q2. (q4,q0,q2) IS marked. MARK.", marked: ['q0,q2-q4', 'q1-q4', 'q3-q4', 'q0,q2-q3'], eval: ['q3', 'q0,q2'], isCheck: true },
    { title: "Propagation (Min)", pair: ['q3', 'q1'], reasoning: "δ(q3,b)=q4, δ(q1,b)=q3. (q4,q3) IS marked. MARK.", marked: ['q0,q2-q4', 'q1-q4', 'q3-q4', 'q0,q2-q3', 'q1-q3'], eval: ['q3', 'q1'], isCheck: true },
    { title: "Propagation (Min)", pair: ['q1', 'q0,q2'], reasoning: "δ(q1,b)=q3, δ(q0,q2,b)=q0,q2. (q3,q0,q2) IS marked now. MARK.", marked: ['q0,q2-q4', 'q1-q4', 'q3-q4', 'q0,q2-q3', 'q1-q3', 'q0,q2-q1'], eval: ['q1', 'q0,q2'], isCheck: true },
    { title: "Verified Finality", pair: null, reasoning: "All pairs in the minimized DFA are distinguished. Minimality proven.", marked: ['q0,q2-q4', 'q1-q4', 'q3-q4', 'q0,q2-q3', 'q1-q3', 'q0,q2-q1'], eval: null, isCheck: true, isVerified: true }
  ], []);

  const current = minimizationSteps[Math.min(step, minimizationSteps.length-1)];
  const isConclusion = current.isFinal || current.isCheck;
  const activeTransitions = isConclusion ? minTransitions : transitions;
  const activePositions = isConclusion ? minNodePositions : nodePositions;

  return (
    <div className="space-y-6">
      {/* Upper Half: Interactive DFA (Full Width) */}
      <div className="glass-card rounded-[2.5rem] p-10 flex flex-col gap-8 relative overflow-hidden h-[450px] border border-white/10 shadow-3xl bg-black">
        <div className="flex justify-between items-center relative z-10">
           <div className="space-y-1">
             <h4 className="text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
               {current.title}
             </h4>
             <p className="text-[10px] text-zinc-500 font-mono tracking-tighter uppercase font-bold">Step {step + 1} // Cycle Visualization</p>
           </div>
           <div className="flex gap-4">
             <button onClick={() => setStep(s => Math.max(0, s-1))} disabled={step === 0} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 disabled:opacity-30 border border-white/5 hover:bg-white/10 transition-all text-white"><FaChevronLeft size={16} /></button>
             <button onClick={() => setStep(s => Math.min(minimizationSteps.length-1, s+1))} disabled={step === minimizationSteps.length-1} className="px-6 h-10 flex items-center justify-center rounded-full bg-secondary text-black font-black uppercase tracking-widest text-[10px] disabled:opacity-30 hover:shadow-[0_0_20px_rgba(218,185,255,0.4)] transition-all">Next Match</button>
           </div>
        </div>

        <div className="flex-1 bg-black/60 rounded-[2rem] border border-white/5 relative overflow-hidden">
          <svg viewBox="0 0 800 300" className="w-full h-full p-4">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
              </marker>
            </defs>
            {/* Edges */}
            {Object.entries(activeTransitions).map(([src, trans]) => 
              Object.entries(trans).map(([sym, tgt]) => {
                const sp = activePositions[src], tp = activePositions[tgt];
                const dx = tp.x - sp.x, dy = tp.y - sp.y, len = Math.hypot(dx, dy);
                const isEvaluating = current.eval && (current.eval.includes(src));
                const labelX = sp.x + dx/2, labelY = sp.y + dy/2;

                if (src === tgt) {
                  return (
                    <g key={`${src}-${sym}`}>
                      <path d={`M ${sp.x-10} ${sp.y-25} C ${sp.x-30} ${sp.y-60} ${sp.x+30} ${sp.y-60} ${sp.x+10} ${sp.y-25}`} fill="none" stroke={isEvaluating ? "#dab9ff" : "rgba(218,185,255,0.15)"} strokeWidth={isEvaluating ? 2.5 : 1} markerEnd="url(#arrowhead)" />
                      <text x={sp.x} y={sp.y-65} textAnchor="middle" fill="#dab9ff" fontSize={14} fontWeight={900} style={{ fontFamily: 'Inter, system-ui' }}>{sym}</text>
                    </g>
                  );
                }
                
                const sx = sp.x + (dx/len)*30, sy = sp.y + (dy/len)*30;
                const tx = tp.x - (dx/len)*35, ty = tp.y - (dy/len)*35;
                
                return (
                  <g key={`${src}-${tgt}-${sym}`}>
                    <line x1={sx} y1={sy} x2={tx} y2={ty} stroke={isEvaluating ? "#dab9ff" : "rgba(218,185,255,0.15)"} strokeWidth={isEvaluating ? 2.5 : 1} markerEnd="url(#arrowhead)" />
                    <text x={labelX + (dy/len)*18} y={labelY - (dx/len)*18} textAnchor="middle" fill="#dab9ff" fontSize={14} fontWeight={900} style={{ fontFamily: 'Inter, system-ui' }}>{sym}</text>
                  </g>
                );
              })
            )}
            {/* Nodes */}
            {Object.entries(activePositions).map(([id, pos]) => {
              const isChecking = current.eval && current.eval.includes(id);
              const isFinal = id === 'q4';
              return (
                <g key={id} transform={`translate(${pos.x}, ${pos.y})`}>
                  <circle r={id.includes(',') ? 35 : 28} fill="#0a0a0f" stroke={isChecking ? '#dab9ff' : (isFinal ? 'rgba(218,185,255,0.8)' : 'rgba(218,185,255,0.25)')} strokeWidth={isChecking ? 4 : (isFinal ? 3 : 1.5)} />
                  {isFinal && <circle r={22} fill="none" stroke="#dab9ff" strokeWidth={1} opacity={0.8} />}
                  {isChecking && <circle r={id.includes(',') ? 42 : 36} fill="none" stroke="#dab9ff" strokeWidth={1} strokeDasharray="6 4" className="animate-spin-slow" />}
                  <text textAnchor="middle" dy=".35em" fill="white" fontSize={id.includes(',') ? 12 : 16} fontWeight={900} style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>{id}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Bottom Half: Reasoning and Matrix */}
      <div className="grid lg:grid-cols-2 gap-8 h-[450px]">
        {/* Left Part: Reasoning Journal */}
        <div className="glass-card rounded-[2.5rem] p-8 flex flex-col border border-white/5 bg-black/40 overflow-hidden">
          <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
            <FaTerminal className="text-secondary text-sm" />
            <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white">Logic Journal</span>
          </div>
          <div className="flex-1 space-y-4">
             <div className="p-6 rounded-3xl bg-secondary/5 border border-secondary/20 min-h-[120px] flex flex-col justify-center">
                <p className="text-[10px] text-secondary font-black uppercase tracking-widest mb-3">Current Evaluation</p>
                <p className="text-lg text-white font-medium leading-relaxed tracking-tight group font-headline">
                  {current.pair ? `Evaluating (${current.eval[0]}, ${current.eval[1]})` : 'Theorem Termination'}
                  <span className="block mt-2 text-zinc-400 text-sm font-normal normal-case font-body">{current.reasoning}</span>
                </p>
             </div>
             <div className="mt-8 space-y-2">
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Algorithm Status</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${current.isCheck ? 'bg-green-400 animate-pulse' : (step > 11 ? 'bg-orange-400 animate-pulse' : 'bg-[#dab9ff]')}`} />
                  <span className="text-xs text-zinc-400 font-mono tracking-tighter uppercase">{current.isCheck ? 'Minimality Verification' : (step > 11 ? 'Recursive Pass' : 'Base Condition Check')}</span>
                </div>
             </div>
          </div>
        </div>

        {/* Right Part: Staircase Matrix */}
        <div className="glass-card rounded-[2.5rem] p-8 flex flex-col items-start justify-center border border-white/10 bg-black/20 overflow-hidden pl-12">
          <div className="text-center mb-8 relative w-full pl-0 flex flex-col items-start">
            <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-1">Staircase Matrix (Left-Oriented)</h5>
            <div className="h-0.5 w-8 bg-secondary/40"></div>
          </div>
          <div className="flex flex-col gap-1.5 items-start">
            {(current.isCheck ? ['q1', 'q3', 'q4'] : ['q1', 'q2', 'q3', 'q4']).map((row, rIdx) => (
              <div key={row} className="flex gap-1.5 items-center">
                <span className="w-8 text-right text-zinc-600 font-bold text-[10px] pr-3 font-mono">{row}</span>
                {(current.isCheck ? ['q0,q2', 'q1', 'q3'] : ['q0', 'q1', 'q2', 'q3']).slice(0, rIdx + 1).map((col) => {
                  const key = `${col}-${row}`;
                  const isMarked = current.marked.includes(key);
                  const isBeingChecked = current.eval && ((current.eval[0] === col && current.eval[1] === row) || (current.eval[0] === row && current.eval[1] === col));
                  
                  return (
                    <div 
                      key={key} 
                      className={`w-10 h-10 md:w-11 md:h-11 rounded-lg flex items-center justify-center transition-all duration-300 border-2 ${
                        isBeingChecked ? 'border-secondary bg-secondary/20 shadow-[0_0_15px_rgba(218,185,255,0.3)] z-10 scale-105' :
                        isMarked 
                          ? 'bg-secondary border-secondary/60 text-black font-black' 
                          : 'bg-white/5 border-zinc-500/80 text-transparent opacity-40'
                      }`}
                    >
                      <span className="text-sm">×</span>
                    </div>
                  );
                })}
              </div>
            ))}
            <div className="flex gap-1.5 mt-3 pl-11">
              {(current.isCheck ? ['q0,q2', 'q1', 'q3'] : ['q0', 'q1', 'q2', 'q3']).map(col => (
                <div key={col} className="w-10 md:w-11 text-center text-zinc-600 font-bold text-[10px] font-mono">{col}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



const AlgoDocs = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('intro');
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e) => {
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  // Sync section highlight on scroll
  // Sync section highlight on window scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['intro', 'concepts', 'theorem', 'algorithm', 'example'];
      let bestSection = sections[0];
      
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          // Check position relative to the top of the viewport
          const elTop = el.getBoundingClientRect().top;
          // Threshold of 120px from top of window
          if (elTop <= 120) {
            bestSection = id;
          } else {
            break; 
          }
        }
      }
      setActiveSection(bestSection);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      // Calculate absolute position on the page
      const elTop = el.getBoundingClientRect().top;
      const targetScroll = window.scrollY + elTop - 100;
      
      window.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });
      
      setActiveSection(id);
    }
  };

  const navItems = [
    { id: 'intro', label: 'Introduction', icon: <FaInfoCircle /> },
    { id: 'concepts', label: 'DFA Concepts', icon: <FaTerminal /> },
    { id: 'theorem', label: 'The Theorem', icon: <FaProjectDiagram /> },
    { id: 'algorithm', label: 'The Algorithm', icon: <FaBolt /> },
    { id: 'example', label: 'Walkthrough', icon: <FaTerminal /> },
  ];

  const TableHeader = ({ children }) => (
    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[#dab9ff]/70 border-b border-white/5 bg-white/2">{children}</th>
  );

  const TableCell = ({ children }) => (
    <td className="px-6 py-4 text-sm text-gray-400 border-b border-white/5">{children}</td>
  );

  return (
    <div className="flex min-h-screen bg-black text-[#e5e1e4] font-body relative overflow-hidden">
      <InteractiveBackground mouseX={mouseX} mouseY={mouseY} />
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? '320px' : '0px' }}
        className="h-screen fixed top-0 left-0 border-r border-white/5 flex flex-col pt-8 space-y-2 bg-[#131315] z-50 overflow-hidden shadow-2xl shrink-0"
      >
        <div className="px-8 mb-10 flex justify-between items-center whitespace-nowrap min-w-[320px]">
          <div>
            <h3 className="text-secondary font-black font-headline uppercase tracking-widest text-xs">Algo Docs</h3>
            <p className="text-zinc-500 text-[10px] mt-1 font-mono">v3.0.0-GOLD</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-2 text-zinc-400 hover:text-white transition-colors">
            <FaChevronLeft size={16} />
          </button>
        </div>

        <nav className="flex flex-col space-y-1 px-4 min-w-[320px]">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`flex items-center gap-4 px-6 py-4 rounded-xl transition-all font-medium text-sm whitespace-nowrap ${
                activeSection === item.id 
                  ? 'text-secondary bg-secondary/10 border-l-4 border-secondary' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
              }`}
            >
              <span className="text-lg opacity-80">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto p-8 whitespace-nowrap min-w-[320px]">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-3 w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-headline font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all active:scale-[0.98]"
          >
            <FaArrowLeft /> Back to Home
          </button>
        </div>
      </motion.aside>

      <AnimatePresence>
        {!isSidebarOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setSidebarOpen(true)}
            className="fixed bottom-8 left-8 z-[60] w-14 h-14 bg-secondary flex items-center justify-center rounded-2xl text-black shadow-2xl hover:scale-110 active:scale-95 transition-all"
          >
            <FaChevronRight size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={`flex-1 px-4 py-16 md:px-16 z-10 transition-all duration-300 ${isSidebarOpen ? 'ml-[320px]' : 'ml-0'}`}>
        <div className="max-w-4xl mx-auto space-y-24 pb-32">
          
          <header className="text-center space-y-6 mb-32">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block px-5 py-2 rounded-full border border-secondary/20 bg-secondary/5 text-secondary text-[10px] font-black tracking-[0.3em] uppercase mb-4"
            >
              Theory & Application
            </motion.div>
            <h1 className="text-6xl md:text-8xl font-headline font-black tracking-tighter text-white leading-none">
              DFA <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary via-white to-secondary animate-pulse">Minimization</span>
            </h1>
            <p className="text-xl text-zinc-400 font-light max-w-2xl mx-auto leading-relaxed">
              Optimizing finite state machines through Partition Refinement. An implementation of the Myhill-Nerode Theorem for redundant state elimination.
            </p>
          </header>

          <section id="intro" className="space-y-12 scroll-mt-32">
            <div className="glass-card p-12 rounded-[2.5rem] relative overflow-hidden group">
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-secondary/10 blur-[100px] rounded-full group-hover:bg-secondary/20 transition-all duration-1000"></div>
              <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
                <div className="flex-1 space-y-6">
                  <h2 className="text-4xl font-headline font-black text-secondary uppercase tracking-tight">Introduction</h2>
                  <p className="text-gray-300 leading-relaxed text-lg">
                    Deterministic Finite Automata (DFA) are abstract machines that read a string of symbols and decide whether to accept or reject it based on a set of states and transitions and final states. 
                  </p>
                  <p className="text-gray-400 leading-relaxed">
                    Sometimes DFA has some unnecessary states while converting from NFA and we need to minimize the DFA to find the smallest DFA that recognizes the same language as a given DFA. In this chapter, we will see the table filling method which is known as <strong>Myhill-Nerode Theorem</strong> for minimizing DFAs.
                  </p>
                </div>
                <div className="w-full md:w-48 aspect-square rounded-3xl bg-black border border-secondary/20 flex items-center justify-center p-6 shadow-2xl">
                  <FaProjectDiagram className="text-6xl text-secondary animate-pulse" />
                </div>
              </div>
            </div>
          </section>

          <section id="concepts" className="space-y-12 scroll-mt-32">
            <div className="flex flex-col items-center text-center space-y-4">
              <h2 className="text-4xl font-headline font-black text-white uppercase tracking-tighter">Concepts of DFA Minimization</h2>
              <div className="w-20 h-1.5 bg-secondary rounded-full shadow-[0_0_15px_rgba(218,185,255,0.5)]"></div>
            </div>
            
            <p className="text-gray-400 text-center text-lg max-w-2xl mx-auto italic mb-12">
              "Suppose we have a DFA with many states, possibly redundant. A minimized DFA, recognizing the same language with fewer states, offers several advantages."
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: 'Simplicity', desc: 'Easier to understand and visualize the behavior of the automaton.', icon: '01' },
                { title: 'Efficiency', desc: 'Less memory and processing power required to implement the DFA.', icon: '02' },
                { title: 'Optimization', desc: 'Improved performance in applications using the minimized DFA.', icon: '03' }
              ].map((item) => (
                <div key={item.title} className="glass-card p-8 rounded-3xl border border-white/5 hover:border-secondary/30 transition-all group">
                  <span className="text-4xl font-black text-white/5 group-hover:text-secondary/10 transition-colors">{item.icon}</span>
                  <h3 className="text-xl font-bold text-white mb-3 mt-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="theorem" className="space-y-12 scroll-mt-32">
            <div className="glass-card p-12 rounded-[2.5rem] border-l-8 border-secondary">
                <h2 className="text-4xl font-headline font-black text-white mb-8">MyHill-Nerode Theorem</h2>
                <div className="space-y-6 text-gray-300 text-lg leading-relaxed">
                  <p>
                    The theorem states that a language <span className="text-secondary font-black">L</span> is regular if <span className="text-secondary font-black">L~</span> (L~ is relation on strings x and y, where no distinguishable extension for x and y) has a finite number of equivalence classes.
                  </p>
                  <p>
                    If this number is <span className="text-secondary font-black">N</span>, then there are <span className="text-secondary font-black">N</span> states in a minimal Deterministic Finite Automaton (DFA) recognizing L.
                  </p>
                </div>
            </div>
          </section>

          <section id="algorithm" className="space-y-12 scroll-mt-32">
            <h2 className="text-4xl font-headline font-black text-center uppercase tracking-tighter mb-12">The Step-by-Step Algorithm</h2>
            <div className="space-y-4">
              {[
                "Create a table with all possible pairs of states (q0, q1), (q1, q2) etc.",
                "Mark all pairs where one state is final and the other is not (Base Case).",
                "For unmarked pairs (p, q), if δ(p, a) and δ(q, a) is a marked pair for any input 'a', mark (p, q).",
                "Repeat the propagation until no more pairs can be marked.",
                "Identify all unmarked pairs as equivalent and merge them into a single state.",
                "Perform a Minimality Check by running the algorithm again on the new DFA to confirm no further reductions are possible."
              ].map((step, i) => (
                <div key={i} className="flex gap-6 p-6 glass-card rounded-2xl border border-white/5 hover:bg-white/5 transition-all">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary text-black flex items-center justify-center font-black">{i + 1}</div>
                  <p className="text-gray-400 self-center">{step}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="example" className="space-y-12 scroll-mt-32">
            <div className="flex flex-col items-center text-center space-y-4 mb-8">
              <h2 className="text-4xl font-headline font-black text-white uppercase tracking-tighter">Interactive Walkthrough</h2>
              <div className="w-20 h-1.5 bg-secondary rounded-full shadow-[0_0_15px_rgba(218,185,255,0.5)]"></div>
              <p className="text-zinc-500 max-w-xl mx-auto mt-4 font-body">Explore the Myhill-Nerode theorem in action. Step through the transition table to see how equivalent states are identified and merged.</p>
            </div>
            <InteractiveWalkthrough isDark={true} />
          </section>
        </div>
      </main>
    </div>
  );
};

export default AlgoDocs;
