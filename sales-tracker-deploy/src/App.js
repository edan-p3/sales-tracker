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
    contactsWeekly: 20
  });
  const [showSettings, setShowSettings] = useState(false);
  const [reps, setReps] = useState(['Rep 1', 'Rep 2', 'Rep 3']);
  const [newRepName, setNewRepName] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (weekStart && selectedRep) {
      loadWeekData();
    }
  }, [weekStart, selectedRep]);

  const getMondayOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  };

  const loadData = () => {
    try {
      const savedGoals = localStorage.getItem('tracker-goals');
      if (savedGoals) setGoals(JSON.parse(savedGoals));

      const savedReps = localStorage.getItem('tracker-reps');
      if (savedReps) setReps(JSON.parse(savedReps));

      const savedLogo = localStorage.getItem('tracker-logo');
      if (savedLogo) setLogoUrl(savedLogo);

      const today = new Date();
      const monday = getMondayOfWeek(today);
      setWeekStart(monday);
    } catch (err) {
      console.error('Error loading data:', err);
      const today = new Date();
      const monday = getMondayOfWeek(today);
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
    } catch (err) {
      console.error('Error saving data:', err);
      setSavedMessage('❌ Error saving data!');
      setTimeout(() => setSavedMessage(''), 3000);
    }
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

  const saveReps = () => {
    try {
      localStorage.setItem('tracker-reps', JSON.stringify(reps));
    } catch (err) {
      console.error('Error saving reps:', err);
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
    // Allow empty string or convert to number (including 0)
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
    const totals = { calls: 0, emails: 0, contacts: 0, responses: 0 };
    days.forEach(day => {
      const data = weekData[day] || {};
      totals.calls += data.calls || 0;
      totals.emails += data.emails || 0;
      totals.contacts += data.contacts || 0;
      totals.responses += data.responses || 0;
    });
    return totals;
  };

  const exportToExcel = () => {
    const allData = [];
    
    // Get all keys from localStorage
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
          // Parse key: week-2024-01-01-RepName
          const parts = key.split('-');
          const monday = `${parts[1]}-${parts[2]}-${parts[3]}`;
          const rep = parts.slice(4).join('-');
          
          const weekInfo = JSON.parse(data);
          days.forEach((day, idx) => {
            const dayData = weekInfo[day] || {};
            const currentDate = new Date(monday);
            currentDate.setDate(currentDate.getDate() + idx);
            
            allData.push({
              'Sales Rep': rep,
              'Week Starting': monday,
              'Date': currentDate.toISOString().split('T')[0],
              'Day': day,
              'Calls': dayData.calls || 0,
              'Emails': dayData.emails || 0,
              'Contacts': dayData.contacts || 0,
              'Responses': dayData.responses || 0
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

    // Sort by date
    allData.sort((a, b) => new Date(a.Date) - new Date(b.Date));

    const ws = XLSX.utils.json_to_sheet(allData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Activity Data');

    // Add goals sheet
    const goalsWs = XLSX.utils.json_to_sheet([{
      'Daily Calls Goal': goals.callsDaily,
      'Daily Emails Goal': goals.emailsDaily,
      'Daily Contacts Goal': goals.contactsDaily,
      'Daily Responses Goal': goals.responsesDaily,
      'Weekly Contacts Goal': goals.contactsWeekly
    }]);
    XLSX.utils.book_append_sheet(wb, goalsWs, 'Goals');

    // Add summary by rep
    const summaryData = {};
    allData.forEach(row => {
      if (!summaryData[row['Sales Rep']]) {
        summaryData[row['Sales Rep']] = {
          'Sales Rep': row['Sales Rep'],
          'Total Calls': 0,
          'Total Emails': 0,
          'Total Contacts': 0,
          'Total Responses': 0,
          'Days Tracked': 0
        };
      }
      summaryData[row['Sales Rep']]['Total Calls'] += row.Calls;
      summaryData[row['Sales Rep']]['Total Emails'] += row.Emails;
      summaryData[row['Sales Rep']]['Total Contacts'] += row.Contacts;
      summaryData[row['Sales Rep']]['Total Responses'] += row.Responses;
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
      padding: '2rem',
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
          padding: 1.5rem;
          transition: all 0.3s ease;
        }
        
        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }
        
        .input-field {
          width: 80px;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: #fff;
          font-size: 1rem;
          text-align: center;
          transition: all 0.2s;
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
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.95rem;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }
        
        .btn-success {
          background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
          color: white;
        }
        
        .btn-success:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(56, 239, 125, 0.4);
        }
        
        .stat-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 1rem;
          text-align: center;
        }
        
        .achievement {
          animation: pulse 2s infinite;
        }
        
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
        }
        
        select:focus {
          outline: none;
          border-color: #00d4ff;
        }
        
        option {
          background: #203a43;
          color: #fff;
        }

        input[type="file"] {
          display: none;
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
        }

        .logo-upload-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: #00d4ff;
        }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header - Fixed Layout */}
        <div style={{ marginBottom: '2rem', position: 'relative', minHeight: '100px', display: 'flex', alignItems: 'center' }}>
          {/* Logo - Left Side */}
          {logoUrl && (
            <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }}>
              <img 
                src={logoUrl} 
                alt="Company Logo" 
                style={{ 
                  height: '80px', 
                  maxWidth: '200px',
                  objectFit: 'contain'
                }} 
              />
            </div>
          )}
          
          {/* Title - Centered */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h1 style={{ 
              fontSize: '3rem', 
              fontWeight: '700',
              fontFamily: "'Space Mono', monospace",
              marginBottom: '0.5rem',
              background: 'linear-gradient(135deg, #00d4ff 0%, #667eea 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em'
            }}>
              SALES TRACKER
            </h1>
            <p style={{ fontSize: '1.1rem', opacity: 0.8, margin: 0 }}>Track daily activity & crush your goals</p>
          </div>
        </div>

        {/* Controls */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>Sales Rep</label>
                <select value={selectedRep} onChange={(e) => setSelectedRep(e.target.value)} style={{ minWidth: '150px' }}>
                  <option value="">Select Rep</option>
                  {reps.map(rep => <option key={rep} value={rep}>{rep}</option>)}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>Week Starting</label>
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

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary" onClick={() => setShowSettings(!showSettings)}>
                ⚙️ {showSettings ? 'Close Settings' : 'Settings'}
              </button>
              <button className="btn btn-success" onClick={exportToExcel}>
                📊 Export to Excel
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
              fontWeight: '600'
            }}>
              {savedMessage}
            </div>
          )}
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.3rem' }}>⚙️ Settings</h3>
            
            {/* Logo Upload Section */}
            <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Company Logo</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                {logoUrl && (
                  <div style={{ 
                    padding: '1rem', 
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <img src={logoUrl} alt="Logo Preview" style={{ height: '40px', objectFit: 'contain' }} />
                    <button 
                      onClick={() => saveLogo('')}
                      style={{
                        background: 'rgba(255, 0, 0, 0.3)',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#fff',
                        cursor: 'pointer',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.8rem'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
                <label className="logo-upload-btn">
                  {logoUrl ? '📸 Change Logo' : '📸 Upload Logo'}
                  <input type="file" accept="image/*" onChange={handleLogoUpload} />
                </label>
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Daily Goals (can be changed anytime)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {[
                  ['Calls/Day', 'callsDaily'],
                  ['Emails/Day', 'emailsDaily'],
                  ['Contacts/Day', 'contactsDaily'],
                  ['Responses/Day', 'responsesDaily']
                ].map(([label, key]) => (
                  <div key={key}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>{label}</label>
                    <input
                      type="number"
                      className="input-field"
                      value={goals[key]}
                      onChange={(e) => setGoals({ ...goals, [key]: parseInt(e.target.value) || 0 })}
                      style={{ width: '100%' }}
                      min="0"
                    />
                  </div>
                ))}
              </div>
              
              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Weekly Contacts Goal</label>
                <input
                  type="number"
                  className="input-field"
                  value={goals.contactsWeekly}
                  onChange={(e) => setGoals({ ...goals, contactsWeekly: parseInt(e.target.value) || 0 })}
                  style={{ width: '200px' }}
                  min="0"
                />
              </div>
              
              <button className="btn btn-success" onClick={saveGoals} style={{ marginTop: '1rem' }}>
                Save Goals
              </button>
            </div>

            <div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Manage Sales Reps</h4>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input
                  type="text"
                  placeholder="New rep name"
                  value={newRepName}
                  onChange={(e) => setNewRepName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addRep()}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <button className="btn btn-success" onClick={addRep}>Add Rep</button>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {reps.map(rep => (
                  <div key={rep} style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
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
                        fontSize: '0.8rem'
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

        {/* Main Content */}
        {selectedRep && weekStart ? (
          <>
            {/* Weekly Stats */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              {[
                ['📞 Calls', totals.calls, callsGoal],
                ['📧 Emails', totals.emails, emailsGoal],
                ['👥 Contacts', totals.contacts, goals.contactsWeekly],
                ['💬 Responses', totals.responses, goals.responsesDaily * 5]
              ].map(([label, value, goal]) => {
                const percent = goal > 0 ? (value / goal) * 100 : 0;
                const isAchieved = percent >= 100;
                return (
                  <div key={label} className={`stat-card ${isAchieved ? 'achievement' : ''}`}>
                    <div style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '0.5rem' }}>{label}</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', fontFamily: "'Space Mono', monospace" }}>
                      {value}
                    </div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.5rem' }}>
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
                    <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', fontWeight: '600' }}>
                      {percent.toFixed(0)}% {isAchieved && '🎉'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Daily Entry Cards */}
            <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
              {days.map((day, idx) => {
                const dayData = weekData[day] || {};
                const date = new Date(weekStart);
                date.setDate(date.getDate() + idx);
                
                return (
                  <div key={day} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.3rem' }}>{day}</h3>
                        <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                      {[
                        ['Calls', 'calls', goals.callsDaily],
                        ['Emails', 'emails', goals.emailsDaily],
                        ['Contacts', 'contacts', goals.contactsDaily],
                        ['Responses', 'responses', goals.responsesDaily]
                      ].map(([label, field, dailyGoal]) => {
                        const value = dayData[field] === '' ? 0 : (dayData[field] || 0);
                        const percent = dailyGoal > 0 ? (value / dailyGoal) * 100 : 0;
                        return (
                          <div key={field}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', opacity: 0.8 }}>
                              {label} (Goal: {dailyGoal})
                            </label>
                            <input
                              type="number"
                              className="input-field"
                              value={dayData[field] === undefined ? '' : dayData[field]}
                              onChange={(e) => updateDayData(day, field, e.target.value)}
                              placeholder="0"
                              min="0"
                              style={{ width: '100%' }}
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

            {/* Save Button */}
            <div style={{ textAlign: 'center' }}>
              <button 
                className="btn btn-success" 
                onClick={saveWeekData}
                style={{ fontSize: '1.1rem', padding: '1rem 3rem' }}
              >
                💾 Save This Week's Data
              </button>
            </div>
          </>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👆</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Get Started</h3>
            <p style={{ opacity: 0.8 }}>Select a sales rep and week to begin tracking activity</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesActivityTracker;
