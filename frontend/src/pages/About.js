import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, Brain, Shield, Zap, BarChart3, Target,
  Github, Mail, Sparkles, Code2, Database, Globe, Cpu,
  ArrowUpRight, Heart
} from 'lucide-react';
import './About.css';

const FEATURES = [
  { icon: Brain,    color:'#00e5a0', label:'AI Categorisation',  desc:'Reads UPI IDs and merchant names to auto-tag every transaction across 12 categories.' },
  { icon: BarChart3,color:'#4d8ef8', label:'Expense Forecasting', desc:'Trend-weighted rolling average predicts next month spend per category.' },
  { icon: Zap,      color:'#b57cf8', label:'Anomaly Detection',  desc:'Z-score statistics flag statistically unusual transactions in real time.' },
  { icon: Shield,   color:'#ffb547', label:'Bank-Grade Security', desc:'15-min JWT access tokens, 7-day refresh tokens, bcrypt-hashed passwords.' },
  { icon: Target,   color:'#ff6b6b', label:'Goal Tracking',      desc:'Visual savings goals with milestone progress and auto-calculation.' },
  { icon: TrendingUp,color:'#00e5a0',label:'Live Dashboard',     desc:'6-month income vs expense area charts, spending pie breakdown, AI insights.' },
];

const STACK = [
  { icon: Code2,    label:'Frontend',   color:'#4d8ef8', items:['React 18', 'Framer Motion', 'Recharts', 'Outfit + Plus Jakarta'] },
  { icon: Globe,    label:'Backend',    color:'#00e5a0', items:['Node.js', 'Express.js', 'JWT Auth', 'CSV Multer'] },
  { icon: Database, label:'Database',   color:'#b57cf8', items:['MongoDB Atlas', 'Mongoose ODM', 'Aggregations', 'Indexing'] },
  { icon: Cpu,      label:'ML Service', color:'#ffb547', items:['Python FastAPI', 'Pandas / NumPy', 'Scikit-learn', 'NLP Engine'] },
];

const STATS = [
  { v:'3',    l:'Microservices' },
  { v:'12',   l:'Smart Categories' },
  { v:'100%', l:'Free & Open Source' },
  { v:'∞',    l:'Transactions' },
];

const SKILLS = ['React.js','Node.js','Python','MongoDB','FastAPI','Machine Learning','REST APIs','UI/UX Design'];

const fade = (delay=0) => ({ initial:{opacity:0,y:20}, animate:{opacity:1,y:0}, transition:{delay, duration:0.5, ease:[0.4,0,0.2,1]} });

