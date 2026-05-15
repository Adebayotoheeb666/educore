import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getSchoolDashboard, getFeeAnalytics, getAttendanceAnalytics } from '../../services/analyticsService';
import './Analytics.css';

const Analytics = () => {
  const [dashboard, setDashboard] = useState(null);
  const [feeData, setFeeData] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getSchoolDashboard(), getFeeAnalytics(), getAttendanceAnalytics()])
      .then(([d, f, a]) => {
        setDashboard(d.data);
        setFeeData(f.data);
        setAttendanceData(a.data);
      })
      .catch((err) => {
          console.error("Failed to fetch analytics:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="analytics-container d-flex justify-content-center align-items-center"><div className="spinner-border text-success" /></div>;

  const feePieData = [
    { name: 'Paid', value: feeData?.paid, color: '#5849b8' },
    { name: 'Pending', value: feeData?.pending, color: '#cbd5e1' },
    { name: 'Overdue', value: feeData?.overdue, color: '#451a03' }
  ];

  return (
    <div className="analytics-container">
      <header className="ann-page-header">
        <div className="ann-header-left">
          <h1>Analytics Overview</h1>
          <p>Real-time insights for Term 2, 2024 academic cycle.</p>
        </div>
        <div className="ann-header-right">
           <button className="btn-export">
             📥 Export Full Report
           </button>
        </div>
      </header>

      {/* Stats Row */}
      <div className="stats-row-premium">
        <div className="stat-card-modern">
          <div className="stat-card-top">
            <div className="stat-icon-square blue">👨‍🎓</div>
            <span className="stat-trend-tag up">↝ +12%</span>
          </div>
          <div>
            <span className="stat-label-small">Total Students</span>
            <h2 className="stat-value-large">{dashboard?.totalStudents?.toLocaleString()}</h2>
          </div>
        </div>

        <div className="stat-card-modern">
          <div className="stat-card-top">
            <div className="stat-icon-square green">👨‍🏫</div>
            <span className="stat-trend-tag stable">Stable</span>
          </div>
          <div>
            <span className="stat-label-small">Total Teachers</span>
            <h2 className="stat-value-large">{dashboard?.totalTeachers}</h2>
          </div>
        </div>

        <div className="stat-card-modern">
          <div className="stat-card-top">
            <div className="stat-icon-square amber">✅</div>
            <span className="stat-trend-tag down">↝ -2%</span>
          </div>
          <div>
            <span className="stat-label-small">Avg Attendance</span>
            <h2 className="stat-value-large">{dashboard?.avgAttendance}%</h2>
          </div>
        </div>

        <div className="stat-card-modern">
          <div className="stat-card-top">
            <div className="stat-icon-square indigo">💰</div>
            <span className="stat-status-tag on-track">On Track</span>
          </div>
          <div>
            <span className="stat-label-small">Fees Collected</span>
            <h2 className="stat-value-large">₦{(dashboard?.feeCollected / 1000000).toFixed(1)}M</h2>
          </div>
        </div>
      </div>

      <div className="charts-grid-main">
        {/* Weekly Attendance Trend */}
        <div className="chart-box-premium">
          <div className="chart-header-row">
            <h3>Weekly Attendance Trend</h3>
            <select className="chart-period-select">
              <option>Last 7 Days</option>
              <option>This Month</option>
            </select>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={attendanceData?.weekly}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}}
                  itemStyle={{fontWeight: 800}}
                />
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="#5849b8" 
                  strokeWidth={4} 
                  dot={false}
                  activeDot={{ r: 6, fill: '#5849b8', stroke: '#fff', strokeWidth: 3 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fee Status Pie */}
        <div className="chart-box-premium">
          <div className="chart-header-row">
            <h3>Fee Status</h3>
          </div>
          <div className="fee-status-content">
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={feePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {feePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="doughnut-center-text">
              <h2>{feeData?.percent}%</h2>
              <p>PAID</p>
            </div>
            <div className="fee-legend">
               {feePieData.map(item => (
                 <div key={item.name} className="legend-item">
                   <div className="legend-left">
                     <span className="legend-dot" style={{ background: item.color }}></span>
                     {item.name}
                   </div>
                   <span className="legend-val">₦{(item.value / 1000000).toFixed(1)}M</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bottom-grid-analytics">
        {/* Class Performance */}
        <div className="chart-box-premium">
          <div className="chart-header-row">
            <h3>Class Performance</h3>
            <Link to="/analytics/subjects" style={{ fontSize: '0.85rem', fontWeight: 800, color: '#5849b8', textDecoration: 'none' }}>
              DETAILED PERFORMANCE ↗
            </Link>
          </div>
          <div className="class-perf-list">
            {dashboard?.classPerformance?.map(item => (
              <div key={item.className} className="class-perf-item">
                <div className="class-name-row">
                  <span>{item.className}</span>
                  <span>{item.average}%</span>
                </div>
                <div className="perf-bar-bg">
                  <div className="perf-bar-fill" style={{ width: `${item.average}%`, background: item.color }}></div>
                </div>
              </div>
            ))}
          </div>
          <div className="ai-insight-box-small">
            <span className="ai-spark-icon">✨</span>
            <div className="ai-insight-text">
              <h5>AI Insight</h5>
              <p>JSS 3 is showing a 15% dip in Mathematics. We suggest reviewing the 'Quadratic Equations' module completion rate.</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="chart-box-premium">
          <div className="chart-header-row">
            <h3>Recent Activity</h3>
          </div>
          <div className="recent-activity-list">
            <div className="activity-item green">
              <div className="activity-line"></div>
              <div className="activity-content">
                <h5>Fee Paid: Chinelo Obi (SS3) cleared Term 2 tuition.</h5>
                <p>2 MINUTES AGO</p>
              </div>
            </div>
            <div className="activity-item blue">
              <div className="activity-line"></div>
              <div className="activity-content">
                <h5>New Student: Ahmed Musa registered for JSS1.</h5>
                <p>15 MINUTES AGO</p>
              </div>
            </div>
            <div className="activity-item red">
              <div className="activity-line"></div>
              <div className="activity-content">
                <h5>Attendance Alert: 12 students marked absent in SS2-B.</h5>
                <p>1 HOUR AGO</p>
              </div>
            </div>
            <div className="activity-item green">
              <div className="activity-line"></div>
              <div className="activity-content">
                <h5>Results Uploaded: Physics Mid-term grades for SS3.</h5>
                <p>3 HOURS AGO</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="ann-footer-main" style={{ background: '#f8fafc', margin: '5rem -4rem -3rem', padding: '2.5rem 8rem' }}>
        <div className="footer-left-content">
          <span className="footer-brand">EduSmart Systems Nigeria</span> | © {new Date().getFullYear()} EduSmart Systems Nigeria. All rights reserved.
        </div>
        <div className="footer-links">
          <Link to="/support">Support Desk</Link>
          <Link to="/manual">User Manual</Link>
          <Link to="/privacy">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
};

export default Analytics;
