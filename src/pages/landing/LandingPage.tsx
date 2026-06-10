import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const features = [
  { icon: '🎓', title: 'Student Management',  desc: 'Enroll, track and manage all student records in one place' },
  { icon: '✅', title: 'Attendance Tracking',  desc: 'Mark and monitor daily attendance with instant reports' },
  { icon: '📊', title: 'Grade Management',     desc: 'Record CA1, CA2 and exam scores with automatic grading' },
  { icon: '💳', title: 'Fee Collection',       desc: 'Track payments, generate receipts and manage fee balances' },
  { icon: '👨‍👩‍👧', title: 'Parent Portal',       desc: 'Parents check results, attendance and school updates' },
  { icon: '📖', title: 'Library Management',   desc: 'Manage book inventory, issue and return tracking' },
  { icon: '📋', title: 'Reports & Analytics',  desc: 'Generate comprehensive academic and financial reports' },
  { icon: '📅', title: 'Events Calendar',      desc: 'Plan and publish school events, holidays and activities' },
];

const slides = [
  {
    url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&auto=format&fit=crop&h=600&q=80',
    tag: 'Glowing Future Academy',
    title: 'Welcome to Glowing Future Academy',
    subtitle: 'A nurturing home for every young learner',
  },
  {
    url: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=1200&auto=format&fit=crop&h=600&q=80',
    tag: 'Our Classrooms',
    title: 'Nurturing Young Minds',
    subtitle: 'Hands-on learning in a warm and caring environment',
  },
  {
    url: 'https://images.unsplash.com/photo-1594608661623-aa0bd3a69799?w=1200&auto=format&fit=crop&h=600&q=80',
    tag: 'Primary Education',
    title: 'Excellence in Primary Education',
    subtitle: 'Building strong foundations for lifelong success',
  },
  {
    url: 'https://images.unsplash.com/photo-1601751818941-571144562843?w=1200&auto=format&fit=crop&h=600&q=80',
    tag: 'Our Values',
    title: 'Strong, Resilient & Bright',
    subtitle: 'Every child deserves the chance to shine',
  },
  {
    url: 'https://images.unsplash.com/photo-1516627145497-ae6968895b40?w=1200&auto=format&fit=crop&h=600&q=80',
    tag: 'School Motto',
    title: 'Glow With Pride',
    subtitle: 'Together we grow, together we glow',
  },
];

