import React, { useState, useEffect } from 'react';
import { DollarSign, Users, TrendingUp, TrendingDown, Plus, Menu, X, Bell, Activity, BarChart3, Settings, LogOut, Search, UserPlus, ChevronRight, AlertCircle, CheckCircle, Clock, Wallet } from 'lucide-react';

const API_BASE = 'https://splitsmart-backend-iay2.onrender.com';

// Auth Context
const AuthContext = React.createContext(null);

const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// API Helper
const api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    console.log('Making request to:', endpoint, 'with token:', token ? 'exists' : 'missing');
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('API Error:', error);
      throw new Error(error.detail || 'Request failed');
    }

    return response.json();
  },

  login: (data) => api.request('/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data) => api.request('/register', { method: 'POST', body: JSON.stringify(data) }),
  getDashboard: () => api.request('/me/dashboard'),
  getGroups: () => api.request('/me/groups'),
  createGroup: (data) => api.request('/groups', { method: 'POST', body: JSON.stringify(data) }),
  getGroupDetails: (id) => api.request(`/groups/${id}`),
  getGroupExpenses: (id) => api.request(`/groups/${id}/expenses`),
  getGroupBalances: (id) => api.request(`/groups/${id}/balances`),
  getGroupNetOwe: (id) => api.request(`/groups/${id}/net-owe`),
  getSettleSuggestions: (id) => api.request(`/groups/${id}/settle-suggestions`),
  addExpense: (data) => api.request('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  settleUp: (data) => api.request('/settle', { method: 'POST', body: JSON.stringify(data) }),
  searchUsers: (q) => api.request(`/users/search?q=${q}`),
  addMember: (groupId, data) => api.request(`/groups/${groupId}/add-member`, { method: 'POST', body: JSON.stringify(data) }),
  leaveGroup: (groupId) => api.request(`/groups/${groupId}/leave`, { method: 'DELETE' }),
  getActivity: () => api.request('/me/activity'),
  getNotifications: () => api.request('/me/notifications'),
  markNotificationRead: (id) => api.request(`/me/notifications/${id}/read`, { method: 'POST' }),
  getMonthlyAnalytics: () => api.request('/me/analytics/monthly'),
  simplifyDebts: () => api.request('/me/simplify-debts'),
};

// Auth Provider Component
function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
    setIsReady(true);
  }, []);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    console.log('Login response:', data);
    console.log('Storing token:', data.access_token);
    localStorage.setItem('token', data.access_token);
    setToken(data.access_token);
    // Force a small delay to ensure storage is complete
    await new Promise(resolve => setTimeout(resolve, 100));
    return data.access_token;
  };

  const register = async (name, email, password) => {
    await api.register({ name, email, password });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  if (!isReady) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
    </div>;
  }

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Login/Register Component
function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.name, formData.email, formData.password);
        await login(formData.email, formData.password);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
            <DollarSign className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">SplitWise Pro</h1>
          <p className="text-gray-600 mt-2">Split expenses effortlessly</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-lg font-medium transition ${
                isLogin ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-lg font-medium transition ${
                !isLogin ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Register
            </button>
          </div>

          <div className="space-y-4">
            {!isLogin && (
              <input
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dashboard Component
function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      console.log('Dashboard: Token exists, loading data');
      loadData();
    }
  }, [token]);

  const loadData = async () => {
    try {
      console.log('Dashboard: Making API calls');
      const [dashboardData, activityData] = await Promise.all([
        api.getDashboard(),
        api.getActivity()
      ]);
      console.log('Dashboard data:', dashboardData);
      setStats(dashboardData);
      setActivity(activityData.slice(0, 5));
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600">Overview of your expenses</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Groups</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.groups || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">You Owe</p>
              <p className="text-3xl font-bold text-red-600 mt-1">₹{stats?.you_owe?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">You Get</p>
              <p className="text-3xl font-bold text-green-600 mt-1">₹{stats?.you_get?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <button
            onClick={() => onNavigate('activity')}
            className="text-blue-600 text-sm hover:underline"
          >
            View All
          </button>
        </div>
        {activity.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {activity.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{item.description}</p>
                    <p className="text-sm text-gray-600">{item.group} • {item.paid_by}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">₹{item.amount.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Groups List Component
function GroupsList({ onNavigate }) {
  const [groups, setGroups] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      console.log('GroupsList: Token exists, loading groups');
      loadGroups();
    }
  }, [token]);

  const loadGroups = async () => {
    try {
      console.log('GroupsList: Making API call');
      const data = await api.getGroups();
      console.log('Groups data:', data);
      setGroups(data);
    } catch (err) {
      console.error('Groups error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!groupName.trim()) return;
    try {
      await api.createGroup({ name: groupName });
      setGroupName('');
      setShowCreate(false);
      loadGroups();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Groups</h2>
          <p className="text-gray-600">Manage your expense groups</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          Create Group
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Group name (e.g., Trip to Paris)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <button
              onClick={handleCreate}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Create
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No groups yet</h3>
          <p className="text-gray-600 mb-4">Create your first group to start splitting expenses</p>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Create Group
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <div
              key={group.id}
              onClick={() => onNavigate('group', group.id)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{group.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">Group #{group.id}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Group Detail Component
function GroupDetail({ groupId, onBack }) {
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [netOwe, setNetOwe] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showSettle, setShowSettle] = useState(false);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    if (token && groupId) {
      console.log('GroupDetail: Token exists, loading group data');
      loadData();
    }
  }, [groupId, token]);

  const loadData = async () => {
    try {
      console.log('GroupDetail: Making API calls for group', groupId);
      const [groupData, expensesData, netOweData, suggestionsData] = await Promise.all([
        api.getGroupDetails(groupId),
        api.getGroupExpenses(groupId),
        api.getGroupNetOwe(groupId),
        api.getSettleSuggestions(groupId)
      ]);
      console.log('Group data:', groupData);
      setGroup(groupData);
      setExpenses(expensesData);
      setNetOwe(netOweData.net_owe || []);
      setSuggestions(suggestionsData.transactions || []);
    } catch (err) {
      console.error('GroupDetail error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ChevronRight className="w-5 h-5 rotate-180" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">{group?.name}</h2>
          <p className="text-gray-600">{group?.members?.length || 0} members</p>
        </div>
        <button
          onClick={() => setShowAddExpense(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          Add Expense
        </button>
      </div>

      {showAddExpense && (
        <AddExpenseModal
          groupId={groupId}
          members={group.members}
          onClose={() => setShowAddExpense(false)}
          onSuccess={() => {
            setShowAddExpense(false);
            loadData();
          }}
        />
      )}

      {showAddMember && (
        <AddMemberModal
          groupId={groupId}
          onClose={() => setShowAddMember(false)}
          onSuccess={() => {
            setShowAddMember(false);
            loadData();
          }}
        />
      )}

      {showSettle && (
        <SettleModal
          groupId={groupId}
          members={group.members}
          onClose={() => setShowSettle(false)}
          onSuccess={() => {
            setShowSettle(false);
            loadData();
          }}
        />
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Members</h3>
          <div className="space-y-2 mb-4">
            {group?.members?.map((member) => (
  <div key={member.id} className="flex items-center gap-2">
    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
      {member.name ? member.name[0] : '?'}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-900">{member.name}</p>
      <p className="text-xs text-gray-500">{member.email}</p>
    </div>
  </div>
))}
          </div>
          <button
            onClick={() => setShowAddMember(true)}
            className="w-full text-blue-600 text-sm font-medium hover:underline"
          >
            + Add Member
          </button>
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Your Balances</h3>
              <button
                onClick={() => setShowSettle(true)}
                className="text-blue-600 text-sm hover:underline"
              >
                Settle Up
              </button>
            </div>
            {netOwe.length === 0 ? (
              <p className="text-gray-500 text-center py-4">All settled up!</p>
            ) : (
              <div className="space-y-2">
                {netOwe.map((balance) => (
                  <div key={balance.user_id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-gray-900">{balance.name}</span>
                    <span className={`font-semibold ${
                      balance.status === 'you_owe' ? 'text-red-600' :
                      balance.status === 'you_get' ? 'text-green-600' :
                      'text-gray-600'
                    }`}>
                      {balance.status === 'you_owe' && '-'}
                      {balance.status === 'you_get' && '+'}
                      ${balance.net_amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {suggestions.length > 0 && (
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Settlement Suggestions
              </h3>
              <div className="space-y-2">
                {suggestions.map((sug, idx) => (
                  <p key={idx} className="text-sm text-blue-800">
                    {sug.from_name} pays ₹{sug.amount} to {sug.to_name}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Recent Expenses</h3>
        {expenses.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No expenses yet</p>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{expense.description}</p>
                  <p className="text-sm text-gray-600">Paid by {expense.paid_by}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">₹{expense.amount.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{new Date(expense.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Add Expense Modal
function AddExpenseModal({ groupId, members, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    split_between: members.map(m => m.id) // Changed from m[0] to m.id
  });

  const handleSubmit = async () => {
    if (!formData.amount || !formData.description || formData.split_between.length === 0) return;
    try {
      await api.addExpense({
        group_id: groupId,
        amount: parseFloat(formData.amount),
        description: formData.description,
        split_between: formData.split_between
      });
      onSuccess();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Add Expense</h3>
        <div className="space-y-4">
          <input
            type="number"
            step="0.01"
            placeholder="Amount"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <input
            type="text"
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Split between:</label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {members.map((member) => (
                <label key={member.id} className="flex items-center gap-2"> {/* Changed from member[0] */}
                  <input
                    type="checkbox"
                    checked={formData.split_between.includes(member.id)} // Changed from member[0]
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, split_between: [...formData.split_between, member.id] });
                      } else {
                        setFormData({ ...formData, split_between: formData.split_between.filter(id => id !== member.id) });
                      }
                    }}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-900">{member.name}</span> {/* Changed from member[1] */}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSubmit} className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition">
              Add Expense
            </button>
            <button onClick={onClose} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
// Add Member Modal
function AddMemberModal({ groupId, onClose, onSuccess }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery) return;
    setSearching(true);
    try {
      const results = await api.searchUsers(searchQuery);
      setSearchResults(results);
    } catch (err) {
      alert(err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async (userId) => {
    try {
      await api.addMember(groupId, { user_id: userId });
      onSuccess();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Add Member</h3>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Search by email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
          {searching ? (
            <p className="text-center py-4 text-gray-500">Searching...</p>
          ) : searchResults.length === 0 ? (
            <p className="text-center py-4 text-gray-500">No results</p>
          ) : (
            searchResults.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
                <button
                  onClick={() => handleAdd(user.id)}
                  className="bg-blue-600 text-white px-4 py-1 rounded-lg hover:bg-blue-700 transition text-sm"
                >
                  Add
                </button>
              </div>
            ))
          )}
        </div>
        <button
          onClick={onClose}
          className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// Settle Modal
function SettleModal({ groupId, members, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    to_user_id: '',
    amount: ''
  });

  const handleSubmit = async () => {
    if (!formData.to_user_id || !formData.amount) return;
    try {
      await api.settleUp({
        group_id: groupId,
        to_user_id: parseInt(formData.to_user_id),
        amount: parseFloat(formData.amount)
      });
      onSuccess();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Settle Up</h3>
        <div className="space-y-4">
          <select
            value={formData.to_user_id}
            onChange={(e) => setFormData({ ...formData, to_user_id: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Select member to pay</option>
            {members.map((member) => (
  <option key={member.id} value={member.id}>{member.name}</option>
))}
          </select>
          <input
            type="number"
            step="0.01"
            placeholder="Amount"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
            >
              Settle
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Activity Feed Component
function ActivityFeed() {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      console.log('ActivityFeed: Token exists, loading activity');
      loadActivity();
    }
  }, [token]);

  const loadActivity = async () => {
    try {
      console.log('ActivityFeed: Making API call');
      const data = await api.getActivity();
      console.log('Activity data:', data);
      setActivity(data);
    } catch (err) {
      console.error('Activity error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Activity</h2>
        <p className="text-gray-600">Recent expense activity</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {activity.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No activity yet</p>
        ) : (
          <div className="space-y-4">
            {activity.map((item, idx) => (
              <div key={idx} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Activity className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.description}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {item.group} • Paid by {item.paid_by}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">₹{item.amount.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Main App Component
function App() {
  const { token, logout } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!token) {
    return <AuthScreen />;
  }

  const navigate = (view, data = null) => {
    setCurrentView(view);
    if (view === 'group') setSelectedGroupId(data);
    setSidebarOpen(false);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'activity', label: 'Activity', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900">SplitWise Pro</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <div className="flex h-screen">
        {/* Sidebar */}
        <div className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transition-transform duration-300`}>
          <div className="p-6 border-b border-gray-200 hidden lg:block">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">SplitSmart Pro</h1>
                <p className="text-xs text-gray-600">Expense Tracker</p>
              </div>
            </div>
          </div>

          <nav className="p-4 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  currentView === item.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-6">
            {currentView === 'dashboard' && <Dashboard onNavigate={navigate} />}
            {currentView === 'groups' && <GroupsList onNavigate={navigate} />}
            {currentView === 'group' && <GroupDetail groupId={selectedGroupId} onBack={() => navigate('groups')} />}
            {currentView === 'activity' && <ActivityFeed />}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

// Root Component
export default function Root() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
