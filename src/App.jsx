import { useState, useRef, useEffect } from 'react'
import './App.css'

const STAGES = [
  { name: 'Seedling',    scale: 0.28, color: '#a8d5a2' },
  { name: 'Sprout',      scale: 0.42, color: '#82c97a' },
  { name: 'Sapling',     scale: 0.58, color: '#5cb85c' },
  { name: 'Blooming',    scale: 0.73, color: '#4caf50' },
  { name: 'Flourishing', scale: 0.90, color: '#388e3c' },
  { name: 'Thriving',    scale: 1.10, color: '#2e7d32' },
  { name: 'Majestic',    scale: 1.45, color: '#1b5e20' },
  { name: 'Ancient',     scale: 1.85, color: '#4a9a35' },
]

// ── PlantSVG helpers ───────────────────────────────────────

// Rounded leaf (cute, for seedling/sprout)
function RoundLeaf({ x, y, angle, size, color, opacity = 0.92 }) {
  const w = size * 0.55, h = size
  return (
    <path
      d={`M0,0 C${w},${-h*0.18} ${w},${-h*0.8} 0,${-h} C${-w},${-h*0.8} ${-w},${-h*0.18} 0,0`}
      fill={color} opacity={opacity}
      transform={`translate(${x},${y}) rotate(${angle})`}
    />
  )
}

// Pointed leaf (sapling through majestic)
function Leaf({ x, y, angle, size, color, opacity = 0.9 }) {
  const w = size * 0.36, h = size * 1.7
  return (
    <path
      d={`M0,0 C${w},${-h*0.22} ${w},${-h*0.72} 0,${-h} C${-w},${-h*0.72} ${-w},${-h*0.22} 0,0`}
      fill={color} opacity={opacity}
      transform={`translate(${x},${y}) rotate(${angle})`}
    />
  )
}

// Golden leaf (Ancient stage)
function GoldenLeaf({ x, y, angle, size, idx = 0 }) {
  const goldens = ['#D4A855','#C4963C','#B8860B','#DAA520']
  const w = size * 0.42, h = size * 1.6
  return (
    <path
      d={`M0,0 C${w},${-h*0.24} ${w},${-h*0.73} 0,${-h} C${-w},${-h*0.73} ${-w},${-h*0.24} 0,0`}
      fill={goldens[idx % 4]} opacity={0.93}
      transform={`translate(${x},${y}) rotate(${angle})`}
    />
  )
}

// ── Terracotta pot ─────────────────────────────────────────
function Pot({ rw = 50, cracked = false }) {
  const bw = rw * 0.80, h = rw * 0.70
  return (
    <g>
      <path d={`M${-rw},0 L${-bw},${h} Q0,${h+10} ${bw},${h} L${rw},0 Z`} fill="#c67a3c"/>
      {cracked && <>
        <path d={`M${-rw*0.38},${h*0.18} L${-rw*0.22},${h*0.52} L${-rw*0.40},${h*0.88}`}
          stroke="#6b3a1f" strokeWidth="2.2" fill="none" opacity="0.7"/>
        <path d={`M${rw*0.28},${h*0.12} L${rw*0.44},${h*0.48} L${rw*0.26},${h*0.86}`}
          stroke="#6b3a1f" strokeWidth="1.8" fill="none" opacity="0.55"/>
      </>}
      <rect x={-rw-5} y={-7} width={(rw+5)*2} height={13} rx={5} fill="#d4894a"/>
      <ellipse cx={0} cy={0} rx={rw-3} ry={6} fill="#3d2b1f"/>
      <ellipse cx={-5} cy={-1} rx={12} ry={3} fill="#5c3a1e" opacity={0.45}/>
    </g>
  )
}

// ── Flower (5-petal) ───────────────────────────────────────
function Flower({ x, y, size = 7, color = '#E91E63', bud = false }) {
  if (bud) return <ellipse cx={x} cy={y-size*0.55} rx={size*0.38} ry={size*0.65} fill={color} opacity={0.85}/>
  return (
    <g transform={`translate(${x},${y})`}>
      {[0,72,144,216,288].map(a => {
        const r = a*Math.PI/180
        const cx = Math.cos(r)*size, cy = Math.sin(r)*size
        return <ellipse key={a} cx={cx} cy={cy} rx={size*0.62} ry={size*0.38}
          transform={`rotate(${a},${cx},${cy})`} fill={color} opacity={0.88}/>
      })}
      <circle cx={0} cy={0} r={size*0.4} fill="#FFF176"/>
    </g>
  )
}

// ── Butterfly ──────────────────────────────────────────────
function Butterfly({ x, y, flip = false }) {
  const s = flip ? -1 : 1
  return (
    <g transform={`translate(${x},${y})`} opacity={0.82}>
      <path d={`M0,0 C${-8*s},-9 ${-18*s},-7 ${-16*s},0 C${-18*s},7 ${-8*s},9 0,0`} fill="#9C27B0" opacity={0.75}/>
      <path d={`M0,0 C${8*s},-7 ${16*s},-5 ${14*s},0 C${16*s},5 ${8*s},7 0,0`} fill="#7B1FA2" opacity={0.75}/>
      <path d="M0,-5 L0,5" stroke="#4A148C" strokeWidth="1.2" strokeLinecap="round"/>
      <path d={`M0,-5 Q${-4*s},-10 ${-3*s},-13`} stroke="#4A148C" strokeWidth="0.8" fill="none"/>
      <path d={`M0,-5 Q${3*s},-10 ${2*s},-13`} stroke="#4A148C" strokeWidth="0.8" fill="none"/>
    </g>
  )
}