export default function About() {
  const canvasRef = useRef(null);

  // Particle network
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    const ctx = canvas.getContext('2d');
    const pts = Array.from({length:55}, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random()-0.5)*0.5,
      vy: (Math.random()-0.5)*0.5,
      r: Math.random()*1.8+0.8,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      pts.forEach(p => {
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0||p.x>canvas.width)  p.vx*=-1;
        if(p.y<0||p.y>canvas.height) p.vy*=-1;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle='rgba(0,229,160,0.5)'; ctx.fill();
      });
      for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++) {
        const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y, d=Math.sqrt(dx*dx+dy*dy);
        if(d<110) {
          ctx.beginPath(); ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y);
          ctx.strokeStyle=`rgba(77,142,248,${0.15*(1-d/110)})`; ctx.lineWidth=1; ctx.stroke();
        }
      }
      raf=requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize',resize); };
  }, []);

  return (
    <div className="about-page">

      {/* ── HERO ── */}
      <motion.div className="ab-hero" {...fade()}>
        <canvas ref={canvasRef} className="ab-canvas" />
        <div className="ab-hero-inner">
          <div className="ab-logo-ring">
            <div className="ab-logo-core"><TrendingUp size={30} color="#fff" strokeWidth={2.5} /></div>
          </div>
          <h1 className="ab-title">FinanceAI</h1>
          <p className="ab-subtitle">AI-Powered Personal Finance Intelligence</p>
          <p className="ab-hero-p">
            A full-stack intelligent finance platform that understands your money — auto-categorises
            UPI transactions, predicts future spending, and detects anomalies using real machine learning.
          </p>
        </div>
      </motion.div>

      {/* ── STATS ── */}
      <div className="ab-stats">
        {STATS.map((s,i) => (
          <motion.div key={i} className="ab-stat" {...fade(i*0.08)}>
            <div className="ab-stat-v">{s.v}</div>
            <div className="ab-stat-l">{s.l}</div>
          </motion.div>
        ))}
      </div>

      {/* ── CREATOR ── */}
      <motion.div className="ab-creator" {...fade(0.2)}>
        <div className="ab-creator-glow" />
        <div className="ab-creator-body">
          <div className="ab-av-wrap">
            <div className="ab-av">AK</div>
            <div className="ab-av-ring" />
          </div>
          <div className="ab-creator-info">
            <div className="ab-made-by"><Sparkles size={13} /> Made with <Heart size={12} fill="var(--red)" color="var(--red)" /> by</div>
            <h2 className="ab-name">Anisha Kumari</h2>
            <p className="ab-bio">
              Full-Stack Developer & Data Science Enthusiast passionate about combining
              modern web technologies with machine learning to build intelligent, user-first
              applications that make complex problems beautifully simple.
            </p>
            <div className="ab-skills">
              {SKILLS.map(s => <span key={s} className="ab-skill-tag">{s}</span>)}
            </div>
            <div className="ab-links">
              <a href="mailto:anisha10021kumari@gmail.com" className="ab-link">
                <Mail size={14} /> Contact Me <ArrowUpRight size={13} />
              </a>
              <a href="https://github.com/AnishaKumari6/FinanceAI-AI-Powered-Personal-Finance-Dashboard" target="_blank" rel="noreferrer" className="ab-link secondary">
                <Github size={14} /> GitHub <ArrowUpRight size={13} />
              </a>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── FEATURES ── */}
      <div className="ab-section">
        <motion.div className="ab-sec-head" {...fade(0.25)}>
          <h2 className="ab-sec-title">What It Does</h2>
          <p className="ab-sec-sub">Six intelligent features working together</p>
        </motion.div>
        <div className="ab-features">
          {FEATURES.map((f,i) => (
            <motion.div key={i} className="ab-feature-card" {...fade(0.08*i)}
              style={{'--fc':f.color}}>
              <div className="ab-feature-icon"><f.icon size={22} /></div>
              <h3 className="ab-feature-label">{f.label}</h3>
              <p className="ab-feature-desc">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── STACK ── */}
      <div className="ab-section">
        <motion.div className="ab-sec-head" {...fade(0.3)}>
          <h2 className="ab-sec-title">Tech Stack</h2>
          <p className="ab-sec-sub">Four services, one cohesive system</p>
        </motion.div>
        <div className="ab-stack">
          {STACK.map((t,i) => (
            <motion.div key={i} className="ab-stack-card" {...fade(0.08*i)} style={{'--sc':t.color}}>
              <div className="ab-stack-header">
                <div className="ab-stack-icon"><t.icon size={17} /></div>
                <span className="ab-stack-label">{t.label}</span>
              </div>
              {t.items.map(item => (
                <div key={item} className="ab-stack-item">
                  <span className="ab-stack-dot" />
                  {item}
                </div>
              ))}
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── ARCHITECTURE ── */}
      <motion.div className="ab-arch" {...fade(0.35)}>
        <h2 className="ab-sec-title" style={{marginBottom:20}}>Architecture</h2>
        <div className="ab-arch-flow">
          {[
            {e:'⚛️', l:'React',      s:'Vercel CDN',   c:'#4d8ef8'},
            {e:'🟢', l:'Node API',   s:'Render',        c:'#00e5a0'},
            {e:'🐍', l:'Python ML',  s:'Render',        c:'#b57cf8'},
            {e:'🍃', l:'MongoDB',    s:'Atlas Cloud',   c:'#ffb547'},
          ].map((n,i) => (
            <React.Fragment key={i}>
              <div className="ab-arch-node" style={{borderColor:n.c, boxShadow:`0 0 16px ${n.c}22`}}>
                <div className="ab-arch-emoji">{n.e}</div>
                <div className="ab-arch-name">{n.l}</div>
                <div className="ab-arch-srv">{n.s}</div>
              </div>
              {i < 3 && <div className="ab-arch-arrow">→</div>}
            </React.Fragment>
          ))}
        </div>
      </motion.div>

      {/* ── FOOTER ── */}
      <motion.footer className="ab-foot" {...fade(0.4)}>
        <div className="ab-foot-logo"><TrendingUp size={15} /><span>FinanceAI</span></div>
        <p>React · Node.js · Python · MongoDB Atlas</p>
        <p className="ab-foot-credit">© 2025 Anisha Kumari — All rights reserved</p>
      </motion.footer>
    </div>
  );
}