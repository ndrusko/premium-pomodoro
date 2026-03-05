import React, { useState, useEffect, useRef } from 'react';

// SVGs and Icons (Inline to keep it highly portable)
const SettingsIcon = () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const CloseIcon = () => <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const PlayIcon = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>;
const PauseIcon = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>;
const ResetIcon = () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>;

// Web Audio API Synth Engine
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const playSound = (type) => {
  if (type === 'none' || audioCtx.state === 'suspended') return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  const now = audioCtx.currentTime;

  if (type === 'tick') {
    osc.type = 'square'; osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.02, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.start(now); osc.stop(now + 0.05);
  } else if (type === 'pop') {
    osc.type = 'sine'; osc.frequency.setValueAtTime(600, now); osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
    gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.start(now); osc.stop(now + 0.1);
  } else if (type === 'wood') {
    osc.type = 'triangle'; osc.frequency.setValueAtTime(300, now);
    gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.start(now); osc.stop(now + 0.08);
  } else if (type === 'alarm') {
    osc.type = 'sine'; osc.frequency.setValueAtTime(500, now); osc.frequency.setValueAtTime(700, now + 0.2);
    gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 1);
    osc.start(now); osc.stop(now + 1);
  }
};

// UI COMPONENTS FOR SETTINGS MENU
const NumberSelector = ({ label, value, onChange, min, max, format = v => v }) => (
  <div className="setting-row">
    <span className="setting-label">{label}</span>
    <div className="selector-control">
      <button className="arrow-btn" onClick={() => onChange(Math.max(min, value - 1))}>❮</button>
      <span className="selector-value">{format(value)}</span>
      <button className="arrow-btn" onClick={() => onChange(Math.min(max, value + 1))}>❯</button>
    </div>
  </div>
);

const PreviewSelector = ({ label, options, current, onChange }) => (
  <div className="setting-row">
    <span className="setting-label">{label}</span>
    <div className="preview-grid">
      {options.map(opt => (
        <div 
          key={opt.id} 
          className={`preview-item ${current === opt.id ? 'active' : ''}`}
          onClick={() => onChange(opt.id)}
          title={opt.name}
          style={opt.style || {}}
        >
          {opt.icon}
        </div>
      ))}
    </div>
  </div>
);

