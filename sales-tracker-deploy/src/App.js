import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

const SalesActivityTracker = () => {
  const [selectedRep, setSelectedRep] = useState('');
  const [weekStart, setWeekStart] = useState('');
  const [weekData, setWeekData] = useState({});
  const [goals, setGoals] = useState({
    callsDaily: 50,
    emailsDaily: 30,
    contactsDaily: 10,
    responsesDaily: 5,
    meetingsDaily: 3,
    contactsWeekly: 20,
    meetingsWeekly: 15
  });
  const [showSettings, setShowSettings] = useState(false);
  const [reps, setReps] = useState(['Rep 1', 'Rep 2', 'Rep 3']);
  const [newRepName, setNewRepName] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(false);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (weekStart && selectedRep) {
      loadWeekData();
    }
  }, [weekStart, selectedRep]);

  // Auto-sync every 5 minutes if enabled
  useEffect(() => {
    if (autoSync && googleSheetsUrl) {
      const interval = setInterval(() => {
        syncToGoogleSheets(true); // true = silent sync
      }, 5 * 60 * 1000); // 5 minutes
      
      return () => clearInterval(interval);
    }
  }, [autoSync, googleSheetsUrl]);

  const getMondayOfWeek = (dateString) => {
    const date = new Date(dateString + 'T12:00:00');
    const dayOfWeek = date.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const monday = new Date(date);
    monday.setDate(date.getDate() + daysToMonday);
    
    const year = monday.getFullYear();
    const month = String(monday.getMonth() + 1).padStart(2, '0');
    const day = String(monday.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  const loadData = () => {
    try {
      const savedGoals = localStorage.getItem('tracker-goals');
      if (savedGoals) {
        const parsed = JSON.parse(savedGoals);
        setGoals({
          ...parsed,
          meetingsDaily: parsed.meetingsDaily || 3,
          meetingsWeekly: parsed.meetingsWeekly || 15
        });
      }

      const savedReps = localStorage.getItem('tracker-reps');
      if (savedReps) setReps(JSON.parse(savedReps));

      const savedLogo = localStorage.getItem('tracker-logo');
      if (savedLogo) setLogoUrl(savedLogo);

      const savedGoogleUrl = localStorage.getItem('google-sheets-url');
      if (savedGoogleUrl) setGoogleSheetsUrl(savedGoogleUrl);

      const savedAutoSync = localStorage.getItem('auto-sync');
      if (savedAutoSync) setAutoSync(savedAutoSync === 'true');

      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      const monday = getMondayOfWeek(todayString);
      setWeekStart(monday);
    } catch (err) {
      console.error('Error loading data:', err);
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      const monday = getMondayOfWeek(todayString);
      setWeekStart(monday);
    }
  };

  const loadWeekData = () => {
    const key = `week-${weekStart}-${selectedRep}`;
    try {
      const data = localStorage.getItem(key);
      if (data) {
        setWeekData(JSON.parse(data));
      } else {
        setWeekData({});
      }
    } catch (err) {
      console.error('Error loading week data:', err);
      setWeekData({});
    }
  };

  const saveWeekData = () => {
    const key = `week-${weekStart}-${selectedRep}`;
    try {
      localStorage.setItem(key, JSON.stringify(weekData));
      setSavedMessage('✓ Data saved successfully!');
      setTimeout(() => setSavedMessage(''), 3000);
      
      // Auto-sync to Google Sheets if enabled
      if (autoSync && googleSheetsUrl) {
        syncToGoogleSheets(true);
      }
    } catch (err) {
      console.error('Error saving data:', err);
      setSavedMessage('❌ Error saving data!');
      setTimeout(() => setSavedMessage(''), 3000);
    }
  };

  const syncToGoogleSheets = async (silent = false) => {
    if (!googleSheetsUrl) {
      alert('Please set your Google Sheets URL in Settings first!');
      return;
    }

    if (!silent) setSyncing(true);

    try {
      // Collect all activity data from localStorage
      const allKeys = Object.keys(localStorage);
      const weekKeys = allKeys.filter(key => key.startsWith('week-'));
      const activities = [];

      weekKeys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          const parts = key.split('-');
          const monday = `${parts[1]}-${parts[2]}-${parts[3]}`;
          const rep = parts.slice(4).join('-');
          
          const weekInfo = JSON.parse(data);
          days.forEach((day, idx) => {
            const dayData = weekInfo[day] || {};
            const currentDate = new Date(monday + 'T12:00:00');
            currentDate.setDate(currentDate.getDate() + idx);
            
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const dayNum = String(currentDate.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${dayNum}`;
            
            activities.push({
              rep: rep,
              weekStart: monday,
              date: formattedDate,
              day: day,
              calls: dayData.calls || 0,
              emails: dayData.emails || 0,
              contacts: dayData.contacts || 0,
              responses: dayData.responses || 0,
              meetings: dayData.meetings || 0
            });
          });
        }
      });

      // Send to Google Sheets
      const response = await fetch(googleSheetsUrl, {
        method: 'POST',
        mode: 'no-cors', // Google Apps Script requires this
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'save',
          activities: activities
        })
      });

      if (!silent) {
        setSavedMessage('✓ Synced to Google Sheets!');
        setTimeout(() => setSavedMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error syncing to Google Sheets:', err);
      if (!silent) {
        setSavedMessage('❌ Sync failed. Check your URL.');
        setTimeout(() => setSavedMessage(''), 3000);
      }
    } finally {
      if (!silent) setSyncing(false);
    }
  };

  const saveGoogleSheetsUrl = () => {
    try {
      localStorage.setItem('google-sheets-url', googleSheetsUrl);
      setSavedMessage('✓ Google Sheets URL saved!');
      setTimeout(() => setSavedMessage(''), 2000);
    } catch (err) {
      console.error('Error saving URL:', err);
    }
  };

  const toggleAutoSync = () => {
    const newValue = !autoSync;
    setAutoSync(newValue);
    localStorage.setItem('auto-sync', newValue.toString());
    setSavedMessage(newValue ? '✓ Auto-sync enabled!' : 'Auto-sync disabled');
    setTimeout(() => setSavedMessage(''), 2000);
  };

  const saveGoals = () => {
    try {
      localStorage.setItem('tracker-goals', JSON.stringify(goals));
      setSavedMessage('✓ Goals updated!');
      setTimeout(() => setSavedMessage(''), 2000);
    } catch (err) {
      console.error('Error saving goals:', err);
    }
  };

  const saveLogo = (url) => {
    try {
      localStorage.setItem('tracker-logo', url);
      setLogoUrl(url);
      setSavedMessage('✓ Logo updated!');
      setTimeout(() => setSavedMessage(''), 2000);
    } catch (err) {
      console.error('Error saving logo:', err);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        saveLogo(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const addRep = () => {
    if (newRepName.trim() && !reps.includes(newRepName.trim())) {
      const updated = [...reps, newRepName.trim()];
      setReps(updated);
      localStorage.setItem('tracker-reps', JSON.stringify(updated));
      setNewRepName('');
      setSavedMessage('✓ Rep added!');
      setTimeout(() => setSavedMessage(''), 2000);
    }
  };

  const removeRep = (rep) => {
    if (window.confirm(`Remove ${rep}? This will NOT delete their saved data.`)) {
      const updated = reps.filter(r => r !== rep);
      setReps(updated);
      localStorage.setItem('tracker-reps', JSON.stringify(updated));
      if (selectedRep === rep) setSelectedRep('');
    }
  };

  const updateDayData = (day, field, value) => {
    const numValue = value === '' ? '' : parseInt(value);
    setWeekData(prev => ({
      ...prev,
      [day]: {
        ...(prev[day] || {}),
        [field]: numValue
      }
    }));
  };

  const calculateWeeklyTotals = () => {
    const totals = { calls: 0, emails: 0, contacts: 0, responses: 0, meetings: 0 };
    days.forEach(day => {
      const data = weekData[day] || {};
      totals.calls += data.calls || 0;
      totals.emails += data.emails || 0;
      totals.contacts += data.contacts || 0;
      totals.responses += data.responses || 0;
      totals.meetings += data.meetings || 0;
    });
    return totals;
  };

  const exportToExcel = () => {
    const allData = [];
    
    const allKeys = Object.keys(localStorage);
    const weekKeys = allKeys.filter(key => key.startsWith('week-'));
    
    if (weekKeys.length === 0) {
      alert('No data to export. Please save some activity data first!');
      return;
    }

    weekKeys.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parts = key.split('-');
          const monday = `${parts[1]}-${parts[2]}-${parts[3]}`;
          const rep = parts.slice(4).join('-');
          
          const weekInfo = JSON.parse(data);
          days.forEach((day, idx) => {
            const dayData = weekInfo[day] || {};
            
            const currentDate = new Date(monday + 'T12:00:00');
            currentDate.setDate(currentDate.getDate() + idx);
            
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const dayNum = String(currentDate.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${dayNum}`;
            
            allData.push({
              'Sales Rep': rep,
              'Week Starting': monday,
              'Date': formattedDate,
              'Day': day,
              'Calls': dayData.calls || 0,
              'Emails': dayData.emails || 0,
              'Contacts': dayData.contacts || 0,
              'Responses': dayData.responses || 0,
              'Meetings': dayData.meetings || 0
            });
          });
        }
      } catch (err) {
        console.error('Error reading key:', key, err);
      }
    });

    if (allData.length === 0) {
      alert('No activity data found. Make sure you have saved some data first!');
      return;
    }

    allData.sort((a, b) => new Date(a.Date) - new Date(b.Date));

    const ws = XLSX.utils.json_to_sheet(allData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Activity Data');

    const goalsWs = XLSX.utils.json_to_sheet([{
      'Daily Calls Goal': goals.callsDaily,
      'Daily Emails Goal': goals.emailsDaily,
      'Daily Contacts Goal': goals.contactsDaily,
      'Daily Responses Goal': goals.responsesDaily,
      'Daily Meetings Goal': goals.meetingsDaily,
      'Weekly Contacts Goal': goals.contactsWeekly,
      'Weekly Meetings Goal': goals.meetingsWeekly
    }]);
    XLSX.utils.book_append_sheet(wb, goalsWs, 'Goals');

    const summaryData = {};
    allData.forEach(row => {
      if (!summaryData[row['Sales Rep']]) {
        summaryData[row['Sales Rep']] = {
          'Sales Rep': row['Sales Rep'],
          'Total Calls': 0,
          'Total Emails': 0,
          'Total Contacts': 0,
          'Total Responses': 0,
          'Total Meetings': 0,
          'Days Tracked': 0
        };
      }
      summaryData[row['Sales Rep']]['Total Calls'] += row.Calls;
      summaryData[row['Sales Rep']]['Total Emails'] += row.Emails;
      summaryData[row['Sales Rep']]['Total Contacts'] += row.Contacts;
      summaryData[row['Sales Rep']]['Total Responses'] += row.Responses;
      summaryData[row['Sales Rep']]['Total Meetings'] += row.Meetings;
      summaryData[row['Sales Rep']]['Days Tracked'] += 1;
    });

    const summaryWs = XLSX.utils.json_to_sheet(Object.values(summaryData));
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary by Rep');

    XLSX.writeFile(wb, `Sales_Activity_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    alert(`✓ Exported ${allData.length} activity records from ${Object.keys(summaryData).length} sales reps!`);
  };

  const totals = calculateWeeklyTotals();
  const callsGoal = goals.callsDaily * 5;
  const emailsGoal = goals.emailsDaily * 5;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
      fontFamily: "'DM Sans', -apple-system, sans-serif",
      padding: '1rem',
      color: '#fff'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Space+Mono:wght@700&display=swap');
        
        * { box-sizing: border-box; }
        
        .card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 1rem;
          transition: all 0.3s ease;
        }
        
        @media (min-width: 768px) {
          .card { padding: 1.5rem; }
          .card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          }
        }
        
        .input-field {
          width: 100%;
          padding: 0.6rem;
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: #fff;
          font-size: 1rem;
          text-align: center;
          transition: all 0.2s;
        }
        
        @media (min-width: 768px) {
          .input-field { width: 80px; padding: 0.5rem; }
        }
        
        .input-field:focus {
          outline: none;
          border-color: #00d4ff;
          background: rgba(255, 255, 255, 0.15);
        }
        
        .progress-bar {
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
          margin-top: 0.5rem;
        }
        
        .progress-fill {
          height: 100%;
          transition: width 0.5s ease, background 0.3s ease;
          border-radius: 4px;
        }
        
        .btn {
          padding: 0.75rem 1.25rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.9rem;
          width: 100%;
        }
        
        @media (min-width: 768px) {
          .btn { width: auto; padding: 0.75rem 1.5rem; font-size: 0.95rem; }
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .btn-primary:active, .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }
        
        .btn-success {
          background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
          color: white;
        }
        
        .btn-success:active, .btn-success:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(56, 239, 125, 0.4);
        }
        
        .btn-info {
          background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
          color: white;
        }
        
        .btn-info:active, .btn-info:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 212, 255, 0.4);
        }
        
        .stat-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 1rem;
          text-align: center;
        }
        
        .achievement { animation: pulse 2s infinite; }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        select {
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          padding: 0.75rem;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          width: 100%;
        }
        
        @media (min-width: 768px) {
          select { width: auto; min-width: 150px; }
        }
        
        select:focus { outline: none; border-color: #00d4ff; }
        option { background: #203a43; color: #fff; }
        input[type="file"] { display: none; }
        input[type="date"] { width: 100%; }
        @media (min-width: 768px) {
          input[type="date"] { width: auto; }
        }

        .logo-upload-btn {
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.1);
          border: 2px dashed rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          color: #fff;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s;
          display: inline-block;
        }

        .logo-upload-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: #00d4ff;
        }
        
        .mobile-stack {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        @media (min-width: 768px) {
          .mobile-stack {
            flex-direction: row;
            align-items: center;
          }
        }
        
        .header-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          text-align: center;
        }
        
        @media (min-width: 768px) {
          .header-container {
            position: relative;
            flex-direction: row;
            min-height: 100px;
            margin-bottom: 2rem;
          }
        }
        
        .logo-container { order: 1; }
        
        @media (min-width: 768px) {
          .logo-container {
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            order: 0;
          }
        }
        
        .title-container { flex: 1; order: 2; }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div className="header-container">
          {logoUrl && (
            <div className="logo-container">
              <img 
                src={logoUrl} 
                alt="Company Logo" 
                style={{ height: '60px', maxWidth: '180px', objectFit: 'contain' }} 
              />
            </div>
          )}
          
          <div className="title-container">
            <h1 style={{ 
              fontSize: 'clamp(1.8rem, 5vw, 3rem)',
              fontWeight: '700',
              fontFamily: "'Space Mono', monospace",
              marginBottom: '0.5rem',
              background: 'linear-gradient(135deg, #00d4ff 0%, #667eea 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
              margin: 0
            }}>
              SALES TRACKER
            </h1>
            <p style={{ fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', opacity: 0.8, margin: '0.5rem 0 0 0' }}>
              Track daily activity & crush your goals
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="mobile-stack" style={{ justifyContent: 'space-between' }}>
            <div className="mobile-stack" style={{ flex: 1 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.8' }}>
                  Sales Rep
                </label>
                <select value={selectedRep} onChange={(e) => setSelectedRep(e.target.value)}>
                  <option value="">Select Rep</option>
                  {reps.map(rep => <option key={rep} value={rep}>{rep}</option>)}
                </select>
              </div>
              
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.8' }}>
                  Week Starting
                </label>
                <input 
                  type="date" 
                  value={weekStart} 
                  onChange={(e) => setWeekStart(getMondayOfWeek(e.target.value))}
                  style={{ 
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
              <button className="btn btn-primary" onClick={() => setShowSettings(!showSettings)}>
                ⚙️ {showSettings ? 'Close' : 'Settings'}
              </button>
              <button 
                className="btn btn-info" 
                onClick={() => syncToGoogleSheets(false)}
                disabled={syncing || !googleSheetsUrl}
                style={{ opacity: !googleSheetsUrl ? 0.5 : 1 }}
              >
                {syncing ? '⏳ Syncing...' : '📊 Sync to Sheets'}
              </button>
              <button className="btn btn-success" onClick={exportToExcel}>
                💾 Export Excel
              </button>
            </div>
          </div>

          {savedMessage && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.75rem', 
              background: savedMessage.includes('❌') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 239, 125, 0.2)',
              borderRadius: '8px',
              textAlign: 'center',
              fontWeight: '600',
              fontSize: '0.9rem'
            }}>
              {savedMessage}
            </div>
          )}
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.2rem' }}>⚙️ Settings</h3>
            
            {/* Google Sheets Integration */}
            <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '1rem' }}>📊 Google Sheets Integration</h4>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Google Apps Script URL
                </label>
                <input
                  type="text"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={googleSheetsUrl}
                  onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                <button className="btn btn-success" onClick={saveGoogleSheetsUrl}>
                  Save URL
                </button>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={toggleAutoSync}
                    style={{ width: '18px', height: '18px' }}
                  />
                  Auto-sync every 5 minutes
                </label>
              </div>
              <p style={{ fontSize: '0.85rem', opacity: 0.7, margin: 0 }}>
                Paste your Google Apps Script Web App URL here to enable syncing
              </p>
            </div>
            
            <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Company Logo</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                {logoUrl && (
                  <div style={{ 
                    padding: '0.75rem', 
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <img src={logoUrl} alt="Logo" style={{ height: '35px', objectFit: 'contain' }} />
                    <button 
                      onClick={() => saveLogo('')}
                      style={{
                        background: 'rgba(255, 0, 0, 0.3)',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#fff',
                        cursor: 'pointer',
                        padding: '0.4rem 0.75rem',
                        fontSize: '0.85rem'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
                <label className="logo-upload-btn">
                  {logoUrl ? '📸 Change' : '📸 Upload'}
                  <input type="file" accept="image/*" onChange={handleLogoUpload} />
                </label>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Daily Goals</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                {[
                  ['Calls', 'callsDaily'],
                  ['Emails', 'emailsDaily'],
                  ['Contacts', 'contactsDaily'],
                  ['Responses', 'responsesDaily'],
                  ['Meetings', 'meetingsDaily']
                ].map(([label, key]) => (
                  <div key={key}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                      {label}
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      value={goals[key]}
                      onChange={(e) => setGoals({ ...goals, [key]: parseInt(e.target.value) || 0 })}
                      min="0"
                    />
                  </div>
                ))}
              </div>
              
              <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                    Weekly Contacts
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={goals.contactsWeekly}
                    onChange={(e) => setGoals({ ...goals, contactsWeekly: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                    Weekly Meetings
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={goals.meetingsWeekly}
                    onChange={(e) => setGoals({ ...goals, meetingsWeekly: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
              </div>
              
              <button className="btn btn-success" onClick={saveGoals} style={{ marginTop: '1rem' }}>
                Save Goals
              </button>
            </div>

            <div>
              <h4 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Manage Reps</h4>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="New rep name"
                  value={newRepName}
                  onChange={(e) => setNewRepName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addRep()}
                  style={{
                    flex: '1 1 200px',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.95rem'
                  }}
                />
                <button className="btn btn-success" onClick={addRep} style={{ flex: '0 0 auto' }}>
                  Add
                </button>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {reps.map(rep => (
                  <div key={rep} style={{
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem'
                  }}>
                    {rep}
                    <button 
                      onClick={() => removeRep(rep)}
                      style={{
                        background: 'rgba(255, 0, 0, 0.3)',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#fff',
                        cursor: 'pointer',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content - Same as before, continues... */}
        {selectedRep && weekStart ? (
          <>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
              gap: '0.75rem',
              marginBottom: '1rem'
            }}>
              {[
                ['📞 Calls', totals.calls, callsGoal],
                ['📧 Emails', totals.emails, emailsGoal],
                ['👥 Contacts', totals.contacts, goals.contactsWeekly],
                ['💬 Responses', totals.responses, goals.responsesDaily * 5],
                ['🤝 Meetings', totals.meetings, goals.meetingsWeekly]
              ].map(([label, value, goal]) => {
                const percent = goal > 0 ? (value / goal) * 100 : 0;
                const isAchieved = percent >= 100;
                return (
                  <div key={label} className={`stat-card ${isAchieved ? 'achievement' : ''}`}>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '0.3rem' }}>{label}</div>
                    <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: '700', fontFamily: "'Space Mono', monospace" }}>
                      {value}
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.4rem' }}>
                      Goal: {goal}
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${Math.min(percent, 100)}%`,
                          background: percent >= 100 ? 'linear-gradient(90deg, #11998e 0%, #38ef7d 100%)' :
                                      percent >= 80 ? 'linear-gradient(90deg, #f09819 0%, #edde5d 100%)' :
                                      'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                        }}
                      />
                    </div>
                    <div style={{ fontSize: '0.8rem', marginTop: '0.4rem', fontWeight: '600' }}>
                      {percent.toFixed(0)}% {isAchieved && '🎉'}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem' }}>
              {days.map((day, idx) => {
                const dayData = weekData[day] || {};
                const date = new Date(weekStart + 'T12:00:00');
                date.setDate(date.getDate() + idx);
                
                return (
                  <div key={day} className="card">
                    <div style={{ marginBottom: '1rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{day}</h3>
                      <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                        {date.toLocaleDateString('en-US', { 
                          weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
                        })}
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.75rem' }}>
                      {[
                        ['Calls', 'calls', goals.callsDaily],
                        ['Emails', 'emails', goals.emailsDaily],
                        ['Contacts', 'contacts', goals.contactsDaily],
                        ['Responses', 'responses', goals.responsesDaily],
                        ['Meetings', 'meetings', goals.meetingsDaily]
                      ].map(([label, field, dailyGoal]) => {
                        const value = dayData[field] === '' ? 0 : (dayData[field] || 0);
                        const percent = dailyGoal > 0 ? (value / dailyGoal) * 100 : 0;
                        return (
                          <div key={field}>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', opacity: 0.8 }}>
                              {label} ({dailyGoal})
                            </label>
                            <input
                              type="number"
                              className="input-field"
                              value={dayData[field] === undefined ? '' : dayData[field]}
                              onChange={(e) => updateDayData(day, field, e.target.value)}
                              placeholder="0"
                              min="0"
                            />
                            <div className="progress-bar">
                              <div 
                                className="progress-fill"
                                style={{ 
                                  width: `${Math.min(percent, 100)}%`,
                                  background: percent >= 100 ? '#38ef7d' : percent >= 80 ? '#edde5d' : '#667eea'
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ textAlign: 'center' }}>
              <button 
                className="btn btn-success" 
                onClick={saveWeekData}
                style={{ fontSize: '1rem', padding: '1rem 2rem', maxWidth: '400px' }}
              >
                💾 Save This Week's Data
              </button>
            </div>
          </>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>👆</div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Get Started</h3>
            <p style={{ opacity: 0.8, fontSize: '0.95rem' }}>Select a sales rep and week to begin tracking</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesActivityTracker;
