"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loginWithGoogle } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userStatus, setUserStatus] = useState<string>("ALIVE");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let unsubPlayer = () => {};
    if (user?.uid) {
      unsubPlayer = onValue(ref(database, `players/${user.uid}/status`), (snap) => {
        const val = snap.val();
        if (val) setUserStatus(val.toUpperCase());
      });
    }

    return () => {
      unsubPlayer();
    };
  }, [user]);

  // Handle ESC key to close user modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserModalOpen(false);
      }
    };
    if (userModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [userModalOpen]);

  const navLinks = [
    { href: '/', label: 'HOME' },
    { href: '/dashboard', label: 'DASHBOARD' },
    { href: '/lobby', label: 'LOBBY' },
    { href: '/faq', label: 'FAQ' },
  ];

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      setUserModalOpen(false);
      router.push('/');
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
      setUserModalOpen(false);
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'GUEST';
  const initial = (user?.displayName || user?.email || 'OP')[0].toUpperCase();

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-40 bg-[#0e0e0e]/95 backdrop-blur-md border-b border-[#353534]/60 shadow-[0_1px_12px_rgba(0,0,0,0.85)]">
        <div className="h-16 sm:h-20 w-full px-3 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-3">
            <Link 
              href="/" 
              className="flex flex-col text-left group transition-transform hover:opacity-90 shrink-0"
            >
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="font-['Cinzel'] text-base sm:text-lg font-bold text-[#ffb4ab] tracking-[0.2em] sm:tracking-[0.22em] uppercase">
                  SKYNET
                </span>
                <span className="text-[#ff544b] font-mono text-xs sm:text-sm font-black">//</span>
                <span className="font-['Cinzel'] text-base sm:text-lg font-bold text-[#e5e2e1] tracking-[0.2em] sm:tracking-[0.22em] uppercase">
                  BORDERLAND
                </span>
              </div>
              <span className="font-sans text-[9px] sm:text-[10px] tracking-[0.16em] sm:tracking-[0.2em] text-[#af8783] uppercase font-semibold hidden xs:block">
                AIRSPACE RESTRICTED // 20 PLAYERS
              </span>
            </Link>
          </div>

          {/* Center: Desktop Navigation Bar */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`font-mono text-xs uppercase tracking-[0.22em] py-2 px-3.5 transition-all duration-200 relative ${
                    isActive
                      ? 'text-[#ff544b] bg-[#201f1f] border-b-2 border-[#ff544b] font-bold shadow-[inset_0_-8px_12px_rgba(255,84,75,0.1)]'
                      : 'text-[#e9bcb7]/75 hover:text-[#e5e2e1] hover:bg-[#1c1b1b]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: Operative User Button & Mobile Menu Trigger */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Operative User Button (Triggers Profile & Logout Popup) */}
            <button
              onClick={() => setUserModalOpen(true)}
              title="Operative Profile & Session Controls"
              className="flex items-center gap-2 bg-[#1c1b1b] hover:bg-[#252424] border border-[#353534] hover:border-[#ff544b]/60 px-2.5 sm:px-3 py-1.5 transition-all cursor-pointer shadow-sm group"
            >
              {/* Avatar Initial Circle */}
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded bg-[#ff544b]/20 border border-[#ff544b]/50 flex items-center justify-center shrink-0">
                <span className="font-mono text-[11px] sm:text-xs font-bold text-[#ffdad6] group-hover:text-white">
                  {initial}
                </span>
              </div>

              {/* User Label & Status */}
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] text-[#ff544b] font-bold tracking-wider hidden sm:inline">
                    {user ? 'OPERATIVE' : 'GUEST'}
                  </span>
                  <span className="font-mono text-xs text-[#e5e2e1] tracking-wider max-w-[90px] sm:max-w-[130px] truncate font-semibold">
                    {displayName}
                  </span>
                </div>
                {user && (
                  <div className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${userStatus === 'ALIVE' ? 'bg-emerald-400' : 'bg-[#ff544b]'}`} />
                    <span className={`font-sans text-[9px] font-bold tracking-wider ${
                      userStatus === 'ALIVE' ? 'text-emerald-400' : 'text-[#ff544b]'
                    }`}>
                      {userStatus}
                    </span>
                  </div>
                )}
              </div>

              {/* Dropdown Indicator Icon */}
              <span className="text-[#af8783] text-[10px] group-hover:text-[#ff544b] transition-colors ml-0.5">
                ▼
              </span>
            </button>

            {/* Mobile Menu Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#e5e2e1] hover:text-[#ff544b] hover:bg-[#1c1b1b] transition-colors cursor-pointer border border-[#353534]/50"
              aria-label="Toggle Navigation"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Drawer Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#131313] border-b border-[#ff544b]/30 px-4 py-3 space-y-1 shadow-2xl">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full text-left font-mono text-xs uppercase tracking-widest py-2.5 px-3 block transition-colors ${
                    isActive
                      ? 'bg-[#201f1f] text-[#ff544b] border-l-2 border-[#ff544b] font-bold'
                      : 'text-[#e5e2e1] hover:bg-[#1c1b1b]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Mobile Drawer User & Quick Logout */}
            <div className="pt-3 mt-2 border-t border-[#353534] flex items-center justify-between text-xs font-mono">
              <div className="flex flex-col">
                <span className="text-[#af8783] text-[10px] uppercase">AUTHENTICATED AS:</span>
                <span className="text-[#e5e2e1] font-bold truncate max-w-[180px]">{displayName}</span>
              </div>
              {user ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="px-3 py-1.5 bg-[#93000a]/50 hover:bg-[#93000a] text-[#ffdad6] border border-[#ff544b]/50 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  LOGOUT
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogin();
                  }}
                  className="px-3 py-1.5 bg-[#ff544b] hover:bg-[#ffb4ab] text-[#5c0005] text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  LOGIN
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Operative User & Logout Popup Modal */}
      {userModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none"
          onClick={() => setUserModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-md bg-[#131313] border-2 border-[#ff544b]/80 shadow-[0_0_50px_rgba(255,84,75,0.3)] p-5 sm:p-6 font-mono text-[#e5e2e1]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#353534] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff544b] animate-ping" />
                <span className="font-['Cinzel'] text-sm sm:text-base font-bold text-[#ffdad6] uppercase tracking-wider">
                  OPERATIVE DOSSIER // SESSION
                </span>
              </div>
              <button
                onClick={() => setUserModalOpen(false)}
                className="text-xs text-[#af8783] hover:text-white px-2 py-1 bg-[#201f1f] border border-[#353534] cursor-pointer hover:border-[#ff544b]"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Operative Info Card */}
            <div className="bg-[#1c1b1b] border border-[#353534] p-4 mb-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded bg-[#ff544b]/20 border border-[#ff544b] flex items-center justify-center shrink-0">
                  <span className="font-mono text-xl font-bold text-[#ffdad6]">
                    {initial}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#ff544b] uppercase font-bold tracking-wider">
                      {user ? 'IDENTIFIED OPERATIVE' : 'ANONYMOUS GUEST'}
                    </span>
                  </div>
                  <div className="text-base font-bold text-[#ffdad6] truncate">
                    {user?.displayName || displayName}
                  </div>
                  <div className="text-xs text-[#af8783] truncate">
                    {user?.email || 'NO SATELLITE EMAIL REGISTERED'}
                  </div>
                </div>
              </div>

              {/* Status and Telemetry Details */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#353534]/70 text-xs">
                <div>
                  <span className="text-[10px] text-[#af8783] uppercase block">SURVIVAL STATUS</span>
                  <span className={`font-bold uppercase ${
                    userStatus === 'ALIVE' ? 'text-emerald-400' : 'text-[#ff544b]'
                  }`}>
                    {user ? userStatus : 'GUEST VISITOR'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#af8783] uppercase block">CLEARANCE</span>
                  <span className="font-bold text-[#e5e2e1] uppercase">
                    {user ? 'DEFCON 1 RESTRICTED' : 'LEVEL 0 GUEST'}
                  </span>
                </div>
              </div>

              {user?.uid && (
                <div className="pt-2 border-t border-[#353534]/50">
                  <span className="text-[9px] text-[#af8783] uppercase block">OPERATIVE ID HASH</span>
                  <span className="text-[10px] font-mono text-[#e9bcb7] break-all">{user.uid}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-1">
              <button
                onClick={() => setUserModalOpen(false)}
                className="px-4 py-2 bg-[#201f1f] hover:bg-[#2a2a2a] text-xs text-[#af8783] hover:text-white uppercase font-bold transition-colors cursor-pointer border border-[#353534]"
              >
                DISMISS
              </button>

              {user ? (
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="px-5 py-2 bg-[#ff544b] hover:bg-[#ffb4ab] text-[#5c0005] font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>{isLoggingOut ? 'TERMINATING...' : 'LOGOUT // END SESSION'}</span>
                </button>
              ) : (
                <button
                  onClick={handleLogin}
                  className="px-5 py-2 bg-[#ff544b] hover:bg-[#ffb4ab] text-[#5c0005] font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>[ LOGIN WITH GOOGLE ]</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