export default function LandingPage() {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length);
    }, 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [paused, current]);

  const goTo = (idx: number) => setCurrent((idx + slides.length) % slides.length);
  const prev = () => goTo(current - 1);
  const next = () => goTo(current + 1);

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', overflowX: 'hidden' }}>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatLogo {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-14px); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.08; transform: scale(1); }
          50%       { opacity: 0.18; transform: scale(1.06); }
        }
        @keyframes shimmerText {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes scrollBounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%       { transform: translateX(-50%) translateY(6px); }
        }
        .gfa-fade-up  { animation: fadeUp 0.65s ease forwards; }
        .gfa-float    { animation: floatLogo 4s ease-in-out infinite; }
        .gfa-blob     { animation: pulseGlow 3.5s ease-in-out infinite; }

        .gfa-btn-gold {
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }
        .gfa-btn-gold:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 32px rgba(212,175,55,0.55) !important;
        }
        .gfa-btn-ghost {
          transition: transform 0.22s ease, background 0.22s ease;
        }
        .gfa-btn-ghost:hover {
          transform: translateY(-3px);
          background: rgba(255,255,255,0.14) !important;
        }
        .gfa-card {
          transition: transform 0.28s ease, box-shadow 0.28s ease;
        }
        .gfa-card:hover {
          transform: translateY(-7px);
          box-shadow: 0 20px 48px rgba(212,175,55,0.14) !important;
        }
        .gfa-nav-link {
          transition: background 0.2s, color 0.2s;
        }
        .gfa-nav-link:hover {
          background: rgba(212,175,55,0.12) !important;
          color: #F5C842 !important;
        }

        /* Slideshow */
        @keyframes slideTextIn {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .slide-active-text {
          animation: slideTextIn 0.7s 0.3s ease both;
        }
        .slide-arrow {
          transition: background 0.2s ease, transform 0.2s ease;
        }
        .slide-arrow:hover {
          background: rgba(212,175,55,0.85) !important;
          color: #2c2c2c !important;
          transform: translateY(-50%) scale(1.1);
        }
        .slide-dot {
          transition: all 0.3s ease;
          cursor: pointer;
          border: none;
          padding: 0;
        }
        .slide-dot:hover {
          transform: scale(1.3);
        }
        @keyframes progressBar {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>

      {/* ─────────── HERO ─────────── */}
      <section style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2c2c2c 55%, #3a3a3a 100%)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: '7rem 1.5rem 5rem',
      }}>

        {/* Background blobs */}
        <div className="gfa-blob" style={{
          position: 'absolute', top: '-12%', left: '-8%',
          width: '520px', height: '520px', borderRadius: '50%',
          background: 'radial-gradient(circle, #D4AF37, transparent)',
          pointerEvents: 'none',
        }} />
        <div className="gfa-blob" style={{
          position: 'absolute', bottom: '-18%', right: '-8%',
          width: '640px', height: '640px', borderRadius: '50%',
          background: 'radial-gradient(circle, #D4AF37, transparent)',
          animationDelay: '1.8s',
          pointerEvents: 'none',
        }} />

        {/* Top nav */}
        <nav style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.1rem 1.75rem',
          background: 'rgba(20,20,20,0.65)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(212,175,55,0.12)',
          zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%', overflow: 'hidden',
              border: '2px solid rgba(212,175,55,0.5)', flexShrink: 0,
            }}>
              <img src="/images/gfa-logo.jpeg" alt="GFA" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.02em' }}>
              GFA — Glowing Future Academy
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Link to="/parent-portal" className="gfa-nav-link" style={{
              color: '#D4AF37', fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none',
              padding: '0.45rem 0.9rem', borderRadius: '0.5rem',
              border: '1px solid rgba(212,175,55,0.3)',
            }}>Parent Portal</Link>
            <Link to="/login" className="gfa-btn-gold" style={{
              background: 'linear-gradient(135deg, #D4AF37, #F5C842)',
              color: '#2c2c2c', fontWeight: 800, fontSize: '0.8rem', textDecoration: 'none',
              padding: '0.45rem 1rem', borderRadius: '0.5rem',
              boxShadow: '0 3px 12px rgba(212,175,55,0.35)',
            }}>Admin Login</Link>
          </div>
        </nav>

        {/* Hero body */}
        <div style={{ textAlign: 'center', maxWidth: '720px', width: '100%', position: 'relative', zIndex: 1 }}>

          {/* Logo */}
          <div style={{
            width: '148px', height: '148px', borderRadius: '50%', overflow: 'hidden',
            margin: '0 auto 2rem',
            border: '3px solid rgba(212,175,55,0.65)',
            boxShadow: '0 0 70px rgba(212,175,55,0.3), 0 10px 48px rgba(0,0,0,0.5)',
            background: '#fff',
            opacity: visible ? 1 : 0,
            ...(visible ? { animation: 'fadeUp 0.65s ease forwards, floatLogo 4s ease-in-out 0.65s infinite' } : {}),
          }}>
            <img src="/images/gfa-logo.jpeg" alt="GFA Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          {/* Badge */}
          <div style={{
            display: 'inline-block', marginBottom: '1.2rem',
            padding: '0.35rem 1.1rem', borderRadius: '99px',
            background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.28)',
            color: '#D4AF37', fontSize: '0.7rem', fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            opacity: visible ? 1 : 0,
            animation: visible ? 'fadeUp 0.65s 0.1s ease forwards' : 'none',
          }}>
            Modern School Management System
          </div>

          {/* School name */}
          <h1 style={{
            color: '#fff', fontWeight: 900, lineHeight: 1.08,
            margin: '0 0 0.65rem',
            fontSize: 'clamp(2.2rem, 6vw, 3.75rem)',
            opacity: visible ? 1 : 0,
            animation: visible ? 'fadeUp 0.65s 0.18s ease forwards' : 'none',
          }}>
            Glowing Future<br />
            <span style={{
              background: 'linear-gradient(90deg, #D4AF37 0%, #F5C842 50%, #D4AF37 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'shimmerText 3.5s linear infinite',
              display: 'inline-block',
            }}>
              Academy
            </span>
          </h1>

          {/* Motto */}
          <p style={{
            color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem', fontStyle: 'italic',
            marginBottom: '0.5rem',
            opacity: visible ? 1 : 0,
            animation: visible ? 'fadeUp 0.65s 0.26s ease forwards' : 'none',
          }}>
            "Glow With Pride"
          </p>
          <p style={{
            color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem',
            marginBottom: '2.75rem',
            opacity: visible ? 1 : 0,
            animation: visible ? 'fadeUp 0.65s 0.3s ease forwards' : 'none',
          }}>
            Empowering educators · Connecting families · Building futures
          </p>

          {/* CTA Buttons */}
          <div style={{
            display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap',
            opacity: visible ? 1 : 0,
            animation: visible ? 'fadeUp 0.65s 0.38s ease forwards' : 'none',
          }}>
            <Link to="/login" className="gfa-btn-gold" style={{
              background: 'linear-gradient(135deg, #D4AF37, #F5C842)',
              color: '#2c2c2c', fontWeight: 800, fontSize: '0.95rem',
              padding: '1rem 2.25rem', borderRadius: '0.9rem',
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              boxShadow: '0 6px 28px rgba(212,175,55,0.45)',
              letterSpacing: '0.01em',
            }}>
              🔐 Admin Login
            </Link>
            <Link to="/parent-portal" className="gfa-btn-ghost" style={{
              background: 'rgba(255,255,255,0.07)',
              color: '#fff', fontWeight: 700, fontSize: '0.95rem',
              padding: '1rem 2.25rem', borderRadius: '0.9rem',
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              border: '1px solid rgba(255,255,255,0.18)',
              boxShadow: '0 4px 18px rgba(0,0,0,0.25)',
              letterSpacing: '0.01em',
            }}>
              👨‍👩‍👧 Parent Portal
            </Link>
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{
          position: 'absolute', bottom: '1.75rem', left: '50%',
          animation: 'scrollBounce 2s ease-in-out infinite',
          color: 'rgba(212,175,55,0.45)', fontSize: '1.4rem',
        }}>↓</div>
      </section>

      {/* ─────────── SLIDESHOW ─────────── */}
      <section
        style={{ position: 'relative', width: '100%', height: 'clamp(300px, 42vw, 500px)', overflow: 'hidden', background: '#111' }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Slides */}
        {slides.map((slide, idx) => (
          <div key={idx} style={{
            position: 'absolute', inset: 0,
            opacity: idx === current ? 1 : 0,
            transition: 'opacity 0.9s ease',
            zIndex: idx === current ? 1 : 0,
          }}>
            {/* Photo */}
            <img
              src={slide.url}
              alt={slide.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              loading={idx === 0 ? 'eager' : 'lazy'}
            />

            {/* Gradient overlay — bottom-heavy for text legibility */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(20,16,8,0.88) 0%, rgba(20,16,8,0.35) 50%, rgba(20,16,8,0.1) 100%)',
            }} />

            {/* Gold left accent bar */}
            <div style={{
              position: 'absolute', left: 0, top: '15%', bottom: '15%',
              width: '4px',
              background: 'linear-gradient(to bottom, transparent, #D4AF37, transparent)',
              opacity: idx === current ? 1 : 0,
              transition: 'opacity 0.9s ease',
            }} />

            {/* Text overlay */}
            {idx === current && (
              <div className="slide-active-text" style={{
                position: 'absolute', bottom: '3.5rem', left: 0, right: 0,
                padding: '0 2rem',
                zIndex: 2,
              }}>
                <span style={{
                  display: 'inline-block', marginBottom: '0.6rem',
                  padding: '0.25rem 0.875rem', borderRadius: '99px',
                  background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.45)',
                  color: '#F5C842', fontSize: '0.7rem', fontWeight: 700,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                }}>
                  {slide.tag}
                </span>
                <h2 style={{
                  color: '#fff', fontWeight: 900, margin: '0 0 0.4rem',
                  fontSize: 'clamp(1.4rem, 3.5vw, 2.25rem)', lineHeight: 1.15,
                  textShadow: '0 2px 12px rgba(0,0,0,0.5)',
                }}>
                  {slide.title}
                </h2>
                <p style={{
                  color: 'rgba(255,255,255,0.75)', margin: 0,
                  fontSize: 'clamp(0.8rem, 1.8vw, 1rem)', fontWeight: 400,
                  textShadow: '0 1px 6px rgba(0,0,0,0.4)',
                }}>
                  {slide.subtitle}
                </p>
              </div>
            )}
          </div>
        ))}

        {/* Progress bar */}
        {!paused && (
          <div style={{
            position: 'absolute', top: 0, left: 0, height: '3px', zIndex: 10,
            background: 'linear-gradient(90deg, #D4AF37, #F5C842)',
            animation: 'progressBar 4s linear forwards',
          }} key={current} />
        )}

        {/* Left arrow */}
        <button
          onClick={prev}
          className="slide-arrow"
          aria-label="Previous slide"
          style={{
            position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
            zIndex: 10, width: '44px', height: '44px', borderRadius: '50%',
            background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.18)',
            color: '#fff', fontSize: '1.4rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', backdropFilter: 'blur(4px)',
            lineHeight: 1,
          }}
        >‹</button>

        {/* Right arrow */}
        <button
          onClick={next}
          className="slide-arrow"
          aria-label="Next slide"
          style={{
            position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
            zIndex: 10, width: '44px', height: '44px', borderRadius: '50%',
            background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.18)',
            color: '#fff', fontSize: '1.4rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', backdropFilter: 'blur(4px)',
            lineHeight: 1,
          }}
        >›</button>

        {/* Dot indicators */}
        <div style={{
          position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: '0.5rem', alignItems: 'center', zIndex: 10,
        }}>
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className="slide-dot"
              aria-label={`Go to slide ${idx + 1}`}
              style={{
                width: idx === current ? '24px' : '8px',
                height: '8px',
                borderRadius: '99px',
                background: idx === current
                  ? 'linear-gradient(90deg, #D4AF37, #F5C842)'
                  : 'rgba(255,255,255,0.4)',
                boxShadow: idx === current ? '0 0 8px rgba(212,175,55,0.6)' : 'none',
              }}
            />
          ))}
        </div>

        {/* Slide counter */}
        <div style={{
          position: 'absolute', top: '1rem', right: '1rem', zIndex: 10,
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
          border: '1px solid rgba(212,175,55,0.25)',
          borderRadius: '99px', padding: '0.25rem 0.75rem',
          color: '#D4AF37', fontSize: '0.72rem', fontWeight: 700,
        }}>
          {current + 1} / {slides.length}
        </div>
      </section>

      {/* ─────────── FEATURES ─────────── */}
      <section style={{ background: '#f5f6fa', padding: '5.5rem 1.5rem' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span style={{
              display: 'inline-block', marginBottom: '1rem',
              padding: '0.35rem 1.1rem', borderRadius: '99px',
              background: 'rgba(212,175,55,0.12)', color: '#B8860B',
              fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
            }}>Everything You Need</span>
            <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.4rem)', fontWeight: 900, color: '#2c2c2c',
              margin: '0 0 0.875rem' }}>
              Powerful School Management Tools
            </h2>
            <p style={{ color: '#6b7280', fontSize: '1rem', maxWidth: '540px', margin: '0 auto', lineHeight: 1.65 }}>
              Everything you need to run a modern, efficient and transparent school — all in one system
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map(({ icon, title, desc }, idx) => (
              <div key={title} className="gfa-card" style={{
                background: '#fff', borderRadius: '1.25rem', padding: '1.75rem 1.5rem',
                boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)',
                animationDelay: `${idx * 0.06}s`,
              }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '0.875rem', marginBottom: '1.1rem',
                  background: 'linear-gradient(135deg, #2c2c2c, #4a4a4a)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                }}>
                  {icon}
                </div>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1f2937',
                  margin: '0 0 0.5rem', lineHeight: 1.3 }}>{title}</h3>
                <p style={{ fontSize: '0.81rem', color: '#6b7280', lineHeight: 1.65, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── BOTTOM CTA ─────────── */}
      <section style={{
        background: 'linear-gradient(135deg, #1e1e1e 0%, #2c2c2c 50%, #3a3a3a 100%)',
        padding: '5.5rem 1.5rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '700px', height: '700px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.07), transparent)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '580px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            marginBottom: '1.5rem', padding: '0.35rem 1.1rem', borderRadius: '99px',
            background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)',
            color: '#D4AF37', fontSize: '0.7rem', fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
          }}>
            ✨ Get Started Today
          </div>
          <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.25rem)', fontWeight: 900, color: '#fff',
            margin: '0 0 1rem', lineHeight: 1.15 }}>
            Ready to Transform<br />Your School Management?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2.5rem', lineHeight: 1.7, fontSize: '0.95rem' }}>
            Log in to manage your school, or check your child's progress through the Parent Portal.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login" className="gfa-btn-gold" style={{
              background: 'linear-gradient(135deg, #D4AF37, #F5C842)',
              color: '#2c2c2c', fontWeight: 800, fontSize: '0.95rem',
              padding: '0.95rem 2.25rem', borderRadius: '0.9rem', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              boxShadow: '0 6px 28px rgba(212,175,55,0.4)',
            }}>🔐 Admin Login</Link>
            <Link to="/parent-portal" className="gfa-btn-ghost" style={{
              background: 'rgba(255,255,255,0.07)',
              color: '#fff', fontWeight: 700, fontSize: '0.95rem',
              padding: '0.95rem 2.25rem', borderRadius: '0.9rem', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              border: '1px solid rgba(255,255,255,0.15)',
            }}>👨‍👩‍👧 Parent Portal</Link>
          </div>
        </div>
      </section>

      {/* ─────────── FOOTER ─────────── */}
      <footer style={{
        background: '#111', padding: '2rem 1.5rem',
        borderTop: '1px solid rgba(212,175,55,0.1)',
      }}>
        <div style={{
          maxWidth: '960px', margin: '0 auto',
          display: 'flex', flexWrap: 'wrap',
          alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden',
              border: '2px solid rgba(212,175,55,0.4)', flexShrink: 0,
            }}>
              <img src="/images/gfa-logo.jpeg" alt="GFA" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <p style={{ color: '#fff', fontWeight: 800, fontSize: '0.9rem', margin: 0 }}>Glowing Future Academy</p>
              <p style={{ color: '#D4AF37', fontSize: '0.75rem', fontStyle: 'italic', margin: '0.1rem 0 0' }}>Glow With Pride</p>
            </div>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', margin: 0 }}>
            © 2026 GFA · All rights reserved · Built by Fade
          </p>
        </div>
      </footer>

    </div>
  );
}
