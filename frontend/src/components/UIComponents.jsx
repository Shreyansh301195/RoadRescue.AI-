import React from 'react';
import { CheckCircle2, CircleDashed, Loader2, AlertCircle, Phone, Navigation } from 'lucide-react';

export const AgentStatus = ({ agentName, status, message }) => {
  const getIcon = () => {
    switch(status) {
      case 'running': return <Loader2 className="animate-spin text-blue-400" size={18} />;
      case 'success': return <CheckCircle2 className="text-emerald-400" size={18} />;
      case 'error': return <AlertCircle className="text-red-400" size={18} />;
      default: return <CircleDashed className="text-gray-500" size={18} />;
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      background: 'rgba(255, 255, 255, 0.03)',
      borderRadius: '8px',
      borderLeft: `2px solid ${status === 'running' ? '#3b82f6' : status === 'success' ? '#10b981' : 'transparent'}`,
      marginBottom: '8px',
      transition: 'all 0.3s ease'
    }} className="anim-fade-in">
      {getIcon()}
      <div style={{ flex: 1 }}>
        <h4 style={{ fontSize: '14px', color: '#e6e9f0', margin: 0 }}>{agentName}</h4>
        {message && <p style={{ fontSize: '13px', color: '#94a1b2', margin: 0 }}>{message}</p>}
      </div>
    </div>
  );
};

export const VendorCard = ({ vendor }) => {
  return (
    <div style={{
      padding: '16px',
      background: 'rgba(16, 185, 129, 0.05)',
      border: '1px solid rgba(16, 185, 129, 0.2)',
      borderRadius: '12px',
      marginTop: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }} className="anim-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>{vendor.name}</h3>
        <span style={{ 
          background: 'rgba(16, 185, 129, 0.2)', 
          color: '#34d399',
          padding: '4px 8px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 600
        }}>
          {vendor.eta_display}
        </span>
      </div>
      
      <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#94a1b2' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Navigation size={14} /> {vendor.distance_km} km
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Phone size={14} /> {vendor.phone}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
        {vendor.specializations?.map(spec => (
          <span key={spec} style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#cbd5e1'
          }}>{spec}</span>
        ))}
      </div>
    </div>
  );
};