// MAIN APP
export default function App() {
  // Settings (State)
  const[settings, setSettings] = useState({
    focus: 25,
    shortBreak: 5,
    longBreak: 15,
    goal: 4,
    theme: 'theme-midnight',
    anim: 'rocket',
    sound: 'tick'
  });

  // Timer State
  const [mode, setMode] = useState('focus'); // focus, shortBreak, longBreak
  const[timeLeft, setTimeLeft] = useState(settings.focus * 60);
  const[isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [completed, setCompleted] = useState(0);
  
  // UI State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const[clock, setClock] = useState(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));

  // References
  const timerRef = useRef(null);

  // Clock update
  useEffect(() => {
    const int = setInterval(() => setClock(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})), 1000);
    return () => clearInterval(int);
  },[]);

  // Apply Theme to Body
  useEffect(() => {
    document.body.className = settings.theme;
  }, [settings.theme]);

  // Handle Mode Change
  useEffect(() => {
    setIsRunning(false);
    let totalSecs = settings.focus * 60;
    if (mode === 'shortBreak') totalSecs = settings.shortBreak * 60;
    if (mode === 'longBreak') totalSecs = settings.longBreak * 60;
    setTimeLeft(totalSecs);
    setProgress(0);
  },[mode, settings.focus, settings.shortBreak, settings.longBreak]);

  // Timer Interval Logic
  useEffect(() => {
    if (isRunning) {
      if(audioCtx.state === 'suspended') audioCtx.resume(); // Resume Audio API on user action

      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleEnd();
            return 0;
          }
          playSound(settings.sound);
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, settings.sound]);

  // Calculate percentage for SVG ring and animations
  useEffect(() => {
    let total = settings.focus * 60;
    if (mode === 'shortBreak') total = settings.shortBreak * 60;
    if (mode === 'longBreak') total = settings.longBreak * 60;
    
    const p = ((total - timeLeft) / total) * 100;
    setProgress(p);
  }, [timeLeft, mode, settings]);

  const handleEnd = () => {
    setIsRunning(false);
    playSound('alarm');
    if (mode === 'focus') {
      const newCompleted = completed + 1;
      setCompleted(newCompleted);
      if (newCompleted % settings.goal === 0) setMode('longBreak');
      else setMode('shortBreak');
    } else {
      setMode('focus');
    }
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    setIsRunning(false);
    setMode('focus');
    setTimeLeft(settings.focus * 60);
    setProgress(0);
  };

  // Helper functions for visuals
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Dynamic center animation
  const renderAnimation = () => {
    const p = progress;
    switch(settings.anim) {
      case 'rocket': return <div style={{transform: `translateY(${20 - (p/100)*40}px)`, opacity: p > 5 ? 1 : 0.5}}>🚀</div>;
      case 'plant': return <div>{p < 25 ? '🌰' : p < 50 ? '🌱' : p < 80 ? '🌿' : '🌳'}</div>;
      case 'sun': return <div style={{transform: `rotate(${(p/100)*180}deg)`}}>☀️</div>;
      case 'battery': return <div>{p < 20 ? '🪫' : p < 95 ? '🔋' : '⚡'}</div>;
      case 'mountain': return <div style={{transform: `translateX(${-20 + (p/100)*40}px) translateY(${- (p/100)*20}px)`}}>🧗</div>;
      default: return null;
    }
  };

  // SVG Ring parameters
  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="widget-container">
      
      {/* Top Bar (Clock and Settings) */}
      <div className="top-bar">
        <div className="widget-clock">{clock}</div>
        <button className="icon-btn" onClick={() => setIsSettingsOpen(true)}>
          <SettingsIcon />
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <div className={`tab ${mode === 'focus' ? 'active' : ''}`} onClick={() => setMode('focus')}>Focus</div>
        <div className={`tab ${mode === 'shortBreak' ? 'active' : ''}`} onClick={() => setMode('shortBreak')}>Short Break</div>
        <div className={`tab ${mode === 'longBreak' ? 'active' : ''}`} onClick={() => setMode('longBreak')}>Long Break</div>
      </div>

      {/* Center - Countdown */}
      <div className="timer-section">
        <div className="timer-circle-wrapper">
          <svg className="timer-svg" viewBox="0 0 280 280">
            <circle className="timer-bg-path" cx="140" cy="140" r={radius} />
            <circle 
              className="timer-path" 
              cx="140" cy="140" r={radius} 
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <div className="timer-content">
            <div className="time-text">{formatTime(timeLeft)}</div>
            <div className="center-anim-wrapper">
              {renderAnimation()}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="controls">
        <button className="sec-btn" onClick={resetTimer}><ResetIcon /></button>
        <button className="main-btn" onClick={toggleTimer}>
          {isRunning ? <PauseIcon /> : <PlayIcon />}
        </button>
        {/* Empty placeholder to keep the flex layout centered */}
        <div className="sec-btn" style={{opacity: 0, pointerEvents: 'none'}}></div> 
      </div>

      {/* Goal Tracker */}
      <div className="goal-tracker">
        {Array.from({ length: settings.goal }).map((_, i) => (
          <div key={i} className={`goal-dot ${i < completed % settings.goal ? 'filled' : ''}`} />
        ))}
      </div>

      {/* SETTINGS MODAL (Glass Overlay) */}
      <div className={`settings-overlay ${isSettingsOpen ? 'open' : ''}`}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="icon-btn" onClick={() => setIsSettingsOpen(false)}>
            <CloseIcon />
          </button>
        </div>

        <div style={{overflowY: 'auto', paddingRight: '10px'}}>
          <NumberSelector label="Focus (min)" value={settings.focus} min={1} max={90} format={v => `${v}m`} 
            onChange={v => setSettings({...settings, focus: v})} />
          
          <NumberSelector label="Short break (min)" value={settings.shortBreak} min={1} max={15} format={v => `${v}m`}
            onChange={v => setSettings({...settings, shortBreak: v})} />
            
          <NumberSelector label="Long break (min)" value={settings.longBreak} min={5} max={45} format={v => `${v}m`}
            onChange={v => setSettings({...settings, longBreak: v})} />
            
          <NumberSelector label="Daily Goal (Sessions)" value={settings.goal} min={2} max={10} 
            onChange={v => setSettings({...settings, goal: v})} />

          <PreviewSelector 
            label="Theme (Style)" 
            current={settings.theme} 
            onChange={v => setSettings({...settings, theme: v})}
            options={[
              {id: 'theme-midnight', name: 'Midnight', style: {background: '#1e1b4b'}, icon: '🌌'},
              {id: 'theme-nature', name: 'Nature', style: {background: '#064e3b'}, icon: '🌲'},
              {id: 'theme-sunset', name: 'Sunset', style: {background: '#db2777'}, icon: '🌇'},
              {id: 'theme-minimal', name: 'Minimal', style: {background: '#111'}, icon: '⚫'},
              {id: 'theme-lofi', name: 'LoFi', style: {background: '#831843'}, icon: '🎧'}
            ]}
          />

          <PreviewSelector 
            label="Countdown Animation" 
            current={settings.anim} 
            onChange={v => setSettings({...settings, anim: v})}
            options={[
              {id: 'rocket', name: 'Rocket', icon: '🚀'},
              {id: 'plant', name: 'Plant', icon: '🌱'},
              {id: 'sun', name: 'Sun', icon: '☀️'},
              {id: 'battery', name: 'Battery', icon: '🔋'},
              {id: 'mountain', name: 'Climber', icon: '🧗'}
            ]}
          />

          <PreviewSelector 
            label="Tick Sound" 
            current={settings.sound} 
            onChange={v => { setSettings({...settings, sound: v}); playSound(v); }} // Preview sound on click!
            options={[
              {id: 'none', name: 'Mute', icon: '🔇'},
              {id: 'tick', name: 'Clock', icon: '⏱️'},
              {id: 'pop', name: 'Pop', icon: '💧'},
              {id: 'wood', name: 'Wood', icon: '🪵'}
            ]}
          />
        </div>
      </div>

    </div>
  );
}