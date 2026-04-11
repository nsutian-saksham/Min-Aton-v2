import { useState, useCallback, useMemo, useEffect, createContext, useContext, memo } from "react";
import { Sun, Moon, Edit3, History, TrendingDown, Trash2, CheckCircle2 } from 'lucide-react';

// ─── Theme Context ────────────────────────────────────────────────────────────
const ThemeContext = createContext();
const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    try { return localStorage.getItem("color-theme") || "light"; } catch { return "light"; }
  });
  const setTheme = (t) => {
    setThemeState(t);
    try { localStorage.setItem("color-theme", t); } catch {}
  };
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
};
const useTheme = () => useContext(ThemeContext);

const lightTheme = {
  primary: '#7D4F50',
  secondary: '#CC8B86',
  background: '#F9EAE1',
  surface: '#FFFFFF',
  subtle: '#D1BE9C',
  text: '#2B2B2B',
  textSecondary: '#AA998F',
  success: '#4CAF50',
  error: '#E53935',
  warning: '#F59E0B',
  info: '#3B82F6',
  btnGradient: 'linear-gradient(135deg, #7D4F50, #CC8B86)'
};

// ─── useDFA Hook ──────────────────────────────────────────────────────────────
const initialNodes = [
  { id: "q0", data: { label: "q0", isInitial: true, isFinal: false, isDead: false }, x: 120, y: 200 },
];
const useDFA = () => {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState([]);
  const [alphabet, setAlphabet] = useState(["0", "1"]);
  const [minStep, setMinStep] = useState(-1);

  const toggleFinal = (nodeId) =>
    setNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, isFinal: !n.data.isFinal } } : n));

  const addState = useCallback(() => {
    const existing = nodes.map((n) => parseInt(n.id.replace("q", ""))).filter((x) => !isNaN(x));
    const nextId = existing.length > 0 ? Math.max(...existing) + 1 : 1;
    const id = `q${nextId}`;

    let bestPos = { x: 120 + Math.random() * 350, y: 80 + Math.random() * 280 };
    if (nodes.length > 0) {
      let maxMinDist = -1;
      for (let i = 0; i < 50; i++) {
        const cx = 80 + Math.random() * 450;
        const cy = 60 + Math.random() * 300;
        let minDist = Infinity;
        nodes.forEach((n) => {
          const dist = Math.hypot(n.x - cx, n.y - cy);
          if (dist < minDist) minDist = dist;
        });
        if (minDist > maxMinDist) {
          maxMinDist = minDist;
          bestPos = { x: cx, y: cy };
        }
      }
    }
    setNodes((nds) => [...nds, { id, data: { label: id, isInitial: false, isFinal: false, isDead: false }, ...bestPos }]);
  }, [nodes]);

  const toggleDead = (nodeId) => {
    setNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, isDead: !n.data.isDead, isFinal: false } } : n));
    // If setting to dead, point all outgoing edges to self
    const isNowDead = !nodes.find(n => n.id === nodeId).data.isDead;
    if (isNowDead) {
      setEdges(eds => {
        const filtered = eds.filter(e => e.source !== nodeId);
        const newSelfEdges = alphabet.map(sym => ({ id: `e-${nodeId}-${sym}`, source: nodeId, target: nodeId, label: sym }));
        return [...filtered, ...newSelfEdges];
      });
    }
  };

  const removeState = (nodeId) => {
    if (nodes.find((n) => n.id === nodeId)?.data.isInitial) return;
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
  };

  const resetMachine = () => { setNodes(initialNodes); setEdges([]); setAlphabet(["0", "1"]); setMinStep(-1); };
  const addAlphabet = () => {
    const next = String.fromCharCode(97 + alphabet.length);
    if (!alphabet.includes(next)) setAlphabet([...alphabet, next]);
  };
  const updateAlphabet = (old, nw) => {
    if (alphabet.includes(nw)) return;
    setAlphabet(alphabet.map((s) => (s === old ? nw : s)));
    setEdges(edges.map((e) => (e.label === old ? { ...e, label: nw } : e)));
  };
  const removeAlphabet = (sym) => { setAlphabet(alphabet.filter((s) => s !== sym)); setEdges(edges.filter((e) => e.label !== sym)); };
  
  const updateNodeLabel = (nodeId, newLabel) => {
    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, label: newLabel } } : n));
  };

  return { nodes, edges, alphabet, minStep, setNodes, setEdges, setMinStep, toggleFinal, toggleDead, addState, removeState, resetMachine, addAlphabet, updateAlphabet, removeAlphabet, updateNodeLabel };
};

