import { useState, useRef, useEffect } from 'react'
import './App.css'

const STAGES = [
  { name: 'Seedling',    scale: 0.35, color: '#a8d5a2' },
  { name: 'Sprout',     scale: 0.50, color: '#82c97a' },
  { name: 'Sapling',    scale: 0.65, color: '#5cb85c' },
  { name: 'Blooming',   scale: 0.78, color: '#4caf50' },
  { name: 'Flourishing',scale: 0.88, color: '#388e3c' },
  { name: 'Thriving',   scale: 0.95, color: '#2e7d32' },
  { name: 'Majestic',   scale: 1.05, color: '#1b5e20' },
  { name: 'Ancient',    scale: 1.18, color: '#0a3d0a' },
]

function PlantSVG({ stage, state }) {
  const s = STAGES[stage]
  const leafColor = s.color
  const darkLeaf = s.color.replace(/#/, '') // used for gradients
  const trunkH = 60 + stage * 12
  const spread = 30 + stage * 8

  return (
    <svg
      viewBox="-120 -260 240 320"
      className={`plant-svg plant-${state}`}
      style={{ '--plant-scale': s.scale }}
      aria-label={`Fernsby the plant, ${s.name} stage`}
    >
      <defs>
        <radialGradient id="groundGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8B6914" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#8B6914" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="trunkGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#5D3A1A" />
          <stop offset="40%" stopColor="#8B6914" />
          <stop offset="100%" stopColor="#5D3A1A" />
        </linearGradient>
        <radialGradient id="leafGrad1" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor={leafColor} />
          <stop offset="100%" stopColor={s.color} stopOpacity="0.7" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="softShadow">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#1a3a0a" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Ground glow */}
      <ellipse cx="0" cy="55" rx="70" ry="14" fill="url(#groundGlow)" />

      {/* Pot */}
      <path d="M-28,55 L-22,85 Q0,92 22,85 L28,55 Z" fill="#c0622a" />
      <path d="M-28,55 Q0,62 28,55 Q0,48 -28,55 Z" fill="#d4733a" />
      <rect x="-32" y="48" width="64" height="10" rx="4" fill="#e07840" />
      <rect x="-32" y="48" width="64" height="4" rx="2" fill="#f09050" opacity="0.5" />

      {/* Soil */}
      <ellipse cx="0" cy="52" rx="26" ry="6" fill="#5C3D1A" />
      <ellipse cx="0" cy="50" rx="24" ry="5" fill="#7B5230" />

      {/* Trunk */}
      <path
        d={`M-5,50 C-6,${50 - trunkH * 0.3} -4,${50 - trunkH * 0.7} 0,${50 - trunkH}`}
        stroke="url(#trunkGrad)" strokeWidth={6 + stage * 0.8} strokeLinecap="round" fill="none"
      />

      {/* Roots (visible for older stages) */}
      {stage >= 4 && <>
        <path d={`M-5,50 Q-${15+stage*2},${60+stage} -${20+stage*3},${65+stage}`} stroke="#5D3A1A" strokeWidth="2" fill="none" opacity="0.6"/>
        <path d={`M2,52 Q${10+stage*2},${62+stage} ${18+stage*3},${66+stage}`} stroke="#5D3A1A" strokeWidth="2" fill="none" opacity="0.6"/>
      </>}

      {/* Branch system */}
      {stage >= 1 && (
        <path d={`M0,${50-trunkH*0.6} Q-${spread*0.6},${50-trunkH*0.8} -${spread},${50-trunkH*0.95}`}
          stroke="#6B4A1E" strokeWidth={3+stage*0.4} strokeLinecap="round" fill="none"/>
      )}
      {stage >= 2 && (
        <path d={`M0,${50-trunkH*0.55} Q${spread*0.5},${50-trunkH*0.75} ${spread*0.9},${50-trunkH*0.9}`}
          stroke="#6B4A1E" strokeWidth={2.5+stage*0.3} strokeLinecap="round" fill="none"/>
      )}
      {stage >= 4 && (
        <path d={`M0,${50-trunkH*0.4} Q-${spread*0.4},${50-trunkH*0.52} -${spread*0.7},${50-trunkH*0.58}`}
          stroke="#6B4A1E" strokeWidth="2" strokeLinecap="round" fill="none"/>
      )}
      {stage >= 5 && (
        <path d={`M0,${50-trunkH*0.38} Q${spread*0.35},${50-trunkH*0.5} ${spread*0.65},${50-trunkH*0.56}`}
          stroke="#6B4A1E" strokeWidth="2" strokeLinecap="round" fill="none"/>
      )}

      {/* Leaf clusters */}
      <LeafCluster cx={0} cy={50-trunkH} r={18+stage*4} color={leafColor} stage={stage} id="top" filter="url(#softShadow)"/>
      {stage >= 1 && <LeafCluster cx={-spread} cy={50-trunkH*0.95} r={12+stage*3} color={leafColor} stage={stage} id="left"/>}
      {stage >= 2 && <LeafCluster cx={spread*0.9} cy={50-trunkH*0.9} r={11+stage*3} color={leafColor} stage={stage} id="right"/>}
      {stage >= 3 && <LeafCluster cx={-spread*0.4} cy={50-trunkH*0.75} r={10+stage*2} color={leafColor} stage={stage} id="mid-l"/>}
      {stage >= 4 && <LeafCluster cx={spread*0.35} cy={50-trunkH*0.7} r={9+stage*2} color={leafColor} stage={stage} id="mid-r"/>}
      {stage >= 5 && <>
        <LeafCluster cx={-spread*0.7} cy={50-trunkH*0.58} r={8+stage*1.5} color={leafColor} stage={stage} id="low-l"/>
        <LeafCluster cx={spread*0.65} cy={50-trunkH*0.56} r={8+stage*1.5} color={leafColor} stage={stage} id="low-r"/>
      </>}
      {stage >= 6 && <>
        <LeafCluster cx={-spread*0.2} cy={50-trunkH*0.45} r={7+stage} color={leafColor} stage={stage} id="base-l"/>
        <LeafCluster cx={spread*0.2} cy={50-trunkH*0.43} r={7+stage} color={leafColor} stage={stage} id="base-r"/>
      </>}

      {/* Flowers for blooming+ */}
      {stage >= 3 && <Flower cx={0} cy={50-trunkH-2} stage={stage}/>}
      {stage >= 5 && <>
        <Flower cx={-spread} cy={50-trunkH*0.98} stage={stage}/>
        <Flower cx={spread*0.9} cy={50-trunkH*0.93} stage={stage}/>
      </>}
      {stage >= 7 && <>
        <Flower cx={-spread*0.4} cy={50-trunkH*0.78} stage={stage} small/>
        <Flower cx={spread*0.35} cy={50-trunkH*0.73} stage={stage} small/>
      </>}

      {/* Sparkles for ancient */}
      {stage === 7 && <Sparkles spread={spread} trunkH={trunkH}/>}
    </svg>
  )
}

function LeafCluster({ cx, cy, r, color, stage, id }) {
  const leaves = 5 + Math.min(stage, 4)
  return (
    <g transform={`translate(${cx},${cy})`} filter={id === 'top' ? 'url(#softShadow)' : undefined}>
      {Array.from({length: leaves}).map((_, i) => {
        const angle = (i / leaves) * Math.PI * 2
        const ox = Math.cos(angle) * r * 0.45
        const oy = Math.sin(angle) * r * 0.45
        const lAngle = (angle * 180 / Math.PI) + 90
        return (
          <ellipse
            key={i}
            cx={ox} cy={oy}
            rx={r * 0.55} ry={r * 0.32}
            fill={color}
            transform={`rotate(${lAngle}, ${ox}, ${oy})`}
            opacity={0.82 + (i % 3) * 0.06}
          />
        )
      })}
      <circle cx="0" cy="0" r={r * 0.55} fill={color} opacity="0.9" />
      <circle cx={-r*0.15} cy={-r*0.15} r={r * 0.25} fill="white" opacity="0.12" />
    </g>
  )
}

function Flower({ cx, cy, stage, small }) {
  const r = small ? 4 : 5 + stage * 0.5
  const petalColors = ['#FFD700','#FF8C00','#FF6B9D','#FF4500','#FFB347']
  const color = petalColors[stage % petalColors.length]
  return (
    <g transform={`translate(${cx},${cy})`}>
      {[0,60,120,180,240,300].map(a => (
        <ellipse key={a}
          cx={Math.cos(a*Math.PI/180)*r*1.4}
          cy={Math.sin(a*Math.PI/180)*r*1.4}
          rx={r*0.9} ry={r*0.5}
          fill={color} opacity="0.9"
          transform={`rotate(${a}, ${Math.cos(a*Math.PI/180)*r*1.4}, ${Math.sin(a*Math.PI/180)*r*1.4})`}
        />
      ))}
      <circle cx="0" cy="0" r={r*0.7} fill="#FFDD00" />
      <circle cx={-r*0.2} cy={-r*0.2} r={r*0.25} fill="white" opacity="0.4"/>
    </g>
  )
}

function Sparkles({ spread, trunkH }) {
  const pts = [
    [0, -trunkH-30], [-spread-10, -trunkH*0.9-10], [spread*0.9+10, -trunkH*0.85-10],
    [-spread*0.5, -trunkH*0.5-10], [spread*0.5, -trunkH*0.45-10]
  ]
  return <>
    {pts.map(([x,y], i) => (
      <g key={i} transform={`translate(${x+50-50},${y+50})`}>
        <animateTransform attributeName="transform" type="translate"
          values={`${x},${y};${x},${y-5};${x},${y}`} dur={`${1.5+i*0.3}s`} repeatCount="indefinite"
          additive="sum"/>
        {[0,45,90,135].map(a => (
          <line key={a}
            x1="0" y1="0"
            x2={Math.cos(a*Math.PI/180)*6} y2={Math.sin(a*Math.PI/180)*6}
            stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" opacity="0.8"
          />
        ))}
        <circle cx="0" cy="0" r="2" fill="#FFD700" opacity="0.9"/>
      </g>
    ))}
  </>
}

function SpeechBubble({ text, visible }) {
  return (
    <div className={`speech-bubble ${visible ? 'bubble-visible' : ''}`}>
      <div className="bubble-text">{text}</div>
      <div className="bubble-tail" />
    </div>
  )
}

function LeafBurst({ active }) {
  const leaves = Array.from({length: 12}, (_, i) => {
    const angle = (i / 12) * 360
    const dist = 80 + Math.random() * 60
    const x = Math.cos(angle * Math.PI / 180) * dist
    const y = Math.sin(angle * Math.PI / 180) * dist
    const colors = ['#4caf50','#81c784','#a5d6a7','#ffb74d','#ff8a65','#a5d6a7']
    return { angle, x, y, color: colors[i % colors.length], delay: i * 0.05 }
  })

  return (
    <div className={`leaf-burst ${active ? 'burst-active' : ''}`} aria-hidden>
      {leaves.map((l, i) => (
        <div
          key={i}
          className="burst-leaf"
          style={{
            '--bx': `${l.x}px`,
            '--by': `${l.y}px`,
            '--bcolor': l.color,
            '--bdelay': `${l.delay}s`,
            '--brot': `${l.angle + 90}deg`,
          }}
        />
      ))}
    </div>
  )
}

export default function App() {
  const [stage, setStage] = useState(0)
  const [plantState, setPlantState] = useState('idle') // idle | waiting | responding
  const [reply, setReply] = useState("Hello, dear. I'm Fernsby. What's been weighing on your roots today?")
  const [bubbleVisible, setBubbleVisible] = useState(true)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [burst, setBurst] = useState(false)
  const audioRef = useRef(null)
  const inputRef = useRef(null)

  const stageInfo = STAGES[stage]

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

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`HTTP ${res.status}: ${text}`)
      }

      const data = await res.json()
      console.log('Fernsby response:', data)

      const newStageIdx = STAGES.findIndex(s => s.name.toLowerCase() === (data.stage || '').toLowerCase())
      console.log(`Stage lookup: backend="${data.stage}" → index=${newStageIdx}, current=${stage}`)
      if (newStageIdx !== -1 && newStageIdx !== stage) {
        setStage(newStageIdx)
      }

      setReply(data.reply || '')
      setPlantState('responding')
      setBubbleVisible(true)
      setBurst(true)

      setTimeout(() => {
        setBurst(false)
        setPlantState('idle')
      }, 1200)
    } catch (err) {
      console.error('Fernsby fetch error:', err)
      setReply("My roots are tangled... I couldn't connect. Please try again.")
      setPlantState('idle')
      setBubbleVisible(true)
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
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
        <div className="plant-scene">
          <SpeechBubble text={reply} visible={bubbleVisible} />
          <LeafBurst active={burst} />
          <PlantSVG stage={stage} state={plantState} />
        </div>

        <div className="stage-progress">
          {STAGES.map((s, i) => (
            <div
              key={s.name}
              className={`stage-pip ${i <= stage ? 'pip-active' : ''} ${i === stage ? 'pip-current' : ''}`}
              style={{ '--pip-color': s.color }}
              title={s.name}
            />
          ))}
        </div>
        <p className="stage-label" style={{ color: stageInfo.color }}>
          {stageInfo.name} · Stage {stage + 1} of {STAGES.length}
        </p>
      </main>

      <footer className="input-area">
        <div className="input-row">
          <textarea
            ref={inputRef}
            className="msg-input"
            placeholder="Share what's on your mind..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={handleKey}
            rows={2}
            disabled={loading}
          />
          <button
            className={`send-btn ${loading ? 'sending' : ''}`}
            onClick={send}
            disabled={loading || !message.trim()}
            aria-label="Send message"
          >
            {loading ? (
              <span className="spinner" />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
              </svg>
            )}
          </button>
        </div>
        <p className="input-hint">Press Enter to send · Shift+Enter for new line</p>
      </footer>

      <audio ref={audioRef} />
    </div>
  )
}