// ── Main plant SVG (complete rewrite) ──────────────────────
function PlantSVG({ stage, state }) {
  const { scale } = STAGES[stage]
  const FC = ['#E91E63','#2196F3','#FFC107','#9C27B0'] // flower colors
  const GL = ['#4CAF50','#66BB6A','#388E3C','#2E7D32']  // green leaf colors

  return (
    <svg
      viewBox="-180 -340 360 420"
      overflow="visible"
      className={`plant-svg plant-${state} stage-${stage}`}
      style={{ '--plant-scale': scale }}
      aria-label={`Fernsby, ${STAGES[stage].name}`}
    >
      <defs>
        <linearGradient id="trunkGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"  stopColor="#4E342E"/>
          <stop offset="45%" stopColor="#6D4C41"/>
          <stop offset="100%" stopColor="#5D4037"/>
        </linearGradient>
        <radialGradient id="groundGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#2e7d32" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="#000"    stopOpacity="0"/>
        </radialGradient>
      </defs>

      {/* ── Stage 0: Seedling — tiny 2-leaf sprout in small pot ── */}
      {stage === 0 && <g>
        <Pot rw={36}/>
        <path d="M0,-1 C-1,-18 1,-34 0,-52" stroke="#4CAF50" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
        <RoundLeaf x={0} y={-38} angle={-44} size={15} color="#66BB6A"/>
        <RoundLeaf x={0} y={-42} angle={40}  size={16} color="#4CAF50"/>
        <RoundLeaf x={0} y={-54} angle={4}   size={12} color="#81C784"/>
      </g>}

      {/* ── Stage 1: Sprout — taller stem, 4-5 leaves ── */}
      {stage === 1 && <g>
        <Pot rw={40}/>
        <path d="M0,-1 C-2,-22 2,-48 0,-78" stroke="#388E3C" strokeWidth="3.2" fill="none" strokeLinecap="round"/>
        <RoundLeaf x={0} y={-28} angle={-50} size={17} color="#66BB6A"/>
        <RoundLeaf x={0} y={-33} angle={46}  size={18} color="#4CAF50"/>
        <RoundLeaf x={0} y={-50} angle={-40} size={16} color="#81C784"/>
        <RoundLeaf x={0} y={-56} angle={42}  size={17} color="#66BB6A"/>
        <RoundLeaf x={0} y={-76} angle={5}   size={15} color="#388E3C"/>
      </g>}

      {/* ── Stage 2: Sapling — thin trunk, branches, buds ── */}
      {stage === 2 && <g>
        <Pot rw={48}/>
        {/* Trunk */}
        <path d="M-4,0 C-5,-35 -3,-75 -2,-118 L2,-118 C3,-75 5,-35 4,0 Z" fill="url(#trunkGrad)"/>
        {/* Branches */}
        <path d="M0,-72 Q-32,-88 -58,-78" stroke="#5D4037" strokeWidth="3"   fill="none" strokeLinecap="round"/>
        <path d="M0,-88 Q38,-106 65,-94"  stroke="#5D4037" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
        <path d="M0,-104 Q-24,-120 -42,-112" stroke="#5D4037" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
        {/* Leaves */}
        {[[-42,-80,-18,13,GL[0]],[-54,-79,14,12,GL[1]],[-60,-77,-28,11,GL[2]],
          [44,-96,22,13,GL[0]],[57,-94,-16,12,GL[1]],[66,-92,32,11,GL[2]],
          [-28,-114,-22,12,GL[0]],[-40,-112,12,11,GL[1]],
          [-2,-46,-30,13,GL[3]],[4,-60,28,12,GL[0]]
        ].map(([x,y,a,s,c],i) => <Leaf key={i} x={x} y={y} angle={a} size={s} color={c}/>)}
        {/* Flower buds */}
        <Flower x={-62} y={-81} size={5} color={FC[0]} bud/>
        <Flower x={68}  y={-97} size={5} color={FC[1]} bud/>
        <Flower x={-44} y={-115} size={4} color={FC[2]} bud/>
      </g>}

      {/* ── Stage 3: Blooming — fuller, open colorful flowers ── */}
      {stage === 3 && <g>
        <Pot rw={56}/>
        <path d="M-5,0 C-6,-40 -4,-88 -3,-152 L3,-152 C4,-88 6,-40 5,0 Z" fill="url(#trunkGrad)"/>
        <path d="M0,-88  Q-48,-108 -80,-96"  stroke="#5D4037" strokeWidth="4"   fill="none" strokeLinecap="round"/>
        <path d="M0,-105 Q55,-128 88,-114"   stroke="#5D4037" strokeWidth="3.8" fill="none" strokeLinecap="round"/>
        <path d="M0,-124 Q-32,-146 -58,-136" stroke="#5D4037" strokeWidth="3.2" fill="none" strokeLinecap="round"/>
        <path d="M0,-138 Q30,-158 54,-148"   stroke="#5D4037" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
        {[[-60,-98,-18,14,GL[0]],[-72,-96,16,13,GL[1]],[-82,-94,-28,12,GL[2]],
          [58,-116,22,14,GL[0]],[72,-114,-18,13,GL[1]],[90,-112,32,12,GL[2]],
          [-40,-138,-20,13,GL[0]],[-52,-136,16,12,GL[1]],[-60,-134,-25,11,GL[2]],
          [34,-150,24,13,GL[0]],[48,-148,-18,12,GL[1]],
          [-6,-52,-28,14,GL[3]],[8,-68,32,13,GL[0]],[-12,-82,-22,15,GL[1]],[10,-96,26,14,GL[2]]
        ].map(([x,y,a,s,c],i) => <Leaf key={i} x={x} y={y} angle={a} size={s} color={c}/>)}
        <Flower x={-84}  y={-99}  size={7} color={FC[0]}/>
        <Flower x={92}   y={-117} size={7} color={FC[1]}/>
        <Flower x={-62}  y={-139} size={6} color={FC[2]}/>
        <Flower x={56}   y={-151} size={6} color={FC[3]}/>
        <Flower x={0}    y={-155} size={7} color={FC[0]}/>
        <Flower x={-30}  y={-112} size={5} color={FC[2]}/>
        <Flower x={38}   y={-124} size={5} color={FC[1]}/>
      </g>}

      {/* ── Stage 4: Flourishing — branching bushy plant overflowing pot ── */}
      {stage === 4 && <g>
        <Pot rw={64}/>
        {/* Trunk — visible through lower gap before foliage begins */}
        <path d="M-5,0 C-5,-28 -4,-58 -3,-95 L3,-95 C4,-58 5,-28 5,0 Z" fill="url(#trunkGrad)"/>
        {/* 5 branches fanning outward */}
        <path d="M0,-72 Q-46,-90 -88,-108"  stroke="#5D4037" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
        <path d="M0,-80 Q48,-96 90,-110"    stroke="#5D4037" strokeWidth="4"   fill="none" strokeLinecap="round"/>
        <path d="M0,-96 Q-38,-114 -68,-132" stroke="#5D4037" strokeWidth="3.8" fill="none" strokeLinecap="round"/>
        <path d="M0,-102 Q40,-118 70,-130"  stroke="#5D4037" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
        <path d="M0,-110 Q-1,-128 0,-148"   stroke="#5D4037" strokeWidth="3.2" fill="none" strokeLinecap="round"/>
        {/* Overflow — leaves spilling over pot rim */}
        {[[-74,-10,30,20,GL[1]],[-52,-8,18,21,GL[0]],[-28,-7,8,22,GL[2]],
          [28,-7,-8,22,GL[3]],[52,-8,-20,21,GL[0]],[74,-10,-32,20,GL[1]]
        ].map(([x,y,a,s,c],i) => <RoundLeaf key={'ov'+i} x={x} y={y} angle={a} size={s} color={c}/>)}
        {/* All leaf clusters — tips + mid-branch */}
        {[
          // B1 tip (−88,−108): 10 leaves
          [-88,-108,-18,23,GL[0]],[-74,-114,12,22,GL[1]],[-100,-116,-28,21,GL[2]],[-70,-122,8,22,GL[3]],
          [-104,-112,-8,23,GL[0]],[-80,-126,20,21,GL[1]],[-94,-120,-22,20,GL[2]],[-68,-108,14,22,GL[0]],
          [-108,-122,-14,21,GL[3]],[-82,-130,6,20,GL[1]],
          // B1 mid (−48,−88): 3 leaves
          [-48,-88,-12,20,GL[2]],[-36,-94,8,19,GL[0]],[-60,-92,-20,19,GL[1]],
          // B2 tip (90,−110): 10 leaves
          [90,-110,22,23,GL[0]],[104,-116,-14,22,GL[1]],[78,-118,16,21,GL[2]],[108,-124,-22,22,GL[3]],
          [74,-114,8,23,GL[0]],[98,-128,-18,21,GL[1]],[84,-122,24,20,GL[2]],[110,-110,-8,22,GL[0]],
          [70,-124,18,21,GL[3]],[96,-132,-12,20,GL[1]],
          // B2 mid (48,−88): 3 leaves
          [48,-88,14,20,GL[2]],[60,-94,-10,19,GL[0]],[34,-92,18,19,GL[3]],
          // B3 tip (−68,−132): 10 leaves
          [-68,-132,-14,22,GL[0]],[-54,-138,10,21,GL[1]],[-80,-140,-22,21,GL[2]],[-50,-146,6,22,GL[3]],
          [-84,-136,-6,23,GL[0]],[-60,-150,16,20,GL[1]],[-76,-144,-18,21,GL[2]],[-48,-132,12,20,GL[0]],
          [-88,-146,-10,20,GL[3]],[-64,-154,4,19,GL[1]],
          // B3 mid (−38,−116): 3 leaves
          [-38,-116,-8,19,GL[1]],[-26,-122,6,18,GL[0]],[-50,-120,-16,19,GL[2]],
          // B4 tip (70,−130): 10 leaves
          [70,-130,18,22,GL[0]],[84,-136,-12,21,GL[1]],[58,-138,14,21,GL[2]],[88,-144,-20,22,GL[3]],
          [54,-134,6,23,GL[0]],[78,-148,-16,20,GL[1]],[64,-142,22,21,GL[2]],[90,-130,-8,20,GL[0]],
          [50,-142,12,20,GL[3]],[74,-152,-4,19,GL[1]],
          // B4 mid (38,−116): 3 leaves
          [38,-116,10,19,GL[1]],[50,-122,-8,18,GL[0]],[24,-120,14,19,GL[3]],
          // B5 top tip (0,−148): 10 leaves
          [0,-148,0,22,GL[0]],[14,-154,-10,21,GL[1]],[-12,-156,8,21,GL[2]],[16,-162,-16,22,GL[3]],
          [-14,-152,4,23,GL[0]],[6,-166,-6,20,GL[1]],[-4,-160,12,21,GL[2]],[18,-148,-14,20,GL[0]],
          [-18,-160,6,20,GL[3]],[4,-168,-2,19,GL[1]],
          // B5 mid (0,−130): 3 leaves
          [0,-130,0,19,GL[0]],[12,-136,-8,18,GL[1]],[-12,-134,8,18,GL[2]],
        ].map(([x,y,a,s,c],i) => <RoundLeaf key={i} x={x} y={y} angle={a} size={s} color={c}/>)}
      </g>}

      {/* ── Stage 5: Thriving — no pot, wide tree, 6 branches, dense foliage + vines ── */}
      {stage === 5 && <g>
        {/* Ground shadow + surface roots */}
        <ellipse cx={0} cy={6} rx={72} ry={9} fill="#2d1f0e" opacity={0.5}/>
        <path d="M-8,0 Q-34,16 -60,28"  stroke="#4E342E" strokeWidth="5"   fill="none" strokeLinecap="round"/>
        <path d="M8,0  Q34,16 60,28"    stroke="#4E342E" strokeWidth="5"   fill="none" strokeLinecap="round"/>
        <path d="M-4,0 Q-18,22 -32,42"  stroke="#4E342E" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
        <path d="M4,0  Q18,22 32,42"    stroke="#4E342E" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
        {/* Thick trunk with bark lines */}
        <path d="M-12,0 C-13,-42 -11,-90 -10,-148 C-9,-175 -10,-198 -8,-215 L8,-215 C10,-198 9,-175 10,-148 C11,-90 13,-42 12,0 Z"
          fill="url(#trunkGrad)"/>
        {[0.22,0.42,0.62,0.80].map((t,i) =>
          <path key={i} d={`M${-12*(1-t*0.48)},${-220*t+10} Q2,${-220*t-6} ${10*(1-t*0.48)},${-220*t+3}`}
            stroke="#3E2723" strokeWidth="1.6" fill="none" opacity="0.3"/>)}
        {/* 6 branches — wider spread than stage 4 */}
        <path d="M0,-128 Q-56,-152 -108,-165" stroke="#5D4037" strokeWidth="7"   fill="none" strokeLinecap="round"/>
        <path d="M0,-138 Q58,-160 112,-165"   stroke="#5D4037" strokeWidth="6.5" fill="none" strokeLinecap="round"/>
        <path d="M0,-158 Q-48,-186 -90,-198"  stroke="#5D4037" strokeWidth="6"   fill="none" strokeLinecap="round"/>
        <path d="M0,-166 Q50,-192 92,-198"    stroke="#5D4037" strokeWidth="5.5" fill="none" strokeLinecap="round"/>
        <path d="M0,-182 Q-30,-212 -60,-225"  stroke="#5D4037" strokeWidth="5"   fill="none" strokeLinecap="round"/>
        <path d="M0,-190 Q28,-218 48,-232"    stroke="#5D4037" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
        {/* Hanging vines from B1 and B2 tips */}
        <path d="M-106,-170 Q-114,-196 -104,-220" stroke="#388E3C" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
        <path d="M110,-170  Q118,-196 108,-222"   stroke="#388E3C" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
        <path d="M-88,-204  Q-96,-228 -86,-250"   stroke="#388E3C" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
        <RoundLeaf x={-104} y={-204} angle={20}  size={10} color="#4CAF50" opacity={0.85}/>
        <RoundLeaf x={108}  y={-206} angle={-24} size={10} color="#66BB6A" opacity={0.85}/>
        <RoundLeaf x={-86}  y={-234} angle={14}  size={9}  color="#388E3C" opacity={0.85}/>
        {/* Dense leaf clusters — tips + mid-branch, pointed Leaf style */}
        {[
          // B1 tip (−108,−165): 12 leaves
          [-108,-165,-18,26,GL[0]],[-92,-173,12,25,GL[1]],[-122,-175,-28,24,GL[2]],[-88,-183,8,25,GL[3]],
          [-126,-170,-8,26,GL[0]],[-100,-187,20,24,GL[1]],[-116,-180,-22,23,GL[2]],[-86,-168,14,25,GL[0]],
          [-130,-182,-14,23,GL[3]],[-104,-191,6,22,GL[1]],[-92,-193,-10,23,GL[2]],[-120,-188,18,22,GL[0]],
          // B1 mid (−65,−148): 4 leaves
          [-65,-148,-12,22,GL[2]],[-52,-155,8,21,GL[0]],[-78,-154,-20,21,GL[1]],[-50,-162,4,21,GL[3]],
          // B2 tip (112,−165): 12 leaves
          [112,-165,22,26,GL[0]],[126,-173,-14,25,GL[1]],[98,-175,16,24,GL[2]],[130,-183,-22,25,GL[3]],
          [94,-170,8,26,GL[0]],[120,-187,-18,24,GL[1]],[106,-180,24,23,GL[2]],[132,-168,-8,25,GL[0]],
          [90,-182,18,23,GL[3]],[116,-195,-12,22,GL[1]],[128,-197,10,23,GL[2]],[94,-190,-16,22,GL[0]],
          // B2 mid (68,−150): 4 leaves
          [68,-150,14,22,GL[2]],[80,-157,-10,21,GL[0]],[54,-156,18,21,GL[1]],[82,-163,-16,21,GL[3]],
          // B3 tip (−90,−198): 12 leaves
          [-90,-198,-16,25,GL[0]],[-74,-206,10,24,GL[1]],[-106,-208,-26,24,GL[2]],[-70,-216,6,25,GL[3]],
          [-110,-204,-6,26,GL[0]],[-82,-220,18,23,GL[1]],[-98,-214,-20,24,GL[2]],[-68,-202,12,23,GL[0]],
          [-114,-218,-12,22,GL[3]],[-86,-228,4,22,GL[1]],[-74,-230,-8,23,GL[2]],[-106,-226,16,22,GL[0]],
          // B3 mid (−58,−182): 4 leaves
          [-58,-182,-10,21,GL[1]],[-44,-189,6,20,GL[0]],[-72,-190,-18,21,GL[2]],[-40,-196,2,20,GL[3]],
          // B4 tip (92,−198): 12 leaves
          [92,-198,20,25,GL[0]],[106,-206,-12,24,GL[1]],[78,-208,16,24,GL[2]],[110,-216,-20,25,GL[3]],
          [74,-204,6,26,GL[0]],[100,-220,-16,23,GL[1]],[84,-214,22,24,GL[2]],[112,-200,-6,23,GL[0]],
          [70,-214,16,22,GL[3]],[96,-228,-10,22,GL[1]],[110,-230,8,23,GL[2]],[76,-224,-14,22,GL[0]],
          // B4 mid (60,−183): 4 leaves
          [60,-183,12,21,GL[2]],[72,-190,-8,20,GL[0]],[46,-192,16,21,GL[1]],[74,-197,-14,20,GL[3]],
          // B5 tip (−60,−225): 10 leaves
          [-60,-225,-14,24,GL[0]],[-46,-233,8,23,GL[1]],[-76,-235,-22,23,GL[2]],[-42,-243,4,24,GL[3]],
          [-78,-230,-4,25,GL[0]],[-54,-247,16,22,GL[1]],[-72,-240,-18,23,GL[2]],[-40,-228,10,22,GL[0]],
          [-82,-244,-8,21,GL[3]],[-58,-252,2,21,GL[1]],
          // B5 mid (−38,−208): 3 leaves
          [-38,-208,-8,21,GL[2]],[-26,-215,4,20,GL[0]],[-52,-216,-16,21,GL[1]],
          // B6 tip (48,−232): 10 leaves
          [48,-232,18,24,GL[0]],[62,-240,-10,23,GL[1]],[34,-242,14,23,GL[2]],[64,-250,-18,24,GL[3]],
          [32,-238,4,25,GL[0]],[56,-254,-14,22,GL[1]],[42,-248,20,23,GL[2]],[66,-232,-6,22,GL[0]],
          [30,-246,10,21,GL[3]],[52,-260,0,21,GL[1]],
          // B6 mid (26,−216): 3 leaves
          [26,-216,10,21,GL[2]],[38,-223,-6,20,GL[0]],[12,-224,14,21,GL[1]],
        ].map(([x,y,a,s,c],i) => <Leaf key={i} x={x} y={y} angle={a} size={s} color={c}/>)}
      </g>}

      {/* ── Stage 6: Majestic — full tree, roots, flowers, butterflies ── */}
      {/* ── Stage 6: Majestic — full crowned tree, dense green foliage, flowers ── */}
      {stage === 6 && <g>
        <ellipse cx={0} cy={6} rx={90} ry={11} fill="#2d1f0e" opacity={0.6}/>
        {/* Surface roots */}
        <path d="M-10,0 Q-42,18 -78,32"  stroke="#4E342E" strokeWidth="5.5" fill="none" strokeLinecap="round"/>
        <path d="M10,0  Q42,18 78,32"    stroke="#4E342E" strokeWidth="5.5" fill="none" strokeLinecap="round"/>
        <path d="M-6,0  Q-28,26 -50,50"  stroke="#4E342E" strokeWidth="4"   fill="none" strokeLinecap="round"/>
        <path d="M6,0   Q28,26 50,50"    stroke="#4E342E" strokeWidth="4"   fill="none" strokeLinecap="round"/>
        <path d="M0,0   Q-8,30 -4,58"    stroke="#4E342E" strokeWidth="3"   fill="none" strokeLinecap="round"/>
        {/* Trunk */}
        <path d="M-12,0 C-14,-55 -10,-118 -9,-222 L9,-222 C10,-118 14,-55 12,0 Z" fill="url(#trunkGrad)"/>
        {[0.22,0.40,0.58,0.74].map((t,i) =>
          <path key={i} d={`M${-14*(1-t*0.52)},${-222*t+10} Q3,${-222*t-7} ${12*(1-t*0.52)},${-222*t+4}`}
            stroke="#3E2723" strokeWidth="1.8" fill="none" opacity="0.28"/>)}
        {/* 8 branches — 2 new lower ones fill sparse bottom crown */}
        <path d="M0,-136 Q-38,-147 -72,-153" stroke="#5D4037" strokeWidth="5"   fill="none" strokeLinecap="round"/>
        <path d="M0,-145 Q36,-157 68,-162"   stroke="#5D4037" strokeWidth="4.8" fill="none" strokeLinecap="round"/>
        <path d="M0,-148 Q-68,-178 -110,-163" stroke="#5D4037" strokeWidth="6.5" fill="none" strokeLinecap="round"/>
        <path d="M0,-168 Q75,-202 120,-185"   stroke="#5D4037" strokeWidth="6"   fill="none" strokeLinecap="round"/>
        <path d="M0,-190 Q-50,-218 -84,-207"  stroke="#5D4037" strokeWidth="5.5" fill="none" strokeLinecap="round"/>
        <path d="M0,-206 Q48,-232 80,-220"    stroke="#5D4037" strokeWidth="5"   fill="none" strokeLinecap="round"/>
        <path d="M0,-217 Q-30,-236 -52,-228"  stroke="#5D4037" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
        <path d="M0,-222 Q24,-238 42,-230"    stroke="#5D4037" strokeWidth="4"   fill="none" strokeLinecap="round"/>
        {/* Dense leaf coverage — 106 leaves, no bare branches */}
        {[
          // B7 new tip (−72,−153): 7 leaves
          [-72,-153,-14,22,GL[0]],[-58,-159,8,21,GL[1]],[-86,-161,-22,21,GL[2]],[-54,-167,4,22,GL[3]],
          [-90,-157,-4,23,GL[0]],[-64,-171,16,20,GL[1]],[-80,-165,-18,21,GL[2]],
          // B8 new tip (68,−162): 7 leaves
          [68,-162,18,22,GL[0]],[84,-168,-10,21,GL[1]],[54,-170,14,21,GL[2]],[88,-176,-18,22,GL[3]],
          [50,-166,4,23,GL[0]],[76,-180,-14,20,GL[1]],[62,-174,20,21,GL[2]],
          // B1 tip (−110,−163): 10 leaves
          [-110,-163,-18,23,GL[0]],[-96,-169,12,22,GL[1]],[-124,-171,-26,21,GL[2]],[-92,-177,8,22,GL[3]],
          [-128,-167,-8,23,GL[0]],[-100,-181,20,21,GL[1]],[-116,-175,-22,20,GL[2]],[-90,-162,14,22,GL[0]],
          [-132,-177,-14,21,GL[3]],[-104,-185,6,20,GL[1]],
          // B1 mid (−64,−152): 4 leaves
          [-64,-152,-10,21,GL[2]],[-52,-158,8,20,GL[0]],[-78,-160,-18,20,GL[1]],[-48,-165,4,20,GL[3]],
          // B1 inner (−28,−143): 2 leaves
          [-28,-143,-6,20,GL[0]],[-14,-149,10,19,GL[2]],
          // B2 tip (120,−185): 10 leaves
          [120,-185,22,23,GL[0]],[136,-191,-12,22,GL[1]],[104,-193,16,21,GL[2]],[138,-199,-20,22,GL[3]],
          [102,-188,8,23,GL[0]],[128,-202,-16,21,GL[1]],[114,-196,24,20,GL[2]],[140,-186,-8,22,GL[0]],
          [100,-200,18,21,GL[3]],[124,-209,-10,20,GL[1]],
          // B2 mid (68,−175): 4 leaves
          [68,-175,14,21,GL[2]],[82,-181,-10,20,GL[0]],[52,-183,18,20,GL[1]],[84,-188,-16,20,GL[3]],
          // B2 inner (26,−161): 2 leaves
          [26,-161,8,20,GL[0]],[14,-167,-10,19,GL[2]],
          // B3 tip (−84,−207): 9 leaves
          [-84,-207,-16,22,GL[0]],[-68,-213,10,21,GL[1]],[-100,-215,-24,21,GL[2]],[-66,-221,6,22,GL[3]],
          [-104,-211,-6,23,GL[0]],[-76,-225,18,20,GL[1]],[-92,-219,-20,21,GL[2]],[-64,-210,12,20,GL[0]],
          [-108,-223,-10,20,GL[3]],
          // B3 mid (−48,−200): 3 leaves
          [-48,-200,-8,20,GL[1]],[-34,-207,6,19,GL[0]],[-64,-208,-16,20,GL[2]],
          // B3 inner (−18,−186): 2 leaves
          [-18,-186,-4,20,GL[1]],[-32,-192,8,19,GL[0]],
          // B4 tip (80,−220): 9 leaves
          [80,-220,20,22,GL[0]],[96,-226,-12,21,GL[1]],[64,-228,16,21,GL[2]],[100,-234,-20,22,GL[3]],
          [60,-223,6,23,GL[0]],[88,-238,-16,20,GL[1]],[74,-231,22,21,GL[2]],[102,-221,-8,20,GL[0]],
          [58,-233,14,20,GL[3]],
          // B4 mid (44,−213): 3 leaves
          [44,-213,12,20,GL[1]],[58,-219,-8,19,GL[0]],[28,-220,16,20,GL[2]],
          // B4 inner (18,−199): 2 leaves
          [18,-199,6,20,GL[1]],[30,-205,-10,19,GL[0]],
          // B5 tip (−52,−228): 7 leaves
          [-52,-228,-12,21,GL[0]],[-36,-234,8,20,GL[1]],[-68,-236,-20,20,GL[2]],[-32,-242,4,21,GL[3]],
          [-72,-232,-4,22,GL[0]],[-44,-246,16,19,GL[1]],[-60,-239,-16,20,GL[2]],
          // B5 mid (−28,−221): 2 leaves
          [-28,-221,-6,20,GL[1]],[-16,-227,8,19,GL[0]],
          // B6 tip (42,−230): 7 leaves
          [42,-230,16,21,GL[0]],[58,-236,-10,20,GL[1]],[26,-238,12,20,GL[2]],[60,-244,-18,21,GL[3]],
          [24,-233,4,22,GL[0]],[48,-248,-14,19,GL[1]],[34,-242,18,20,GL[2]],
          // B6 mid (22,−222): 2 leaves
          [22,-222,8,20,GL[1]],[36,-228,-8,19,GL[0]],
          // Inner fill — 12 leaves covering trunk/inner branch gaps
          [-56,-165,-10,21,GL[3]],[56,-168,12,21,GL[0]],[-80,-178,-20,22,GL[1]],[80,-182,16,22,GL[2]],
          [-40,-195,-6,21,GL[0]],[40,-198,10,21,GL[1]],[-22,-212,-8,21,GL[2]],[22,-215,8,21,GL[3]],
          [-62,-188,-14,20,GL[1]],[62,-193,14,20,GL[2]],[-8,-224,-2,20,GL[0]],[8,-228,4,20,GL[1]],
        ].map(([x,y,a,s,c],i) => <Leaf key={i} x={x} y={y} angle={a} size={s} color={c}/>)}
        {/* Flowers at every branch tip */}
        {[[-76,-155,FC[0],5.5],[70,-164,FC[1],5.5],[-114,-165,FC[2],7],[122,-186,FC[3],7],
          [-88,-207,FC[0],6.5],[84,-219,FC[1],6.5],[-56,-230,FC[2],6],[44,-232,FC[3],6],
          [-14,-240,FC[0],6.5],[16,-242,FC[1],6]
        ].map(([x,y,c,s],i) => <Flower key={i} x={x} y={y} size={s} color={c}/>)}
        <Butterfly x={-100} y={-188}/>
        <Butterfly x={108}  y={-208} flip/>
        <Butterfly x={-18}  y={-258}/>
      </g>}

      {/* ── Stage 7: Ancient — SOLID golden canopy, impenetrable leaf mass ── */}
      {stage === 7 && <g>
        <ellipse cx={0} cy={8} rx={118} ry={15} fill="#2d1f0e" opacity={0.65}/>
        {/* Wide spreading roots */}
        <path d="M-18,0 Q-58,22 -96,36"  stroke="#4E342E" strokeWidth="8"   fill="none" strokeLinecap="round"/>
        <path d="M18,0  Q58,22 96,36"    stroke="#4E342E" strokeWidth="8"   fill="none" strokeLinecap="round"/>
        <path d="M-10,0 Q-36,28 -62,54"  stroke="#4E342E" strokeWidth="6"   fill="none" strokeLinecap="round"/>
        <path d="M10,0  Q36,28 62,54"    stroke="#4E342E" strokeWidth="6"   fill="none" strokeLinecap="round"/>
        <path d="M-4,0  Q-12,32 -8,60"   stroke="#4E342E" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
        <path d="M4,0   Q16,32 22,58"    stroke="#4E342E" strokeWidth="4"   fill="none" strokeLinecap="round"/>
        {/* Massive gnarled trunk */}
        <path d="M-22,0 C-26,-45 -24,-90 -20,-135 C-17,-165 -18,-195 -15,-220 L15,-220 C18,-195 17,-165 20,-135 C24,-90 26,-45 22,0 Z"
          fill="url(#trunkGrad)"/>
        {[0.15,0.28,0.42,0.56,0.70,0.83].map((t,i) =>
          <path key={i} d={`M${-22*(1-t*0.45)},${-225*t+10} Q3,${-225*t-8} ${19*(1-t*0.45)},${-225*t+4}`}
            stroke="#3E2723" strokeWidth="2" fill="none" opacity="0.28"/>)}
        <ellipse cx={-16} cy={-78}  rx={9} ry={5} fill="#4E342E" opacity={0.45}/>
        <ellipse cx={18}  cy={-138} rx={8} ry={4} fill="#4E342E" opacity={0.38}/>
        <ellipse cx={-12} cy={-172} rx={7} ry={4} fill="#4E342E" opacity={0.32}/>
        {/* 8 branches — hidden under leaf mass */}
        <path d="M0,-125 Q-90,-140 -155,-165" stroke="#5D4037" strokeWidth="10"  fill="none" strokeLinecap="round"/>
        <path d="M0,-135 Q95,-148 158,-168"   stroke="#5D4037" strokeWidth="9.5" fill="none" strokeLinecap="round"/>
        <path d="M0,-158 Q-68,-188 -118,-228" stroke="#5D4037" strokeWidth="9"   fill="none" strokeLinecap="round"/>
        <path d="M0,-165 Q72,-192 122,-232"   stroke="#5D4037" strokeWidth="8.5" fill="none" strokeLinecap="round"/>
        <path d="M0,-178 Q-48,-222 -80,-268"  stroke="#5D4037" strokeWidth="8"   fill="none" strokeLinecap="round"/>
        <path d="M0,-183 Q52,-226 86,-264"    stroke="#5D4037" strokeWidth="7.5" fill="none" strokeLinecap="round"/>
        <path d="M0,-195 Q-28,-240 -52,-285"  stroke="#5D4037" strokeWidth="7"   fill="none" strokeLinecap="round"/>
        <path d="M0,-200 Q18,-245 30,-290"    stroke="#5D4037" strokeWidth="6.5" fill="none" strokeLinecap="round"/>

        {/* DENSE LEAF LAYERS — 100 hardcoded + 204 algorithmic = 304 golden leaves total */}
        <g>
          {/* Layer 1: hardcoded leaves anchoring each branch */}
          {[
            [-155,-165,0],[-140,-171,1],[-168,-174,2],[-135,-182,3],[-173,-170,0],[-146,-186,1],[-162,-180,2],[-133,-162,3],[-176,-182,0],[-150,-192,1],
            [-100,-152,2],[-88,-158,3],[-110,-160,0],[-86,-166,1],
            [158,-168,2],[173,-174,3],[145,-177,0],[176,-185,1],[140,-173,2],[166,-189,3],[151,-183,0],[174,-165,1],[136,-185,2],[162,-195,3],
            [103,-152,0],[115,-158,1],[91,-160,2],[117,-166,3],
            [-118,-228,0],[-103,-234,1],[-132,-237,2],[-98,-245,3],[-136,-233,0],[-109,-249,1],[-125,-243,2],[-96,-225,3],[-140,-245,0],[-112,-256,1],
            [-77,-196,2],[-66,-201,3],[-88,-204,0],[-64,-209,1],
            [122,-232,2],[137,-238,3],[109,-241,0],[142,-249,1],[104,-237,2],[132,-253,3],[115,-247,0],[144,-229,1],[100,-249,2],[128,-260,3],
            [79,-202,0],[90,-207,1],[67,-210,2],[92,-215,3],
            [-80,-268,0],[-66,-274,1],[-94,-277,2],[-62,-285,3],[-98,-272,0],[-72,-289,1],[-88,-282,2],[-60,-265,3],[-104,-280,0],
            [-52,-236,1],[-40,-242,2],[-64,-244,3],[-38,-250,0],
            [86,-264,1],[100,-270,2],[74,-273,3],[106,-281,0],[70,-268,1],[96,-285,2],[80,-278,3],[108,-261,0],[68,-258,1],
            [56,-234,2],[68,-240,3],[42,-242,0],[70,-248,1],
            [-52,-285,2],[-38,-291,3],[-66,-293,0],[-35,-300,1],[-68,-289,2],[-46,-305,3],[-70,-280,0],[-32,-296,1],
            [-34,-258,2],[-22,-264,3],[-46,-266,0],
            [30,-290,1],[44,-296,2],[16,-298,3],[47,-306,0],[13,-294,1],[38,-310,2],[-4,-302,3],[50,-286,0],
            [20,-262,1],[32,-268,2],[6,-270,3],
            [-60,-185,0],[-82,-202,1],[-104,-218,2],[60,-186,3],[82,-200,0],[104,-216,1],
            [-38,-252,2],[38,-248,3],[0,-242,0],[-14,-272,1],[14,-270,2],[-28,-185,3],
          ].map(([x,y,idx],i) => (
            <GoldenLeaf key={'g'+i} x={x} y={y} angle={((i*43)%80)-40} size={13+((i*7)%13)} idx={idx}/>
          ))}
          {/* Layer 2: algorithmic fill — 204 leaves in Fibonacci packing per zone */}
          {[
            [-132,-180,56,50,20,0],[-130,-198,52,44,14,0],
            [134,-182,56,50,20,1],[136,-198,52,44,14,1],
            [-98,-238,54,48,17,2],[-98,-256,50,42,13,2],
            [98,-238,54,48,17,3],[98,-256,50,42,13,3],
            [-66,-272,48,42,15,0],[-66,-292,42,36,11,0],
            [67,-270,48,42,15,1],[67,-290,42,36,11,1],
            [-32,-297,42,36,13,2],[22,-302,42,36,13,3],
            [0,-212,52,46,16,0],[-78,-218,46,40,13,1],[78,-216,46,40,13,2],
          ].flatMap(([cx,cy,rx,ry,n,co], zi) =>
            Array.from({length: n}, (_, i) => {
              const a = (i / n) * Math.PI * 2
              const r = Math.sqrt((i + 0.5) / n)
              return <GoldenLeaf key={`f${zi}-${i}`}
                x={Math.round(cx + Math.cos(a) * rx * r)}
                y={Math.round(cy + Math.sin(a) * ry * r)}
                angle={((zi * 23 + i * 41) % 80) - 40}
                size={12 + (i * 7 % 12)}
                idx={(co + i) % 4}/>
            })
          )}
          {/* Green holdover leaves — scattered for color variation */}
          {[[-148,-172,0],[-92,-158,2],[90,-160,0],[148,-175,2],
            [-120,-232,0],[118,-230,2],[-72,-272,0],[74,-268,2],
            [-50,-290,0],[32,-294,2],[0,-246,0],[-46,-222,2],[46,-220,0],
            [-80,-205,2],[80,-202,0],
          ].map(([x,y,c],i) => (
            <Leaf key={'gr'+i} x={x} y={y} angle={((i*53)%80)-40}
              size={14+((i*6)%10)} color={c===0?'#5A8F5A':'#3D6B3D'} opacity={0.9}/>
          ))}
        </g>

        {/* Sparkles at branch tip zones */}
        {[[-155,-183],[158,-186],[-118,-250],[122,-253],[-80,-288],[86,-284],
          [-52,-303],[30,-308],[-136,-200],[136,-197],[-102,-250],[100,-248]
        ].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r={2.2} fill={i%2===0?'#E8D5A0':'#FFF8E8'}>
            <animate attributeName="opacity" values="0;1;0"
              dur={`${1.4+i*0.2}s`} begin={`${i*0.17}s`} repeatCount="indefinite"/>
            <animate attributeName="r" values="1.2;3;1.2"
              dur={`${1.4+i*0.2}s`} begin={`${i*0.17}s`} repeatCount="indefinite"/>
          </circle>
        ))}
      </g>}
    </svg>
  )
}

