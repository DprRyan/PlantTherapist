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
  const goldens = ['#FFD54F','#FFC107','#FFB300','#FF8F00']
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
        <radialGradient id="goldAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#FFC107" stopOpacity="0.45"/>
          <stop offset="100%" stopColor="#FF8F00" stopOpacity="0"/>
        </radialGradient>
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

      {/* ── Stage 4: Flourishing — dense lush green bush, no flowers ── */}
      {stage === 4 && <g>
        <Pot rw={64}/>
        <path d="M-6,0 C-7,-42 -5,-95 -4,-142 L4,-142 C5,-95 7,-42 6,0 Z" fill="url(#trunkGrad)"/>
        {/* Dense overlapping foliage — pure green, no flowers */}
        {[[-62,-82,-24,21,GL[0]],[-42,-76,-8,23,GL[1]],[-20,-73,14,22,GL[2]],
          [0,-71,4,24,GL[0]],[22,-74,-20,23,GL[1]],[42,-77,24,22,GL[3]],[64,-82,32,20,GL[2]],
          [-76,-108,-30,22,GL[0]],[-56,-102,-6,24,GL[1]],[-34,-99,20,25,GL[2]],
          [-12,-96,-14,26,GL[0]],[8,-95,12,27,GL[1]],[28,-98,-24,25,GL[3]],
          [50,-102,30,24,GL[2]],[72,-108,38,22,GL[0]],
          [-68,-132,-26,21,GL[1]],[-46,-128,-4,23,GL[2]],[-24,-126,16,24,GL[0]],
          [-4,-123,9,25,GL[1]],[16,-125,-16,24,GL[3]],[38,-128,26,23,GL[2]],[58,-132,32,21,GL[0]],
          [-42,-158,-20,20,GL[1]],[-20,-160,8,22,GL[2]],[0,-162,0,23,GL[0]],
          [20,-159,-12,22,GL[1]],[42,-156,20,20,GL[3]],
          [-56,-118,-14,19,GL[2]],[56,-120,22,19,GL[0]]
        ].map(([x,y,a,s,c],i) => <Leaf key={i} x={x} y={y} angle={a} size={s} color={c}/>)}
      </g>}

      {/* ── Stage 5: Thriving — tree with cracked pot, vines ── */}
      {stage === 5 && <g>
        <Pot rw={68} cracked/>
        <path d="M-8,0 C-10,-52 -7,-112 -6,-185 L6,-185 C7,-112 10,-52 8,0 Z" fill="url(#trunkGrad)"/>
        {[0.28,0.48,0.68].map((t,i) =>
          <path key={i} d={`M${-12*(1-t*0.5)},${-185*t+8} Q2,${-185*t-5} ${10*(1-t*0.5)},${-185*t+3}`}
            stroke="#3E2723" strokeWidth="1.5" fill="none" opacity="0.32"/>)}
        <path d="M0,-118 Q-58,-145 -94,-130" stroke="#5D4037" strokeWidth="5.5" fill="none" strokeLinecap="round"/>
        <path d="M0,-136 Q64,-165 100,-150" stroke="#5D4037" strokeWidth="5"   fill="none" strokeLinecap="round"/>
        <path d="M0,-158 Q-42,-180 -70,-170" stroke="#5D4037" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
        <path d="M0,-172 Q38,-192 62,-180"   stroke="#5D4037" strokeWidth="4"   fill="none" strokeLinecap="round"/>
        {/* Hanging vines */}
        <path d="M-88,-133 Q-94,-158 -84,-178" stroke="#388E3C" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M94,-153  Q100,-178 90,-200"  stroke="#388E3C" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M-64,-173 Q-70,-196 -62,-218" stroke="#388E3C" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
        <RoundLeaf x={-86} y={-162} angle={22}  size={10} color="#4CAF50" opacity={0.8}/>
        <RoundLeaf x={92}  y={-182} angle={-26} size={10} color="#66BB6A" opacity={0.8}/>
        <RoundLeaf x={-64} y={-202} angle={16}  size={9}  color="#388E3C" opacity={0.8}/>
        {[[-78,-133,-20,22,GL[0]],[-90,-131,16,20,GL[1]],[-97,-128,-30,18,GL[2]],
          [76,-152,24,22,GL[0]],[90,-150,-20,20,GL[1]],[100,-147,34,18,GL[3]],
          [-52,-172,-16,20,GL[1]],[-65,-170,20,19,GL[2]],[-73,-167,-26,18,GL[0]],
          [42,-182,22,20,GL[0]],[56,-180,-16,19,GL[1]],[64,-177,30,18,GL[2]],
          [-16,-96,-24,18,GL[3]],[20,-102,32,17,GL[0]],
          [-32,-112,-18,20,GL[1]],[30,-118,24,20,GL[2]],
          [-36,-158,-12,19,GL[0]],[36,-162,16,19,GL[1]],
          [-8,-187,-5,20,GL[2]],[10,-190,8,20,GL[0]]
        ].map(([x,y,a,s,c],i) => <Leaf key={i} x={x} y={y} angle={a} size={s} color={c}/>)}
      </g>}

      {/* ── Stage 6: Majestic — full tree, roots, flowers, butterflies ── */}
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
        <path d="M0,-148 Q-68,-178 -110,-163" stroke="#5D4037" strokeWidth="6.5" fill="none" strokeLinecap="round"/>
        <path d="M0,-168 Q75,-202 120,-185"   stroke="#5D4037" strokeWidth="6"   fill="none" strokeLinecap="round"/>
        <path d="M0,-190 Q-50,-218 -84,-207"  stroke="#5D4037" strokeWidth="5.5" fill="none" strokeLinecap="round"/>
        <path d="M0,-206 Q48,-232 80,-220"    stroke="#5D4037" strokeWidth="5"   fill="none" strokeLinecap="round"/>
        <path d="M0,-217 Q-30,-236 -52,-228"  stroke="#5D4037" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
        <path d="M0,-222 Q24,-238 42,-230"    stroke="#5D4037" strokeWidth="4"   fill="none" strokeLinecap="round"/>
        {[[-90,-165,-24,24,GL[0]],[-104,-162,16,22,GL[1]],[-112,-160,-34,21,GL[2]],
          [96,-187,26,24,GL[0]],[112,-184,-22,22,GL[1]],[120,-181,36,21,GL[3]],
          [-66,-210,-20,23,GL[0]],[-80,-208,22,22,GL[1]],[-88,-205,-30,21,GL[2]],
          [60,-222,24,23,GL[0]],[74,-220,-18,22,GL[1]],[82,-217,32,21,GL[2]],
          [-42,-230,-16,22,GL[0]],[-56,-228,20,21,GL[1]],
          [32,-232,20,22,GL[0]],[44,-230,-16,21,GL[1]],
          [-14,-238,-10,21,GL[2]],[16,-240,12,22,GL[3]],
          [-32,-180,-14,22,GL[2]],[32,-185,16,22,GL[0]],
          [-16,-120,-22,20,GL[1]],[20,-126,26,20,GL[2]]
        ].map(([x,y,a,s,c],i) => <Leaf key={i} x={x} y={y} angle={a} size={s} color={c}/>)}
        {[[-114,-165,FC[0],7],[122,-186,FC[1],7],[-88,-207,FC[2],6.5],[84,-219,FC[3],6.5],
          [-56,-230,FC[0],6],[44,-232,FC[1],6],[-14,-240,FC[2],6.5],[16,-242,FC[3],6]
        ].map(([x,y,c,s],i) => <Flower key={i} x={x} y={y} size={s} color={c}/>)}
        <Butterfly x={-100} y={-188}/>
        <Butterfly x={108}  y={-208} flip/>
        <Butterfly x={-18}  y={-258}/>
      </g>}

      {/* ── Stage 7: Ancient — massive golden glowing tree ── */}
      {stage === 7 && <g>
        {/* Golden aura */}
        <ellipse cx={0} cy={-155} rx={158} ry={132} fill="url(#goldAura)">
          <animate attributeName="opacity" values="0.6;1;0.6" dur="3.5s" repeatCount="indefinite"/>
        </ellipse>
        <ellipse cx={0} cy={8} rx={118} ry={15} fill="#2d1f0e" opacity={0.65}/>
        {/* Massive spreading roots */}
        <path d="M-18,0 Q-55,22 -92,38"  stroke="#4E342E" strokeWidth="8"   fill="none" strokeLinecap="round"/>
        <path d="M18,0  Q55,22 92,38"    stroke="#4E342E" strokeWidth="8"   fill="none" strokeLinecap="round"/>
        <path d="M-12,0 Q-38,30 -62,58"  stroke="#4E342E" strokeWidth="6"   fill="none" strokeLinecap="round"/>
        <path d="M12,0  Q38,30 62,58"    stroke="#4E342E" strokeWidth="6"   fill="none" strokeLinecap="round"/>
        <path d="M-5,0  Q-14,34 -10,64"  stroke="#4E342E" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
        <path d="M5,0   Q20,34 26,62"    stroke="#4E342E" strokeWidth="4"   fill="none" strokeLinecap="round"/>
        {/* Gnarled thick trunk */}
        <path d="M-22,0 C-26,-55 -21,-108 -18,-162 C-16,-210 -20,-252 -16,-278 L16,-278 C20,-252 16,-210 18,-162 C21,-108 26,-55 22,0 Z"
          fill="url(#trunkGrad)"/>
        {/* Knots */}
        <ellipse cx={-15} cy={-88}  rx={9} ry={5} fill="#4E342E" opacity={0.5}/>
        <ellipse cx={17}  cy={-152} rx={8} ry={4} fill="#4E342E" opacity={0.42}/>
        {[0.14,0.27,0.42,0.56,0.70,0.82].map((t,i) =>
          <path key={i} d={`M${-22*(1-t*0.48)},${-285*t+10} Q3,${-285*t-9} ${19*(1-t*0.48)},${-285*t+4}`}
            stroke="#3E2723" strokeWidth="2" fill="none" opacity="0.3"/>)}
        {/* Main branches */}
        <path d="M0,-188 Q-84,-220 -136,-202" stroke="#5D4037" strokeWidth="9"   fill="none" strokeLinecap="round"/>
        <path d="M0,-208 Q92,-248 148,-224"   stroke="#5D4037" strokeWidth="8.5" fill="none" strokeLinecap="round"/>
        <path d="M0,-232 Q-58,-265 -96,-252"  stroke="#5D4037" strokeWidth="8"   fill="none" strokeLinecap="round"/>
        <path d="M0,-250 Q62,-280 102,-264"   stroke="#5D4037" strokeWidth="7.5" fill="none" strokeLinecap="round"/>
        <path d="M0,-264 Q-38,-286 -66,-274"  stroke="#5D4037" strokeWidth="7"   fill="none" strokeLinecap="round"/>
        <path d="M0,-276 Q35,-294 60,-282"    stroke="#5D4037" strokeWidth="6.5" fill="none" strokeLinecap="round"/>
        {/* Golden leaves */}
        {[
          [-118,-204,0],[-130,-201,1],[-138,-198,2],[-110,-222,3],[-124,-219,0],[-116,-238,1],
          [124,-226,2],[138,-222,3],[148,-218,0],[116,-244,1],[130,-241,2],[122,-260,3],
          [-78,-254,0],[-92,-251,1],[-100,-248,2],[-72,-272,3],[-86,-269,0],
          [64,-268,1],[78,-265,2],[86,-261,3],[60,-284,0],[74,-281,1],
          [-44,-278,2],[-58,-275,3],[-36,-292,0],[34,-286,1],[48,-283,2],
          [-18,-296,3],[18,-300,0],[-6,-302,1],[12,-304,2],
          [-32,-265,3],[32,-270,0],[-18,-248,1],[18,-252,2],[-62,-238,3],[62,-244,0],
          [-90,-228,1],[90,-234,2],[-110,-214,3],[110,-220,0],[-128,-206,1],[128,-210,2],
        ].map(([x,y,idx],i) => (
          <GoldenLeaf key={i} x={x} y={y}
            angle={((i*41)%82)-41}
            size={15+((i*3)%9)}
            idx={idx}/>
        ))}
        {/* Sparkle particles using SVG-native animation */}
        {[[-138,-208],[-152,-236],[-118,-268],[136,-226],[150,-258],[122,-282],
          [-22,-310],[22,-314],[0,-306],[-52,-300],[52,-295],[0,-285],
          [-80,-288],[80,-290]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r={2.5} fill={i%2===0?'#FFD54F':'#FFF9C4'}>
            <animate attributeName="opacity" values="0;1;0"
              dur={`${1.4+i*0.22}s`} begin={`${i*0.18}s`} repeatCount="indefinite"/>
            <animate attributeName="r" values="1.5;3.2;1.5"
              dur={`${1.4+i*0.22}s`} begin={`${i*0.18}s`} repeatCount="indefinite"/>
          </circle>
        ))}
        <Butterfly x={-124} y={-256}/>
        <Butterfly x={132}  y={-274} flip/>
        <Butterfly x={-16}  y={-326}/>
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
        <div className="stage-badge" style={{ '--stage-color': stageInfo.color }}>
          {stageInfo.name}
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
