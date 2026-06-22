/**
 * AuthModal.tsx — UI de autenticación (nuevo requerimiento 2026-06-14)
 *
 * Login y registro con Email/Password + Google Sign-In.
 * Prerrequisito: AuthProvider.tsx envuelve la app y expone useAuth().
 * Registro: crea cuenta Firebase + doc Firestore users/{uid} (§7 — Free nace en nube).
 * Política de contraseñas: ≥8 chars, 1 mayúscula, 1 número (Constitución P9/P57).
 */

import React, { useState, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { useAuth } from '../core/AuthProvider';

// ── Tipos ─────────────────────────────────────────────────────────────────────

type Mode = 'login' | 'register';

const PASS_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

// ── Componente principal ──────────────────────────────────────────────────────

export default function AuthModal() {
  const { signInEmail, signInGoogle } = useAuth();

  const [mode, setMode]             = useState<Mode>('login');
  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const formId = useId();

  const clearError = () => setError(null);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setName('');
    setPassword('');
    setConfirmPass('');
  };

  // ── Google ─────────────────────────────────────────────────────────────────

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInGoogle();
      // onAuthStateChanged en AuthProvider recibe al usuario y lo setea
    } catch (e: any) {
      setError(friendlyError(e?.code));
      setLoading(false);
    }
  };

  // ── Email / contraseña ─────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'register') {
      if (!PASS_REGEX.test(password)) {
        setError('La contraseña necesita mínimo 8 caracteres, 1 mayúscula y 1 número.');
        return;
      }
      if (password !== confirmPass) {
        setError('Las contraseñas no coinciden.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await signInEmail(email, password);
        // AuthProvider detecta el cambio vía onAuthStateChanged
      } else {
        // Registro — dynamic import para mantener mockup compatible
        const { getFirebaseAuth, getDb } = await import('../core/firebase');
        const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
        const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');

        const auth     = getFirebaseAuth();
        const nombreFinal = name.trim() || email.split('@')[0];
        const cred     = await createUserWithEmailAndPassword(auth, email, password);

        // Nombre en Firebase Auth (para displayName)
        await updateProfile(cred.user, { displayName: nombreFinal });

        // Documento Firestore users/{uid} — Free desde creación (§7)
        await setDoc(doc(getDb(), 'users', cred.user.uid), {
          email:       email.trim().toLowerCase(),
          nombre:      nombreFinal,
          plan:        'free',
          compPremium: false,
          estado:      'activo',
          createdAt:   serverTimestamp(),
        });
        // onAuthStateChanged lee el doc recién creado y setea el usuario
      }
    } catch (e: any) {
      setError(friendlyError(e?.code));
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{
      position:       'fixed',
      inset:          0,
      zIndex:         9999,
      background:     'var(--background)',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        20,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="bg-card border-theme shadow-hard"
        style={{ width: '100%', maxWidth: 400 }}
      >
        {/* ── Header */}
        <div
          className="bg-muted"
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          12,
            padding:      '15px 20px',
            borderBottom: 'var(--border-thickness) solid var(--border)',
          }}
        >
          <div style={{
            width:           32,
            height:          32,
            background:      'var(--primary)',
            color:           'var(--primary-foreground)',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            fontWeight:      900,
            fontSize:        15,
            letterSpacing:   '-0.05em',
            flexShrink:      0,
          }}>
            A
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              ArchiBots
            </div>
            <div className="text-muted-foreground" style={{ fontSize: 10 }}>
              {mode === 'login' ? 'Inicia sesión para continuar' : 'Crea tu cuenta gratuita'}
            </div>
          </div>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* ── Tabs login / registro */}
          <div className="border-theme" style={{ display: 'flex', overflow: 'hidden' }}>
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                style={{
                  flex:            1,
                  padding:         '9px 0',
                  fontSize:        10,
                  fontWeight:      800,
                  textTransform:   'uppercase',
                  letterSpacing:   '0.07em',
                  border:          'none',
                  cursor:          'pointer',
                  background:      mode === m ? 'var(--primary)'           : 'var(--muted)',
                  color:           mode === m ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                  transition:      'background 0.12s, color 0.12s',
                }}
              >
                {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </button>
            ))}
          </div>

          {/* ── Botón Google */}
          <button
            type="button"
            className="ab-btn sec"
            onClick={handleGoogle}
            disabled={loading}
            style={{
              width:           '100%',
              gap:             8,
              justifyContent:  'center',
              padding:         '10px 0',
              fontSize:        11,
            }}
          >
            <GoogleIcon />
            {mode === 'login' ? 'Continuar con Google' : 'Registrarse con Google'}
          </button>

          {/* ── Divisor */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span
              className="text-muted-foreground"
              style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}
            >
              o con correo
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* ── Formulario */}
          <form
            id={formId}
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
            noValidate
          >
            {/* Nombre — solo en registro */}
            <AnimatePresence initial={false}>
              {mode === 'register' && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <FieldLabel>Nombre</FieldLabel>
                  <input
                    className="tech-input"
                    type="text"
                    placeholder="Tu nombre o apodo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    style={{ width: '100%' }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Correo */}
            <div>
              <FieldLabel>Correo electrónico</FieldLabel>
              <input
                className="tech-input"
                type="email"
                required
                placeholder="correo@ejemplo.cl"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearError(); }}
                autoComplete="email"
                style={{ width: '100%' }}
              />
            </div>

            {/* Contraseña */}
            <div>
              <FieldLabel>Contraseña</FieldLabel>
              <div style={{ position: 'relative' }}>
                <input
                  className="tech-input"
                  type={showPass ? 'text' : 'password'}
                  required
                  placeholder={mode === 'register' ? 'Mín. 8 chars, 1 mayúscula, 1 número' : '••••••••'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError(); }}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  style={{ width: '100%', paddingRight: 36 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position:   'absolute',
                    right:      10,
                    top:        '50%',
                    transform:  'translateY(-50%)',
                    background: 'none',
                    border:     'none',
                    cursor:     'pointer',
                    padding:    0,
                    color:      'var(--muted-foreground)',
                    display:    'flex',
                    alignItems: 'center',
                  }}
                  tabIndex={-1}
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPass ? <Icons.EyeOff size={14} /> : <Icons.Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Confirmar contraseña — solo en registro */}
            <AnimatePresence initial={false}>
              {mode === 'register' && (
                <motion.div
                  key="confirm-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <FieldLabel>Confirmar contraseña</FieldLabel>
                  <input
                    className="tech-input"
                    type={showPass ? 'text' : 'password'}
                    required
                    placeholder="Repite la contraseña"
                    value={confirmPass}
                    onChange={(e) => { setConfirmPass(e.target.value); clearError(); }}
                    autoComplete="new-password"
                    style={{ width: '100%' }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* ── Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="auth-error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-destructive text-destructive-foreground"
                style={{
                  padding:    '8px 12px',
                  fontSize:   11,
                  display:    'flex',
                  alignItems: 'flex-start',
                  gap:        7,
                }}
                role="alert"
              >
                <Icons.AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Submit */}
          <button
            form={formId}
            type="submit"
            className="ab-btn"
            disabled={loading}
            style={{
              width:           '100%',
              padding:         '11px 0',
              fontSize:        12,
              justifyContent:  'center',
              gap:             8,
            }}
          >
            {loading
              ? <Icons.Loader2 size={14} style={{ animation: 'ab-spin 0.8s linear infinite' }} />
              : mode === 'login'
                ? <Icons.LogIn size={14} />
                : <Icons.UserPlus size={14} />
            }
            {loading ? 'Procesando…' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>

          {/* ── Footer legal */}
          <p
            className="text-muted-foreground"
            style={{ textAlign: 'center', fontSize: 9, lineHeight: 1.5, margin: 0 }}
          >
            Al continuar aceptas los{' '}
            <a href="/legal/terminos" style={{ color: 'var(--primary)' }} target="_blank" rel="noreferrer">
              Términos de Uso
            </a>{' '}
            y la{' '}
            <a href="/legal/privacidad" style={{ color: 'var(--primary)' }} target="_blank" rel="noreferrer">
              Política de Privacidad
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ── Subcomponentes ────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      fontSize:      10,
      fontWeight:    800,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      display:       'block',
      marginBottom:  4,
      opacity:       0.65,
    }}>
      {children}
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

// ── Mensajes de error legibles ────────────────────────────────────────────────

function friendlyError(code?: string): string {
  const map: Record<string, string> = {
    'auth/user-not-found':         'No existe una cuenta con ese correo.',
    'auth/wrong-password':         'Contraseña incorrecta.',
    'auth/invalid-credential':     'Correo o contraseña incorrectos.',
    'auth/email-already-in-use':   'Ya existe una cuenta con ese correo. Inicia sesión.',
    'auth/invalid-email':          'El correo electrónico no es válido.',
    'auth/weak-password':          'La contraseña es demasiado débil.',
    'auth/too-many-requests':      'Demasiados intentos fallidos. Intenta más tarde.',
    'auth/popup-closed-by-user':   'La ventana de Google fue cerrada. Intenta de nuevo.',
    'auth/popup-blocked':          'El navegador bloqueó la ventana emergente. Permite popups para este sitio.',
    'auth/network-request-failed': 'Error de red. Verifica tu conexión a internet.',
    'auth/user-disabled':          'Esta cuenta ha sido suspendida. Contacta a soporte.',
    'auth/requires-recent-login':  'Por seguridad, vuelve a iniciar sesión.',
  };
  return map[code ?? ''] ?? ('Error al autenticar (' + (code ?? 'desconocido') + ').');
}
