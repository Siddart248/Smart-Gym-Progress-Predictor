import React, { useState, useEffect } from 'react';
import axios from 'axios';

const App = () => {
  // 1. AUTH STATE
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(localStorage.getItem('username'));
  const [isLogin, setIsLogin] = useState(true);
  const [authData, setAuthData] = useState({ username: '', email: '', password: '' });

  // 2. DASHBOARD STATE
  const [inputs, setInputs] = useState({ weight: 80, calories: 2000, maintenance: 2500, protein: 120, workoutDays: 4, targetWeight: 75 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Set Axios default header whenever token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // 3. HANDLERS
  const handleAuthChange = (e) => setAuthData({ ...authData, [e.target.name]: e.target.value });

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const apiUrl = import.meta.env.VITE_API_URL || 'https://smart-gym-progress-predictor.onrender.com/';
      const res = await axios.post(`${apiUrl}${endpoint}`, authData);
      setToken(res.data.token);
      setUser(res.data.username);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.username);
    } catch (err) {
      alert(err.response?.data?.msg || 'Auth Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
  };

  const handleInputChange = (e, key) => {
    const val = Number(e.target.value);
    setInputs(prev => {
      const updated = { ...prev, [key]: val };
      if (key === 'weight') updated.maintenance = val * 30;
      return updated;
    });
  };

  const handlePredict = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await axios.post(`${apiUrl}/predict`, inputs);
      setResult(res.data);
    } catch (err) {
      alert('Prediction Error. Session might have expired.');
      if (err.response?.status === 401) handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    body: { backgroundColor: '#f0f2f5', minHeight: '100vh', padding: '20px', fontFamily: 'system-ui, sans-serif' },
    card: { backgroundColor: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', marginBottom: '20px' },
    input: { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', marginTop: '5px', boxSizing: 'border-box' },
    button: { width: '100%', padding: '14px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' },
    statBox: { padding: '20px', borderRadius: '12px', color: '#fff', textAlign: 'center' },
    barContainer: { display: 'flex', alignItems: 'flex-end', height: '200px', gap: '10px', borderBottom: '2px solid #ddd', paddingBottom: '5px', marginTop: '20px' },
    bar: { flex: 1, backgroundColor: '#007bff', borderRadius: '4px 4px 0 0', position: 'relative' },
  };

  // --- LOGIN / REGISTER VIEW ---
  if (!token) {
    return (
      <div style={{ ...styles.body, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ ...styles.card, width: '400px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>{isLogin ? 'Login' : 'Register'}</h2>
          <form onSubmit={handleAuthSubmit}>
            {!isLogin && (
              <div style={{ marginBottom: '15px' }}>
                <label>Username</label>
                <input style={styles.input} type="text" name="username" onChange={handleAuthChange} required />
              </div>
            )}
            <div style={{ marginBottom: '15px' }}>
              <label>Email</label>
              <input style={styles.input} type="email" name="email" onChange={handleAuthChange} required />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label>Password</label>
              <input style={styles.input} type="password" name="password" onChange={handleAuthChange} required />
            </div>
            <button style={styles.button} type="submit" disabled={loading}>
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '15px', cursor: 'pointer', color: '#007bff' }} onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
          </p>
        </div>
      </div>
    );
  }

  // --- DASHBOARD VIEW ---
  return (
    <div style={styles.body}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>🏋️ Welcome, {user}!</h1>
          <button style={{ ...styles.button, width: 'auto', backgroundColor: '#dc3545' }} onClick={handleLogout}>Logout</button>
        </div>

        <div style={styles.card}>
          <h3>Settings</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
            {Object.keys(inputs).map(k => (
              <div key={k}>
                <label style={{ fontSize: '12px' }}>{k.toUpperCase()}</label>
                <input style={styles.input} type="number" value={inputs[k]} onChange={e => handleInputChange(e, k)} />
              </div>
            ))}
          </div>
          <button style={{ ...styles.button, marginTop: '20px' }} onClick={handlePredict} disabled={loading}>
            {loading ? 'Calculating...' : 'Update Prediction'}
          </button>
        </div>

        {result && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '20px' }}>
              <div style={{ ...styles.statBox, backgroundColor: '#007bff' }}>
                <div style={{ fontSize: '12px' }}>LOSS / WEEK</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{result.fatLossPerWeek.toFixed(2)}kg</div>
              </div>
              <div style={{ ...styles.statBox, backgroundColor: '#28a745' }}>
                <div style={{ fontSize: '12px' }}>WEEKS TO GOAL</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{result.weeksToTarget ? result.weeksToTarget.toFixed(1) : 'N/A'}</div>
              </div>
              <div style={{ ...styles.statBox, backgroundColor: '#6f42c1' }}>
                <div style={{ fontSize: '12px' }}>TARGET WEIGHT</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{inputs.targetWeight}kg</div>
              </div>
            </div>

            <div style={styles.card}>
              <h3>Projection</h3>
              <div style={styles.barContainer}>
                {Array.from({ length: 11 }, (_, i) => {
                  const w = inputs.weight - (result.fatLossPerWeek * i);
                  return (
                    <div key={i} style={{ ...styles.bar, height: `${(w/inputs.weight)*100}%` }}>
                      <div style={{ position: 'absolute', top: '-20px', width: '100%', textAlign: 'center', fontSize: '10px' }}>{w.toFixed(1)}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ ...styles.card, borderLeft: '10px solid #007bff' }}>
              <p>{result.message}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
