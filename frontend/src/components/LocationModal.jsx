import React, { useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';

export default function LocationModal({ onComplete }) {
  const [manualLoc, setManualLoc] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGPS = () => {
    setLoading(true);
    if (!navigator.geolocation) {
       alert("Geolocation is not supported by your browser.");
       setLoading(false);
       return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onComplete({ lat: pos.coords.latitude, lon: pos.coords.longitude, manual: null });
      },
      (err) => {
        alert("Unable to retrieve location. Please type it manually.");
        setLoading(false);
      }
    );
  };

  const handleManual = (e) => {
    e.preventDefault();
    if(manualLoc.trim()) {
      onComplete({ lat: null, lon: null, manual: manualLoc.trim() });
    }
  };

  return (
      <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(11, 15, 25, 0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
      }} className="anim-fade-in">
        <div className="glass glass-panel" style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <MapPin size={40} className="text-primary" style={{ margin: '0 auto 12px' }} />
            <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Where is the emergency?</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              We need your location to dispatch the nearest help and evaluate connectivity.
            </p>
          </div>

          <button 
             onClick={handleGPS} 
             disabled={loading}
             className="send-btn"
             style={{
               width: '100%', padding: '12px',
               borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
               fontWeight: 500, transition: 'background 0.2s', opacity: loading ? 0.7 : 1
             }}>
             <Navigation size={18} /> {loading ? "Locating..." : "Use Current Location (GPS)"}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
            <span style={{ padding: '0 12px' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
          </div>

          <form onSubmit={handleManual} style={{ display: 'flex', gap: '8px' }}>
            <input 
              value={manualLoc}
              onChange={e => setManualLoc(e.target.value)}
              placeholder="e.g. NH7 Krishnagiri, or Bangalore"
              className="chat-input"
              style={{
                flex: 1, padding: '12px', borderRadius: '8px'
              }}
            />
            <button 
              type="submit"
              disabled={!manualLoc.trim()}
              style={{
                background: 'rgba(255,255,255,0.1)', color: 'white', padding: '0 16px',
                borderRadius: '8px', border: '1px solid var(--glass-border)',
                opacity: !manualLoc.trim() ? 0.5 : 1, cursor: !manualLoc.trim() ? 'not-allowed' : 'pointer'
              }}>
              Done
            </button>
          </form>
        </div>
      </div>
  );
}
