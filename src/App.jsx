import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, RefreshCw } from 'lucide-react';

// ⚠️ REPLACE THESE WITH YOUR ACTUAL SUPABASE VALUES
const supabaseUrl = 'https://paqlegjobnvnewzkwgtg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcWxlZ2pvYm52bmV3emt3Z3RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2OTkxNjUsImV4cCI6MjA3NTI3NTE2NX0.DiwWFKhCFy4xE-RwlgzhIE4Fj9PrNxEuJape9qK4Ir8';
const supabase = createClient(supabaseUrl, supabaseKey);

const InvestmentAnalystDashboard = () => {
  const [activeTab, setActiveTab] = useState('deals');
  const [deals, setDeals] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [showDealForm, setShowDealForm] = useState(false);
  const [showMarketForm, setShowMarketForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);

  const [newDeal, setNewDeal] = useState({
    company: '',
    sector: '',
    founder: '',
    stage: 'Screening',
    noVC: true,
    hasTraction: false,
    timing: '',
    keyInsights: '',
    deckLink: '',
    analysisLink: '',
    notes: ''
  });

  const [newMarket, setNewMarket] = useState({
    sector: '',
    status: 'Researching',
    priority: 'Medium',
    insights: '',
    analysisLink: ''
  });

  const [newTask, setNewTask] = useState({
    task: '',
    type: 'Research',
    priority: 'Medium',
    completed: false
  });

  useEffect(() => {
    loadAllData();
    
    const dealsChannel = supabase
      .channel('deals-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, () => {
        loadDeals();
      })
      .subscribe();

    const marketsChannel = supabase
      .channel('markets-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'markets' }, () => {
        loadMarkets();
      })
      .subscribe();

    const tasksChannel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        loadTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(dealsChannel);
      supabase.removeChannel(marketsChannel);
      supabase.removeChannel(tasksChannel);
    };
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([loadDeals(), loadMarkets(), loadTasks()]);
    setLoading(false);
  };

  const loadDeals = async () => {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setDeals(data);
  };

  const loadMarkets = async () => {
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setMarkets(data);
  };

  const loadTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('priority', { ascending: false });
    if (!error && data) setTasks(data);
  };

  const addDeal = async () => {
    if (newDeal.company && newDeal.sector) {
      setSyncing(true);
      const { error } = await supabase.from('deals').insert([{
        company: newDeal.company,
        sector: newDeal.sector,
        founder: newDeal.founder,
        stage: newDeal.stage,
        no_vc: newDeal.noVC,
        has_traction: newDeal.hasTraction,
        timing: newDeal.timing,
        key_insights: newDeal.keyInsights,
        deck_link: newDeal.deckLink,
        analysis_link: newDeal.analysisLink,
        notes: newDeal.notes,
        founder_score: 0,
        last_update: new Date().toISOString().split('T')[0]
      }]);
      
      if (!error) {
        setNewDeal({
          company: '',
          sector: '',
          founder: '',
          stage: 'Screening',
          noVC: true,
          hasTraction: false,
          timing: '',
          keyInsights: '',
          deckLink: '',
          analysisLink: '',
          notes: ''
        });
        setShowDealForm(false);
      }
      setSyncing(false);
    }
  };

  const addMarket = async () => {
    if (newMarket.sector) {
      setSyncing(true);
      const { error } = await supabase.from('markets').insert([{
        sector: newMarket.sector,
        status: newMarket.status,
        priority: newMarket.priority,
        insights: newMarket.insights,
        analysis_link: newMarket.analysisLink,
        last_update: new Date().toISOString().split('T')[0]
      }]);
      
      if (!error) {
        setNewMarket({
          sector: '',
          status: 'Researching',
          priority: 'Medium',
          insights: '',
          analysisLink: ''
        });
        setShowMarketForm(false);
      }
      setSyncing(false);
    }
  };

  const addTask = async () => {
    if (newTask.task) {
      setSyncing(true);
      const { error } = await supabase.from('tasks').insert([newTask]);
      
      if (!error) {
        setNewTask({
          task: '',
          type: 'Research',
          priority: 'Medium',
          completed: false
        });
        setShowTaskForm(false);
      }
      setSyncing(false);
    }
  };

  const updateTaskStatus = async (taskId, completed) => {
    await supabase.from('tasks').update({ completed }).eq('id', taskId);
  };

  const deleteDeal = async (id) => {
    if (window.confirm('Delete this deal?')) {
      await supabase.from('deals').delete().eq('id', id);
    }
  };

  const deleteMarket = async (id) => {
    if (window.confirm('Delete this market?')) {
      await supabase.from('markets').delete().eq('id', id);
    }
  };

  const deleteTask = async (id) => {
    if (window.confirm('Delete this task?')) {
      await supabase.from('tasks').delete().eq('id', id);
    }
  };

  const generateWeeklyUpdate = () => {
    const dealsInProgress = deals.filter(d => d.stage !== 'Pass' && d.stage !== 'Invested');
    const completedTasks = tasks.filter(t => t.completed).length;
    
    return `WEEKLY UPDATE - ${new Date().toLocaleDateString()}

NEW DEALS REVIEWED: ${deals.filter(d => d.stage === 'Screening').length}
ACTIVE DILIGENCE: ${deals.filter(d => d.stage === 'Diligence').length}
MARKETS TRACKED: ${markets.length}
TASKS COMPLETED: ${completedTasks}/${tasks.length}

TOP PRIORITY DEALS:
${dealsInProgress.slice(0, 3).map(d => 
  `• ${d.company} (${d.sector}) - ${d.stage}
   Founder: ${d.founder || 'TBD'} | No VC: ${d.no_vc ? 'Yes' : 'No'} | Traction: ${d.has_traction ? 'Yes' : 'No'} | Timing: ${d.timing || 'TBD'}`
).join('\n\n')}

NEXT WEEK PRIORITIES:
${tasks.filter(t => !t.completed && t.priority === 'High').slice(0, 3).map(t => 
  `• ${t.task} (${t.type})`
).join('\n')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4" size={40} />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Investment Analyst Dashboard</h1>
            <p className="text-gray-600">Real-time sync • Live updates</p>
          </div>
          {syncing && (
            <div className="flex items-center space-x-2 text-blue-600">
              <RefreshCw className="animate-spin" size={16} />
              <span className="text-sm">Syncing...</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Active Deals</div>
            <div className="text-2xl font-bold text-blue-600">
              {deals.filter(d => d.stage !== 'Pass' && d.stage !== 'Invested').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">In Diligence</div>
            <div className="text-2xl font-bold text-purple-600">
              {deals.filter(d => d.stage === 'Diligence').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Markets Tracked</div>
            <div className="text-2xl font-bold text-green-600">{markets.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Tasks Pending</div>
            <div className="text-2xl font-bold text-orange-600">
              {tasks.filter(t => !t.completed).length}
            </div>
          </div>
        </div>

        <div className="flex space-x-2 mb-6 border-b">
          {['deals', 'markets', 'tasks', 'weekly'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium capitalize ${
                activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'weekly' ? 'Weekly Update' : tab}
            </button>
          ))}
        </div>

        {activeTab === 'deals' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Deal Pipeline</h2>
              <button onClick={() => setShowDealForm(!showDealForm)} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                <Plus size={20} />
                <span>Add Deal</span>
              </button>
            </div>

            {showDealForm && (
              <div className="mb-6 p-4 bg-gray-50 rounded border">
                <h3 className="font-semibold mb-4">New Deal</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="Company Name" value={newDeal.company} onChange={(e) => setNewDeal({...newDeal, company: e.target.value})} className="p-2 border rounded" />
                  <input placeholder="Sector" value={newDeal.sector} onChange={(e) => setNewDeal({...newDeal, sector: e.target.value})} className="p-2 border rounded" />
                  <input placeholder="Founder Name" value={newDeal.founder} onChange={(e) => setNewDeal({...newDeal, founder: e.target.value})} className="p-2 border rounded" />
                  <select value={newDeal.stage} onChange={(e) => setNewDeal({...newDeal, stage: e.target.value})} className="p-2 border rounded">
                    <option>Screening</option>
                    <option>Initial Review</option>
                    <option>Diligence</option>
                    <option>Pass</option>
                    <option>Invested</option>
                  </select>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" checked={newDeal.noVC} onChange={(e) => setNewDeal({...newDeal, noVC: e.target.checked})} className="w-4 h-4" />
                    <label className="text-sm">No Institutional VC ✓</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" checked={newDeal.hasTraction} onChange={(e) => setNewDeal({...newDeal, hasTraction: e.target.checked})} className="w-4 h-4" />
                    <label className="text-sm">Has Traction</label>
                  </div>
                  <input placeholder="Timing Assessment" value={newDeal.timing} onChange={(e) => setNewDeal({...newDeal, timing: e.target.value})} className="p-2 border rounded col-span-2" />
                  <textarea placeholder="Key Insights (Pitch deck highlights, opportunity summary)" value={newDeal.keyInsights} onChange={(e) => setNewDeal({...newDeal, keyInsights: e.target.value})} className="p-2 border rounded col-span-2" rows="2" />
                  <input placeholder="Pitch Deck Link" value={newDeal.deckLink} onChange={(e) => setNewDeal({...newDeal, deckLink: e.target.value})} className="p-2 border rounded col-span-2" />
                  <input placeholder="Analysis Link (Notion, Google Doc, etc.)" value={newDeal.analysisLink} onChange={(e) => setNewDeal({...newDeal, analysisLink: e.target.value})} className="p-2 border rounded col-span-2" />
                  <textarea placeholder="Notes" value={newDeal.notes} onChange={(e) => setNewDeal({...newDeal, notes: e.target.value})} className="p-2 border rounded col-span-2" rows="3" />
                </div>
                <div className="flex space-x-2 mt-4">
                  <button onClick={addDeal} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Save Deal</button>
                  <button onClick={() => setShowDealForm(false)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {deals.map(deal => (
                <div key={deal.id} className="border rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg">{deal.company}</h3>
                      <p className="text-gray-600 text-sm">{deal.sector}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded text-sm font-medium ${
                        deal.stage === 'Diligence' ? 'bg-purple-100 text-purple-700' :
                        deal.stage === 'Screening' ? 'bg-blue-100 text-blue-700' :
                        deal.stage === 'Pass' ? 'bg-red-100 text-red-700' :
                        'bg-green-100 text-green-700'
                      }`}>{deal.stage}</span>
                      <button onClick={() => deleteDeal(deal.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm mt-3">
                    <div><span className="text-gray-600">Founder:</span><span className="ml-2 font-medium">{deal.founder || 'TBD'}</span></div>
                    <div><span className="text-gray-600">No VC:</span><span className={`ml-2 font-medium ${deal.no_vc ? 'text-green-600' : 'text-red-600'}`}>{deal.no_vc ? '✓' : '✗'}</span></div>
                    <div><span className="text-gray-600">Traction:</span><span className={`ml-2 font-medium ${deal.has_traction ? 'text-green-600' : 'text-gray-400'}`}>{deal.has_traction ? '✓' : '✗'}</span></div>
                    <div><span className="text-gray-600">Timing:</span><span className="ml-2 font-medium">{deal.timing || 'TBD'}</span></div>
                    <div className="col-span-2"><span className="text-gray-600">Last Update:</span><span className="ml-2 font-medium">{deal.last_update}</span></div>
                  </div>
                  {deal.key_insights && (
                    <div className="mt-3 p-3 bg-purple-50 border-l-4 border-purple-500 rounded">
                      <div className="text-xs text-purple-700 font-semibold mb-1">KEY INSIGHTS</div>
                      <div className="text-sm text-gray-800">{deal.key_insights}</div>
                    </div>
                  )}
                  {(deal.deck_link || deal.analysis_link) && (
                    <div className="mt-3 flex space-x-3 text-sm">
                      {deal.deck_link && <a href={deal.deck_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">📄 Pitch Deck</a>}
                      {deal.analysis_link && <a href={deal.analysis_link} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-800 underline">📊 Full Analysis</a>}
                    </div>
                  )}
                  {deal.notes && <div className="mt-3 text-sm text-gray-700 bg-gray-50 p-2 rounded">{deal.notes}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'markets' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Market Research</h2>
              <button onClick={() => setShowMarketForm(!showMarketForm)} className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                <Plus size={20} />
                <span>Add Market</span>
              </button>
            </div>
            {showMarketForm && (
              <div className="mb-6 p-4 bg-gray-50 rounded border">
                <h3 className="font-semibold mb-4">New Market</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="Sector/Market Name" value={newMarket.sector} onChange={(e) => setNewMarket({...newMarket, sector: e.target.value})} className="p-2 border rounded col-span-2" />
                  <select value={newMarket.status} onChange={(e) => setNewMarket({...newMarket, status: e.target.value})} className="p-2 border rounded">
                    <option>Researching</option>
                    <option>Active</option>
                    <option>On Hold</option>
                    <option>Completed</option>
                  </select>
                  <select value={newMarket.priority} onChange={(e) => setNewMarket({...newMarket, priority: e.target.value})} className="p-2 border rounded">
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                  <textarea placeholder="Quick Insights (Why/Why Not - headline summary)" value={newMarket.insights} onChange={(e) => setNewMarket({...newMarket, insights: e.target.value})} className="p-2 border rounded col-span-2" rows="3" />
                  <input placeholder="Market Map/Sector Brief Link" value={newMarket.analysisLink} onChange={(e) => setNewMarket({...newMarket, analysisLink: e.target.value})} className="p-2 border rounded col-span-2" />
                </div>
                <div className="flex space-x-2 mt-4">
                  <button onClick={addMarket} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Save Market</button>
                  <button onClick={() => setShowMarketForm(false)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
                </div>
              </div>
            )}
            <div className="space-y-4">
              {markets.map(market => (
                <div key={market.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{market.sector}</h3>
                      <p className="text-sm text-gray-600 mt-1">Status: {market.status}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded text-sm ${
                        market.priority === 'High' ? 'bg-red-100 text-red-700' :
                        market.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>{market.priority}</span>
                      <button onClick={() => deleteMarket(market.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                    </div>
                  </div>
                  {market.insights && (
                    <div className="mb-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                      <div className="text-xs text-blue-700 font-semibold mb-1">KEY INSIGHTS</div>
                      <div className="text-sm text-gray-800">{market.insights}</div>
                    </div>
                  )}
                  {market.analysis_link && (
                    <div className="mt-2">
                      <a href={market.analysis_link} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800 underline text-sm">🗺️ View Market Map / Sector Brief</a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Tasks & Workflow</h2>
              <button onClick={() => setShowTaskForm(!showTaskForm)} className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700">
                <Plus size={20} />
                <span>Add Task</span>
              </button>
            </div>
            {showTaskForm && (
              <div className="mb-6 p-4 bg-gray-50 rounded border">
                <h3 className="font-semibold mb-4">New Task</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="Task description" value={newTask.task} onChange={(e) => setNewTask({...newTask, task: e.target.value})} className="p-2 border rounded col-span-2" />
                  <select value={newTask.type} onChange={(e) => setNewTask({...newTask, type: e.target.value})} className="p-2 border rounded">
                    <option>Research</option>
                    <option>Deal Analysis</option>
                    <option>Follow-up</option>
                    <option>Reporting</option>
                  </select>
                  <select value={newTask.priority} onChange={(e) => setNewTask({...newTask, priority: e.target.value})} className="p-2 border rounded">
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
                <div className="flex space-x-2 mt-4">
                  <button onClick={addTask} className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700">Save Task</button>
                  <button onClick={() => setShowTaskForm(false)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
                </div>
              </div>
            )}
            <div className="space-y-3">
              {tasks.map(task => (
                <div key={task.id} className="flex items-center space-x-3 p-3 border rounded hover:bg-gray-50">
                  <input type="checkbox" checked={task.completed} onChange={(e) => updateTaskStatus(task.id, e.target.checked)} className="w-5 h-5" />
                  <div className="flex-1">
                    <div className={task.completed ? 'line-through text-gray-500' : ''}>{task.task}</div>
                    <div className="text-sm text-gray-600">{task.type}</div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    task.priority === 'High' ? 'bg-red-100 text-red-700' :
                    task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{task.priority}</span>
                  <button onClick={() => deleteTask(task.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'weekly' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-6">Weekly Update Generator</h2>
            <div className="bg-gray-50 p-4 rounded border font-mono text-sm whitespace-pre-wrap">{generateWeeklyUpdate()}</div>
            <button onClick={() => {navigator.clipboard.writeText(generateWeeklyUpdate()); alert('Copied!');}} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Copy to Clipboard</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestmentAnalystDashboard;
const InvestmentAnalystDashboard = () => {
  const [activeTab, setActiveTab] = useState('deals');
  const [deals, setDeals] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [showDealForm, setShowDealForm] = useState(false);
  const [showMarketForm, setShowMarketForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);

  const [newDeal, setNewDeal] = useState({
    company: '',
    sector: '',
    founder: '',
    stage: 'Screening',
    noVC: true,
    hasTraction: false,
    timing: '',
    notes: ''
  });

  const [newMarket, setNewMarket] = useState({
    sector: '',
    status: 'Researching',
    priority: 'Medium'
  });

  const [newTask, setNewTask] = useState({
    task: '',
    type: 'Research',
    priority: 'Medium',
    completed: false
  });

  useEffect(() => {
    loadAllData();
    
    const dealsChannel = supabase
      .channel('deals-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, () => {
        loadDeals();
      })
      .subscribe();

    const marketsChannel = supabase
      .channel('markets-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'markets' }, () => {
        loadMarkets();
      })
      .subscribe();

    const tasksChannel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        loadTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(dealsChannel);
      supabase.removeChannel(marketsChannel);
      supabase.removeChannel(tasksChannel);
    };
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([loadDeals(), loadMarkets(), loadTasks()]);
    setLoading(false);
  };

  const loadDeals = async () => {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setDeals(data);
  };

  const loadMarkets = async () => {
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setMarkets(data);
  };

  const loadTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('priority', { ascending: false });
    if (!error && data) setTasks(data);
  };

  const addDeal = async () => {
    if (newDeal.company && newDeal.sector) {
      setSyncing(true);
      const { error } = await supabase.from('deals').insert([{
        company: newDeal.company,
        sector: newDeal.sector,
        founder: newDeal.founder,
        stage: newDeal.stage,
        no_vc: newDeal.noVC,
        has_traction: newDeal.hasTraction,
        timing: newDeal.timing,
        notes: newDeal.notes,
        founder_score: 0,
        last_update: new Date().toISOString().split('T')[0]
      }]);
      
      if (!error) {
        setNewDeal({
          company: '',
          sector: '',
          founder: '',
          stage: 'Screening',
          noVC: true,
          hasTraction: false,
          timing: '',
          notes: ''
        });
        setShowDealForm(false);
      }
      setSyncing(false);
    }
  };

  const addMarket = async () => {
    if (newMarket.sector) {
      setSyncing(true);
      const { error } = await supabase.from('markets').insert([{
        sector: newMarket.sector,
        status: newMarket.status,
        priority: newMarket.priority,
        last_update: new Date().toISOString().split('T')[0]
      }]);
      
      if (!error) {
        setNewMarket({
          sector: '',
          status: 'Researching',
          priority: 'Medium'
        });
        setShowMarketForm(false);
      }
      setSyncing(false);
    }
  };

  const addTask = async () => {
    if (newTask.task) {
      setSyncing(true);
      const { error } = await supabase.from('tasks').insert([newTask]);
      
      if (!error) {
        setNewTask({
          task: '',
          type: 'Research',
          priority: 'Medium',
          completed: false
        });
        setShowTaskForm(false);
      }
      setSyncing(false);
    }
  };

  const updateTaskStatus = async (taskId, completed) => {
    await supabase.from('tasks').update({ completed }).eq('id', taskId);
  };

  const deleteDeal = async (id) => {
    if (window.confirm('Delete this deal?')) {
      await supabase.from('deals').delete().eq('id', id);
    }
  };

  const deleteMarket = async (id) => {
    if (window.confirm('Delete this market?')) {
      await supabase.from('markets').delete().eq('id', id);
    }
  };

  const deleteTask = async (id) => {
    if (window.confirm('Delete this task?')) {
      await supabase.from('tasks').delete().eq('id', id);
    }
  };

  const generateWeeklyUpdate = () => {
    const dealsInProgress = deals.filter(d => d.stage !== 'Pass' && d.stage !== 'Invested');
    const completedTasks = tasks.filter(t => t.completed).length;
    
    return `WEEKLY UPDATE - ${new Date().toLocaleDateString()}

NEW DEALS REVIEWED: ${deals.filter(d => d.stage === 'Screening').length}
ACTIVE DILIGENCE: ${deals.filter(d => d.stage === 'Diligence').length}
MARKETS TRACKED: ${markets.length}
TASKS COMPLETED: ${completedTasks}/${tasks.length}

TOP PRIORITY DEALS:
${dealsInProgress.slice(0, 3).map(d => 
  `• ${d.company} (${d.sector}) - ${d.stage}
   Founder: ${d.founder || 'TBD'} | No VC: ${d.no_vc ? 'Yes' : 'No'} | Traction: ${d.has_traction ? 'Yes' : 'No'} | Timing: ${d.timing || 'TBD'}`
).join('\n\n')}

NEXT WEEK PRIORITIES:
${tasks.filter(t => !t.completed && t.priority === 'High').slice(0, 3).map(t => 
  `• ${t.task} (${t.type})`
).join('\n')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4" size={40} />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Investment Analyst Dashboard</h1>
            <p className="text-gray-600">Real-time sync • Live updates</p>
          </div>
          {syncing && (
            <div className="flex items-center space-x-2 text-blue-600">
              <RefreshCw className="animate-spin" size={16} />
              <span className="text-sm">Syncing...</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Active Deals</div>
            <div className="text-2xl font-bold text-blue-600">
              {deals.filter(d => d.stage !== 'Pass' && d.stage !== 'Invested').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">In Diligence</div>
            <div className="text-2xl font-bold text-purple-600">
              {deals.filter(d => d.stage === 'Diligence').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Markets Tracked</div>
            <div className="text-2xl font-bold text-green-600">{markets.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Tasks Pending</div>
            <div className="text-2xl font-bold text-orange-600">
              {tasks.filter(t => !t.completed).length}
            </div>
          </div>
        </div>

        <div className="flex space-x-2 mb-6 border-b">
          {['deals', 'markets', 'tasks', 'weekly'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium capitalize ${
                activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'weekly' ? 'Weekly Update' : tab}
            </button>
          ))}
        </div>

        {activeTab === 'deals' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Deal Pipeline</h2>
              <button onClick={() => setShowDealForm(!showDealForm)} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                <Plus size={20} />
                <span>Add Deal</span>
              </button>
            </div>

            {showDealForm && (
              <div className="mb-6 p-4 bg-gray-50 rounded border">
                <h3 className="font-semibold mb-4">New Deal</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="Company Name" value={newDeal.company} onChange={(e) => setNewDeal({...newDeal, company: e.target.value})} className="p-2 border rounded" />
                  <input placeholder="Sector" value={newDeal.sector} onChange={(e) => setNewDeal({...newDeal, sector: e.target.value})} className="p-2 border rounded" />
                  <input placeholder="Founder Name" value={newDeal.founder} onChange={(e) => setNewDeal({...newDeal, founder: e.target.value})} className="p-2 border rounded" />
                  <select value={newDeal.stage} onChange={(e) => setNewDeal({...newDeal, stage: e.target.value})} className="p-2 border rounded">
                    <option>Screening</option>
                    <option>Initial Review</option>
                    <option>Diligence</option>
                    <option>Pass</option>
                    <option>Invested</option>
                  </select>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" checked={newDeal.noVC} onChange={(e) => setNewDeal({...newDeal, noVC: e.target.checked})} className="w-4 h-4" />
                    <label className="text-sm">No Institutional VC ✓</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" checked={newDeal.hasTraction} onChange={(e) => setNewDeal({...newDeal, hasTraction: e.target.checked})} className="w-4 h-4" />
                    <label className="text-sm">Has Traction</label>
                  </div>
                  <input placeholder="Timing Assessment" value={newDeal.timing} onChange={(e) => setNewDeal({...newDeal, timing: e.target.value})} className="p-2 border rounded col-span-2" />
                  <textarea placeholder="Notes" value={newDeal.notes} onChange={(e) => setNewDeal({...newDeal, notes: e.target.value})} className="p-2 border rounded col-span-2" rows="3" />
                </div>
                <div className="flex space-x-2 mt-4">
                  <button onClick={addDeal} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Save Deal</button>
                  <button onClick={() => setShowDealForm(false)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {deals.map(deal => (
                <div key={deal.id} className="border rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg">{deal.company}</h3>
                      <p className="text-gray-600 text-sm">{deal.sector}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded text-sm font-medium ${
                        deal.stage === 'Diligence' ? 'bg-purple-100 text-purple-700' :
                        deal.stage === 'Screening' ? 'bg-blue-100 text-blue-700' :
                        deal.stage === 'Pass' ? 'bg-red-100 text-red-700' :
                        'bg-green-100 text-green-700'
                      }`}>{deal.stage}</span>
                      <button onClick={() => deleteDeal(deal.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm mt-3">
                    <div><span className="text-gray-600">Founder:</span><span className="ml-2 font-medium">{deal.founder || 'TBD'}</span></div>
                    <div><span className="text-gray-600">No VC:</span><span className={`ml-2 font-medium ${deal.no_vc ? 'text-green-600' : 'text-red-600'}`}>{deal.no_vc ? '✓' : '✗'}</span></div>
                    <div><span className="text-gray-600">Traction:</span><span className={`ml-2 font-medium ${deal.has_traction ? 'text-green-600' : 'text-gray-400'}`}>{deal.has_traction ? '✓' : '✗'}</span></div>
                    <div><span className="text-gray-600">Timing:</span><span className="ml-2 font-medium">{deal.timing || 'TBD'}</span></div>
                    <div className="col-span-2"><span className="text-gray-600">Last Update:</span><span className="ml-2 font-medium">{deal.last_update}</span></div>
                  </div>
                  {deal.notes && <div className="mt-3 text-sm text-gray-700 bg-gray-50 p-2 rounded">{deal.notes}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'markets' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Market Research</h2>
              <button onClick={() => setShowMarketForm(!showMarketForm)} className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                <Plus size={20} />
                <span>Add Market</span>
              </button>
            </div>
            {showMarketForm && (
              <div className="mb-6 p-4 bg-gray-50 rounded border">
                <h3 className="font-semibold mb-4">New Market</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="Sector/Market Name" value={newMarket.sector} onChange={(e) => setNewMarket({...newMarket, sector: e.target.value})} className="p-2 border rounded col-span-2" />
                  <select value={newMarket.status} onChange={(e) => setNewMarket({...newMarket, status: e.target.value})} className="p-2 border rounded">
                    <option>Researching</option>
                    <option>Active</option>
                    <option>On Hold</option>
                    <option>Completed</option>
                  </select>
                  <select value={newMarket.priority} onChange={(e) => setNewMarket({...newMarket, priority: e.target.value})} className="p-2 border rounded">
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
                <div className="flex space-x-2 mt-4">
                  <button onClick={addMarket} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Save Market</button>
                  <button onClick={() => setShowMarketForm(false)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
                </div>
              </div>
            )}
            <div className="space-y-4">
              {markets.map(market => (
                <div key={market.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold">{market.sector}</h3>
                      <p className="text-sm text-gray-600 mt-1">Status: {market.status}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded text-sm ${
                        market.priority === 'High' ? 'bg-red-100 text-red-700' :
                        market.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>{market.priority}</span>
                      <button onClick={() => deleteMarket(market.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Tasks & Workflow</h2>
              <button onClick={() => setShowTaskForm(!showTaskForm)} className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700">
                <Plus size={20} />
                <span>Add Task</span>
              </button>
            </div>
            {showTaskForm && (
              <div className="mb-6 p-4 bg-gray-50 rounded border">
                <h3 className="font-semibold mb-4">New Task</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="Task description" value={newTask.task} onChange={(e) => setNewTask({...newTask, task: e.target.value})} className="p-2 border rounded col-span-2" />
                  <select value={newTask.type} onChange={(e) => setNewTask({...newTask, type: e.target.value})} className="p-2 border rounded">
                    <option>Research</option>
                    <option>Deal Analysis</option>
                    <option>Follow-up</option>
                    <option>Reporting</option>
                  </select>
                  <select value={newTask.priority} onChange={(e) => setNewTask({...newTask, priority: e.target.value})} className="p-2 border rounded">
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
                <div className="flex space-x-2 mt-4">
                  <button onClick={addTask} className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700">Save Task</button>
                  <button onClick={() => setShowTaskForm(false)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
                </div>
              </div>
            )}
            <div className="space-y-3">
              {tasks.map(task => (
                <div key={task.id} className="flex items-center space-x-3 p-3 border rounded hover:bg-gray-50">
                  <input type="checkbox" checked={task.completed} onChange={(e) => updateTaskStatus(task.id, e.target.checked)} className="w-5 h-5" />
                  <div className="flex-1">
                    <div className={task.completed ? 'line-through text-gray-500' : ''}>{task.task}</div>
                    <div className="text-sm text-gray-600">{task.type}</div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    task.priority === 'High' ? 'bg-red-100 text-red-700' :
                    task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{task.priority}</span>
                  <button onClick={() => deleteTask(task.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'weekly' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-6">Weekly Update Generator</h2>
            <div className="bg-gray-50 p-4 rounded border font-mono text-sm whitespace-pre-wrap">{generateWeeklyUpdate()}</div>
            <button onClick={() => {navigator.clipboard.writeText(generateWeeklyUpdate()); alert('Copied!');}} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Copy to Clipboard</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestmentAnalystDashboard;