// ─── useMinimization Hook ─────────────────────────────────────────────────────
const useMinimization = (propNodes, propEdges, alphabet) => {
  const { rNodes: nodes, rEdges: edges, unreachable } = useMemo(() => {
    const initialNode = propNodes.find(n => n.data.isInitial);
    if (!initialNode) return { rNodes: [], rEdges: [], unreachable: [] };
    let reachable = new Set([initialNode.id]);
    let queue = [initialNode.id];
    while(queue.length > 0) {
      const curr = queue.shift();
      const transitions = propEdges.filter(e => e.source === curr);
      for(const t of transitions) {
        if(!reachable.has(t.target)) {
          reachable.add(t.target);
          queue.push(t.target);
        }
      }
    }
    const rNodes = propNodes.filter(n => reachable.has(n.id));
    const rEdges = propEdges.filter(e => reachable.has(e.source));

    let needsDead = false;
    for (const n of rNodes) {
      for (const sym of alphabet) {
        if (!rEdges.some(e => e.source === n.id && e.label === sym)) {
          needsDead = true;
          break;
        }
      }
      if (needsDead) break;
    }

    if (needsDead) {
      const deadNode = { id: "DEAD", data: { isInitial: false, isFinal: false, isDead: true, label: "DEAD" } };
      const newEdges = [...rEdges];
      rNodes.forEach(n => {
        alphabet.forEach(sym => {
          if (!rEdges.some(e => e.source === n.id && e.label === sym)) {
            newEdges.push({ source: n.id, target: "DEAD", label: sym });
          }
        });
      });
      alphabet.forEach(sym => newEdges.push({ source: "DEAD", target: "DEAD", label: sym }));
      return { rNodes: [...rNodes, deadNode], rEdges: newEdges, unreachable: propNodes.filter(n => !reachable.has(n.id)) };
    }

    return { 
      rNodes, 
      rEdges, 
      unreachable: propNodes.filter(n => !reachable.has(n.id)) 
    };
  }, [propNodes, propEdges, alphabet]);

  const [currentStep, setCurrentStep] = useState(-1);
  const [markedPairs, setMarkedPairs] = useState(new Set());
  const [reasoning, setReasoning] = useState("Press 'Minimize' to begin the algorithm.");
  const [stepHistory, setStepHistory] = useState([]);
  const [minimizedDFA, setMinimizedDFA] = useState(null);
  
  const [evalIndex, setEvalIndex] = useState(0); 
  const [changedInPass, setChangedInPass] = useState(false);
  const [passCount, setPassCount] = useState(1);
  const [evaluatingPair, setEvaluatingPair] = useState(null);

  const pairs = useMemo(() => {
    const p = [];
    for (let i = 1; i < nodes.length; i++)
      for (let j = 0; j < i; j++) p.push([nodes[i].id, nodes[j].id].sort());
    return p;
  }, [nodes]);

  const getPairKey = (p1, p2) => [p1, p2].sort().join("-");

  const startMinimization = () => { 
    if (nodes.length === 0) {
      setReasoning("Error: Cannot start without an initial state.");
      return;
    }
    setCurrentStep(0); 
    setEvalIndex(0);
    setChangedInPass(false);
    setPassCount(1);
    setEvaluatingPair(null);
    setMarkedPairs(new Set()); 
    setMinimizedDFA(null); 
    const msg = "Initializing exhaustive state analysis. Ready to mark base reachable partitions."; 
    const log = [];
    if(unreachable.length > 0) {
       log.push(`Pre-Step: Removed unreachable states from algorithm: {${unreachable.map(n => n.id).join(", ")}}`);
    }
    log.push(msg);
    setReasoning(log[0]); 
    setStepHistory(log); 
  };

  const nextStep = () => {
    if (currentStep === 0) {
      const init = new Set();
      pairs.forEach(([p1, p2]) => {
        const n1 = nodes.find((n) => n.id === p1);
        const n2 = nodes.find((n) => n.id === p2);
        if (n1.data.isFinal !== n2.data.isFinal) init.add(getPairKey(p1, p2));
      });
      setMarkedPairs(init);
      setCurrentStep(1);
      setEvalIndex(0);
      setChangedInPass(false);
      setPassCount(1);
      setEvaluatingPair(null);
      const msg = `Base Step: Separated Final, Dead, and Regular states. (${init.size} pairs distinguished)`;
      setReasoning(msg);
      setStepHistory(s => [...s, msg]);
      return;
    }
    if (currentStep === 888) { finalizeMinimization(markedPairs); return; }

    const nm = new Set(markedPairs);
    let i = evalIndex;
    while (i < pairs.length) {
       const [p1, p2] = pairs[i];
       if (nm.has(getPairKey(p1, p2))) {
          i++;
       } else {
          break;
       }
    }

    if (i >= pairs.length) {
       setEvaluatingPair(null);
       if (changedInPass) {
          const msg = `Pass ${passCount} complete. Some states were distinguished. Starting Pass ${passCount + 1}...`;
          setReasoning(msg); setStepHistory(s => [...s, msg]);
          setEvalIndex(0);
          setChangedInPass(false);
          setPassCount(pc => pc + 1);
          setCurrentStep(s => s + 1);
       } else {
          const msg = `Pass ${passCount} complete. No new pairs distinguished. Convergence Reached! Ready to merge equivalent classes.`;
          setReasoning(msg); setStepHistory(s => [...s, msg]);
          setCurrentStep(888);
       }
       return;
    }

    const [p1, p2] = pairs[i];
    let newlyMarked = false;
    let evalLog = [];
    
    const getLabel = (id) => nodes.find(n => n.id === id)?.data.label || id;
    const l1 = getLabel(p1), l2 = getLabel(p2);
    
    for (const sym of alphabet) {
       let t1 = edges.find(e => e.source === p1 && e.label === sym)?.target;
       let t2 = edges.find(e => e.source === p2 && e.label === sym)?.target;
       
       if (!t1) t1 = "DEAD";
       if (!t2) t2 = "DEAD";
       
       const lt1 = getLabel(t1), lt2 = getLabel(t2);
       
       if (t1 !== t2 && nm.has(getPairKey(t1, t2))) {
          newlyMarked = true;
          evalLog.push({ sym, tgt: `{${lt1}, ${lt2}}`, status: "Marked" });
          nm.add(getPairKey(p1, p2));
          break;
       } else {
          if (t1 === t2) {
             evalLog.push({ sym, tgt: `{${lt1}}`, status: "Same State" });
          } else {
             evalLog.push({ sym, tgt: `{${lt1}, ${lt2}}`, status: "Unmarked" });
          }
       }
    }

    setEvaluatingPair(getPairKey(p1, p2));
    
    if (newlyMarked) {
       setMarkedPairs(nm);
       setChangedInPass(true);
    }
    
    const explanationObj = {
       type: "evaluation",
       pass: passCount,
       pair: `{${l1}, ${l2}}`,
       evals: evalLog,
       isMarked: newlyMarked,
       result: newlyMarked ? "Distinguished! Marked ✕" : "Not distinguished yet",
       raw: `Pass ${passCount}: Checking {${l1}, ${l2}}... ${newlyMarked ? "MARKED!" : "Not distinguished."}`
    };

    setReasoning(explanationObj);
    setStepHistory(s => [...s, explanationObj]);
    setEvalIndex(i + 1);
    setCurrentStep(s => s + 1);
  };

  const finalizeMinimization = (fm) => {
    const parent = {};
    nodes.forEach((n) => (parent[n.id] = n.id));
    const find = (i) => { if (parent[i] === i) return i; parent[i] = find(parent[i]); return parent[i]; };
    const union = (i, j) => { const ri = find(i), rj = find(j); if (ri !== rj) parent[ri] = rj; };
    pairs.forEach(([p1, p2]) => { if (!fm.has(getPairKey(p1, p2))) union(p1, p2); });
    const groups = {};
    nodes.forEach((n) => { const r = find(n.id); if (!groups[r]) groups[r] = []; groups[r].push(n.id); });
    const newStates = Object.values(groups).map((members) => {
      const isDead = members.some((m) => nodes.find((n) => n.id === m).data.isDead);
      const isInitial = members.some((m) => nodes.find((n) => n.id === m).data.isInitial);
      const isFinal = members.some((m) => nodes.find((n) => n.id === m).data.isFinal);
      const label = isDead ? "DEAD" : members.map(m => nodes.find(n => n.id === m).data.label).sort().join(",");
      return { 
        id: members.sort().join(","), 
        data: { label, isInitial, isFinal, isDead },
        members 
      };
    });
    const newTransitions = [], seen = new Set();
    newStates.forEach((s) => {
      alphabet.forEach((sym) => {
        const rep = s.members[0];
        const tid = edges.find((e) => e.source === rep && e.label === sym)?.target;
        if (tid) {
          const tRoot = find(tid);
          const tGroup = Object.values(groups).find((g) => g.includes(tRoot)).sort().join(",");
          const tk = `${s.id}-${sym}-${tGroup}`;
          if (!seen.has(tk)) { newTransitions.push({ source: s.id, target: tGroup, label: sym }); seen.add(tk); }
        }
      });
    });
    setMinimizedDFA({ states: newStates, transitions: newTransitions });
    setCurrentStep(999);
  };

  const reductionPercentage = useMemo(() => {
    if (currentStep < 0) return 0;
    if (!minimizedDFA) return Math.min((markedPairs.size / (pairs.length || 1)) * 40, 40);
    return Math.floor(((propNodes.length - minimizedDFA.states.length) / Math.max(propNodes.length, 1)) * 100);
  }, [currentStep, minimizedDFA, propNodes, pairs, markedPairs]);

  const getMinPairKey = (p1, p2) => [p1, p2].sort().join("-");
  const minimizedStaircase = useMemo(() => {
    if (!minimizedDFA) return null;
    const mNodes = minimizedDFA.states;
    const mEdges = minimizedDFA.transitions;
    const mPairs = [];
    for (let i = 1; i < mNodes.length; i++)
      for (let j = 0; j < i; j++) mPairs.push([mNodes[i].id, mNodes[j].id].sort());

    let mMarked = new Set();
    mPairs.forEach(([p1, p2]) => {
      const n1 = mNodes.find(n => n.id === p1);
      const n2 = mNodes.find(n => n.id === p2);
      if (n1.data.isFinal !== n2.data.isFinal) mMarked.add(getMinPairKey(p1, p2));
    });

    let changed = true;
    while(changed) {
      changed = false;
      for (const [p1, p2] of mPairs) {
        const key = getMinPairKey(p1, p2);
        if (mMarked.has(key)) continue;
        for (const sym of alphabet) {
          const t1 = mEdges.find(e => e.source === p1 && e.label === sym)?.target;
          const t2 = mEdges.find(e => e.source === p2 && e.label === sym)?.target;
          if (t1 && t2 && t1 !== t2 && mMarked.has(getMinPairKey(t1, t2))) {
            mMarked.add(key); changed = true; break;
          }
        }
      }
    }
    return { nodes: mNodes, markedPairs: mMarked, getPairKey: getMinPairKey };
  }, [minimizedDFA, alphabet]);

  const resetMinimization = () => { setCurrentStep(-1); setEvalIndex(0); setChangedInPass(false); setPassCount(1); setEvaluatingPair(null); setMarkedPairs(new Set()); setMinimizedDFA(null); setReasoning("Analysis reset. Adjust machine or restart minimization."); setStepHistory([]); };

  return { currentStep, markedPairs, reasoning, stepHistory, reductionPercentage, minimizedDFA, minimizedStaircase, startMinimization, nextStep, resetMinimization, getPairKey, workingNodes: nodes, workingEdges: edges, evaluatingPair };
};

