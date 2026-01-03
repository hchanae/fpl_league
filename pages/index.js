import { useState } from 'react';
import Head from 'next/head';
import pLimit from 'p-limit';

// --- 設定區 ---
const LEAGUE_ID = '880922';
const CONCURRENCY_LIMIT = 5;
const CHIPS_PER_HALF = { wildcard: 1, freehit: 1, benchboost: 1, '3xc': 1 };

export default function Home({ leagueName, managersData, monthMapping, currentMonth, lastUpdated, currentSeasonPhase }) {
    const [activeTab, setActiveTab] = useState('standings');
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);

    return (
        <div className="app-shell">
            <Head>
                <title>{leagueName}</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
                <meta name="theme-color" content="#37003c" />
            </Head>

            <header className="header">
                <div className="header-inner">
                    <div className="league-title">{leagueName}</div>
                </div>
                <div className="sub-header">Last update: {lastUpdated}</div>
            </header>

            <main className="main-content">

                {/* --- Tab 1: Rankings --- */}
                {activeTab === 'standings' && (
                    <div className="animate-fade-in">
                        <SectionHeader title="Season Rankings" subtitle="Net Score (Hits deducted)" />

                        {/* 這裡我們傳入 costKey 來顯示該區間的扣分 */}
                        <RankCard
                            title="🏆 Overall Leader"
                            data={managersData}
                            sortKey="totalPoints"
                            costKey="totalCost" // 顯示整季總扣分
                            type="gold"
                        />
                        <RankCard
                            title="🌓 2nd Half (GW20+)"
                            data={managersData}
                            sortKey="secondHalfNet"
                            costKey="secondHalfCost" // 顯示下半季扣分
                            type="purple"
                        />
                        <RankCard
                            title="🌗 1st Half (GW1-19)"
                            data={managersData}
                            sortKey="firstHalfNet"
                            costKey="firstHalfCost" // 顯示上半季扣分
                            type="default"
                        />
                    </div>
                )}

                {/* --- Tab 2: Monthly --- */}
                {activeTab === 'monthly' && (
                    <div className="animate-fade-in">
                        <SectionHeader title="Monthly Performance" subtitle="Select a month to view" />

                        <div className="month-selector-container">
                            <select className="month-select" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                                {Object.keys(monthMapping).map(month => <option key={month} value={month}>{month}</option>)}
                            </select>
                            <div className="select-arrow">▼</div>
                        </div>

                        <div className="gw-pill">Gameweeks: {monthMapping[selectedMonth]?.join(', ')}</div>

                        <div className="card">
                            <MonthLeaderboard data={managersData} targetGws={monthMapping[selectedMonth]} />
                        </div>
                    </div>
                )}

                {/* --- Tab 3: Chips --- */}
                {activeTab === 'chips' && (
                    <div className="animate-fade-in">
                        <SectionHeader title="Chip Strategy" subtitle={currentSeasonPhase} />
                        <div className="info-banner">ℹ️ Displaying usage for <strong>{currentSeasonPhase}</strong> only.</div>
                        <ChipGrid data={managersData} />
                    </div>
                )}

                {/* --- Tab 4: Awards --- */}
                {activeTab === 'winners' && (
                    <div className="animate-fade-in">
                        <SectionHeader title="Hall of Fame" subtitle="Current Title Holders" />

                        <WinnerDisplay title="Season MVP" icon="👑" data={managersData} sortKey="totalPoints" gradient="linear-gradient(135deg, #FFD700 0%, #FDB931 100%)" textColor="#37003c" />

                        <div className="grid-2-col">
                            <WinnerDisplay title="2nd Half" icon="🚀" data={managersData} sortKey="secondHalfNet" gradient="linear-gradient(135deg, #00ff85 0%, #00b860 100%)" textColor="#37003c" hideIfZero />
                            <WinnerDisplay title="1st Half" icon="🏁" data={managersData} sortKey="firstHalfNet" gradient="linear-gradient(135deg, #37003c 0%, #1a001c 100%)" textColor="#fff" />
                        </div>

                        <h3 className="sub-section-title">Monthly Winners</h3>
                        <MonthlyWinnersList managersData={managersData} monthMapping={monthMapping} />
                    </div>
                )}

            </main>

            <nav className="bottom-nav">
                <NavButton active={activeTab === 'standings'} onClick={() => setActiveTab('standings')} icon="📊" label="Rank" />
                <NavButton active={activeTab === 'monthly'} onClick={() => setActiveTab('monthly')} icon="📅" label="Month" />
                <NavButton active={activeTab === 'chips'} onClick={() => setActiveTab('chips')} icon="📝" label="Chips" />
                <NavButton active={activeTab === 'winners'} onClick={() => setActiveTab('winners')} icon="🏅" label="Awards" />
            </nav>

            <style jsx global>{`
        :root {
          --primary: #37003c; --accent: #00ff85; --bg-body: #F2F4F8; --card-bg: #ffffff;
          --text-main: #1a1a1a; --text-sub: #888888; --nav-height: 85px; --radius-card: 20px;
          --radius-sm: 12px; --shadow-soft: 0 10px 30px -10px rgba(0,0,0,0.08); --shadow-card: 0 4px 12px rgba(0,0,0,0.03);
          --hit-red: #e90052;
        }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, sans-serif; background-color: var(--bg-body); color: var(--text-main); padding-bottom: var(--nav-height); }
        
        .header { background: rgba(55, 0, 60, 0.95); backdrop-filter: blur(10px); color: white; padding: 1rem 1.2rem 0.8rem; position: sticky; top: 0; z-index: 100; border-bottom: 1px solid rgba(255,255,255,0.1); padding-top: max(1rem, env(safe-area-inset-top)); }
        .header-inner { display: flex; justify-content: space-between; align-items: center; }
        .league-title { font-size: 1.25rem; font-weight: 800; letter-spacing: -0.5px; }
        .sub-header { font-size: 0.75rem; opacity: 0.7; margin-top: 4px; }
        .status-badge { background: rgba(0, 255, 133, 0.2); color: #00ff85; font-size: 0.7rem; padding: 4px 8px; border-radius: 100px; font-weight: 700; display: flex; align-items: center; gap: 5px; }
        .dot { width: 6px; height: 6px; background: #00ff85; border-radius: 50%; box-shadow: 0 0 8px #00ff85; }

        .main-content { padding: 1.2rem; max-width: 600px; margin: 0 auto; }
        .section-header { margin-bottom: 1rem; } .section-header h2 { margin: 0; font-size: 1.4rem; font-weight: 800; color: var(--primary); } .section-header p { margin: 4px 0 0; font-size: 0.85rem; color: var(--text-sub); }
        .sub-section-title { margin: 2rem 0 1rem; font-size: 1.1rem; color: var(--primary); }
        .grid-2-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }

        .card { background: var(--card-bg); border-radius: var(--radius-card); box-shadow: var(--shadow-card); overflow: hidden; margin-bottom: 1.5rem; border: 1px solid rgba(0,0,0,0.02); }
        .card-header { padding: 1rem 1.2rem; background: #fff; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
        .card-header h3 { margin: 0; font-size: 1rem; font-weight: 700; color: var(--primary); }
        
        .rank-row { display: flex; align-items: center; padding: 1rem 1.2rem; border-bottom: 1px solid #f5f5f5; }
        .rank-row:last-child { border-bottom: none; }
        .rank-badge { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem; border-radius: 50%; margin-right: 12px; background: #f0f2f5; color: #888; }
        .rank-badge.top-1 { background: linear-gradient(135deg, #FFD700, #FDB931); color: #37003c; }
        .rank-badge.top-2 { background: #E0E0E0; color: #555; }
        .rank-badge.top-3 { background: #CD7F32; color: #fff; }
        
        .manager-info { flex: 1; }
        .manager-name { display: block; font-weight: 700; font-size: 0.95rem; color: var(--text-main); margin-bottom: 2px; }
        .team-name { display: block; font-size: 0.75rem; color: var(--text-sub); }
        
        .score-container { text-align: right; display: flex; flex-direction: column; align-items: flex-end; }
        .points-pill { background: rgba(55, 0, 60, 0.05); color: var(--primary); padding: 4px 10px; border-radius: 8px; font-weight: 800; font-size: 0.95rem; display: inline-block; }
        .hits-badge { font-size: 0.65rem; color: var(--hit-red); font-weight: 700; margin-top: 4px; background: rgba(233, 0, 82, 0.1); padding: 2px 6px; border-radius: 4px; }

        .chip-card { padding: 1rem; background: white; border-radius: var(--radius-sm); box-shadow: var(--shadow-card); margin-bottom: 1rem; }
        .chip-manager-name { font-weight: 700; margin-bottom: 0.8rem; font-size: 1rem; color: var(--primary); border-bottom: 1px solid #f0f0f0; padding-bottom: 0.5rem;}
        .chip-flex { display: flex; justify-content: space-between; align-items: flex-start; }
        .chip-col { flex: 1; } .chip-col-label { font-size: 0.65rem; text-transform: uppercase; font-weight: 700; color: #aaa; margin-bottom: 6px; display: block; }
        .chip-list { display: flex; flex-wrap: wrap; gap: 6px; }
        .chip-pill { font-size: 0.65rem; padding: 4px 8px; border-radius: 6px; color: white; font-weight: 700; }
        .chip-pill.used { opacity: 0.4; filter: grayscale(0.8); text-decoration: line-through; }
        .c-wc { background: #ff9f43; } .c-fh { background: #e90052; } .c-bb { background: #00ff85; color: #37003c; } .c-tc { background: #2d98da; }
        .info-banner { background: #e3f2fd; color: #0d47a1; padding: 0.8rem; border-radius: var(--radius-sm); font-size: 0.8rem; margin-bottom: 1rem; }

        .winner-widget { padding: 1.2rem; border-radius: 20px; box-shadow: var(--shadow-soft); position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: center; }
        .winner-icon { font-size: 2rem; margin-bottom: 0.5rem; }
        .winner-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; font-weight: 700; margin-bottom: 4px; }
        .winner-player { font-size: 1.1rem; font-weight: 800; line-height: 1.2; }
        .winner-score-tag { margin-top: 8px; display: inline-block; background: rgba(255,255,255,0.3); padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 700; width: fit-content; }

        .monthly-row { background: white; padding: 1rem; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem; box-shadow: var(--shadow-card); }
        .month-selector-container { position: relative; margin-bottom: 0.5rem; }
        .month-select { width: 100%; appearance: none; background: white; border: 2px solid #e0e0e0; padding: 12px; border-radius: 12px; font-size: 1rem; font-weight: 700; color: var(--primary); }
        .select-arrow { position: absolute; right: 15px; top: 50%; transform: translateY(-50%); pointer-events: none; color: var(--primary); font-size: 0.8rem;}
        .gw-pill { display: inline-block; background: #e0e0e0; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; color: #555; margin-bottom: 1rem; font-weight: 600;}

        .bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; height: var(--nav-height); background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(15px); border-top: 1px solid rgba(0,0,0,0.05); display: flex; justify-content: space-around; padding-bottom: env(safe-area-inset-bottom); z-index: 1000; box-shadow: 0 -5px 20px rgba(0,0,0,0.03); }
        .nav-btn { background: none; border: none; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #aaa; transition: all 0.2s; }
        .nav-btn.active { color: var(--primary); } .nav-btn.active .nav-icon { transform: scale(1.1); filter: drop-shadow(0 2px 4px rgba(55,0,60,0.2)); }
        .nav-icon { font-size: 1.5rem; margin-bottom: 4px; transition: transform 0.2s; } .nav-label { font-size: 0.65rem; font-weight: 700; letter-spacing: 0.3px; }
        .animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
        </div>
    );
}

// --- Components ---

function NavButton({ active, onClick, icon, label }) {
    return (
        <button className={`nav-btn ${active ? 'active' : ''}`} onClick={onClick}>
            <span className="nav-icon">{icon}</span>
            <span className="nav-label">{label}</span>
        </button>
    );
}

function SectionHeader({ title, subtitle }) {
    return (
        <div className="section-header">
            <h2>{title}</h2>
            <p>{subtitle}</p>
        </div>
    );
}

function RankCard({ title, data, sortKey, costKey, type }) {
    const sorted = [...data].sort((a, b) => b[sortKey] - a[sortKey]);
    return (
        <div className="card">
            <div className="card-header">
                <h3>{title}</h3>
            </div>
            <div>
                {sorted.map((m, i) => (
                    <div key={m.id} className="rank-row">
                        <div className={`rank-badge top-${i + 1}`}>{i + 1}</div>
                        <div className="manager-info">
                            <span className="manager-name">{m.player_name}</span>
                            <span className="team-name">{m.entry_name}</span>
                        </div>
                        <div className="score-container">
                            <div className="points-pill">{m[sortKey]}</div>
                            {/* 如果該區間有扣分 (costKey > 0)，顯示紅色標籤 */}
                            {m[costKey] < 0 && (
                                <div className="hits-badge">{m[costKey]}</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function MonthLeaderboard({ data, targetGws }) {
    // 動態計算該月的分數 (Score) 和 扣分 (Cost)
    const calc = data.map(m => {
        const relevantHistory = m.history.filter(h => targetGws?.includes(h.event));
        const score = relevantHistory.reduce((a, b) => a + (b.points - b.event_transfers_cost), 0);
        const cost = relevantHistory.reduce((a, b) => a + b.event_transfers_cost, 0); // 計算該月總扣分
        return { ...m, score, cost };
    }).sort((a, b) => b.score - a.score);

    return (
        <div>
            {calc.map((m, i) => (
                <div key={m.id} className="rank-row">
                    <div className={`rank-badge top-${i + 1}`}>{i + 1}</div>
                    <div className="manager-info">
                        <span className="manager-name">{m.player_name}</span>
                    </div>
                    <div className="score-container">
                        <div className="points-pill">{m.score}</div>
                        {/* 顯示該月扣分 */}
                        {m.cost > 0 && (
                            <div className="hits-badge">-{m.cost}</div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

function ChipGrid({ data }) {
    const getChipStyle = (rawName) => {
        let name = rawName;
        if (name === 'bboost') name = 'benchboost';
        if (name === 'triple_captain') name = '3xc';
        if (name === 'wildcard') return { label: 'WC', cls: 'c-wc' };
        if (name === 'freehit') return { label: 'FH', cls: 'c-fh' };
        if (name === 'benchboost') return { label: 'BB', cls: 'c-bb' };
        if (name === '3xc') return { label: 'TC', cls: 'c-tc' };
        return { label: name, cls: 'c-wc' };
    };

    return (
        <div>
            {data.map(m => (
                <div key={m.id} className="chip-card">
                    <div className="chip-manager-name">{m.player_name}</div>
                    <div className="chip-flex">
                        <div className="chip-col">
                            <span className="chip-col-label">Remaining</span>
                            <div className="chip-list">
                                {m.chipsRemaining.length > 0 ? (
                                    m.chipsRemaining.map((c, i) => <span key={i} className={`chip-pill ${getChipStyle(c).cls}`}>{getChipStyle(c).label}</span>)
                                ) : <span style={{ fontSize: '0.7rem', color: '#ddd' }}>—</span>}
                            </div>
                        </div>
                        <div className="chip-col" style={{ textAlign: 'right' }}>
                            <span className="chip-col-label">Used</span>
                            <div className="chip-list" style={{ justifyContent: 'flex-end' }}>
                                {m.chipsUsedInCurrentHalf.length > 0 ? (
                                    m.chipsUsedInCurrentHalf.map((c, i) => <span key={i} className={`chip-pill used ${getChipStyle(c.name).cls}`}>{getChipStyle(c.name).label} (GW{c.event})</span>)
                                ) : <span style={{ fontSize: '0.7rem', color: '#ddd' }}>None</span>}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function WinnerDisplay({ title, icon, data, sortKey, gradient, textColor, hideIfZero }) {
    const sorted = [...data].sort((a, b) => b[sortKey] - a[sortKey]);
    const winner = sorted[0];
    if (hideIfZero && winner[sortKey] <= 0) return null;
    return (
        <div className="winner-widget" style={{ background: gradient, color: textColor }}>
            <div className="winner-icon">{icon}</div>
            <div className="winner-label">{title}</div>
            <div className="winner-player">{winner.player_name}</div>
            <div className="winner-score-tag">{winner[sortKey]} pts</div>
        </div>
    );
}

function MonthlyWinnersList({ managersData, monthMapping }) {
    const monthlyResults = Object.keys(monthMapping).map(month => {
        const targetGws = monthMapping[month];
        const scores = managersData.map(m => ({
            ...m, monthScore: m.history.filter(h => targetGws.includes(h.event)).reduce((acc, h) => acc + (h.points - h.event_transfers_cost), 0)
        }));
        scores.sort((a, b) => b.monthScore - a.monthScore);
        return { month, winner: scores[0] };
    });
    const activeMonths = monthlyResults.filter(r => r.winner.monthScore > 0);
    return (
        <div>
            {activeMonths.map((item, idx) => (
                <div key={idx} className="monthly-row">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ fontSize: '1.5rem', marginRight: '12px' }}>📅</div>
                        <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#888', textTransform: 'uppercase' }}>{item.month}</div>
                            <div style={{ fontWeight: '700', fontSize: '1rem', color: '#333' }}>{item.winner.player_name}</div>
                        </div>
                    </div>
                    <div style={{ fontWeight: '800', color: '#00ff85', background: '#37003c', padding: '4px 10px', borderRadius: '8px' }}>{item.winner.monthScore}</div>
                </div>
            ))}
            {activeMonths.length === 0 && <p style={{ textAlign: 'center', color: '#999', marginTop: '20px' }}>Season hasn't started yet.</p>}
        </div>
    );
}

// --- Backend Logic ---
// --- Backend Logic (Fixed: Added Headers to bypass block) ---
export async function getStaticProps() {
  const limit = pLimit(CONCURRENCY_LIMIT);

  // 定義偽裝成瀏覽器的 Header
  const fplHeaders = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://fantasy.premierleague.com/',
    'Origin': 'https://fantasy.premierleague.com',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9'
  };

  try {
    // 1. Fetch League & Bootstrap with headers
    const [leagueRes, bootstrapRes] = await Promise.all([
      fetch(`https://fantasy.premierleague.com/api/leagues-classic/${LEAGUE_ID}/standings/`, { headers: fplHeaders }),
      fetch(`https://fantasy.premierleague.com/api/bootstrap-static/`, { headers: fplHeaders })
    ]);

    if (!leagueRes.ok) throw new Error(`League API Error: ${leagueRes.status}`);
    if (!bootstrapRes.ok) throw new Error(`Bootstrap API Error: ${bootstrapRes.status}`);

    const leagueData = await leagueRes.json();
    const bootstrapData = await bootstrapRes.json();
    
    if (!leagueData.standings) throw new Error('League Data Missing');

    // --- (中間邏輯保持不變) ---
    const monthMapping = {};
    bootstrapData.events.forEach(event => {
      const date = new Date(event.deadline_time);
      const monthName = date.toLocaleString('en-US', { month: 'long' });
      if (!monthMapping[monthName]) monthMapping[monthName] = [];
      monthMapping[monthName].push(event.id);
    });

    let currentMonthName = 'August';
    const activeEvent = bootstrapData.events.find(e => e.is_current) || bootstrapData.events.find(e => e.is_next);
    let currentGw = 1;
    if (activeEvent) {
      const date = new Date(activeEvent.deadline_time);
      currentMonthName = date.toLocaleString('en-US', { month: 'long' });
      currentGw = activeEvent.id;
    } else {
      const allMonths = Object.keys(monthMapping);
      if (allMonths.length > 0) currentMonthName = allMonths[allMonths.length - 1];
      currentGw = 38;
    }

    const HALF_SEASON_GW_START = 20; 
    const isSecondHalf = currentGw >= HALF_SEASON_GW_START;
    const currentSeasonPhase = isSecondHalf ? "2nd Half Season" : "1st Half Season";
    const chipCalcStart = isSecondHalf ? HALF_SEASON_GW_START : 1;
    const chipCalcEnd = isSecondHalf ? 38 : HALF_SEASON_GW_START - 1;

    const entries = leagueData.standings.results;
    
    // 2. Loop fetch with headers
    const managersData = await Promise.all(
      entries.map((entry) =>
        limit(async () => {
          // 這裡也要加上 headers
          const historyRes = await fetch(`https://fantasy.premierleague.com/api/entry/${entry.entry}/history/`, { headers: fplHeaders });
          
          if (!historyRes.ok) return null; // 容錯處理：如果某個人抓失敗，不要讓整個網頁掛掉

          const historyData = await historyRes.json();
          const currentHistory = historyData.current;
          const chipsHistory = historyData.chips;
          
          const chipsUsedInCurrentHalf = chipsHistory.filter(c => c.event >= chipCalcStart && c.event <= chipCalcEnd);
          const usedCounts = { wildcard: 0, freehit: 0, benchboost: 0, '3xc': 0 };
          
          chipsUsedInCurrentHalf.forEach(c => { 
            let name = c.name;
            if (name === 'bboost') name = 'benchboost';
            if (name === 'triple_captain') name = '3xc';
            if (usedCounts[name] !== undefined) usedCounts[name]++; 
          });
          const chipsRemaining = [];
          if (usedCounts.wildcard < CHIPS_PER_HALF.wildcard) chipsRemaining.push('wildcard');
          if (usedCounts.freehit < CHIPS_PER_HALF.freehit) chipsRemaining.push('freehit');
          if (usedCounts.benchboost < CHIPS_PER_HALF.benchboost) chipsRemaining.push('benchboost');
          if (usedCounts['3xc'] < CHIPS_PER_HALF['3xc']) chipsRemaining.push('3xc');

          const calculateMetrics = (startGw, endGw) => {
            const relevant = currentHistory.filter(h => h.event >= startGw && h.event <= endGw);
            const points = relevant.reduce((sum, h) => sum + h.points, 0);
            const cost = relevant.reduce((sum, h) => sum + h.event_transfers_cost, 0);
            return { net: points - cost, cost: -cost };
          };

          const firstHalf = calculateMetrics(1, 19);
          const secondHalf = calculateMetrics(20, 38);
          const totalCost = currentHistory.reduce((sum, h) => sum + h.event_transfers_cost, 0);

          return {
            id: entry.entry, player_name: entry.player_name, entry_name: entry.entry_name,
            totalPoints: entry.total, 
            totalCost: -totalCost,
            firstHalfNet: firstHalf.net, firstHalfCost: firstHalf.cost,
            secondHalfNet: secondHalf.net, secondHalfCost: secondHalf.cost,
            history: currentHistory, chipsUsedInCurrentHalf, chipsRemaining 
          };
        })
      )
    );

    // 過濾掉 fetch 失敗的 null 資料
    const validManagersData = managersData.filter(m => m !== null);

    return {
      props: {
        leagueName: leagueData.league.name, managersData: validManagersData, monthMapping, 
        currentMonth: currentMonthName, currentSeasonPhase,
        lastUpdated: new Date().toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong' }),
      }, revalidate: 60,
    };
  } catch (error) {
    console.error("FPL API Error Details:", error); // 這裡會在 Vercel Log 顯示詳細錯誤
    return { props: { leagueName: 'FPL Connection Error', managersData: [], monthMapping: {}, currentMonth: 'August' }, revalidate: 10 };
  }
}