// ── Speech bubble ──────────────────────────────────────────
function SpeechBubble({ text, visible }) {
  return (
    <div className={`speech-bubble ${visible ? 'bubble-visible' : ''}`}>
      <div className="bubble-text">{text}</div>
      <div className="bubble-tail"/>
    </div>
  )
}

// ── Leaf burst on response ─────────────────────────────────
function LeafBurst({ active }) {
  const leaves = Array.from({length: 12}, (_,i) => {
    const angle = (i/12)*360
    const dist = 80 + (i%3)*30
    const colors = ['#4caf50','#81c784','#a5d6a7','#c8e6c9']
    return { angle, x: Math.cos(angle*Math.PI/180)*dist, y: Math.sin(angle*Math.PI/180)*dist, color: colors[i%colors.length], delay: i*0.05 }
  })
  return (
    <div className={`leaf-burst ${active ? 'burst-active' : ''}`} aria-hidden>
      {leaves.map((l,i) => (
        <div key={i} className="burst-leaf" style={{
          '--bx': `${l.x}px`, '--by': `${l.y}px`, '--bcolor': l.color,
          '--bdelay': `${l.delay}s`, '--brot': `${l.angle+90}deg`,
        }}/>
      ))}
    </div>
  )
}

// ── App ────────────────────────────────────────────────────
export default function App() {
  const [stage, setStage] = useState(0)
  const [plantState, setPlantState] = useState('idle')
  const [reply, setReply] = useState("Hello, dear. I'm Fernsby. What's been weighing on your roots today?")
  const [bubbleVisible, setBubbleVisible] = useState(true)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [burst, setBurst] = useState(false)
  const audioRef = useRef(null)
  const inputRef = useRef(null)
  const stageInfo = STAGES[stage]

  useEffect(() => {
    fetch('http://localhost:8000/plant/Fernsby')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return
        const idx = STAGES.findIndex(s => s.name.toLowerCase() === (data.stage ?? '').toLowerCase())
        if (idx !== -1) setStage(idx)
      })
      .catch(() => {})
  }, [])

  async function send() {
    const msg = message.trim()
    if (!msg || loading) return
    setMessage('')
    setLoading(true)
    setPlantState('waiting')
    setBubbleVisible(false)

    try {
      const res = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, name: 'Fernsby' }),
      })
      if (!res.ok) { const t = await res.text(); throw new Error(`HTTP ${res.status}: ${t}`) }

      const data = await res.json()
      console.log('Fernsby response:', data)

      const idx = STAGES.findIndex(s => s.name.toLowerCase() === (data.stage || '').toLowerCase())
      console.log(`Stage: backend="${data.stage}" → idx=${idx}, current=${stage}`)
      if (idx !== -1 && idx !== stage) setStage(idx)

      const full = data.reply || ''
      setReply(full.length > 150 ? full.slice(0, 150).trimEnd() + '…' : full)
      setPlantState('responding')
      setBubbleVisible(true)
      setBurst(true)
      setTimeout(() => { setBurst(false); setPlantState('idle') }, 1200)
    } catch (err) {
      console.error('Fernsby fetch error:', err)
      setReply("My roots are tangled… I couldn't connect. Please try again.")
      setPlantState('idle')
      setBubbleVisible(true)
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-title">
          <span className="leaf-icon">🌿</span>
          Plant Therapist
        </div>
        <div className="header-right">
          <div className="stage-badge" style={{ '--stage-color': stageInfo.color }}>
            {stageInfo.name}
          </div>
          <button
            className="reset-btn"
            title="Reset plant"
            onClick={async () => {
              await fetch('http://localhost:8000/reset/Fernsby', { method: 'DELETE' })
              setStage(0)
              setReply("Hello, dear. I'm Fernsby. What's been weighing on your roots today?")
              setBubbleVisible(true)
              setPlantState('idle')
              setTimeout(() => window.location.reload(), 500)
            }}
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 10a6 6 0 1 1 1.1 3.5"/>
              <polyline points="1 15 4 10 7.5 12.5"/>
            </svg>
          </button>
        </div>
      </header>

      <main className="stage-area">
        <SpeechBubble text={reply} visible={bubbleVisible}/>
        <div className="plant-scene">
          <LeafBurst active={burst}/>
          <PlantSVG stage={stage} state={plantState}/>
        </div>
        <div className="stage-progress">
          {STAGES.map((s,i) => (
            <div key={s.name}
              className={`stage-pip ${i<=stage?'pip-active':''} ${i===stage?'pip-current':''}`}
              style={{ '--pip-color': s.color }} title={s.name}/>
          ))}
        </div>
        <p className="stage-label" style={{ color: stageInfo.color }}>
          {stageInfo.name} · Stage {stage+1} of {STAGES.length}
        </p>
      </main>

      <footer className="input-area">
        <div className="input-row">
          <textarea ref={inputRef} className="msg-input"
            placeholder="Share what's on your mind..."
            value={message} onChange={e => setMessage(e.target.value)}
            onKeyDown={handleKey} rows={2} disabled={loading}/>
          <button className={`send-btn ${loading ? 'sending' : ''}`}
            onClick={send} disabled={loading || !message.trim()} aria-label="Send message">
            {loading ? <span className="spinner"/> : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
              </svg>
            )}
          </button>
        </div>
        <p className="input-hint">Press Enter to send · Shift+Enter for new line</p>
      </footer>

      <audio ref={audioRef}/>
    </div>
  )
}
