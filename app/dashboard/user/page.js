'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield, Cpu, Key, Landmark, HelpCircle, User, LogOut,
  AlertTriangle, Check, Upload, Trash2, ShieldAlert,
  LayoutDashboard, Activity, TrendingUp, Plus, ChevronRight,
  BookOpen, Lock, Send, Sun, Moon, Settings
} from 'lucide-react';

export default function UserDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('light');

  // SOS trigger state
  const [showSosModal, setShowSosModal] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [sosStatus, setSosStatus] = useState('idle'); // 'idle', 'counting', 'sending', 'success', 'error'
  const countdownIntervalRef = useRef(null);

  // Theme Sync
  useEffect(() => {
    const savedTheme = localStorage.getItem('trace_theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('trace_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  // Check login session (sessionStorage only, safe by design)
  useEffect(() => {
    const userStr = sessionStorage.getItem('trace_user');
    if (!userStr) {
      router.replace('/login');
    } else {
      const user = JSON.parse(userStr);
      if (user.role !== 'user') {
        router.replace('/dashboard/admin');
      } else {
        setCurrentUser(user);
      }
    }
    setLoading(false);
  }, [router]);

  const handleQuickHide = () => {
    window.history.replaceState(null, '', '/');
    window.history.pushState(null, '', '/decoy');
    document.title = 'Home Gardening Tips';
    window.location.replace('/decoy');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('trace_user');
    router.push('/');
  };

  // Physical Escape Key Event Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleQuickHide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- SOS Logic ---
  const triggerSosAlert = () => {
    setShowSosModal(true);
    setSosStatus('counting');
    setCountdown(3);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          sendSosSignal();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelSos = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    setShowSosModal(false);
    setSosStatus('idle');
  };

  const sendSosSignal = () => {
    setSosStatus('sending');

    // Request Location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const loc = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          await postSos(loc);
        },
        async (error) => {
          console.warn('Location permission denied or error. Sending SOS without GPS:', error);
          await postSos(null);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      postSos(null);
    }
  };

  const postSos = async (location) => {
    try {
      const res = await fetch('/api/sos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: currentUser?.username || 'Anonymous User',
          location: location
        })
      });

      if (!res.ok) throw new Error('API request failed');

      setSosStatus('success');
      // Redirect to decoy immediately for safety after a brief pause
      setTimeout(() => {
        handleQuickHide();
      }, 1500);

    } catch (err) {
      console.error(err);
      setSosStatus('error');
    }
  };

  // --- AI Abuse Engine State & Logic ---
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello. I am the TRACE AI Threat Assessment assistant. You can paste logs, messages, or detail your current situation here. I will evaluate safety indices across emotional, physical, financial, and digital dimensions. All analysis is confidential.',
      time: '10:23 PM'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [threatMetrics, setThreatMetrics] = useState({
    physical: 0,
    coercion: 15,
    financial: 0,
    surveillance: 0
  });
  const [threatLevel, setThreatLevel] = useState('LOW RISK'); // 'LOW RISK', 'MODERATE RISK', 'SEVERE DANGER'
  const [protocolChecks, setProtocolChecks] = useState({
    visibleEscape: true,
    incognitoMode: false,
    secondaryContact: false
  });

  const [safetyRoadmap, setSafetyRoadmap] = useState([
    { id: 1, text: 'Keep browser tabs discreet and learn the escape shortcut', severity: 'low' },
    { id: 2, text: 'Review digital surveillance indicators on settings page', severity: 'low' }
  ]);

  const [vaultSetupNeeded, setVaultSetupNeeded] = useState(true);
  const [vaultAuthenticated, setVaultAuthenticated] = useState(false);
  const [vaultAccessMode, setVaultAccessMode] = useState(null); // 'master' or 'emergency'
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const [masterPinReg, setMasterPinReg] = useState('');
  const [emergencyPinReg, setEmergencyPinReg] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mp = localStorage.getItem('vault_master_pin');
      const ep = localStorage.getItem('vault_emergency_pin');
      if (mp && ep) {
        setVaultSetupNeeded(false);
      }
    }
  }, []);

  // Reset PIN authentication when switching tabs
  useEffect(() => {
    if (activeTab !== 'vault') {
      setVaultAuthenticated(false);
      setVaultAccessMode(null);
      setPinInput('');
      setPinError('');
    }
  }, [activeTab]);

  const handleSetupPins = (e) => {
    e.preventDefault();
    if (masterPinReg.length < 4 || emergencyPinReg.length < 4) {
      setPinError('Both PINs must be at least 4 digits long.');
      return;
    }
    if (masterPinReg === emergencyPinReg) {
      setPinError('Master PIN and Emergency PIN must be different.');
      return;
    }
    localStorage.setItem('vault_master_pin', masterPinReg);
    localStorage.setItem('vault_emergency_pin', emergencyPinReg);
    setVaultSetupNeeded(false);
    setPinError('');
    setMasterPinReg('');
    setEmergencyPinReg('');
  };

  const handleVerifyPin = (e) => {
    e.preventDefault();
    const mp = localStorage.getItem('vault_master_pin');
    const ep = localStorage.getItem('vault_emergency_pin');

    if (pinInput === mp) {
      setVaultAuthenticated(true);
      setVaultAccessMode('master');
      setPinError('');
    } else if (pinInput === ep) {
      setVaultAuthenticated(true);
      setVaultAccessMode('emergency');
      setPinError('');
    } else {
      setPinError('Invalid PIN code. Access denied.');
      setPinInput('');
    }
  };

  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const currentTimeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { sender: 'user', text: chatInput, time: currentTimeString };
    setChatMessages(prev => [...prev, userMsg]);
    const textLower = chatInput.toLowerCase();
    setChatInput('');

    // Simulate AI response
    setTimeout(() => {
      let physInc = 0;
      let coerInc = 0;
      let finInc = 0;
      let survInc = 0;

      if (/hit|punch|hurt|kill|harm|beat|slap|physical|abuse|force|weapon|push|kick/.test(textLower)) physInc = 40;
      if (/control|isolate|yell|shout|ignore|insult|threaten|blame|screamed|angry|jealous|wear|go out/.test(textLower)) coerInc = 35;
      if (/money|bank|job|work|funds|spend|credit|wallet|pay|allowance|stole|allow|account/.test(textLower)) finInc = 45;
      if (/phone|location|track|spy|camera|hacked|password|messages|device|texting|gps|screen/.test(textLower)) survInc = 50;

      setThreatMetrics(prev => {
        const nextMetrics = {
          physical: Math.min(100, prev.physical + physInc),
          coercion: Math.min(100, prev.coercion + coerInc),
          financial: Math.min(100, prev.financial + finInc),
          surveillance: Math.min(100, prev.surveillance + survInc)
        };
        
        const maxScore = Math.max(nextMetrics.physical, nextMetrics.coercion, nextMetrics.financial, nextMetrics.surveillance);
        if (maxScore > 70 || nextMetrics.physical > 40) {
          setThreatLevel('SEVERE DANGER');
        } else if (maxScore > 35) {
          setThreatLevel('MODERATE RISK');
        } else {
          setThreatLevel('LOW RISK');
        }
        return nextMetrics;
      });

      // AI Advice generation based on keywords
      let aiResponseText = "";
      const newRoadmapItems = [];

      // Physical Threat
      if (physInc > 0) {
        aiResponseText = "URGENT SAFETY PROTOCOL: Physical safety markers have been identified. Your security is paramount. Memorize local shelter addresses and have a physical escape route mapped. If you feel you are in immediate threat, trigger our emergency SOS.";
        newRoadmapItems.push(
          { id: 1, text: "Map evacuation routes and memorize addresses of the closest domestic violence shelter.", severity: "high" },
          { id: 2, text: "Prepare a physical safety bag (ID, cash, medication) stored in a secret location outside your home.", severity: "high" }
        );
      } 
      
      // Surveillance Threat
      if (survInc > 0) {
        aiResponseText = (aiResponseText ? aiResponseText + " " : "") + "DEVICE INTEGRITY ALERT: Indicators of device tracking/monitoring detected. Abusers frequently monitor texts and location coordinates. Safely check your phone settings, clear your history, or switch to browsing in private incognito tabs.";
        newRoadmapItems.push(
          { id: 3, text: "Audit location sharing on your phone and disable unknown tracking services.", severity: "high" },
          { id: 4, text: "Change passwords for critical accounts (email, banking) from a safe public computer.", severity: "medium" }
        );
      } 

      // Financial Threat
      if (finInc > 0) {
        aiResponseText = (aiResponseText ? aiResponseText + " " : "") + "FINANCIAL RESTRICTION LOGGED: Financial sabotage or banking surveillance detected. Opening a separate personal bank account with paperless statements is a critical step towards independence. Review funding on the Recovery tab.";
        newRoadmapItems.push(
          { id: 5, text: "Establish a new personal bank account at a different financial institution with paperless billing.", severity: "medium" },
          { id: 6, text: "Request a credit freeze to block accounts from being opened under your name without authorization.", severity: "low" }
        );
      } 

      // Coercion/Emotional Threat
      if (coerInc > 0 && physInc === 0) {
        aiResponseText = (aiResponseText ? aiResponseText + " " : "") + "COERCIVE CONTROL LOGGED: Markers of social isolation or psychological control are present. Remember that this behavior is intended to isolate you and is not your fault. Establishing safe contact channels is recommended.";
        newRoadmapItems.push(
          { id: 7, text: "Establish a safe physical word signal with a neighbor to notify them if you need assistance.", severity: "medium" },
          { id: 8, text: "Reach out to a professional counselor or advocate via local support hotlines.", severity: "low" }
        );
      }

      // Default/Fallback context-aware response if no flags
      if (!aiResponseText) {
        aiResponseText = `Thank you for sharing. Based on "${chatInput.substring(0, 30)}...", I am parsing threat variables. Let me know if your partner is restricting your movement, monitoring devices, or controlling your funds, so I can map your safety roadmap.`;
        newRoadmapItems.push(
          { id: 9, text: "Document dates, details, and safe backups of all incidents in the LockVault.", severity: "low" }
        );
      }

      // Update safety roadmap with unique new recommendations
      setSafetyRoadmap(prev => {
        const existingTexts = prev.map(item => item.text);
        const uniqueNewItems = newRoadmapItems.filter(item => !existingTexts.includes(item.text));
        if (uniqueNewItems.length > 0) {
          return [...uniqueNewItems, ...prev].slice(0, 6); // Cap at 6 items
        }
        return prev;
      });

      const aiMsg = {
        sender: 'ai',
        text: aiResponseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, aiMsg]);
    }, 1000);
  };

  // --- Evidence Vault State & Logic ---
  const [encryptionPin, setEncryptionPin] = useState('1984');
  const [evidenceList, setEvidenceList] = useState([]);
  const [evidenceLabel, setEvidenceLabel] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [vaultProcessing, setVaultProcessing] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadEvidence = async (e) => {
    e.preventDefault();
    if (!selectedFile || !evidenceLabel) return;

    setVaultProcessing(true);

    try {
      // 1. Generate SHA-256 hash client-side
      const buffer = await selectedFile.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const fileHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // 2. Mock blockchain transaction commit
      setTimeout(() => {
        const txId = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        const newEvidence = {
          id: Date.now(),
          fileName: selectedFile.name,
          label: evidenceLabel,
          hash: fileHash,
          txId: txId,
          timestamp: new Date().toISOString()
        };

        setEvidenceList([newEvidence, ...evidenceList]);
        setSelectedFile(null);
        setEvidenceLabel('');
        setVaultProcessing(false);
      }, 1200);

    } catch (err) {
      console.error(err);
      alert('Error encrypting file. Please try again.');
      setVaultProcessing(false);
    }
  };

  const handleDeleteEvidence = (id) => {
    setEvidenceList(prev => prev.filter(item => item.id !== id));
  };

  // --- Recovery Fund Rail State & Logic ---
  const [budget, setBudget] = useState({
    relocation: 600,
    locks: 150,
    transit: 80,
    food: 120,
    legal: 250,
    savings: 400
  });

  const totalNeeds = budget.relocation + budget.locks + budget.transit + budget.food + budget.legal;
  const deficitGap = Math.max(0, totalNeeds - budget.savings);

  const handleBudgetChange = (field, val) => {
    const numericVal = parseInt(val) || 0;
    setBudget(prev => ({
      ...prev,
      [field]: numericVal
    }));
  };

  // Grant Questionnaire
  const [grantAnswers, setGrantAnswers] = useState({
    q1: null,
    q2: null,
    q3: null,
    q4: null
  });
  const [grantAssessmentText, setGrantAssessmentText] = useState('Status: Awaiting assessment');
  const [isPrequalified, setIsPrequalified] = useState(false);

  const handleAssessGrant = () => {
    if (grantAnswers.q1 === null || grantAnswers.q2 === null || grantAnswers.q3 === null || grantAnswers.q4 === null) {
      alert("Please answer all questions to complete the simulation.");
      return;
    }

    if (grantAnswers.q1 === 'yes' || grantAnswers.q2 === 'yes' || grantAnswers.q3 === 'yes') {
      setIsPrequalified(true);
      setGrantAssessmentText(`Status: Pre-Qualified for $${deficitGap > 0 ? deficitGap + 200 : 1000} Relocation Micro-Grant. Proceed to verification.`);
    } else {
      setIsPrequalified(false);
      setGrantAssessmentText("Status: Standard processing. Direct connection to local shelter programs initiated.");
    }
  };

  // Safe Recovery Checklist
  const [checklist, setChecklist] = useState([
    { id: 1, text: 'Open a safe email account (using a secondary device).', done: false },
    { id: 2, text: 'Open a separate bank account at a new institution (with paperless statements).', done: false },
    { id: 3, text: 'Locate and store original ID, Social Security card, and passport in a safe space.', done: false },
    { id: 4, text: 'Draft a list of immediate emergency contacts and add them to TRACE SOS.', done: false },
    { id: 5, text: 'Obtain local legal representation referrals via womenslaw.org.', done: false },
    { id: 6, text: 'Secure a safe physical mailing address (PO Box or trusted friend).', done: false }
  ]);
  const [newChecklistItem, setNewChecklistItem] = useState('');

  const toggleChecklistItem = (id) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  const deleteChecklistItem = (id) => {
    setChecklist(prev => prev.filter(item => item.id !== id));
  };

  const handleAddChecklistItem = (e) => {
    e.preventDefault();
    if (!newChecklistItem.trim()) return;
    const newItem = {
      id: Date.now(),
      text: newChecklistItem.trim(),
      done: false
    };
    setChecklist(prev => [...prev, newItem]);
    setNewChecklistItem('');
  };

  const checkedCount = checklist.filter(item => item.done).length;
  const checklistPercentage = checklist.length > 0 ? Math.round((checkedCount / checklist.length) * 100) : 0;

  if (loading) {
    return <div style={styles.loadingScreen}>Loading your secure portal...</div>;
  }

  return (
    <div style={styles.dashboardContainer}>
      {/* 2-Column Sidebar Layout */}
      <div style={styles.mainGrid}>
        
        {/* Left Sidebar */}
        <aside style={styles.sidebar}>
          <div style={styles.sidebarLogo}>
            <img src="/shield-logo.png" alt="TRACE Logo" style={{ width: '28px', height: '28px', objectFit: 'contain', marginRight: '8px' }} />
            <span style={styles.logoText}>TRACE</span>
          </div>

          {/* User Profile Info Card */}
          <div style={styles.profileCard}>
            <div 
              onClick={() => setActiveTab('settings')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', marginBottom: '0.75rem', cursor: 'pointer' }}
              title="View Profile Settings"
            >
              <div style={styles.profileAvatar}>
                <User size={18} color="#a78bfa" />
              </div>
              <div style={styles.profileDetails}>
                <div style={styles.profileName}>{currentUser?.username || 'Amr'}</div>
                <div style={styles.profileEmail}>{currentUser?.username || 'amr'}@gmail.com</div>
              </div>
            </div>
            {/* Quick Profile Actions */}
            <div style={{ display: 'flex', gap: '0.4rem', width: '100%', borderTop: '1px solid var(--color-clay-light)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
              <button onClick={toggleTheme} style={styles.profileActionBtn} title="Toggle Color Theme">
                {theme === 'light' ? <Moon size={12} /> : <Sun size={12} />}
                <span>Theme</span>
              </button>
              <button onClick={handleQuickHide} style={{ ...styles.profileActionBtn, color: 'var(--color-terracotta)', fontWeight: 'bold' }} title="Camouflage decoy exit">
                <BookOpen size={12} />
                <span>Hide</span>
              </button>
              <button onClick={handleLogout} style={styles.profileActionBtn} title="Lock Workspace">
                <Lock size={12} />
                <span>Lock</span>
              </button>
            </div>
          </div>

          {/* Tab Menu Navigation */}
          <nav style={styles.sidebarMenu}>
            <button
              onClick={() => setActiveTab('overview')}
              style={{ ...styles.menuItem, ...(activeTab === 'overview' ? styles.menuItemActive : {}) }}
            >
              <LayoutDashboard size={18} />
              <span>Home</span>
            </button>
            
            <button
              onClick={() => setActiveTab('risk')}
              style={{ ...styles.menuItem, ...(activeTab === 'risk' ? styles.menuItemActive : {}) }}
            >
              <Cpu size={18} />
              <span>AI Abuse Engine</span>
            </button>
            
            <button
              onClick={() => setActiveTab('vault')}
              style={{ ...styles.menuItem, ...(activeTab === 'vault' ? styles.menuItemActive : {}) }}
            >
              <Key size={18} />
              <span>Evidence Lock Vault</span>
            </button>
            
            <button
              onClick={() => setActiveTab('plan')}
              style={{ ...styles.menuItem, ...(activeTab === 'plan' ? styles.menuItemActive : {}) }}
            >
              <TrendingUp size={18} />
              <span>Recovery Fund Rail</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              style={{ ...styles.menuItem, ...(activeTab === 'settings' ? styles.menuItemActive : {}) }}
            >
              <Settings size={18} />
              <span>Settings</span>
            </button>
          </nav>
        </aside>

        {/* Console Content Screen (Right side) */}
        <main style={styles.consoleContent}>
          
          {/* Tab 1: Overview Console */}
          {activeTab === 'overview' && (
            <div style={styles.tabWrapper}>
              <div style={styles.tabHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <LayoutDashboard size={24} style={styles.tabHeaderIcon} />
                  <h1 style={styles.tabHeaderTitle}>Home</h1>
                </div>
                <p style={styles.tabHeaderSubtitle}>
                  Welcome back, {currentUser?.username || 'Amr'}. Your secure safety portal.
                </p>
              </div>

              <div style={styles.overviewGrid}>
                {/* Threat Level Summary */}
                <div className="card" style={styles.overviewCard}>
                  <div style={styles.cardHeaderWithIcon}>
                    <Cpu size={20} color="var(--color-forest)" />
                    <h3 style={styles.overviewCardTitle}>AI Threat Index</h3>
                  </div>
                  <div style={styles.overviewMetric}>
                    <div style={{ ...styles.threatLevelBadge, backgroundColor: threatLevel === 'SEVERE DANGER' ? 'var(--color-terracotta)' : 'var(--color-forest)' }}>
                      {threatLevel}
                    </div>
                  </div>
                  <p style={styles.overviewCardText}>
                    Active monitoring. Chat sandbox has recorded markers across Coercion ({threatMetrics.coercion}%) and Surveillance ({threatMetrics.surveillance}%).
                  </p>
                  <button onClick={() => setActiveTab('risk')} className="btn btn-outline" style={{ marginTop: 'auto', width: '100%', fontSize: '0.85rem' }}>
                    Open Threat Assessor
                  </button>
                </div>

                {/* Evidence Vault Summary */}
                <div className="card" style={styles.overviewCard}>
                  <div style={styles.cardHeaderWithIcon}>
                    <Key size={20} color="var(--color-forest)" />
                    <h3 style={styles.overviewCardTitle}>Tamper-Proof Certificates</h3>
                  </div>
                  <div style={styles.overviewMetric}>
                    <span style={styles.metricNumber}>{evidenceList.length}</span>
                    <span style={styles.metricLabel}>Secured Files</span>
                  </div>
                  <p style={styles.overviewCardText}>
                    Images, PDFs, or audio statements hashes committed to Sepolia testnet. Volatile memory clears on exit.
                  </p>
                  <button onClick={() => setActiveTab('vault')} className="btn btn-outline" style={{ marginTop: 'auto', width: '100%', fontSize: '0.85rem' }}>
                    Manage Evidence Vault
                  </button>
                </div>

                {/* Recovery Checklist Summary */}
                <div className="card" style={styles.overviewCard}>
                  <div style={styles.cardHeaderWithIcon}>
                    <TrendingUp size={20} color="var(--color-forest)" />
                    <h3 style={styles.overviewCardTitle}>Exit Plan Checklist</h3>
                  </div>
                  <div style={styles.overviewMetric}>
                    <span style={styles.metricNumber}>{checklistPercentage}%</span>
                    <span style={styles.metricLabel}>Done</span>
                  </div>
                  <p style={styles.overviewCardText}>
                    {checkedCount} of {checklist.length} checklist items complete. Relocation deficit gap estimated at ${deficitGap}.
                  </p>
                  <button onClick={() => setActiveTab('plan')} className="btn btn-outline" style={{ marginTop: 'auto', width: '100%', fontSize: '0.85rem' }}>
                    Open Budget Planner
                  </button>
                </div>
              </div>

              {/* Warning Alert */}
              <div style={styles.alertPanel}>
                <AlertTriangle size={24} style={styles.alertIcon} />
                <div>
                  <h4 style={styles.alertTitle}>Device Safety Protocols</h4>
                  <p style={styles.alertText}>
                    This window maintains volatile state in RAM only. Closing the tab immediately destroys database cookies. Use the red <strong>QUICK ESCAPE</strong> button in the bottom right corner (or press <strong>ESC</strong> key) if an abuser approaches.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: AI Abuse Engine */}
          {activeTab === 'risk' && (
            <div style={styles.tabWrapper}>
              <div style={styles.tabHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Cpu size={24} style={styles.tabHeaderIcon} />
                  <h1 style={styles.tabHeaderTitle}>AI Threat Assessor Engine</h1>
                </div>
                <p style={styles.tabHeaderSubtitle}>
                  Automated analysis of coercion logs, messages, and security vectors.
                </p>
              </div>

              <div style={styles.columnsGrid}>
                {/* Chat Sandbox */}
                <div className="card" style={styles.chatCard}>
                  <div style={styles.chatCardHeader}>
                    <h3 style={styles.chatCardTitle}>END-TO-END CHAT SANDBOX</h3>
                    <span style={styles.encryptionBadge}>Encryption Active</span>
                  </div>

                  <div style={styles.chatContainer}>
                    {chatMessages.map((msg, index) => (
                      <div
                        key={index}
                        style={{
                          ...styles.chatBubbleWrapper,
                          justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                        }}
                      >
                        <div
                          style={{
                            ...styles.chatBubble,
                            backgroundColor: msg.sender === 'user' ? 'var(--sidebar-item-active-bg)' : 'var(--color-sand-light)',
                            color: msg.sender === 'user' ? 'var(--color-earth)' : 'var(--color-earth)',
                            borderColor: msg.sender === 'user' ? 'var(--color-clay)' : 'var(--color-clay-light)',
                          }}
                        >
                          <p style={{ margin: 0, fontSize: '0.95rem' }}>{msg.text}</p>
                          <span style={styles.chatTime}>{msg.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSendChatMessage} style={styles.chatInputForm}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Describe what occurred, or paste abusive log excerpts..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      style={styles.chatInputField}
                    />
                    <button type="submit" style={styles.chatSendBtn}>
                      <Send size={16} />
                    </button>
                  </form>
                </div>

                {/* Threat Metrics & Actions */}
                <div style={styles.sideColumn}>
                  {/* Assessed threat metrics */}
                  <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <div style={styles.metricCardHeader}>
                      <h3 style={styles.sidebarPanelTitle}>ASSESSED THREAT METRICS</h3>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: threatLevel === 'SEVERE DANGER' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: threatLevel === 'SEVERE DANGER' ? '#ef4444' : '#10b981',
                      }}>
                        {threatLevel}
                      </span>
                    </div>

                    <div style={styles.progressBarList}>
                      {/* Metric 1 */}
                      <div style={styles.progressItem}>
                        <div style={styles.progressLabelRow}>
                          <span style={styles.progressLabel}>Physical Violence / Threats</span>
                          <span style={styles.progressVal}>{threatMetrics.physical}%</span>
                        </div>
                        <div style={styles.progressBarBg}>
                          <div style={{ ...styles.progressBarFill, width: `${threatMetrics.physical}%`, backgroundColor: '#ef4444' }} />
                        </div>
                      </div>

                      {/* Metric 2 */}
                      <div style={styles.progressItem}>
                        <div style={styles.progressLabelRow}>
                          <span style={styles.progressLabel}>Coercion & Emotional Control</span>
                          <span style={styles.progressVal}>{threatMetrics.coercion}%</span>
                        </div>
                        <div style={styles.progressBarBg}>
                          <div style={{ ...styles.progressBarFill, width: `${threatMetrics.coercion}%`, backgroundColor: '#a78bfa' }} />
                        </div>
                      </div>

                      {/* Metric 3 */}
                      <div style={styles.progressItem}>
                        <div style={styles.progressLabelRow}>
                          <span style={styles.progressLabel}>Financial Sabotage</span>
                          <span style={styles.progressVal}>{threatMetrics.financial}%</span>
                        </div>
                        <div style={styles.progressBarBg}>
                          <div style={{ ...styles.progressBarFill, width: `${threatMetrics.financial}%`, backgroundColor: '#f59e0b' }} />
                        </div>
                      </div>

                      {/* Metric 4 */}
                      <div style={styles.progressItem}>
                        <div style={styles.progressLabelRow}>
                          <span style={styles.progressLabel}>Surveillance & Digital Abuse</span>
                          <span style={styles.progressVal}>{threatMetrics.surveillance}%</span>
                        </div>
                        <div style={styles.progressBarBg}>
                          <div style={{ ...styles.progressBarFill, width: `${threatMetrics.surveillance}%`, backgroundColor: '#3b82f6' }} />
                        </div>
                      </div>
                    </div>
                    <span style={styles.metricsDisclaimer}>
                      ⚠️ Indices are generated programmatically using locally parsed trigger markers.
                    </span>
                  </div>

                  {/* Personalized Safety Roadmap */}
                  <div className="card">
                    <h3 style={styles.sidebarPanelTitle}>PERSONALIZED SAFETY ROADMAP</h3>
                    <p style={styles.vaultDescription}>
                      Step-by-step guidance dynamically generated based on your assessed threat markers:
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
                      {safetyRoadmap.map((item) => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: item.severity === 'high' ? 'var(--color-terracotta)' : 'var(--color-forest)', marginTop: '0.45rem', flexShrink: 0 }} />
                          <span style={{ color: 'var(--color-earth)', lineHeight: '1.4' }}>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Evidence Lock Vault */}
          {activeTab === 'vault' && (
            <div style={styles.tabWrapper}>
              <div style={styles.tabHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Key size={24} style={styles.tabHeaderIcon} />
                  <h1 style={styles.tabHeaderTitle}>Evidence Lock Vault</h1>
                </div>
                <p style={styles.tabHeaderSubtitle}>
                  Locally encrypted file backup with SHA-256 verification codes and simulated blockchain stamps.
                </p>
              </div>

              {/* Initial PIN Setup Flow */}
              {vaultSetupNeeded ? (
                <div style={{ maxWidth: '550px', margin: '2rem auto' }} className="card">
                  <h2 style={{ fontSize: '1.5rem', color: 'var(--color-forest)', marginBottom: '1rem', textAlign: 'center' }}>Secure Your LockVault</h2>
                  <p style={{ ...styles.vaultDescription, textAlign: 'center', marginBottom: '1.5rem' }}>
                    Set up two different PINs. For your safety, the **Emergency PIN** grants read-only access (restricted editing/deleting), while the **Master PIN** grants full management access.
                  </p>
                  <form onSubmit={handleSetupPins} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Master PIN (Full Access)</label>
                      <input
                        type="password"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        maxLength="6"
                        className="form-input"
                        placeholder="e.g. 1111"
                        value={masterPinReg}
                        onChange={(e) => setMasterPinReg(e.target.value.replace(/\D/g, ''))}
                        required
                        style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.25rem', fontWeight: 'bold' }}
                      />
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-earth-muted)' }}>Use this PIN to upload, view, and delete files.</span>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Emergency / View-Only PIN</label>
                      <input
                        type="password"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        maxLength="6"
                        className="form-input"
                        placeholder="e.g. 2222"
                        value={emergencyPinReg}
                        onChange={(e) => setEmergencyPinReg(e.target.value.replace(/\D/g, ''))}
                        required
                        style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.25rem', fontWeight: 'bold' }}
                      />
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-earth-muted)' }}>Use this PIN when forced to unlock. Files will appear readable, but upload and deletion are disabled.</span>
                    </div>

                    {pinError && (
                      <div style={{ color: 'var(--color-terracotta)', fontSize: '0.85rem', fontWeight: '600', textAlign: 'center' }}>
                        {pinError}
                      </div>
                    )}

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                      Configure Secure PINs
                    </button>
                  </form>
                </div>
              ) : !vaultAuthenticated ? (
                /* PIN Entry Screen */
                <div style={{ maxWidth: '400px', margin: '4rem auto' }} className="card">
                  <h2 style={{ fontSize: '1.25rem', color: 'var(--color-forest)', marginBottom: '1rem', textAlign: 'center' }}>Enter Security PIN</h2>
                  <p style={{ ...styles.vaultDescription, textAlign: 'center', marginBottom: '1.5rem' }}>
                    Access to the Evidence Vault is locked. Enter your security PIN to continue.
                  </p>
                  <form onSubmit={handleVerifyPin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <input
                      type="password"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      maxLength="6"
                      className="form-input"
                      placeholder="••••"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                      required
                      autoFocus
                      style={{ textAlign: 'center', letterSpacing: '12px', fontSize: '1.5rem', fontWeight: 'bold' }}
                    />

                    {pinError && (
                      <div style={{ color: 'var(--color-terracotta)', fontSize: '0.85rem', fontWeight: '600', textAlign: 'center' }}>
                        {pinError}
                      </div>
                    )}

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                      Unlock Vault
                    </button>
                  </form>
                </div>
              ) : (
                /* Authenticated Vault View */
                <div style={styles.columnsGrid}>
                  {/* Vault Inputs - Only shown in Master Mode */}
                  {vaultAccessMode === 'master' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1.2 }}>
                      <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <h3 style={styles.sidebarPanelTitle}>VAULT STATUS</h3>
                          <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 'bold' }}>Master Edit Mode</span>
                        </div>
                        <p style={styles.vaultDescription}>
                          You have full administrative control to encrypt and delete files.
                        </p>
                      </div>

                      <div className="card">
                        <h3 style={styles.sidebarPanelTitle}>UPLOAD EVIDENCE</h3>
                        <form onSubmit={handleUploadEvidence} style={styles.uploadContainer}>
                          <div className="form-group">
                            <label className="form-label">Evidence Label</label>
                            <input
                              type="text"
                              className="form-input"
                              value={evidenceLabel}
                              onChange={(e) => setEvidenceLabel(e.target.value)}
                              placeholder="e.g. Threat message screenshot"
                              required
                            />
                          </div>
                          
                          {/* Drag & Drop Box */}
                          <div style={styles.dropZone}>
                            <Upload size={32} color="var(--color-earth-muted)" style={{ marginBottom: '0.5rem' }} />
                            <span style={styles.dropZoneTitle}>Select or drop file</span>
                            <span style={styles.dropZoneSubtitle}>Images, PDF, or Audio (Max 15MB)</span>
                            <input
                              type="file"
                              onChange={handleFileChange}
                              style={styles.hiddenFileInput}
                            />
                          </div>

                          {selectedFile && (
                            <div style={styles.selectedFileAlert}>
                              <Check size={16} color="#10b981" />
                              <span>Selected: <strong>{selectedFile.name}</strong></span>
                            </div>
                          )}

                          <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: '1rem' }}
                            disabled={vaultProcessing || !selectedFile || !evidenceLabel}
                          >
                            {vaultProcessing ? 'Encrypting...' : 'Encrypt & Commit to Blockchain'}
                          </button>
                        </form>
                      </div>
                    </div>
                  ) : (
                    /* Emergency Decoy Info Card (View Only) */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1.2 }}>
                      <div className="card" style={{ borderLeft: '4px solid var(--color-terracotta)' }}>
                        <h3 style={{ ...styles.sidebarPanelTitle, color: 'var(--color-terracotta)' }}>DECOY MODE ACTIVE</h3>
                        <p style={{ ...styles.vaultDescription, color: 'var(--color-earth)' }}>
                          Vault records are loaded in **Emergency View-Only mode**. Upload and delete utilities are restricted to prevent forced modifications.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Vault list */}
                  <div className="card" style={{ flex: 1.5, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={styles.sidebarPanelTitle}>SECURED VAULT RECORDS ({evidenceList.length})</h3>
                    
                    {evidenceList.length === 0 ? (
                      <div style={styles.emptyState}>
                        No files archived. Upload new files in Master mode to secure records.
                      </div>
                    ) : (
                      <div style={styles.recordsList}>
                        {evidenceList.map((item) => (
                          <div key={item.id} style={styles.recordCard}>
                            <div style={styles.recordHeader}>
                              <div>
                                <h4 style={styles.recordLabel}>{item.label}</h4>
                                <span style={styles.recordFilename}>{item.fileName}</span>
                              </div>
                              {/* Only show delete button in Master mode */}
                              {vaultAccessMode === 'master' && (
                                <button onClick={() => handleDeleteEvidence(item.id)} style={styles.deleteBtn}>
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                            
                            <div style={styles.recordDetails}>
                              <div style={styles.recordDetailRow}>
                                <span style={styles.detailLabel}>SHA-256 Hash:</span>
                                <span style={styles.detailValue} title={item.hash}>{item.hash.substring(0, 16)}...</span>
                              </div>
                              <div style={styles.recordDetailRow}>
                                <span style={styles.detailLabel}>Sepolia Tx ID:</span>
                                <span style={styles.detailValue} title={item.txId}>{item.txId.substring(0, 16)}...</span>
                              </div>
                              <div style={styles.recordDetailRow}>
                                <span style={styles.detailLabel}>Timestamp:</span>
                                <span style={styles.detailValue}>{new Date(item.timestamp).toLocaleString()}</span>
                              </div>
                            </div>
                            
                            <div style={styles.securedBadge}>
                              <Check size={12} />
                              <span>SECURED</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Recovery Fund Rail */}
          {activeTab === 'plan' && (
            <div style={styles.tabWrapper}>
              <div style={styles.tabHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <TrendingUp size={24} style={styles.tabHeaderIcon} />
                  <h1 style={styles.tabHeaderTitle}>Recovery Fund Rail</h1>
                </div>
                <p style={styles.tabHeaderSubtitle}>
                  Fintech tools: emergency budget planning, checklist tracking, and micro-grant pre-qualification simulation.
                </p>
              </div>

              <div style={styles.columnsGrid}>
                {/* Left Column (Budget & Assessment) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1.5 }}>
                  {/* Crisis Relocation Budget Planner */}
                  <div className="card">
                    <div style={styles.cardHeaderWithIcon}>
                      <Landmark size={20} color="var(--color-green-accent)" />
                      <h3 style={styles.plannerTitle}>CRISIS RELOCATION BUDGET PLANNER</h3>
                    </div>
                    <p style={styles.vaultDescription}>
                      Estimate absolute minimum parameters for housing and relocation expenses to organize backup savings goals.
                    </p>

                    <div style={styles.inputsGrid}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={styles.budgetInputLabel}>RELOCATION / DEPOSIT</label>
                        <input
                          type="number"
                          className="form-input"
                          value={budget.relocation}
                          onChange={(e) => handleBudgetChange('relocation', e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={styles.budgetInputLabel}>LOCK REPLACEMENTS / HOME SECURITY</label>
                        <input
                          type="number"
                          className="form-input"
                          value={budget.locks}
                          onChange={(e) => handleBudgetChange('locks', e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={styles.budgetInputLabel}>TRANSIT / GASOLINE / TICKETS</label>
                        <input
                          type="number"
                          className="form-input"
                          value={budget.transit}
                          onChange={(e) => handleBudgetChange('transit', e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={styles.budgetInputLabel}>FOOD / INITIAL STAPLE SUPPLIES</label>
                        <input
                          type="number"
                          className="form-input"
                          value={budget.food}
                          onChange={(e) => handleBudgetChange('food', e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={styles.budgetInputLabel}>LEGAL REPRESENTATION / FILING FEES</label>
                        <input
                          type="number"
                          className="form-input"
                          value={budget.legal}
                          onChange={(e) => handleBudgetChange('legal', e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={styles.budgetInputLabel}>SAFE SAVINGS / BACKUP CASH</label>
                        <input
                          type="number"
                          className="form-input"
                          value={budget.savings}
                          onChange={(e) => handleBudgetChange('savings', e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={styles.budgetTotalsRow}>
                      <div style={styles.totalBlock}>
                        <span style={styles.totalLabel}>TOTAL NEEDS</span>
                        <span style={styles.totalValue}>${totalNeeds}</span>
                      </div>
                      <div style={styles.totalBlock}>
                        <span style={styles.totalLabel}>YOUR SAVINGS</span>
                        <span style={{ ...styles.totalValue, color: '#10b981' }}>${budget.savings}</span>
                      </div>
                      <div style={styles.totalBlock}>
                        <span style={styles.totalLabel}>DEFICIT GAP</span>
                        <span style={{ ...styles.totalValue, color: '#ef4444' }}>${deficitGap}</span>
                      </div>
                    </div>
                  </div>

                  {/* Rapid Micro-grant Eligibility Assessment */}
                  <div className="card">
                    <div style={styles.cardHeaderWithIcon}>
                      <Shield size={20} color="var(--color-green-accent)" />
                      <h3 style={styles.plannerTitle}>RAPID MICRO-GRANT ELIGIBILITY ASSESSMENT</h3>
                    </div>
                    <p style={styles.vaultDescription}>
                      We simulate matching algorithms for rapid cash relief to relocate survivors. Answers are evaluated client-side.
                    </p>

                    <div style={styles.questionnaireList}>
                      {/* Q1 */}
                      <div style={styles.questionRow}>
                        <span style={styles.questionText}>Are you currently planning relocation to escape a hostile environment?</span>
                        <div style={styles.toggleButtonGroup}>
                          <button
                            type="button"
                            onClick={() => setGrantAnswers({ ...grantAnswers, q1: 'yes' })}
                            style={{ ...styles.toggleBtn, ...(grantAnswers.q1 === 'yes' ? styles.toggleBtnActive : {}) }}
                          >
                            YES
                          </button>
                          <button
                            type="button"
                            onClick={() => setGrantAnswers({ ...grantAnswers, q1: 'no' })}
                            style={{ ...styles.toggleBtn, ...(grantAnswers.q1 === 'no' ? styles.toggleBtnActive : {}) }}
                          >
                            NO
                          </button>
                        </div>
                      </div>

                      {/* Q2 */}
                      <div style={styles.questionRow}>
                        <span style={styles.questionText}>Is your access to funds monitored or restricted by an abuser?</span>
                        <div style={styles.toggleButtonGroup}>
                          <button
                            type="button"
                            onClick={() => setGrantAnswers({ ...grantAnswers, q2: 'yes' })}
                            style={{ ...styles.toggleBtn, ...(grantAnswers.q2 === 'yes' ? styles.toggleBtnActive : {}) }}
                          >
                            YES
                          </button>
                          <button
                            type="button"
                            onClick={() => setGrantAnswers({ ...grantAnswers, q2: 'no' })}
                            style={{ ...styles.toggleBtn, ...(grantAnswers.q2 === 'no' ? styles.toggleBtnActive : {}) }}
                          >
                            NO
                          </button>
                        </div>
                      </div>

                      {/* Q3 */}
                      <div style={styles.questionRow}>
                        <span style={styles.questionText}>Do you have children or dependents currently under your care?</span>
                        <div style={styles.toggleButtonGroup}>
                          <button
                            type="button"
                            onClick={() => setGrantAnswers({ ...grantAnswers, q3: 'yes' })}
                            style={{ ...styles.toggleBtn, ...(grantAnswers.q3 === 'yes' ? styles.toggleBtnActive : {}) }}
                          >
                            YES
                          </button>
                          <button
                            type="button"
                            onClick={() => setGrantAnswers({ ...grantAnswers, q3: 'no' })}
                            style={{ ...styles.toggleBtn, ...(grantAnswers.q3 === 'no' ? styles.toggleBtnActive : {}) }}
                          >
                            NO
                          </button>
                        </div>
                      </div>

                      {/* Q4 */}
                      <div style={styles.questionRow}>
                        <span style={styles.questionText}>Do you have a secure bank account registered under a safe email?</span>
                        <div style={styles.toggleButtonGroup}>
                          <button
                            type="button"
                            onClick={() => setGrantAnswers({ ...grantAnswers, q4: 'yes' })}
                            style={{ ...styles.toggleBtn, ...(grantAnswers.q4 === 'yes' ? styles.toggleBtnActive : {}) }}
                          >
                            YES
                          </button>
                          <button
                            type="button"
                            onClick={() => setGrantAnswers({ ...grantAnswers, q4: 'no' })}
                            style={{ ...styles.toggleBtn, ...(grantAnswers.q4 === 'no' ? styles.toggleBtnActive : {}) }}
                          >
                            NO
                          </button>
                        </div>
                      </div>
                    </div>

                    <div style={styles.assessmentFooter}>
                      <span style={styles.assessmentStatusText}>{grantAssessmentText}</span>
                      <button onClick={handleAssessGrant} className="btn btn-primary" style={{ backgroundColor: '#10b981' }}>
                        Assess Eligibility
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column (Checklist & Resources) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1.2 }}>
                  {/* Safe Recovery Checklist */}
                  <div className="card">
                    <div style={styles.cardHeaderWithProgress}>
                      <h3 style={styles.plannerTitle}>SAFE RECOVERY CHECKLIST</h3>
                      <span style={styles.percentageBadge}>{checklistPercentage}% Done</span>
                    </div>

                    <div style={styles.checklistContainer}>
                      {checklist.map((item) => (
                        <div key={item.id} style={styles.checkItemRow}>
                          <input
                            type="checkbox"
                            checked={item.done}
                            onChange={() => toggleChecklistItem(item.id)}
                            style={styles.checklistCheckbox}
                          />
                          <span style={{
                            ...styles.checkItemText,
                            textDecoration: item.done ? 'line-through' : 'none',
                            color: item.done ? 'var(--color-earth-muted)' : 'var(--color-earth)'
                          }}>
                            {item.text}
                          </span>
                          <button onClick={() => deleteChecklistItem(item.id)} style={styles.deleteCheckBtn}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleAddChecklistItem} style={styles.addCustomTaskForm}>
                      <input
                        type="text"
                        placeholder="Add custom task..."
                        className="form-input"
                        value={newChecklistItem}
                        onChange={(e) => setNewChecklistItem(e.target.value)}
                        style={styles.addChecklistInput}
                      />
                      <button type="submit" style={styles.addChecklistBtn}>
                        <Plus size={16} />
                      </button>
                    </form>
                  </div>

                  {/* Fintech Relief Resources */}
                  <div className="card">
                    <div style={styles.cardHeaderWithIcon}>
                      <HelpCircle size={18} color="var(--color-earth-muted)" />
                      <h3 style={styles.plannerTitle}>FINTECH RELIEF RESOURCES</h3>
                    </div>
                    <div style={styles.fintechResourcesBody}>
                      <div style={styles.resourceTopic}>
                        <h4 style={styles.resourceTopicTitle}>1. Safe-Haven Banking</h4>
                        <p style={styles.resourceTopicText}>
                          Avoid using your primary family bank when opening an escape account. Direct deposit your relocation grants into a fresh bank account that supports paperless statements.
                        </p>
                      </div>
                      <div style={styles.resourceTopic}>
                        <h4 style={styles.resourceTopicTitle}>2. Low-Interest Crisis Lending</h4>
                        <p style={styles.resourceTopicText}>
                          Several survivor advocacy networks provide zero-percent security deposit loans. Contact the microgrant partners listed in our self-help directory for local program guides.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Settings Page */}
          {activeTab === 'settings' && (
            <div style={styles.tabWrapper}>
              <div style={styles.tabHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Settings size={24} style={styles.tabHeaderIcon} />
                  <h1 style={styles.tabHeaderTitle}>Settings & Privacy Control</h1>
                </div>
                <p style={styles.tabHeaderSubtitle}>
                  Configure stealth indicators, customize dynamic protocols, and manage volatile local storage.
                </p>
              </div>

              <div style={styles.columnsGrid}>
                {/* Protocol Section */}
                <div className="card" style={{ flex: 1.2 }}>
                  <h3 style={styles.sidebarPanelTitle}>DYNAMIC ACTION PROTOCOL</h3>
                  <p style={{ ...styles.vaultDescription, marginBottom: '1rem' }}>
                    Review and verify emergency safety actions. These guidelines are dynamically updated based on the AI Abuse Engine risk factors.
                  </p>
                  <div style={styles.checklist}>
                    <label style={styles.protocolCheckItem}>
                      <input
                        type="checkbox"
                        checked={protocolChecks.visibleEscape}
                        onChange={(e) => setProtocolChecks({ ...protocolChecks, visibleEscape: e.target.checked })}
                        style={styles.checkboxInput}
                      />
                      <span style={styles.protocolCheckText}>
                        Keep the TRACE 'Quick Escape' button (ESC) visible at all times to quickly clear your screen.
                      </span>
                    </label>
                    <label style={styles.protocolCheckItem}>
                      <input
                        type="checkbox"
                        checked={protocolChecks.incognitoMode}
                        onChange={(e) => setProtocolChecks({ ...protocolChecks, incognitoMode: e.target.checked })}
                        style={styles.checkboxInput}
                      />
                      <span style={styles.protocolCheckText}>
                        Clear your browser cache or run TRACE in Incognito mode when looking up shelters.
                      </span>
                    </label>
                    <label style={styles.protocolCheckItem}>
                      <input
                        type="checkbox"
                        checked={protocolChecks.secondaryContact}
                        onChange={(e) => setProtocolChecks({ ...protocolChecks, secondaryContact: e.target.checked })}
                        style={styles.checkboxInput}
                      />
                      <span style={styles.protocolCheckText}>
                        Establish a secure secondary communication channel with a trusted contact.
                      </span>
                    </label>
                  </div>
                </div>

                {/* Account & Storage Settings */}
                <div className="card" style={{ flex: 1 }}>
                  <h3 style={styles.sidebarPanelTitle}>SECURITY PARAMETERS</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Anonymous Username</label>
                      <input
                        type="text"
                        className="form-input"
                        value={currentUser?.username || ''}
                        disabled
                        style={{ opacity: 0.7 }}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Volatile RAM Storage Status</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: '600', fontSize: '0.9rem' }}>
                        <Check size={16} />
                        <span>Active (No database logs)</span>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="btn btn-accent"
                      style={{ width: '100%', marginTop: '1rem' }}
                    >
                      Clear & Lock Dashboard
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Floating SOS Trigger Button */}
      <button
        onClick={triggerSosAlert}
        className="sos-pulse-button"
        style={styles.floatingSosBtn}
        title="Trigger Emergency Admin Alert"
      >
        <ShieldAlert size={28} />
        <span style={styles.sosBtnText}>SOS</span>
      </button>

      {/* Sticky/Floating Quick Escape Button */}
      <button
        onClick={handleQuickHide}
        style={styles.stickyEscapeBtn}
        title="Decoy Swapping (Escape Key)"
      >
        <BookOpen size={16} />
        <span>QUICK ESCAPE</span>
        <span style={styles.escapeBadge}>ESC</span>
      </button>

      {/* SOS Alerting Modal */}
      {showSosModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            {sosStatus === 'counting' && (
              <div style={styles.countingContent}>
                <AlertTriangle size={64} style={styles.warningIcon} />
                <h2 style={styles.modalTitle}>Triggering SOS Distress Signal</h2>
                <p style={styles.modalText}>
                  This will immediately notify all active agency administrators, sending your username and GPS location coordinates.
                </p>
                <div style={styles.timerDisplay}>{countdown}</div>
                <p style={styles.countdownSub}>Distress alert will activate in {countdown} seconds.</p>
                <button onClick={cancelSos} style={styles.cancelBtn}>
                  CANCEL ALERT
                </button>
              </div>
            )}

            {sosStatus === 'sending' && (
              <div style={styles.statusContent}>
                <div style={styles.spinner}></div>
                <h3 style={styles.modalTitle}>Sending Encrypted Distress Signal...</h3>
                <p style={styles.modalText}>Extracting browser GPS location coordinates and updating monitoring panel.</p>
              </div>
            )}

            {sosStatus === 'success' && (
              <div style={styles.statusContent}>
                <div style={styles.successIconWrapper}>
                  <Check size={48} />
                </div>
                <h3 style={styles.modalTitle}>Distress Signal Active</h3>
                <p style={styles.modalText}>Agency notified. Local emergency line: <strong>Dial 112</strong>.</p>
                <p style={styles.redirectText}>Redirecting to safe decoy screen immediately...</p>
              </div>
            )}

            {sosStatus === 'error' && (
              <div style={styles.statusContent}>
                <AlertTriangle size={48} style={styles.errorIcon} />
                <h3 style={styles.modalTitle}>Transmission Failed</h3>
                <p style={styles.modalText}>Could not reach the server. Please dial <strong>112</strong> or <strong>181</strong> directly on your phone.</p>
                <div style={styles.errorActions}>
                  <button onClick={sendSosSignal} className="btn btn-primary">Retry</button>
                  <button onClick={cancelSos} className="btn btn-outline">Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  dashboardContainer: {
    background: 'var(--dashboard-bg-gradient)',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'var(--font-sans)',
    color: 'var(--color-earth)',
    transition: 'background 0.3s ease, color 0.3s ease',
  },
  loadingScreen: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: 'var(--color-sand)',
    fontSize: '1.2rem',
    fontWeight: '600',
    color: 'var(--color-forest)',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '280px 1fr',
    minHeight: '100vh',
  },
  sidebar: {
    backgroundColor: 'var(--sidebar-bg)',
    borderRight: '1px solid var(--color-clay-light)',
    padding: '2rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    height: '100vh',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    transition: 'background-color 0.3s ease, border-color 0.3s ease',
  },
  sidebarLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0 0.5rem',
  },
  logoBadgeIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: '1.4rem',
    fontWeight: '800',
    letterSpacing: '1px',
    color: 'var(--dashboard-header-color)',
  },
  profileCard: {
    backgroundColor: 'var(--color-white)',
    border: '1px solid var(--color-clay-light)',
    borderRadius: '12px',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: '0.75rem',
    boxShadow: 'var(--shadow-sm)',
  },
  profileActionBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.25rem',
    border: '1px solid var(--color-clay-light)',
    backgroundColor: 'var(--color-sand-light)',
    color: 'var(--color-earth-muted)',
    cursor: 'pointer',
    fontSize: '0.7rem',
    padding: '0.35rem 0.25rem',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
  },
  profileAvatar: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileDetails: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  profileName: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: 'var(--color-earth)',
  },
  profileEmail: {
    fontSize: '0.75rem',
    color: 'var(--color-earth-muted)',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },
  sidebarMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flex: 1,
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.85rem 1rem',
    border: 'none',
    background: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    color: 'var(--sidebar-text)',
    fontWeight: '600',
    fontSize: '0.9rem',
    textAlign: 'left',
    transition: 'all 0.2s ease',
  },
  menuItemActive: {
    backgroundColor: 'var(--sidebar-item-active-bg)',
    color: 'var(--sidebar-item-active-text)',
    boxShadow: 'var(--shadow-sm)',
  },
  sidebarBottom: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  bottomMenuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    border: 'none',
    background: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    color: 'var(--sidebar-text)',
    fontWeight: '600',
    fontSize: '0.85rem',
    textAlign: 'left',
    transition: 'all 0.2s ease',
    opacity: 0.8,
    ':hover': {
      opacity: 1,
    },
  },
  divider: {
    height: '1px',
    backgroundColor: 'var(--color-clay-light)',
    width: '100%',
  },
  bottomControls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  themeToggleBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    color: 'var(--sidebar-text)',
    fontSize: '0.85rem',
    fontWeight: '600',
    padding: '0.5rem 1rem',
  },
  controlText: {
    fontSize: '0.85rem',
  },
  lockBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    border: 'none',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '0.85rem',
    transition: 'all 0.2s ease',
  },
  consoleContent: {
    padding: '2.5rem 3.5rem',
    overflowY: 'auto',
    height: '100vh',
    backgroundColor: 'transparent',
  },
  tabWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  tabHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    borderBottom: '1px solid var(--color-clay-light)',
    paddingBottom: '1.25rem',
  },
  tabHeaderIcon: {
    color: 'var(--color-forest)',
  },
  tabHeaderTitle: {
    fontSize: '1.8rem',
    fontWeight: '800',
    color: 'var(--dashboard-header-color)',
    margin: 0,
  },
  tabHeaderSubtitle: {
    fontSize: '0.95rem',
    color: 'var(--color-earth-muted)',
    margin: 0,
    lineHeight: '1.5',
  },
  overviewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
  },
  overviewCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    minHeight: '220px',
  },
  cardHeaderWithIcon: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  overviewCardTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: 'var(--dashboard-header-color)',
    margin: 0,
  },
  overviewMetric: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.5rem',
    margin: '0.5rem 0',
  },
  threatLevelBadge: {
    color: '#ffffff',
    fontSize: '0.85rem',
    fontWeight: '800',
    padding: '0.35rem 0.85rem',
    borderRadius: '20px',
    letterSpacing: '0.5px',
  },
  metricNumber: {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: 'var(--color-forest)',
    lineHeight: '1',
  },
  metricLabel: {
    fontSize: '0.9rem',
    color: 'var(--color-earth-muted)',
    fontWeight: '600',
  },
  overviewCardText: {
    fontSize: '0.85rem',
    color: 'var(--color-earth-muted)',
    margin: 0,
    lineHeight: '1.5',
  },
  alertPanel: {
    backgroundColor: 'var(--color-alert-bg)',
    border: '1px solid var(--color-clay)',
    borderRadius: '12px',
    padding: '1.5rem',
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start',
  },
  alertIcon: {
    color: 'var(--color-terracotta)',
    flexShrink: 0,
  },
  alertTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    color: 'var(--color-terracotta)',
    margin: '0 0 0.25rem 0',
  },
  alertText: {
    fontSize: '0.85rem',
    color: 'var(--color-earth-muted)',
    margin: 0,
    lineHeight: '1.5',
  },
  columnsGrid: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr',
    gap: '2rem',
    alignItems: 'start',
  },
  chatCard: {
    display: 'flex',
    flexDirection: 'column',
    height: '550px',
    padding: '1.5rem',
  },
  chatCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--color-clay-light)',
    paddingBottom: '0.75rem',
    marginBottom: '1rem',
  },
  chatCardTitle: {
    fontSize: '0.9rem',
    fontWeight: '800',
    color: 'var(--color-earth-muted)',
    margin: 0,
    letterSpacing: '0.5px',
  },
  encryptionBadge: {
    fontSize: '0.75rem',
    color: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
    fontWeight: '700',
  },
  chatContainer: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    paddingRight: '0.5rem',
    marginBottom: '1rem',
  },
  chatBubbleWrapper: {
    display: 'flex',
    width: '100%',
  },
  chatBubble: {
    maxWidth: '80%',
    padding: '0.85rem 1.1rem',
    borderRadius: '12px',
    border: '1px solid',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    boxShadow: 'var(--shadow-sm)',
  },
  chatTime: {
    fontSize: '0.7rem',
    alignSelf: 'flex-end',
    opacity: 0.6,
  },
  chatInputForm: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    borderTop: '1px solid var(--color-clay-light)',
    paddingTop: '1rem',
  },
  chatInputField: {
    flex: 1,
    margin: 0,
    fontSize: '0.9rem',
    padding: '0.75rem 1rem',
  },
  chatSendBtn: {
    width: '42px',
    height: '42px',
    borderRadius: '8px',
    backgroundColor: 'var(--sidebar-item-active-bg)',
    color: 'var(--sidebar-item-active-text)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  sideColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  metricCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  sidebarPanelTitle: {
    fontSize: '0.9rem',
    fontWeight: '800',
    color: 'var(--dashboard-header-color)',
    margin: 0,
    letterSpacing: '0.5px',
  },
  statusBadge: {
    fontSize: '0.75rem',
    fontWeight: '800',
    padding: '0.25rem 0.6rem',
    borderRadius: '4px',
    letterSpacing: '0.5px',
  },
  progressBarList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    marginBottom: '1rem',
  },
  progressItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  progressLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.85rem',
    fontWeight: '600',
  },
  progressLabel: {
    color: 'var(--color-earth)',
  },
  progressVal: {
    color: 'var(--color-earth-muted)',
  },
  progressBarBg: {
    height: '6px',
    backgroundColor: 'var(--color-clay-light)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.5s ease',
  },
  metricsDisclaimer: {
    fontSize: '0.75rem',
    color: 'var(--color-earth-muted)',
    lineHeight: '1.4',
  },
  protocolCheckItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    cursor: 'pointer',
    fontSize: '0.85rem',
    color: 'var(--color-earth)',
    lineHeight: '1.4',
    padding: '0.5rem 0',
  },
  checkboxInput: {
    marginTop: '0.2rem',
    cursor: 'pointer',
  },
  protocolCheckText: {
    flex: 1,
  },
  vaultDescription: {
    fontSize: '0.85rem',
    color: 'var(--color-earth-muted)',
    lineHeight: '1.5',
    margin: '0 0 1.25rem 0',
  },
  uploadContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  dropZone: {
    border: '2px dashed var(--color-clay)',
    borderRadius: '12px',
    backgroundColor: 'var(--color-sand-light)',
    padding: '2.5rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.2s ease',
  },
  hiddenFileInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer',
  },
  dropZoneTitle: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: 'var(--color-earth)',
    marginBottom: '0.25rem',
  },
  dropZoneSubtitle: {
    fontSize: '0.75rem',
    color: 'var(--color-earth-muted)',
  },
  selectedFileAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'var(--color-green-bg)',
    border: '1px solid var(--color-green-accent)',
    borderRadius: '8px',
    padding: '0.75rem',
    fontSize: '0.85rem',
    color: 'var(--color-earth)',
  },
  emptyState: {
    color: 'var(--color-earth-muted)',
    fontSize: '0.9rem',
    textAlign: 'center',
    padding: '3rem 1.5rem',
    border: '1px dashed var(--color-clay)',
    borderRadius: '10px',
    backgroundColor: 'var(--color-sand-light)',
    margin: 'auto 0',
  },
  recordsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    overflowY: 'auto',
    maxHeight: '450px',
    paddingRight: '0.25rem',
  },
  recordCard: {
    backgroundColor: 'var(--color-sand-light)',
    border: '1px solid var(--color-clay-light)',
    borderRadius: '10px',
    padding: '1.25rem',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  recordHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  recordLabel: {
    fontSize: '1rem',
    fontWeight: '700',
    color: 'var(--color-earth)',
    margin: '0 0 0.15rem 0',
  },
  recordFilename: {
    fontSize: '0.75rem',
    color: 'var(--color-earth-muted)',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-terracotta)',
    cursor: 'pointer',
    padding: '0.25rem',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
  },
  recordDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    fontSize: '0.8rem',
  },
  recordDetailRow: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  detailLabel: {
    color: 'var(--color-earth-muted)',
    fontWeight: '600',
  },
  detailValue: {
    fontFamily: 'monospace',
    color: 'var(--color-earth)',
  },
  securedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'var(--color-green-bg)',
    color: 'var(--color-green-accent)',
    fontWeight: '800',
    fontSize: '0.65rem',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    boxShadow: 'var(--shadow-sm)',
  },
  plannerTitle: {
    fontSize: '1rem',
    fontWeight: '800',
    color: 'var(--dashboard-header-color)',
    margin: 0,
    letterSpacing: '0.5px',
  },
  inputsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  budgetInputLabel: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: 'var(--color-earth-muted)',
  },
  budgetTotalsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    borderTop: '1px solid var(--color-clay-light)',
    paddingTop: '1.5rem',
    gap: '1rem',
  },
  totalBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: '0.75rem',
    fontWeight: '800',
    color: 'var(--color-earth-muted)',
    marginBottom: '0.25rem',
  },
  totalValue: {
    fontSize: '1.4rem',
    fontWeight: '800',
    color: 'var(--color-earth)',
  },
  questionnaireList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  questionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1.5rem',
    borderBottom: '1px solid var(--color-clay-light)',
    paddingBottom: '0.75rem',
  },
  questionText: {
    fontSize: '0.875rem',
    lineHeight: '1.4',
    color: 'var(--color-earth)',
    fontWeight: '500',
  },
  toggleButtonGroup: {
    display: 'flex',
    gap: '0.25rem',
    backgroundColor: 'var(--color-sand-light)',
    border: '1px solid var(--color-clay-light)',
    borderRadius: '6px',
    padding: '2px',
  },
  toggleBtn: {
    padding: '0.4rem 0.8rem',
    fontSize: '0.75rem',
    fontWeight: '700',
    border: 'none',
    background: 'none',
    color: 'var(--color-earth-muted)',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  toggleBtnActive: {
    backgroundColor: 'var(--sidebar-item-active-bg)',
    color: 'var(--sidebar-item-active-text)',
    boxShadow: 'var(--shadow-sm)',
  },
  assessmentFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid var(--color-clay-light)',
    paddingTop: '1.25rem',
  },
  assessmentStatusText: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: 'var(--color-earth)',
  },
  cardHeaderWithProgress: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--color-clay-light)',
    paddingBottom: '0.75rem',
    marginBottom: '1rem',
  },
  percentageBadge: {
    fontSize: '0.75rem',
    fontWeight: '800',
    backgroundColor: 'var(--color-green-bg)',
    color: 'var(--color-green-accent)',
    padding: '0.25rem 0.6rem',
    borderRadius: '20px',
  },
  checklistContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '1.25rem',
    maxHeight: '260px',
    overflowY: 'auto',
    paddingRight: '0.25rem',
  },
  checkItemRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    backgroundColor: 'var(--color-sand-light)',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1px solid var(--color-clay-light)',
  },
  checklistCheckbox: {
    marginTop: '0.2rem',
    cursor: 'pointer',
  },
  checkItemText: {
    fontSize: '0.85rem',
    flex: 1,
    lineHeight: '1.4',
  },
  deleteCheckBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-earth-muted)',
    cursor: 'pointer',
    padding: '0.2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6,
    transition: 'opacity 0.2s',
    ':hover': {
      opacity: 1,
      color: 'var(--color-terracotta)',
    },
  },
  addCustomTaskForm: {
    display: 'flex',
    gap: '0.5rem',
  },
  addChecklistInput: {
    flex: 1,
    margin: 0,
    fontSize: '0.85rem',
    padding: '0.5rem 0.75rem',
  },
  addChecklistBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '6px',
    backgroundColor: 'var(--sidebar-item-active-bg)',
    color: 'var(--sidebar-item-active-text)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fintechResourcesBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginTop: '0.5rem',
  },
  resourceTopic: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  resourceTopicTitle: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: 'var(--color-earth)',
    margin: 0,
  },
  resourceTopicText: {
    fontSize: '0.8rem',
    color: 'var(--color-earth-muted)',
    lineHeight: '1.4',
    margin: 0,
  },
  floatingSosBtn: {
    position: 'fixed',
    bottom: '2rem',
    left: '2rem',
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    border: 'none',
    color: '#ffffff',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)',
    zIndex: 100,
    transition: 'all 0.3s ease',
  },
  sosBtnText: {
    fontSize: '0.75rem',
    fontWeight: '800',
    letterSpacing: '0.5px',
    marginTop: '2px',
  },
  stickyEscapeBtn: {
    position: 'fixed',
    bottom: '2rem',
    right: '2rem',
    backgroundColor: 'var(--color-terracotta)',
    color: '#ffffff',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '30px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '0.9rem',
    boxShadow: '0 4px 15px rgba(225, 29, 72, 0.4)',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.3s ease',
    ':hover': {
      backgroundColor: 'var(--color-terracotta-hover)',
    },
  },
  escapeBadge: {
    fontSize: '0.7rem',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: '0.1rem 0.4rem',
    borderRadius: '4px',
    marginLeft: '0.25rem',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1.5rem',
  },
  modalContent: {
    backgroundColor: 'var(--color-white)',
    borderRadius: '16px',
    padding: '2.5rem',
    width: '100%',
    maxWidth: '480px',
    boxShadow: 'var(--shadow-lg)',
    textAlign: 'center',
    border: '1px solid var(--color-clay-light)',
  },
  countingContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  warningIcon: {
    color: '#ef4444',
    marginBottom: '1rem',
  },
  modalTitle: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: 'var(--dashboard-header-color)',
    marginBottom: '0.75rem',
  },
  modalText: {
    fontSize: '0.95rem',
    color: 'var(--color-earth-muted)',
    lineHeight: '1.5',
    marginBottom: '1.5rem',
  },
  timerDisplay: {
    fontSize: '5rem',
    fontWeight: '800',
    color: '#ef4444',
    lineHeight: '1',
    margin: '1rem 0',
  },
  countdownSub: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--color-earth)',
    marginBottom: '2rem',
  },
  cancelBtn: {
    width: '100%',
    padding: '0.85rem',
    backgroundColor: 'var(--color-sand)',
    color: 'var(--color-earth)',
    border: '1px solid var(--color-clay)',
    borderRadius: '10px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  statusContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '1rem 0',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid var(--color-sand)',
    borderTopColor: '#ef4444',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1.5rem',
  },
  successIconWrapper: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-green-bg)',
    color: 'var(--color-green-accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.5rem',
  },
  redirectText: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--color-terracotta)',
    marginTop: '1rem',
  },
  errorIcon: {
    color: '#ef4444',
    marginBottom: '1.5rem',
  },
  errorActions: {
    display: 'flex',
    gap: '1rem',
    width: '100%',
    marginTop: '1rem',
    button: {
      flex: 1,
    },
  },
};
