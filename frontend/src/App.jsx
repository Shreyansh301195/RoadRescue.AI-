import React, { useState, useEffect, useRef } from 'react';
import { Send, Map, Key, TerminalSquare, AlertTriangle } from 'lucide-react';
import { AgentStatus, VendorCard } from './components/UIComponents';
import LocationModal from './components/LocationModal';
import './App.css';

export default function App() {
  const [messages, setMessages] = useState([
    { role: 'sys', text: "Welcome to RoadRescue.AI. Please describe your emergency, location, or upload a photo." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agentStates, setAgentStates] = useState({});
  const [llmProvider, setLlmProvider] = useState('gemini-2.0-flash');
  const [fallbackTriggered, setFallbackTriggered] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const chatEndRef = useRef(null);

  // Initialize all agents purely for display
  const orderedAgents = [
    "FallbackMonitorAgent",
    "LocationAgent",
    "TriageAgent",
    "AvailabilityAgent",
    "RescueDispatchAgent",
    "GuidanceAgent",
    "NotificationAgent"
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, agentStates]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Clear old state for new run
    setAgentStates({});
    setFallbackTriggered(false);
    setLlmProvider('gemini-2.0-flash');
    
    setMessages(prev => [...prev, { role: 'user', text: input }]);
    setIsLoading(true);
    
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';
      let url = `${apiBaseUrl}/api/orchestrate?description=${encodeURIComponent(input)}`;
      if (userLocation) {
         if (userLocation.manual) url += `&manual_location=${encodeURIComponent(userLocation.manual)}`;
         if (userLocation.lat) url += `&lat=${userLocation.lat}&lon=${userLocation.lon}`;
      }
      const eventSource = new EventSource(url);
      
      eventSource.onmessage = (e) => {
        const data = JSON.parse(e.data);
        
        switch (data.event) {
          case 'agent_progress':
            setAgentStates(prev => ({
              ...prev,
              [data.agent]: { status: data.status, message: data.message }
            }));
            break;
            
          case 'agent_complete':
            setAgentStates(prev => ({
              ...prev,
              [data.agent]: { status: 'success', message: 'Completed', result: data.result }
            }));
            
            // Render specific UI if it's AvailabilityAgent rendering vendors
            if (data.agent === 'AvailabilityAgent' && data.result?.available_vendors) {
               setMessages(prev => [...prev, { 
                 role: 'sys', 
                 vendors: data.result.available_vendors 
               }]);
            }
            break;
            
          case 'llm_fallback_triggered':
            setFallbackTriggered(true);
            setLlmProvider(`ollama:${data.fallback_model}`);
            setMessages(prev => [...prev, { role: 'sys', fallback_alert: data.message }]);
            break;
            
          case 'context':
            setLlmProvider(data.llm_provider);
            setFallbackTriggered(data.fallback_triggered);
            break;
            
          case 'pipeline_complete':
            setMessages(prev => [...prev, { role: 'sys', text: data.message }]);
            setIsLoading(false);
            eventSource.close();
            break;
            
          default:
            break;
        }
      };

      eventSource.onerror = (err) => {
        console.error("SSE Error:", err);
        setIsLoading(false);
        eventSource.close();
      };
      
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
    
    setInput('');
  };

  return (
    <>
      {showLocationModal && (
        <LocationModal onComplete={(loc) => {
          setUserLocation(loc);
          setShowLocationModal(false);
        }} />
      )}
      <div className="app-container">
        {/* Left panel: Pipeline Status */}
      <div className="layout-left glass">
        <div className="header">
          <TerminalSquare size={28} className="text-primary" />
          <h1>RoadRescue.AI</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '-12px' }}>
          Intelligent Rescue Orchestration (v3.0)
        </p>

        <div style={{
          background: fallbackTriggered ? 'rgba(139, 92, 246, 0.08)' : 'rgba(16, 185, 129, 0.05)',
          border: `1px solid ${fallbackTriggered ? 'rgba(139, 92, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
          padding: '16px',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '14px', fontWeight: 600 }}>
            {fallbackTriggered ? <AlertTriangle size={16} color="#c4b5fd" /> : <Key size={16} color="#34d399" />}
            Active Core: {llmProvider}
          </div>
          {fallbackTriggered && (
             <span style={{ fontSize: '12px', color: '#a78bfa' }}>
               Running on local fallback via Sidecar Container.
             </span>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '12px', marginTop: '16px' }}>
          <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '16px' }}>Execute Pipeline</h3>
          
          {orderedAgents.map(agent => (
            <AgentStatus 
              key={agent}
              agentName={agent}
              status={agentStates[agent]?.status || 'pending'}
              message={agentStates[agent]?.message || ''}
            />
          ))}
        </div>
      </div>

      {/* Right panel: Chat Interface */}
      <div className="layout-right">
        <div className="chat-container glass">
          <div className="chat-history">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role} anim-fade-in`}>
                {msg.fallback_alert && (
                  <div className="fallback-badge">
                    <AlertTriangle size={14} /> Fallback Active
                  </div>
                )}
                
                {msg.text && <div>{msg.text}</div>}
                
                {msg.fallback_alert && <div style={{marginTop: '8px', color: '#e2e8f0', fontSize: '13px'}}>{msg.fallback_alert}</div>}
                
                {msg.vendors && msg.vendors.map(v => (
                  <VendorCard key={v.vendor_id} vendor={v} />
                ))}
              </div>
            ))}
            {isLoading && (
              <div className="message sys anim-fade-in" style={{ padding: '8px', display: 'flex', alignItems: 'center' }}>
                <div className="dot-flashing" />
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="chat-input-area">
            <input 
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Describe what happened... e.g., 'Ertiga won't start, clicking sound, NH7'"
              disabled={isLoading}
            />
            <button className="send-btn" onClick={handleSend} disabled={isLoading || !input.trim()}>
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