// ─── SVG Canvas ───────────────────────────────────────────────────────────────
const DFACanvas = ({ nodes, edges, onNodeClick, isAlgorithmMode, highlightedNodes, evaluatingNodes, isDark, isComplete, theme }) => {
  const isEditorial = theme === "editorial";
  const [dragging, setDragging] = useState(null);
  const [positions, setPositions] = useState({});

  const getPos = (n) => ({ x: positions[n.id]?.x ?? n.x, y: positions[n.id]?.y ?? n.y });

  const commonRadius = useMemo(() => {
    let maxLen = 0;
    nodes.forEach(n => { maxLen = Math.max(maxLen, (n.data?.label || "").length); });
    const base = Math.max(25, maxLen * 5.5 + 4);
    return isComplete ? Math.round(base * 0.8) : base;
  }, [nodes, isComplete]);

  const biPairs = useMemo(() => {
    const pairs = new Set();
    edges.forEach(e1 => {
      const reverse = edges.find(e2 => e2.source === e1.target && e2.target === e1.source && e1.source !== e2.source);
      if (reverse) pairs.add([e1.source, e1.target].sort().join("|"));
    });
    return pairs;
  }, [edges]);

  const handleMouseDown = (e, nodeId) => {
    if (isAlgorithmMode && !isComplete) return;
    e.stopPropagation();
    const svg = e.currentTarget.closest("svg");
    const rect = svg.getBoundingClientRect();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    setDragging({ id: nodeId, ox: e.clientX - rect.left - getPos(node).x, oy: e.clientY - rect.top - getPos(node).y });
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const rawX = e.clientX - rect.left - dragging.ox;
    const rawY = e.clientY - rect.top - dragging.oy;
    const pad = commonRadius + 15;
    const x = Math.max(pad, Math.min(rect.width - pad, rawX));
    const y = Math.max(pad, Math.min(460 - pad, rawY));
    setPositions((p) => ({ ...p, [dragging.id]: { x, y } }));
  };

  const handleMouseUp = () => setDragging(null);

  const getEdgePath = (src, tgt) => {
    const sp = getPos(src), tp = getPos(tgt);
    const trim = commonRadius + 5;

    if (src.id === tgt.id) {
      const otherPoints = nodes.filter(n => n.id !== src.id).map(n => getPos(n));
      let dxSum = 0, dySum = 0;
      otherPoints.forEach(p => {
        const dlen = Math.hypot(p.x - sp.x, p.y - sp.y) || 1;
        if (dlen < 250) { dxSum += (p.x - sp.x) / dlen; dySum += (p.y - sp.y) / dlen; }
      });
      const angle = otherPoints.length > 0 ? Math.atan2(-dySum, -dxSum) : -Math.PI / 2;
      const sAngle1 = angle - Math.PI / 5, sAngle2 = angle + Math.PI / 5;
      const x1 = sp.x + Math.cos(sAngle1) * commonRadius, y1 = sp.y + Math.sin(sAngle1) * commonRadius;
      const x2 = sp.x + Math.cos(sAngle2) * commonRadius, y2 = sp.y + Math.sin(sAngle2) * commonRadius;
      const cp1x = sp.x + Math.cos(sAngle1) * (commonRadius + 55), cp1y = sp.y + Math.sin(sAngle1) * (commonRadius + 55);
      const cp2x = sp.x + Math.cos(sAngle2) * (commonRadius + 55), cp2y = sp.y + Math.sin(sAngle2) * (commonRadius + 55);
      return `M ${x1} ${y1} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${x2} ${y2}`;
    }

    const dx = tp.x - sp.x, dy = tp.y - sp.y, len = Math.hypot(dx, dy) || 1;
    const isBi = biPairs.has([src.id, tgt.id].sort().join("|"));

    if (!isBi) {
      const srcX = sp.x + (dx / len) * commonRadius, srcY = sp.y + (dy / len) * commonRadius;
      const tgtX = tp.x - (dx / len) * trim, tgtY = tp.y - (dy / len) * trim;
      return `M ${srcX} ${srcY} L ${tgtX} ${tgtY}`;
    }

    const isForward = src.id < tgt.id;
    const curveSide = isForward ? 1 : -1;
    const canonSrc = isForward ? sp : tp;
    const canonTgt = isForward ? tp : sp;
    const cdx = canonTgt.x - canonSrc.x, cdy = canonTgt.y - canonSrc.y;
    const clen = Math.hypot(cdx, cdy) || 1;
    const cperpX = -cdy / clen, cperpY = cdx / clen;
    const offset = 40 * curveSide;
    const mx = (sp.x + tp.x) / 2 + cperpX * offset;
    const my = (sp.y + tp.y) / 2 + cperpY * offset;
    const outDirX = mx - sp.x, outDirY = my - sp.y;
    const outLen = Math.hypot(outDirX, outDirY) || 1;
    const srcX = sp.x + (outDirX / outLen) * commonRadius, srcY = sp.y + (outDirY / outLen) * commonRadius;
    const inDirX = tp.x - mx, inDirY = tp.y - my;
    const inLen = Math.hypot(inDirX, inDirY) || 1;
    const tgtX = tp.x - (inDirX / inLen) * trim, tgtY = tp.y - (inDirY / inLen) * trim;
    return `M ${srcX} ${srcY} Q ${mx} ${my} ${tgtX} ${tgtY}`;
  };

  const getLabelPos = (src, tgt) => {
    const sp = getPos(src), tp = getPos(tgt);
    if (src.id === tgt.id) {
      const otherPoints = nodes.filter(n => n.id !== src.id).map(n => getPos(n));
      let dxSum = 0, dySum = 0;
      otherPoints.forEach(p => {
        const dlen = Math.hypot(p.x - sp.x, p.y - sp.y) || 1;
        if (dlen < 250) { dxSum += (p.x - sp.x) / dlen; dySum += (p.y - sp.y) / dlen; }
      });
      const angle = otherPoints.length > 0 ? Math.atan2(-dySum, -dxSum) : -Math.PI / 2;
      return { x: sp.x + Math.cos(angle) * (commonRadius + 58), y: sp.y + Math.sin(angle) * (commonRadius + 58) };
    }
    const dx = tp.x - sp.x, dy = tp.y - sp.y, len = Math.hypot(dx, dy) || 1;
    const isBi = biPairs.has([src.id, tgt.id].sort().join("|"));
    if (!isBi) {
      const perpX = -dy / len, perpY = dx / len;
      return { x: (sp.x + tp.x) / 2 + perpX * 18, y: (sp.y + tp.y) / 2 + perpY * 18 };
    }
    const isForward = src.id < tgt.id;
    const canonSrc = isForward ? sp : tp;
    const canonTgt = isForward ? tp : sp;
    const cdx = canonTgt.x - canonSrc.x, cdy = canonTgt.y - canonSrc.y;
    const clen = Math.hypot(cdx, cdy) || 1;
    const cperpX = -cdy / clen, cperpY = cdx / clen;
    const curveSide = isForward ? 1 : -1;
    const labelOffset = (40 + 20) * curveSide;
    return { x: (sp.x + tp.x) / 2 + cperpX * labelOffset, y: (sp.y + tp.y) / 2 + cperpY * labelOffset };
  };

  const mergedHash = {};
  edges.forEach((e) => { 
      const k = `${e.source}|${e.target}`; 
      if (!mergedHash[k]) mergedHash[k] = { source: e.source, target: e.target, labels: [] };
      mergedHash[k].labels.push(e.label);
  });
  const edgeGroups = Object.values(mergedHash).map(v => ({ id: `m-${v.source}-${v.target}`, source: v.source, target: v.target, label: v.labels.join(", ") }));

  const bg = isDark ? "#000000" : "#FDF6F4";
  const dot = isDark ? "rgba(218,185,255,0.06)" : "rgba(125,79,80,0.08)";
  const nodeStroke = isDark ? "#dab9ff" : lightTheme.primary;
  const nodeFill = isDark ? "#0a0a0f" : lightTheme.surface;
  const textFill = isDark ? "#e5e1e4" : lightTheme.text;
  const edgeColor = isDark ? "#dab9ff" : lightTheme.primary;
  const canvasBorder = isDark ? "rgba(218,185,255,0.15)" : "rgba(0,0,0,0.07)";
  const canvasBgClass = isDark ? "linear-gradient(180deg, rgba(10,10,15,1), rgba(0,0,0,1))" : bg;

  return (
    <div style={{ width: "100%", height: 460, borderRadius: 24, overflow: "hidden", border: `1px solid ${canvasBorder}`, background: canvasBgClass, position: "relative" }}>
      <div style={{ position: "absolute", top: 12, left: 16, zIndex: 10, display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: isDark ? "#dab9ff" : "#dab9ff", animation: "pulse 2s infinite" }} />
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)" }}>Diagram View v3.0</span>
      </div>

      <svg width="100%" height="100%" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} style={{ cursor: dragging ? "grabbing" : "default" }}>
        <defs>
          <marker id="arrow" markerWidth="12" markerHeight="12" refX="9" refY="6" orient="auto">
            <path d="M2,2 L9,6 L2,10" fill="none" stroke={edgeColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
          <pattern id="dots" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="15" cy="15" r="1" fill={dot} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />

        {edgeGroups.map((edge) => {
            const src = nodes.find((n) => n.id === edge.source);
            const tgt = nodes.find((n) => n.id === edge.target);
            if (!src || !tgt) return null;
            const path = getEdgePath(src, tgt);
            const lp = getLabelPos(src, tgt);
            const labelW = edge.label.length * 8 + 12;
            return (
              <g key={edge.id}>
                <path d={path} fill="none" stroke={edgeColor} strokeWidth={1.6} markerEnd="url(#arrow)" opacity={0.6} />
                <g transform={`translate(${lp.x}, ${lp.y})`}>
                  <rect x={-labelW / 2} y="-11" width={labelW} height="22" rx="6" fill={bg} opacity={0.92} />
                  <text textAnchor="middle" dominantBaseline="middle" fill={edgeColor} fontSize={11} fontWeight={800} style={{ fontStyle: "italic" }}>{edge.label}</text>
                </g>
              </g>
            );
        })}

        {nodes.map((node) => {
          const p = getPos(node);
          const isHL = highlightedNodes?.includes(node.id);
          const isEval = evaluatingNodes?.includes(node.id);
          let fillColor = nodeFill;
          let strokeColor = nodeStroke;
          let strokeW = node.data.isFinal ? 2.5 : 1.5;
          let filterStyle = {};
          if (node.data.isDead) { fillColor = isDark ? "#121212" : "#F4E4DB"; }
          if (isEval) {
            fillColor = isDark ? "rgba(251,191,36,0.18)" : "rgba(251,191,36,0.22)";
            strokeColor = "#f59e0b";
            strokeW = 2.5;
            filterStyle = { filter: "drop-shadow(0 0 8px #f59e0b)" };
          }
          if (isHL) {
            fillColor = isDark ? "rgba(126,240,226,0.15)" : "#CC8B8640";
            strokeColor = "#ef4444";
            strokeW = 2.5;
            filterStyle = { filter: "drop-shadow(0 0 6px #ef4444)" };
          }
          return (
            <g key={node.id} transform={`translate(${p.x},${p.y})`} style={{ cursor: (isAlgorithmMode && !isComplete) ? "default" : "grab" }}
              onMouseDown={(e) => handleMouseDown(e, node.id)}
              onClick={() => (!isAlgorithmMode || isComplete) && onNodeClick(node.id)}>
              {node.data.isInitial && <g><line x1={-(commonRadius + 24)} y1={0} x2={-commonRadius} y2={0} stroke={nodeStroke} strokeWidth={2} /><polygon points={`-${commonRadius + 2},0 -${commonRadius + 10},-5 -${commonRadius + 10},5`} fill={nodeStroke} /></g>}
              {isEval && <circle r={commonRadius + 8} fill="none" stroke="#f59e0b" strokeWidth={1.5} opacity={0.4} style={{ animation: "pulse 1s infinite" }} />}
              <circle r={commonRadius} fill={fillColor} stroke={strokeColor} strokeWidth={strokeW} style={filterStyle} />
              {node.data.isFinal && <circle r={commonRadius - 6} fill="none" stroke={strokeColor} strokeWidth={1.2} />}
              <text textAnchor="middle" dominantBaseline="middle" fill={node.data.isDead ? (isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.3)") : textFill} fontSize={13} fontWeight={700} style={{ fontFamily: "sans-serif" }}>{node.data.label}</text>
              {isEval && <text y={-(commonRadius + 14)} textAnchor="middle" fill="#f59e0b" fontSize={9} fontWeight={700} style={{ fontFamily: "sans-serif", textTransform: "uppercase" }}>comparing</text>}
              {node.data.isFinal && <text y={commonRadius + 10} textAnchor="middle" fill={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)"} fontSize={9} fontWeight={700} style={{ fontFamily: "sans-serif", textTransform: "uppercase" }}>FINAL</text>}
              {node.data.isDead && <text y={commonRadius + 10} textAnchor="middle" fill={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)"} fontSize={9} fontWeight={700} style={{ fontFamily: "sans-serif", textTransform: "uppercase" }}>DEAD</text>}
            </g>
          );
        })}
      </svg>

      {(!isAlgorithmMode || isComplete) && (
        <div style={{ position: "absolute", bottom: 12, right: 16, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)", background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", padding: "6px 12px", borderRadius: 12 }}>
          {isComplete ? "Rearrange results as needed" : "Click state to toggle final"}
        </div>
      )}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
};

// ─── Transition Table ─────────────────────────────────────────────────────────
const TransitionTable = ({ nodes, edges, alphabet, setEdges, isAlgorithmMode, addState, removeState, addAlphabet, updateAlphabet, removeAlphabet, toggleFinal, toggleDead, updateNodeLabel, isDark, theme }) => {
  const bg = isDark ? "rgba(10,10,15,0.8)" : "#fff";
  const borderCol = isDark ? "rgba(218,185,255,0.1)" : "rgba(0,0,0,0.06)";
  const textCol = isDark ? "#e5e1e4" : "#111";

  const handleChange = (fromId, sym, toId) => {
    if (isAlgorithmMode) return;
    setEdges((prev) => {
      const filtered = prev.filter((e) => !(e.source === fromId && e.label === sym));
      if (!toId) return filtered;
      return [...filtered, { id: `e-${fromId}-${sym}`, source: fromId, target: toId, label: sym }];
    });
  };

  const cell = { padding: "10px 16px", borderBottom: `1px solid ${borderCol}` };
  const hdr = { ...cell, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: isDark ? "rgba(218,185,255,0.7)" : "rgba(0,0,0,0.4)", background: isDark ? "rgba(218,185,255,0.05)" : "rgba(0,0,0,0.02)" };

  return (
    <div style={{ borderRadius: 20, border: `1px solid ${borderCol}`, overflow: "hidden", background: bg, backdropFilter: "blur(10px)" }}>
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${borderCol}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: textCol }}>Transition Delta Table</span>
        <div style={{ display: "flex", gap: 8 }}>
          {!isAlgorithmMode && (
            <button onClick={addAlphabet} style={{ fontSize: 11, padding: "5px 12px", borderRadius: 8, border: "none", background: isDark ? "rgba(218,185,255,0.15)" : "rgba(218,185,255,0.1)", color: isDark ? "#dab9ff" : "#dab9ff", fontWeight: 700, cursor: "pointer" }}>+ Symbol</button>
          )}
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={hdr}>State</th>
              {alphabet.map((sym, i) => (
                <th key={i} style={hdr}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input value={sym} onChange={(e) => updateAlphabet(sym, e.target.value)} disabled={isAlgorithmMode}
                      style={{ width: 32, background: "transparent", border: "none", fontWeight: 700, fontSize: 10, letterSpacing: "0.2em", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", outline: "none" }} />
                    {!isAlgorithmMode && <button onClick={() => removeAlphabet(sym)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 12, lineHeight: 1 }}>✕</button>}
                  </div>
                </th>
              ))}
              <th style={hdr}>Status</th>
            </tr>
          </thead>
          <tbody>
            {nodes.map((node) => (
              <tr key={node.id} style={{ background: "transparent" }}>
                <td style={{ ...cell, fontFamily: "monospace", fontWeight: 700, color: isDark ? "#dab9ff" : "#dab9ff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input 
                      value={node.data.label} 
                      onChange={(e) => updateNodeLabel(node.id, e.target.value.toUpperCase())}
                      disabled={isAlgorithmMode}
                      style={{ width: 44, background: "transparent", border: "none", color: "inherit", fontWeight: 800, outline: "none" }}
                    />
                    {!isAlgorithmMode && !node.data.isInitial && (
                      <button onClick={() => removeState(node.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", display: "flex", alignItems: "center" }}>
                        <Trash2 size={13} strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                </td>
                {alphabet.map((sym, i) => {
                  const dst = edges.find((e) => e.source === node.id && e.label === sym)?.target || "";
                  return (
                    <td key={i} style={cell}>
                      <select value={dst} onChange={(e) => handleChange(node.id, sym, e.target.value)} disabled={isAlgorithmMode}
                        style={{ background: isDark ? "#131313" : "#f3f4f6", border: "none", borderRadius: 8, padding: "5px 10px", fontFamily: "monospace", fontSize: 12, color: isDark ? "#fff" : "#111", width: 80, cursor: "pointer" }}>
                        <option value="">—</option>
                        {nodes.map((n) => <option key={n.id} value={n.id}>{n.data.label}</option>)}
                      </select>
                    </td>
                  );
                })}
                <td style={cell}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {node.data.isInitial && <span style={{ fontSize: 9, padding: "3px 8px", borderRadius: 6, background: isDark ? "rgba(218,185,255,0.15)" : "rgba(218,185,255,0.1)", color: isDark ? "#dab9ff" : "#dab9ff", fontWeight: 700, letterSpacing: "0.1em" }}>START</span>}
                    <button onClick={() => toggleFinal(node.id)} style={{ border: "none", background: "none", cursor: "pointer", padding: 0 }}>
                      <span style={{ fontSize: 9, padding: "3px 8px", borderRadius: 6, opacity: node.data.isFinal ? 1 : 0.3, background: isDark ? "rgba(218,185,255,0.15)" : "rgba(218,185,255,0.2)", color: isDark ? "#dab9ff" : "#dab9ff", fontWeight: 700, letterSpacing: "0.1em" }}>FINAL</span>
                    </button>
                    <button onClick={() => toggleDead(node.id)} style={{ border: "none", background: "none", cursor: "pointer", padding: 0 }}>
                      <span style={{ fontSize: 9, padding: "3px 8px", borderRadius: 6, opacity: node.data.isDead ? 1 : 0.3, background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)", color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)", fontWeight: 700, letterSpacing: "0.1em" }}>DEAD</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!isAlgorithmMode && (
        <div style={{ padding: "12px", textAlign: "center", borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}` }}>
          <button onClick={addState} style={{ fontSize: 11, fontWeight: 700, background: "none", border: "none", cursor: "pointer", color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.4)", textTransform: "uppercase", letterSpacing: "0.15em" }}>+ Add State Row</button>
        </div>
      )}
    </div>
  );
};

// ─── Staircase Grid ───────────────────────────────────────────────────────────
const StaircaseGrid = ({ nodes, markedPairs, getPairKey, isDark, onToggleStaircase, showMinimizedStaircase, isComplete, evaluatingPair, theme }) => {
  if (nodes.length < 2) return null;
  const rows = nodes.slice(1), cols = nodes.slice(0, nodes.length - 1);
  const accent = isDark ? "#dab9ff" : lightTheme.primary;
  const bg = isDark ? "rgba(10,10,15,0.8)" : lightTheme.surface;
  const border = isDark ? "rgba(218,185,255,0.15)" : "rgba(125,79,80,0.15)";
  
  return (
    <div style={{ borderRadius: 20, border: `1px solid ${border}`, padding: 20, background: bg, backdropFilter: "blur(10px)", boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 8px 30px rgba(125,79,80,0.05)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 3, height: 20, borderRadius: 2, background: accent }} />
          <span style={{ fontWeight: 300, fontSize: 15, color: isDark ? "#fff" : lightTheme.text }}>Staircase Grid</span>
        </div>
        {isComplete && onToggleStaircase ? (
          <div style={{ display: "flex", gap: 4, background: isDark ? "rgba(255,255,255,0.05)" : "#F9EAE1", padding: 4, borderRadius: 8 }}>
            <button onClick={() => onToggleStaircase(false)} style={{ border: "none", background: !showMinimizedStaircase ? (isDark ? "rgba(255,255,255,0.1)" : lightTheme.subtle) : "transparent", color: !showMinimizedStaircase ? (isDark ? "#fff" : lightTheme.primary) : (isDark ? "rgba(255,255,255,0.4)" : lightTheme.textSecondary), padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontSize: 10, fontWeight: 300, transition: "all 0.2s" }}>Original</button>
            <button onClick={() => onToggleStaircase(true)} style={{ border: "none", background: showMinimizedStaircase ? (isDark ? "rgba(218,185,255,0.15)" : lightTheme.secondary + "40") : "transparent", color: showMinimizedStaircase ? (isDark ? "#dab9ff" : lightTheme.primary) : (isDark ? "rgba(255,255,255,0.4)" : lightTheme.textSecondary), padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontSize: 10, fontWeight: 300, transition: "all 0.2s" }}>Verified</button>
          </div>
        ) : (
          <span style={{ fontSize: 9, padding: "3px 8px", borderRadius: 6, background: isDark ? "rgba(218,185,255,0.15)" : lightTheme.subtle + "40", color: isDark ? "#dab9ff" : lightTheme.primary, fontWeight: 300, letterSpacing: "0.1em", textTransform: "uppercase" }}>Myhill-Nerode</span>
        )}
      </div>
      <div style={{ overflowX: "auto" }}>
        {rows.map((rowNode, i) => (
          <div key={rowNode.id} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
            <span style={{ width: 28, fontSize: 10, fontFamily: "monospace", fontWeight: 700, color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)", textAlign: "right" }}>{rowNode.data.label}</span>
            <div style={{ display: "flex", gap: 4 }}>
              {cols.slice(0, i + 1).map((colNode) => {
                const isMarked = markedPairs.has(getPairKey(rowNode.id, colNode.id));
                const isChecking = evaluatingPair === getPairKey(rowNode.id, colNode.id);
                const cellBg = isChecking ? (isDark ? "rgba(218,185,255,0.25)" : lightTheme.secondary + "40") : (isMarked ? (isDark ? "rgba(239,68,68,0.12)" : "rgba(229,57,53,0.1)") : (isDark ? "rgba(255,255,255,0.03)" : "rgba(125,79,80,0.04)"));
                const cellBorder = isChecking ? (isDark ? "#dab9ff" : lightTheme.primary) : (isMarked ? "#ef4444" : isDark ? "rgba(255,255,255,0.08)" : "rgba(125,79,80,0.08)");
                const cellBoxShadow = isChecking ? `0 0 16px ${isDark ? "rgba(218,185,255,0.4)" : lightTheme.secondary + "60"}` : "none";
                const cellZIndex = isChecking ? 10 : 1;
                
                return (
                  <div key={colNode.id} title={`${rowNode.data.label}, ${colNode.data.label}`} style={{ position: "relative", zIndex: cellZIndex, width: 36, height: 36, borderRadius: 8, border: `1px solid ${cellBorder}`, background: cellBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: isMarked ? "#ef4444" : "transparent", boxShadow: cellBoxShadow, transition: "all 0.3s" }}>
                    {isMarked ? "✕" : ""}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div style={{ display: "flex", gap: 4, marginTop: 4, marginLeft: 32 }}>
          {cols.map((c) => <span key={c.id} style={{ width: 36, textAlign: "center", fontSize: 10, fontFamily: "monospace", fontWeight: 700, color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}>{c.data.label}</span>)}
        </div>
      </div>
      <p style={{ fontSize: 10, color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.35)", marginTop: 12, fontStyle: "italic", lineHeight: 1.5 }}>Cells marked ✕ are distinguishable. Unmarked pairs will be merged.</p>
    </div>
  );
};

// ─── Logic Walkthrough ────────────────────────────────────────────────────────
const LogicWalkthrough = ({ currentStep, reasoning, isAlgorithmMode, isDark, theme }) => {
  const isComplete = currentStep === 999;
  const accent = isDark ? "#dab9ff" : lightTheme.primary;
  const bg = isDark ? "rgba(10,10,15,0.8)" : lightTheme.surface;
  const border = isDark ? "rgba(218,185,255,0.15)" : "rgba(125,79,80,0.15)";
  const textCol = isDark ? "#fff" : lightTheme.text;

  return (
    <div style={{ borderRadius: 20, border: `1px solid ${border}`, padding: 24, background: bg, display: "flex", flexDirection: "column", minHeight: 200, boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 8px 30px rgba(125,79,80,0.05)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <span style={{ fontWeight: 300, fontSize: 17, color: textCol, textTransform: "uppercase", letterSpacing: "-0.02em" }}>Logic Walkthrough</span>
      </div>

      <div style={{ flex: 1 }}>
        {isAlgorithmMode ? (
          <div style={{ padding: 16, borderRadius: 12, border: `1px solid ${`${accent}25`}`, background: `${accent}08` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: accent, animation: isComplete ? "none" : "pulse 2s infinite" }} />
              <span style={{ fontSize: 10, fontWeight: 300, letterSpacing: "0.2em", textTransform: "uppercase", color: accent, display: "flex", alignItems: "center", gap: 6 }}>
                {isComplete ? <>DFA Minimized <CheckCircle2 size={12} strokeWidth={3} /></> : `Phase: Marking Pair #${currentStep}`}
              </span>
            </div>
            {typeof reasoning === "string" ? (
              <p style={{ fontSize: 13, color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)", lineHeight: 1.6, margin: 0, fontWeight: 300 }}>{reasoning}</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <p style={{ margin: 0, fontWeight: 700, color: isDark ? "#fff" : "#111", fontSize: 13 }}>Pass {reasoning.pass}: Checking {reasoning.pair}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {reasoning.evals.map((e, i) => (
                     <div key={i} style={{ display: "flex", gap: 10, fontSize: 13, color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)", alignItems: "center" }}>
                        <span style={{ fontWeight: 400 }}>δ({reasoning.pair}, <strong style={{color: accent}}>'{e.sym}'</strong>)</span>
                        <span style={{ fontSize: 14 }}>➔</span>
                        <span style={{ fontWeight: 400 }}>{e.tgt}</span>
                        <span style={{ color: e.status === "Marked" ? "#ef4444" : (isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"), fontWeight: e.status === "Marked" ? 700 : 300, fontSize: 11, textTransform: "uppercase" }}>
                          ({e.status})
                        </span>
                     </div>
                  ))}
                </div>
                <div style={{ marginTop: 8, padding: "10px 14px", borderRadius: 10, background: reasoning.isMarked ? "rgba(239,68,68,0.12)" : (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"), color: reasoning.isMarked ? "#ef4444" : (isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)"), fontWeight: 700, fontSize: 12, border: `1px solid ${reasoning.isMarked ? "rgba(239,68,68,0.3)" : "transparent"}` }}>
                   Result: {reasoning.result}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: 16, borderRadius: 12, border: `1px dashed ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}` }}>
            <p style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", lineHeight: 1.6, margin: 0, fontWeight: 300, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Edit mode: Add states and transitions. Ready for Myhill-Nerode reduction?
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Complexity Reduction ─────────────────────────────────────────────────────
const ComplexityReduction = ({ reduction, isDark, theme }) => {
  const accent = isDark ? "#dab9ff" : lightTheme.primary;
  const bg = isDark ? "rgba(10,10,15,0.8)" : "#fff";
  const textCol = isDark ? "#fff" : "#111";

  return (
    <div style={{ borderRadius: 20, border: `1px solid ${accent}20`, padding: 22, background: bg, backdropFilter: "blur(10px)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: `${accent}15`, display: "flex", alignItems: "center", justifyContent: "center", color: accent }}><TrendingDown size={16} strokeWidth={2.5} /></div>
        <span style={{ fontWeight: 800, fontSize: 14, color: accent, textTransform: "uppercase", letterSpacing: "0.05em" }}>Complexity Savings</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 44, fontWeight: 900, color: textCol, letterSpacing: "-0.04em", transition: "all 1s" }}>{reduction}%</span>
        <span style={{ fontSize: 11, color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.35)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Reduction in states</span>
      </div>
      <div style={{ height: 8, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${reduction}%`, background: `linear-gradient(90deg, ${accent}, #6a1b9a)`, borderRadius: 8, transition: "width 1s ease-out" }} />
      </div>
    </div>
  );
};

// ─── Top Nav ──────────────────────────────────────────────────────────────────
const TopNavBar = ({ toggleSidebar, isDark, setTheme, theme }) => {
  const bg = isDark ? "rgba(10,10,15,0.85)" : "rgba(249,234,225,0.85)";
  const border = isDark ? "rgba(218,185,255,0.15)" : "rgba(125,79,80,0.1)";
  const accent = isDark ? "#dab9ff" : lightTheme.primary;
  const nextTheme = theme === "light" ? "dark" : "light";
  
  return (
    <nav style={{ position: "fixed", top: 0, width: "100%", zIndex: 50, background: bg, backdropFilter: "blur(20px)", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", height: 60 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <button onClick={toggleSidebar} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: isDark ? "rgba(255,255,255,0.5)" : lightTheme.primary, padding: 4 }}>☰</button>
        <span style={{ fontSize: 20, fontWeight: 300, color: accent, letterSpacing: "-0.04em" }}>Min-Aton {isDark && <span style={{fontSize:10, padding:"2px 6px", background:"rgba(218,185,255,0.1)", borderRadius:4, marginLeft:8}}>v3.0</span>}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => setTheme(nextTheme)} title={`Switch to ${nextTheme} mode`} style={{ background: "none", border: "none", cursor: "pointer", color: isDark ? "rgba(255,255,255,0.6)" : lightTheme.primary, display: "flex", alignItems: "center" }}>
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: isDark ? "rgba(218,185,255,0.1)" : "rgba(125,79,80,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 300, color: accent }}>U</div>
      </div>
    </nav>
  );
};

// ─── Side Nav ─────────────────────────────────────────────────────────────────
const SideNavBar = ({ isMinimized, resetMachine, isDark, sidebarTab, setSidebarTab, theme }) => {
  const accent = isDark ? "#dab9ff" : lightTheme.primary;
  const activeBg = isDark ? "rgba(218,185,255,0.1)" : "#CC8B8630";
  const activeColor = accent;
  const bg = isDark ? "rgba(10,10,15,0.9)" : "rgba(249,234,225,0.9)";
  const border = isDark ? "rgba(218,185,255,0.1)" : "rgba(125,79,80,0.1)";
  
  return (
    <aside style={{ position: "fixed", left: 0, top: 60, height: "calc(100vh - 60px)", width: isMinimized ? 64 : 220, background: bg, backdropFilter: "blur(20px)", borderRight: `1px solid ${border}`, display: "flex", flexDirection: "column", padding: "20px 12px", zIndex: 40, transition: "width 0.3s" }}>
      {!isMinimized && (
        <div style={{ marginBottom: 24, paddingLeft: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: accent, animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 10, fontWeight: 300, letterSpacing: "0.25em", textTransform: "uppercase", color: accent }}>DFA Engine</span>
          </div>
          <span style={{ fontSize: 10, color: isDark ? "rgba(255,255,255,0.25)" : "#A68B8A", fontWeight: 300, textTransform: "uppercase", letterSpacing: "0.1em" }}>v2.4.0-stable</span>
        </div>
      )}
      <nav style={{ flex: 1 }}>
        {[
          { icon: <Edit3 size={15} strokeWidth={2} />, label: "State Editor", key: "editor" },
          { icon: <History size={15} strokeWidth={2} />, label: "Step History", key: "history" }
        ].map(({ icon, label, key }) => {
          const active = sidebarTab === key;
          return (
          <a key={label} href="#" onClick={(e) => { e.preventDefault(); setSidebarTab(key); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, marginBottom: 4, background: active ? activeBg : "transparent", color: active ? activeColor : (isDark ? "rgba(255,255,255,0.4)" : "#8B454A"), textDecoration: "none", fontWeight: 300, fontSize: 13, borderRight: active ? `3px solid ${accent}` : "3px solid transparent", transition: "all 0.2s" }}>
            <span style={{ display: "flex", alignItems: "center" }}>{icon}</span>
            {!isMinimized && label}
          </a>
        );})}
      </nav>
      <div style={{ marginTop: "auto", marginBottom: 24 }}>
        <button onClick={resetMachine} style={{ width: isMinimized ? 40 : "90%", margin: isMinimized ? "0 auto" : "0 5%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: isMinimized ? "10px" : "12px 0", borderRadius: 14, background: isDark ? `linear-gradient(135deg, ${accent}, #6a1b9a)` : lightTheme.btnGradient, border: "none", color: "#fff", fontWeight: 300, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", boxShadow: isDark ? `0 4px 16px ${accent}30` : `0 4px 16px ${lightTheme.primary}40` }}>
          {isMinimized ? "+" : "+ New Machine"}
        </button>
      </div>
    </aside>
  );
};

// ─── Algorithm History Panel ──────────────────────────────────────────────────
const AlgorithmHistory = ({ stepHistory, isDark, theme }) => {
  const accent = isDark ? "#dab9ff" : "#6366f1";
  const bg = isDark ? "rgba(10,10,15,0.8)" : "#fff";
  const border = isDark ? "rgba(218,185,255,0.1)" : "rgba(0,0,0,0.06)";
  const textCol = isDark ? "#fff" : "#111";

  return (
  <div style={{ borderRadius: 20, border: `1px solid ${border}`, padding: 24, background: bg, backdropFilter: "blur(10px)", height: "100%", minHeight: 400, display: "flex", flexDirection: "column" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
      <div style={{ width: 4, height: 24, borderRadius: 2, background: accent }} />
      <span style={{ fontWeight: 300, fontSize: 18, color: textCol, textTransform: "uppercase", letterSpacing: "0.05em" }}>Algorithm Execution History</span>
    </div>
    <div style={{ flex: 1, overflowY: "auto", paddingRight: 8, display: "flex", flexDirection: "column", gap: 12 }}>
      {stepHistory.length === 0 ? (
        <p style={{ fontSize: 14, color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", fontWeight: 300 }}>Start the minimization algorithm to see the steps here.</p>
      ) : (
        stepHistory.map((step, i) => (
          typeof step === "string" ? (
            <div key={i} style={{ padding: 16, borderRadius: 12, background: isDark ? "rgba(218,185,255,0.05)" : "rgba(0,0,0,0.02)", fontSize: 13, color: isDark ? "rgba(218,185,255,0.8)" : "#333", borderLeft: `2px solid ${accent}`, fontWeight: 300, lineHeight: 1.5 }}>
              <div style={{ fontSize: 10, opacity: 0.5, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.1em" }}>Step {i + 1}</div>
              {step}
            </div>
          ) : (
            <div key={i} style={{ padding: 16, borderRadius: 12, background: isDark ? (step.isMarked ? "rgba(239,68,68,0.1)" : "rgba(218,185,255,0.05)") : "rgba(0,0,0,0.02)", fontSize: 13, color: isDark ? "rgba(218,185,255,0.8)" : "#333", borderLeft: `2px solid ${step.isMarked ? "#ef4444" : accent}`, fontWeight: 300, lineHeight: 1.5 }}>
              <div style={{ fontSize: 10, opacity: 0.5, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>Step {i + 1} • Pass {step.pass}</div>
              <div style={{ fontWeight: 700, color: isDark ? "#e5e1e4" : "#111", marginBottom: 8 }}>Checking pair {step.pair}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 8, borderLeft: `1px dashed ${isDark ? "rgba(218,185,255,0.15)" : "rgba(0,0,0,0.1)"}` }}>
                {step.evals.map((e, ei) => (
                  <div key={ei} style={{ fontSize: 12, display: "flex", gap: 6, opacity: 0.9 }}>
                    <span>δ({step.pair}, <strong style={{color: accent}}>{e.sym}</strong>) ➔ {e.tgt}</span>
                    <span style={{ color: e.status === "Marked" ? "#ef4444" : "inherit" }}>({e.status})</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 8, color: step.isMarked ? "#ef4444" : "inherit", fontWeight: step.isMarked ? 700 : 300, fontSize: 12 }}>{step.result}</div>
            </div>
          )
        ))
      )}
    </div>
  </div>
  );
};

// ─── Main App ─────────────────────────────────────────────────────────────────
function AppInner() {
  const [sidebarMin, setSidebarMin] = useState(false);
  const [sidebarTab, setSidebarTab] = useState("editor");
  const [showMinimizedStaircase, setShowMinimizedStaircase] = useState(false);
  const { theme, setTheme } = useTheme();

  const { nodes, edges, alphabet, minStep, setNodes, setEdges, setMinStep, toggleFinal, toggleDead, addState, removeState, resetMachine, addAlphabet, updateAlphabet, removeAlphabet, updateNodeLabel } = useDFA();
  const { currentStep, markedPairs, reasoning, stepHistory, reductionPercentage, minimizedDFA, minimizedStaircase, startMinimization, nextStep, resetMinimization, getPairKey, workingNodes, workingEdges, evaluatingPair } = useMinimization(nodes, edges, alphabet);

  const isAlgorithmMode = minStep >= 0;
  const isComplete = currentStep === 999;
  const [autoVerify, setAutoVerify] = useState(false);

  useEffect(() => {
    if(isComplete) setShowMinimizedStaircase(true);
    else setShowMinimizedStaircase(false);
  }, [isComplete]);

  // Auto-start iterative verification after DOM flush
  useEffect(() => {
    if (autoVerify && minStep === -1 && workingNodes.length > 0) {
      const t = setTimeout(() => {
        setMinStep(0);
        startMinimization();
        setAutoVerify(false);
      }, 500); // Small delay so the user experiences the graphical 'snap' to the new DFA
      return () => clearTimeout(t);
    }
  }, [autoVerify, minStep, workingNodes.length, startMinimization, setMinStep]);

  const activeStaircaseNodes = isComplete && showMinimizedStaircase && minimizedStaircase ? minimizedStaircase.nodes : workingNodes;
  const activeStaircaseMarked = isComplete && showMinimizedStaircase && minimizedStaircase ? minimizedStaircase.markedPairs : markedPairs;
  const activeStaircaseGetPairKey = isComplete && showMinimizedStaircase && minimizedStaircase ? minimizedStaircase.getPairKey : getPairKey;
  const activeStaircaseEval = isComplete && showMinimizedStaircase && minimizedStaircase ? null : evaluatingPair;

  const handleStartMinimization = () => { setMinStep(0); startMinimization(); };
  const handleReset = () => { setMinStep(-1); resetMinimization(); };

  const handleVerifyIterative = () => {
    if (!minimizedDFA) return;
    const spacing = Math.max(160, 800 / (minimizedDFA.states.length + 1));
    const newNodes = minimizedDFA.states.map((s, i) => ({ 
      id: s.id, 
      data: { ...s.data, label: s.id },
      x: spacing + i * spacing, 
      y: 230 
    }));
    const newEdges = minimizedDFA.transitions.map((t, i) => ({ 
      id: `emin-${i}`, 
      source: t.source, 
      target: t.target, 
      label: t.label 
    }));
    setNodes(newNodes);
    setEdges(newEdges);
    handleReset();
    setAutoVerify(true);
  };

  const handleNodeClick = useCallback((nodeId) => { if (!isAlgorithmMode) toggleFinal(nodeId); }, [isAlgorithmMode, toggleFinal]);

  const highlightedNodes = useMemo(() => {
    if (!isAlgorithmMode || isComplete) return [];
    const textTarget = typeof reasoning === "string" ? reasoning : reasoning.raw;
    return workingNodes.filter((n) => textTarget.includes(`{${n.id}`) || textTarget.includes(`, ${n.id}}`) || textTarget.includes(` ${n.id} `)).map((n) => n.id);
  }, [workingNodes, reasoning, isAlgorithmMode, isComplete]);

  // Nodes currently being compared in the iteration
  const evaluatingNodes = useMemo(() => {
    if (!evaluatingPair || isComplete) return [];
    return evaluatingPair.split("|");
  }, [evaluatingPair, isComplete]);

  const displayNodes = useMemo(() => {
    if (isComplete && minimizedDFA) {
      const spacing = Math.max(160, 800 / (minimizedDFA.states.length + 1));
      return minimizedDFA.states.map((s, i) => ({ 
        id: s.id, 
        data: s.data,
        x: spacing + i * spacing, 
        y: 230 
      }));
    }
    if (isAlgorithmMode) return workingNodes;
    return nodes;
  }, [nodes, workingNodes, isAlgorithmMode, isComplete, minimizedDFA]);

  const displayEdges = useMemo(() => {
    if (isComplete && minimizedDFA) return minimizedDFA.transitions.map((t, i) => ({ id: `emin-${i}`, source: t.source, target: t.target, label: t.label }));
    if (isAlgorithmMode) return workingEdges;
    return edges;
  }, [edges, workingEdges, isAlgorithmMode, isComplete, minimizedDFA]);

  const isDark = theme === "dark";
  const sideW = sidebarMin ? 64 : 220;
  const bg = isDark ? "#000000" : "#FDF6F4";
  const accent = isDark ? "#dab9ff" : "#8B454A";

  return (
    <div style={{ minHeight: "100vh", background: bg, color: isDark ? "#fff" : "#333", fontFamily: '"Space Grotesk", sans-serif', transition: "background 0.3s, color 0.3s" }}>
      <TopNavBar toggleSidebar={() => setSidebarMin(!sidebarMin)} isDark={isDark} theme={theme} setTheme={setTheme} />
      <SideNavBar isMinimized={sidebarMin} resetMachine={resetMachine} isDark={isDark} sidebarTab={sidebarTab} setSidebarTab={setSidebarTab} theme={theme} />

      <main style={{ paddingTop: 80, paddingLeft: sideW + 64, paddingRight: 40, paddingBottom: 40, maxWidth: 1800, margin: "0 auto", transition: "padding-left 0.3s" }}>
        {/* Header */}
        <header style={{ marginBottom: 40, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div style={{ maxWidth: 600 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 12, border: `1px solid ${`${accent}20`}`, background: `${accent}08`, marginBottom: 16 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: accent }} />
              <span style={{ fontSize: 10, fontWeight: 300, letterSpacing: "0.25em", textTransform: "uppercase", color: accent }}>
                {isComplete ? "Result: 100% Minimized" : "Standard DFA Construction"}
              </span>
            </div>
            <h1 style={{ fontFamily: '"Outfit", "Space Grotesk", sans-serif', fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", lineHeight: 1, margin: "0 0 10px", ...(isDark ? { background: "linear-gradient(to right, #ffffff, rgba(255,255,255,0.7), rgba(255,255,255,0.4))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } : { color: "#111" }) }}>
              DFA Minimizer
            </h1>
            <p style={{ fontSize: "14px", color: isDark ? "rgba(255,255,255,0.4)" : "#8B454A", lineHeight: 1.6, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 400 }}>
              {isComplete ? "Convergence achieved. Redundant states collapsed." : "Myhill-Nerode partitioning engine for state equivalence analysis."}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {isAlgorithmMode ? (
              <>
                {!isComplete && (
                  <button onClick={nextStep} style={{ border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", borderRadius: 16, transition: "all 0.2s", padding: "16px 24px", background: isDark ? `linear-gradient(135deg, ${accent}, #6a1b9a)` : lightTheme.btnGradient, color: "#fff", boxShadow: isDark ? `0 8px 24px ${accent}30` : `0 8px 24px ${lightTheme.primary}30` }}>
                    Continue Iteration →
                  </button>
                )}
                {isComplete && (
                  <button onClick={handleVerifyIterative} style={{ border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", borderRadius: 16, transition: "all 0.2s", padding: "16px 24px", background: isDark ? `linear-gradient(135deg, ${accent}, #6a1b9a)` : lightTheme.btnGradient, color: "#fff", boxShadow: isDark ? `0 8px 24px ${accent}30` : `0 8px 30px ${lightTheme.primary}40` }}>
                    Verify Minimality ✓
                  </button>
                )}
                <button onClick={handleReset} style={{ border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", borderRadius: 16, transition: "all 0.2s", padding: "16px 24px", background: isDark ? "rgba(255,255,255,0.06)" : lightTheme.subtle, color: isDark ? "rgba(255,255,255,0.5)" : lightTheme.primary }}>
                  ↺ Reset
                </button>
              </>
            ) : (
              <>
                <button onClick={handleStartMinimization} style={{ border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", borderRadius: 16, transition: "all 0.2s", padding: "16px 24px", background: isDark ? `linear-gradient(135deg, ${accent}, #6a1b9a)` : lightTheme.btnGradient, color: "#fff", boxShadow: isDark ? `0 8px 24px ${accent}30` : `0 8px 30px ${lightTheme.primary}40` }}>
                  ▶ Minimize DFA
                </button>
                <button onClick={addState} style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 24px", background: isDark ? "#fff" : lightTheme.secondary, color: isDark ? "#111" : "#fff", border: "none", borderRadius: 16, fontWeight: 700, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", boxShadow: isDark ? "0 12px 32px rgba(0,0,0,0.2)" : `0 8px 24px ${lightTheme.secondary}30`, transition: "all 0.2s" }}>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>+</span> Add State
                </button>
              </>
            )}
          </div>
        </header>

        {/* Content Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: 24, alignItems: "start" }}>
          {/* Left */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <DFACanvas nodes={displayNodes} edges={displayEdges} onNodeClick={handleNodeClick} isAlgorithmMode={isAlgorithmMode} highlightedNodes={highlightedNodes} evaluatingNodes={evaluatingNodes} isDark={isDark} isComplete={isComplete} theme={theme} />
            {sidebarTab === "history" ? (
              <AlgorithmHistory stepHistory={stepHistory} isDark={isDark} theme={theme} />
            ) : (
              <TransitionTable nodes={nodes} edges={edges} alphabet={alphabet} setEdges={setEdges} isAlgorithmMode={isAlgorithmMode} addState={addState} removeState={removeState} addAlphabet={addAlphabet} updateAlphabet={updateAlphabet} removeAlphabet={removeAlphabet} toggleFinal={toggleFinal} toggleDead={toggleDead} updateNodeLabel={updateNodeLabel} isDark={isDark} theme={theme} />
            )}
          </div>

          {/* Right */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <ComplexityReduction reduction={reductionPercentage} isDark={isDark} theme={theme} />
            <LogicWalkthrough currentStep={currentStep} reasoning={reasoning} isAlgorithmMode={isAlgorithmMode} isDark={isDark} theme={theme} />
            <StaircaseGrid nodes={activeStaircaseNodes} markedPairs={activeStaircaseMarked} getPairKey={activeStaircaseGetPairKey} isDark={isDark} onToggleStaircase={setShowMinimizedStaircase} showMinimizedStaircase={showMinimizedStaircase} isComplete={isComplete} evaluatingPair={activeStaircaseEval} theme={theme} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
