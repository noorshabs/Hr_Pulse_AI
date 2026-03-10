import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  MessageSquare, 
  ClipboardList, 
  ShieldCheck, 
  Plus, 
  Search, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  UserPlus,
  LogOut,
  FileText,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileCheck,
  FileWarning,
  Eye,
  Briefcase,
  UserCheck,
  Filter,
  Star,
  MoreVertical,
  ArrowUpRight,
  Settings,
  User,
  Lock,
  Key,
  AlertTriangle,
  Gavel,
  Scale,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  status: string;
  join_date: string;
  skills?: string[];
  bio?: string;
  location?: string;
  phone?: string;
}

interface Task {
  id: number;
  employee_email: string;
  description: string;
  status: string;
  type: string;
  created_at: string;
}

interface Approval {
  id: number;
  type: string;
  details: string;
  status: string;
  requested_by: string;
  created_at: string;
}

interface ChatMessage {
  role: 'user' | 'model';
  parts: { text?: string; functionCall?: any; functionResponse?: any }[];
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'employees' | 'tasks' | 'approvals' | 'onboarding' | 'recruitment' | 'compliance'>('chat');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [approvalStats, setApprovalStats] = useState({ pending: 0, approvedLeave: 0, total: 0 });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedOnboardingEmployee, setSelectedOnboardingEmployee] = useState<Employee | null>(null);
  const [onboardingItems, setOnboardingItems] = useState<any[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedEmployeeProfile, setSelectedEmployeeProfile] = useState<Employee | null>(null);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [adminName, setAdminName] = useState('HR Administrator');
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [jobPostings, setJobPostings] = useState([
    { id: 1, title: 'Senior Frontend Engineer', department: 'Engineering', type: 'Full-time', status: 'Open', applicants: 45 },
    { id: 2, title: 'Product Manager', department: 'Product', type: 'Full-time', status: 'Open', applicants: 28 },
    { id: 3, title: 'UX Designer', department: 'Design', type: 'Contract', status: 'Open', applicants: 15 },
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const fetchData = async () => {
    try {
      const [empRes, taskRes, appRes, statRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/tasks'),
        fetch('/api/approvals'),
        fetch('/api/approvals/stats')
      ]);
      setEmployees(await empRes.json());
      setTasks(await taskRes.json());
      setApprovals(await appRes.json());
      setApprovalStats(await statRes.json());
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  };

  const handleAddEmployee = async (formData: any) => {
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input;
    setInput('');
    setChatHistory(prev => [...prev, { role: 'user', parts: [{ text: userMsg }] }]);
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: chatHistory })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response from AI');
      }

      if (data.history && Array.isArray(data.history)) {
        setChatHistory(data.history);
      }
      // Refresh data in case AI took actions
      fetchData();
    } catch (err: any) {
      console.error(err);
      setChatHistory(prev => [...prev, { 
        role: 'model', 
        parts: [{ text: `Error: ${err.message}. Please check your API key configuration in the Secrets panel.` }] 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleApproval = async (id: number, action: 'approved' | 'rejected') => {
    try {
      await fetch(`/api/approvals/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'onboarding': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'offboarding': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'pending': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (!isAuthenticated) {
    return <SignInPage onSignIn={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <ShieldCheck className="text-white w-5 h-5" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">HR Pulse</h1>
          </div>
          
          <nav className="space-y-1">
            <SidebarItem 
              icon={<MessageSquare size={18} />} 
              label="AI Assistant" 
              active={activeTab === 'chat'} 
              onClick={() => setActiveTab('chat')} 
            />
            <SidebarItem 
              icon={<Users size={18} />} 
              label="Employees" 
              active={activeTab === 'employees'} 
              onClick={() => setActiveTab('employees')} 
            />
            <SidebarItem 
              icon={<Briefcase size={18} />} 
              label="Recruitment" 
              active={activeTab === 'recruitment'} 
              onClick={() => setActiveTab('recruitment')} 
            />
            <SidebarItem 
              icon={<ClipboardList size={18} />} 
              label="Onboarding" 
              active={activeTab === 'onboarding'} 
              onClick={() => setActiveTab('onboarding')} 
            />
            <SidebarItem 
              icon={<ClipboardList size={18} />} 
              label="Workflows" 
              active={activeTab === 'tasks'} 
              onClick={() => setActiveTab('tasks')} 
            />
            <SidebarItem 
              icon={<ShieldCheck size={18} />} 
              label="Pending Requests" 
              active={activeTab === 'approvals'} 
              count={approvalStats.pending}
              onClick={() => setActiveTab('approvals')} 
            />
            <SidebarItem 
              icon={<Scale size={18} />} 
              label="Compliance" 
              active={activeTab === 'compliance'} 
              onClick={() => setActiveTab('compliance')} 
            />
          </nav>
        </div>
        
        <div className="mt-auto p-6 border-t border-slate-100 relative">
          <button 
            onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
            className="w-full flex items-center gap-3 hover:bg-slate-50 p-2 -m-2 rounded-xl transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold shrink-0">
              {adminName.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{adminName}</p>
              <p className="text-xs text-slate-500">Admin Access</p>
            </div>
            <ChevronUp size={14} className={`text-slate-400 ml-auto transition-transform ${isAdminMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isAdminMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full left-6 right-6 mb-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50"
              >
                <div className="p-2 space-y-1">
                  <button 
                    onClick={() => {
                      setIsAdminMenuOpen(false);
                      // Mock viewing own profile
                      setSelectedEmployeeProfile({
                        id: 0,
                        name: adminName,
                        email: 'admin@hrpulse.ai',
                        role: 'HR Administrator',
                        department: 'Human Resources',
                        status: 'active',
                        join_date: '2023-01-01',
                        bio: 'System administrator for HR Pulse platform.',
                        skills: ['System Admin', 'HR Strategy', 'Data Privacy']
                      });
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-colors"
                  >
                    <User size={16} /> View Profile
                  </button>
                  <button 
                    onClick={() => {
                      setIsAdminMenuOpen(false);
                      setIsSettingsModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-colors"
                  >
                    <Settings size={16} /> Settings
                  </button>
                  <div className="h-px bg-slate-100 my-1" />
                  <button 
                    onClick={() => {
                      setIsAdminMenuOpen(false);
                      setIsAuthenticated(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut size={16} /> Log Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-bottom border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h2 className="font-semibold text-lg capitalize">{activeTab === 'approvals' ? 'Pending Requests' : activeTab}</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-64"
              />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'chat' && (
              <motion.div 
                key="chat"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full flex flex-col max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
              >
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {chatHistory.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-60">
                      <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                        <MessageSquare size={32} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">How can I help you today?</h3>
                        <p className="text-sm max-w-xs">Ask me to onboard a new employee, check leave policies, or coordinate offboarding.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <SuggestionCard text="Onboard Jane Smith" onClick={() => setInput("Onboard Jane Smith as a Product Designer in the Design department.")} />
                        <SuggestionCard text="What's the leave policy?" onClick={() => setInput("What is our current leave policy?")} />
                        <SuggestionCard text="Offboard John Doe" onClick={() => setInput("I need to offboard John Doe on June 10th.")} />
                        <SuggestionCard text="List active employees" onClick={() => setInput("Can you show me a list of active employees?")} />
                      </div>
                    </div>
                  )}
                  {Array.isArray(chatHistory) && chatHistory.map((msg, i) => {
                    const textParts = msg.parts.filter(p => p.text).map(p => p.text).join('\n');
                    if (!textParts) return null;
                    
                    return (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-4 rounded-2xl ${
                          msg.role === 'user' 
                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                            : 'bg-slate-100 text-slate-800 rounded-tl-none'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{textParts}</p>
                        </div>
                      </div>
                    );
                  })}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                        <Loader2 className="animate-spin text-slate-400" size={16} />
                        <span className="text-xs text-slate-500 font-medium">AI is processing...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                
                <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 flex gap-2">
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your HR request..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button 
                    type="submit"
                    disabled={isTyping}
                    className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </motion.div>
            )}

            {activeTab === 'employees' && (
              <motion.div 
                key="employees"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">Employee Directory</h3>
                  <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                  >
                    <UserPlus size={16} /> Add Employee
                  </button>
                </div>
                
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Join Date</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {employees.map((emp) => (
                        <tr 
                          key={emp.id} 
                          className="hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => setSelectedEmployeeProfile(emp)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-medium text-xs">
                                {emp.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{emp.name}</p>
                                <p className="text-xs text-slate-500">{emp.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{emp.role}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{emp.department}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(emp.status)}`}>
                              {emp.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{emp.join_date}</td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-slate-400 hover:text-indigo-600">
                              <ChevronRight size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'onboarding' && (
              <OnboardingView 
                employees={employees.filter(e => e.status === 'onboarding' || e.status === 'active')}
                selectedEmployee={selectedOnboardingEmployee}
                onSelectEmployee={async (emp) => {
                  setSelectedOnboardingEmployee(emp);
                  const res = await fetch(`/api/onboarding/${emp.id}`);
                  setOnboardingItems(await res.json());
                }}
                items={onboardingItems}
                onUpdateItem={async (id, status, value) => {
                  await fetch(`/api/onboarding/items/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status, value })
                  });
                  if (selectedOnboardingEmployee) {
                    const res = await fetch(`/api/onboarding/${selectedOnboardingEmployee.id}`);
                    setOnboardingItems(await res.json());
                  }
                }}
                onAddEmployee={() => setIsAddModalOpen(true)}
              />
            )}

            {activeTab === 'recruitment' && (
              <RecruitmentView 
                jobPostings={jobPostings}
                onNewJob={() => setIsJobModalOpen(true)}
                onOnboardCandidate={(candidate) => {
                  setActiveTab('onboarding');
                  // In a real app, we'd create the employee record first
                }}
              />
            )}

            {activeTab === 'tasks' && (
              <motion.div 
                key="tasks"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">Automated Workflows</h3>
                  <div className="flex gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                      <Clock size={14} /> {tasks.filter(t => t.status === 'pending').length} Pending
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                      <CheckCircle2 size={14} /> {tasks.filter(t => t.status === 'completed').length} Completed
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tasks.map((task) => (
                    <div key={task.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-2 rounded-lg ${
                          task.type === 'IT' ? 'bg-blue-50 text-blue-600' : 
                          task.type === 'Payroll' ? 'bg-emerald-50 text-emerald-600' : 
                          'bg-purple-50 text-purple-600'
                        }`}>
                          <FileText size={20} />
                        </div>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm mb-1">{task.description}</h4>
                      <p className="text-xs text-slate-500 mb-4">Target: {task.employee_email}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <span className="text-[10px] text-slate-400">{new Date(task.created_at).toLocaleDateString()}</span>
                        <button className="text-xs font-semibold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          Mark Done
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'approvals' && (
              <motion.div 
                key="approvals"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard 
                    label="Pending Approvals" 
                    value={approvalStats.pending} 
                    icon={<Clock className="text-amber-600" size={20} />}
                    color="bg-amber-50"
                  />
                  <StatCard 
                    label="Approved Leave" 
                    value={approvalStats.approvedLeave} 
                    icon={<CheckCircle2 className="text-emerald-600" size={20} />}
                    color="bg-emerald-50"
                  />
                  <StatCard 
                    label="Total Requests" 
                    value={approvalStats.total} 
                    icon={<ClipboardList className="text-indigo-600" size={20} />}
                    color="bg-indigo-50"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Requires Attention</h3>
                  <button className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors">
                    View All Activity
                  </button>
                </div>
                
                {approvals.filter(a => a.status === 'pending').length === 0 ? (
                  <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                      <ShieldCheck size={24} />
                    </div>
                    <p className="text-slate-500 font-medium">No requests require attention at the moment.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {approvals.filter(a => a.status === 'pending').map((app) => {
                      const details = JSON.parse(app.details);
                      return (
                        <div key={app.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-indigo-200 transition-all">
                          <div className="flex gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                              app.type === 'LEAVE_REQUEST' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                              {app.type === 'CREATE_EMPLOYEE' ? <UserPlus size={24} /> : 
                               app.type === 'LEAVE_REQUEST' ? <Clock size={24} /> : <LogOut size={24} />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-slate-900">
                                  {app.type === 'CREATE_EMPLOYEE' ? 'New Hire Onboarding' : 
                                   app.type === 'LEAVE_REQUEST' ? 'Leave Request' : 'Employee Offboarding'}
                                </h4>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">#{app.id}</span>
                              </div>
                              <p className="text-sm text-slate-600 mb-2">
                                {app.type === 'CREATE_EMPLOYEE' 
                                  ? `Request to add ${details.name} (${details.role}) to ${details.department}.`
                                  : app.type === 'LEAVE_REQUEST'
                                  ? `${details.employee} requested ${details.days} days for ${details.reason}.`
                                  : `Request to offboard ${details.email}.`}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-slate-400">
                                <span className="flex items-center gap-1"><Clock size={12} /> {new Date(app.created_at).toLocaleString()}</span>
                                <span className="flex items-center gap-1"><Users size={12} /> Requested by {app.requested_by}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleApproval(app.id, 'rejected')}
                              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all flex items-center gap-2"
                            >
                              <XCircle size={18} /> Reject
                            </button>
                            <button 
                              onClick={() => handleApproval(app.id, 'approved')}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm shadow-indigo-200"
                            >
                              <CheckCircle2 size={18} /> Approve
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'compliance' && <ComplianceView />}
          </AnimatePresence>
        </div>
      </main>

      {/* Modals */}
      <AddEmployeeModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSubmit={handleAddEmployee} 
      />

      <EmployeeProfileModal 
        employee={selectedEmployeeProfile} 
        onClose={() => setSelectedEmployeeProfile(null)} 
      />

      <JobPostingModal 
        isOpen={isJobModalOpen} 
        onClose={() => setIsJobModalOpen(false)} 
        onSubmit={(data) => {
          setJobPostings(prev => [...prev, { ...data, id: prev.length + 1, applicants: 0, status: 'Open' }]);
          setIsJobModalOpen(false);
        }}
      />

      <AdminSettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentName={adminName}
        onSave={(newName) => {
          setAdminName(newName);
          setIsSettingsModalOpen(false);
        }}
      />
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string, value: number, icon: React.ReactNode, color: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${color}`}>
          {icon}
        </div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stats</span>
      </div>
      <h4 className="text-3xl font-bold text-slate-900 mb-1">{value}</h4>
      <p className="text-sm text-slate-500 font-medium">{label}</p>
    </div>
  );
}

function AddEmployeeModal({ isOpen, onClose, onSubmit }: { isOpen: boolean, onClose: () => void, onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    department: '',
    join_date: new Date().toISOString().split('T')[0]
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-bold">Add New Employee</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XCircle size={24} />
          </button>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
            <input 
              required
              type="text" 
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
            <input 
              required
              type="email" 
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Role</label>
              <input 
                required
                type="text" 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Department</label>
              <input 
                required
                type="text" 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Join Date</label>
            <input 
              required
              type="date" 
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={formData.join_date}
              onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
            />
          </div>
          
          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              Add Employee
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function OnboardingView({ employees, selectedEmployee, onSelectEmployee, items, onUpdateItem, onAddEmployee }: any) {
  const categories = ['Documents Collection', 'Account & System Setup', 'Personal Forms & Agreements'];
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Documents Collection']);
  
  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const getProgress = () => {
    if (items.length === 0) return 0;
    const completed = items.filter((i: any) => i.status === 'submitted' || i.status === 'generated' || i.status === 'completed').length;
    return Math.round((completed / items.length) * 100);
  };

  const [viewingDoc, setViewingDoc] = useState<any>(null);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {viewingDoc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-4xl h-full max-h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800">Document Viewer: {viewingDoc.label}</h3>
              <button onClick={() => setViewingDoc(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle size={24} />
              </button>
            </div>
            <div className="flex-1 bg-slate-200 p-8 flex items-center justify-center overflow-auto">
              <div className="bg-white shadow-lg p-12 w-full max-w-2xl aspect-[1/1.4] flex flex-col items-center justify-center text-center space-y-4">
                <FileText size={64} className="text-indigo-600" />
                <h4 className="text-xl font-bold text-slate-900">{viewingDoc.label}</h4>
                <p className="text-slate-500 max-w-sm">This is a secure preview of the submitted document for {selectedEmployee?.name}. In a production environment, this would display the actual PDF or image file.</p>
                <div className="pt-8 w-full border-t border-slate-100">
                  <p className="text-xs text-slate-400 font-mono uppercase tracking-widest">Digital Signature Verified</p>
                  <p className="text-[10px] text-slate-300 font-mono">HASH: 8f2d9e1a4c5b6d7e8f9a0b1c2d3e4f5g</p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setViewingDoc(null)}
                className="px-6 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  alert(`Downloading ${viewingDoc.label}...`);
                  setViewingDoc(null);
                }}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
              >
                Download Document
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Onboarding Management</h3>
        <button 
          onClick={onAddEmployee}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <UserPlus size={16} /> Add New Employee
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Employee List */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm h-fit">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h4 className="text-xs font-bold text-slate-500 uppercase">Onboarding Queue</h4>
          </div>
          <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
            {employees.map((emp: any) => (
              <button 
                key={emp.id}
                onClick={() => onSelectEmployee(emp)}
                className={`w-full p-4 text-left hover:bg-slate-50 transition-colors flex items-center gap-3 ${selectedEmployee?.id === emp.id ? 'bg-indigo-50/50 border-l-4 border-indigo-600' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                  {emp.name.split(' ').map((n: any) => n[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-semibold">{emp.name}</p>
                  <p className="text-xs text-slate-500">{emp.role}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Progress View */}
        <div className="lg:col-span-3 space-y-6">
          {!selectedEmployee ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-20 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Users size={32} />
              </div>
              <h4 className="text-lg font-semibold text-slate-900">Select an employee</h4>
              <p className="text-slate-500 text-sm">Choose an employee from the queue to view and manage their onboarding progress.</p>
            </div>
          ) : (
            <>
              {/* Overall Progress */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-bold">{selectedEmployee.name}</h4>
                    <p className="text-sm text-slate-500">{selectedEmployee.role} • {selectedEmployee.department}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-indigo-600">{getProgress()}%</p>
                    <p className="text-xs font-bold text-slate-400 uppercase">Overall Progress</p>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${getProgress()}%` }}
                    className="bg-indigo-600 h-full"
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-4">
                {categories.map(cat => (
                  <div key={cat} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <button 
                      onClick={() => toggleCategory(cat)}
                      className="w-full p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between hover:bg-slate-100 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`transition-transform duration-200 ${expandedCategories.includes(cat) ? 'rotate-0' : '-rotate-90'}`}>
                          <ChevronDown size={18} className="text-slate-400 group-hover:text-indigo-600" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-700">{cat}</h4>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase bg-white px-2 py-1 rounded-full border border-slate-100">
                          {items.filter((i: any) => i.category === cat && (i.status === 'submitted' || i.status === 'generated' || i.status === 'completed')).length} / {items.filter((i: any) => i.category === cat).length} Done
                        </span>
                      </div>
                    </button>
                    
                    <AnimatePresence initial={false}>
                      {expandedCategories.includes(cat) && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                        >
                          <div className="divide-y divide-slate-50">
                            {items.filter((i: any) => i.category === cat).length === 0 ? (
                              <div className="p-8 text-center text-slate-400 italic text-sm">
                                No items found in this category.
                              </div>
                            ) : (
                              items.filter((i: any) => i.category === cat).map((item: any) => (
                                <OnboardingItem 
                                  key={item.id} 
                                  item={item} 
                                  onUpdate={(status: string, value: string) => onUpdateItem(item.id, status, value)} 
                                  onViewDoc={() => setViewingDoc(item)}
                                />
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              {/* Checklist Overview */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="font-bold mb-4">Task Checklist Overview</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <h5 className="text-xs font-bold text-emerald-700 uppercase mb-2">All tasks finished</h5>
                    <ul className="space-y-2">
                      {items.filter((i: any) => i.status === 'submitted' || i.status === 'generated' || i.status === 'completed').map((i: any) => (
                        <li key={i.id} className="text-sm text-emerald-800 flex items-center justify-between group">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={14} /> {i.label}
                          </div>
                          <button 
                            onClick={() => onUpdateItem(i.id, i.category === 'Documents Collection' ? 'pending' : i.category === 'Account & System Setup' ? 'not generated' : 'pending', i.value)}
                            className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 opacity-0 group-hover:opacity-100 transition-opacity uppercase"
                          >
                            Revert
                          </button>
                        </li>
                      ))}
                      {items.filter((i: any) => i.status === 'submitted' || i.status === 'generated' || i.status === 'completed').length === 0 && (
                        <p className="text-xs text-emerald-600 italic">No tasks completed yet.</p>
                      )}
                    </ul>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">No task completed yet</h5>
                    <ul className="space-y-2">
                      {items.filter((i: any) => i.status !== 'submitted' && i.status !== 'generated' && i.status !== 'completed').map((i: any) => (
                        <li key={i.id} className="text-sm text-slate-600 flex items-center justify-between group">
                          <div className="flex items-center gap-2">
                            <Clock size={14} /> {i.label}
                          </div>
                          <button 
                            onClick={() => onUpdateItem(i.id, i.category === 'Documents Collection' ? 'submitted' : i.category === 'Account & System Setup' ? 'generated' : 'completed', i.value)}
                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 opacity-0 group-hover:opacity-100 transition-opacity uppercase"
                          >
                            Mark Done
                          </button>
                        </li>
                      ))}
                      {items.filter((i: any) => i.status !== 'submitted' && i.status !== 'generated' && i.status !== 'completed').length === 0 && (
                        <p className="text-xs text-slate-500 italic">All tasks finished!</p>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function OnboardingItem({ item, onUpdate, onViewDoc }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(item.value || '');

  const getStatusOptions = () => {
    if (item.category === 'Documents Collection') return ['pending', 'submitted'];
    if (item.category === 'Account & System Setup') return ['not generated', 'generated'];
    return ['pending', 'completed'];
  };

  const isCompleted = item.status === 'submitted' || item.status === 'generated' || item.status === 'completed';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
      case 'generated':
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'pending':
      case 'not generated':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  // Mock content for Account & System Setup and Personal Forms
  const getMockContent = () => {
    if (item.value) return item.value;
    if (item.status === 'generated' || item.status === 'completed') {
      if (item.label.includes('Email')) return 'emp.name@company.com';
      if (item.label.includes('ID')) return 'EMP-2024-001';
      if (item.label.includes('Slack')) return '@emp.name';
      if (item.label.includes('Salesforce')) return 'SF-LICENSE-ACTIVE';
      if (item.category === 'Personal Forms & Agreements') return 'Signed & Verified';
    }
    return null;
  };

  const displayValue = getMockContent();

  return (
    <div className={`p-4 flex items-center justify-between group transition-all ${isCompleted ? 'bg-emerald-50/10' : 'hover:bg-slate-50/50'}`}>
      <div className="flex-1 flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
          isCompleted ? 'bg-emerald-100 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-400'
        }`}>
          {item.category === 'Documents Collection' ? (
            isCompleted ? <FileCheck size={20} /> : <FileWarning size={20} />
          ) : (
            isCompleted ? <CheckCircle2 size={20} /> : <Clock size={20} />
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-0.5">
            <p className={`text-sm font-semibold ${isCompleted ? 'text-slate-900' : 'text-slate-600'}`}>{item.label}</p>
            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-tighter border ${getStatusBadge(item.status)}`}>
              {item.status}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {displayValue && !isEditing && (
              <p className="text-xs text-indigo-600 font-mono font-medium">{displayValue}</p>
            )}
            
            {(item.category === 'Documents Collection' || item.category === 'Personal Forms & Agreements') && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={onViewDoc}
                  className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  <Eye size={12} /> View Document
                </button>
                {item.status === 'submitted' && (
                  <button 
                    onClick={() => alert(`Downloading ${item.label}...`)}
                    className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    <FileText size={12} /> Download
                  </button>
                )}
              </div>
            )}
          </div>

          {isEditing && (
            <div className="flex gap-2 mt-2">
              <input 
                type="text" 
                value={val}
                onChange={(e) => setVal(e.target.value)}
                placeholder="Enter details..."
                className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full max-w-xs"
              />
              <button 
                onClick={() => { onUpdate(item.status, val); setIsEditing(false); }}
                className="text-[10px] font-bold text-white bg-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Save
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button 
          onClick={() => {
            const newStatus = isCompleted 
              ? (item.category === 'Documents Collection' ? 'pending' : item.category === 'Account & System Setup' ? 'not generated' : 'pending')
              : (item.category === 'Documents Collection' ? 'submitted' : item.category === 'Account & System Setup' ? 'generated' : 'completed');
            onUpdate(newStatus, item.value);
          }}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${
            isCompleted 
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-100' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {isCompleted ? <CheckCircle2 size={14} /> : <Clock size={14} />}
          {isCompleted ? 'Submitted' : 'Mark Submitted'}
        </button>

        <select 
          value={item.status}
          onChange={(e) => onUpdate(e.target.value, item.value)}
          className="text-[11px] font-semibold bg-white border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
        >
          {getStatusOptions().map(opt => (
            <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
          ))}
        </select>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className={`p-1.5 rounded-lg transition-colors ${isEditing ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-100 hover:text-indigo-600'}`}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick, count }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void, count?: number }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
        active 
          ? 'bg-indigo-50 text-indigo-700 font-semibold' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      {count !== undefined && count > 0 && (
        <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
          {count}
        </span>
      )}
    </button>
  );
}

function SuggestionCard({ text, onClick }: { text: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="text-left p-3 rounded-xl border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
    >
      <p className="text-xs font-medium text-slate-600 group-hover:text-indigo-700">{text}</p>
    </button>
  );
}

function EmployeeProfileModal({ employee, onClose }: { employee: Employee | null, onClose: () => void }) {
  if (!employee) return null;

  const mockSkills = employee.skills || ['React', 'TypeScript', 'Tailwind CSS', 'Node.js', 'Project Management'];
  const mockBio = employee.bio || "A highly motivated and detail-oriented professional with over 5 years of experience in their field. Proven track record of delivering high-quality results and leading successful teams.";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header/Cover */}
        <div className="h-32 bg-indigo-600 relative shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors">
            <XCircle size={24} />
          </button>
        </div>
        
        <div className="px-8 pb-8 -mt-12 relative flex-1 overflow-y-auto">
          <div className="flex items-end justify-between mb-8">
            <div className="w-24 h-24 rounded-3xl bg-white p-1 shadow-xl">
              <div className="w-full h-full rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-3xl font-bold">
                {employee.name.split(' ').map(n => n[0]).join('')}
              </div>
            </div>
            <div className="flex gap-3 pb-2">
              <button className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                Edit Profile
              </button>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                Send Message
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{employee.name}</h3>
                <p className="text-slate-500 font-medium">{employee.role} • {employee.department}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">About</h4>
                <p className="text-sm text-slate-600 leading-relaxed">{mockBio}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Skills & Expertise</h4>
                <div className="flex flex-wrap gap-2">
                  {mockSkills.map(skill => (
                    <span key={skill} className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold border border-slate-100">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contact Info</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 border border-slate-100">
                      <FileText size={16} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Email</p>
                      <p className="text-xs font-bold text-slate-900 truncate">{employee.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 border border-slate-100">
                      <Clock size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Joined</p>
                      <p className="text-xs font-bold text-slate-900">{employee.join_date}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Status</h4>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border bg-white ${
                  employee.status === 'active' ? 'text-emerald-600 border-emerald-100' : 'text-blue-600 border-blue-100'
                }`}>
                  {employee.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function JobPostingModal({ isOpen, onClose, onSubmit }: { isOpen: boolean, onClose: () => void, onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    type: 'Full-time',
    description: ''
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="text-xl font-bold text-slate-900">Create New Job Posting</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XCircle size={24} />
          </button>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="p-8 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Job Title</label>
            <input 
              required
              type="text" 
              placeholder="e.g. Senior Product Designer"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Department</label>
              <input 
                required
                type="text" 
                placeholder="e.g. Engineering"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Job Type</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
                <option>Internship</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
            <textarea 
              rows={4}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Describe the role and requirements..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          
          <div className="pt-4 flex gap-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              Post Job
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function RecruitmentView({ onOnboardCandidate, onNewJob, jobPostings }: { onOnboardCandidate: (candidate: any) => void, onNewJob: () => void, jobPostings: any[] }) {
  const [candidates, setCandidates] = useState([
    { id: 1, name: 'Sarah Miller', role: 'Senior Frontend Engineer', stage: 'Interview', score: 92, email: 'sarah.m@example.com', source: 'LinkedIn', applied_date: '2024-03-01' },
    { id: 2, name: 'James Wilson', role: 'Product Manager', stage: 'Screening', score: 78, email: 'j.wilson@example.com', source: 'Referral', applied_date: '2024-03-05' },
    { id: 3, name: 'Elena Rodriguez', role: 'UX Designer', stage: 'Offer', score: 88, email: 'elena.r@example.com', source: 'Indeed', applied_date: '2024-02-28' },
    { id: 4, name: 'David Chen', role: 'Backend Developer', stage: 'Technical Test', score: 85, email: 'd.chen@example.com', source: 'LinkedIn', applied_date: '2024-03-02' },
  ]);

  const [hiredCandidate, setHiredCandidate] = useState<any>(null);

  const stages = ['Screening', 'Technical Test', 'Interview', 'Offer', 'Hired'];

  const handleHire = (candidate: any) => {
    setCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, stage: 'Hired' } : c));
    setHiredCandidate(candidate);
    
    // Trigger confetti
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Screening': return 'bg-slate-100 text-slate-600';
      case 'Technical Test': return 'bg-blue-100 text-blue-600';
      case 'Interview': return 'bg-purple-100 text-purple-600';
      case 'Offer': return 'bg-amber-100 text-amber-600';
      case 'Hired': return 'bg-emerald-100 text-emerald-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold">Recruitment & ATS</h3>
          <p className="text-sm text-slate-500">Manage your hiring pipeline and AI-assisted candidate screening.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors">
            <Filter size={16} /> Filter
          </button>
          <button 
            onClick={onNewJob}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Plus size={16} /> New Job Posting
          </button>
        </div>
      </div>

      {/* Pipeline Overview */}
      <div className="grid grid-cols-5 gap-4">
        {stages.map(stage => (
          <div key={stage} className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stage}</h4>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {candidates.filter(c => c.stage === stage).length}
              </span>
            </div>
            <div className="space-y-3 min-h-[200px] p-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              {candidates.filter(c => c.stage === stage).map(candidate => (
                <div key={candidate.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                      {candidate.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <button className="text-slate-300 hover:text-slate-600">
                      <MoreVertical size={14} />
                    </button>
                  </div>
                  <h5 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{candidate.name}</h5>
                  <p className="text-[11px] text-slate-500 mb-3">{candidate.role}</p>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-amber-400 fill-amber-400" />
                      <span className="text-xs font-bold text-slate-700">{candidate.score}</span>
                    </div>
                    <div className="flex -space-x-1">
                      <div className="w-5 h-5 rounded-full border-2 border-white bg-slate-200" />
                      <div className="w-5 h-5 rounded-full border-2 border-white bg-slate-300" />
                    </div>
                  </div>
                </div>
              ))}
              {stage === 'Offer' && candidates.filter(c => c.stage === stage).length > 0 && (
                <div className="pt-2 space-y-2">
                  <button 
                    onClick={() => handleHire(candidates.find(c => c.stage === 'Offer'))}
                    className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-indigo-100"
                  >
                    <UserCheck size={14} /> Hire Candidate
                  </button>
                  <button 
                    onClick={() => onOnboardCandidate(candidates.find(c => c.stage === 'Offer'))}
                    className="w-full py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <UserPlus size={14} /> Onboard Candidate
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {hiredCandidate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 40 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden text-center p-8"
            >
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Star size={40} className="fill-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">New Candidate Hired!</h3>
              <p className="text-slate-500 mb-8">Congratulations! You've successfully added a new member to the team.</p>
              
              <div className="bg-slate-50 rounded-2xl p-6 mb-8 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase">Employee</span>
                  <span className="text-sm font-bold text-slate-900">{hiredCandidate.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase">Role</span>
                  <span className="text-sm font-bold text-slate-900">{hiredCandidate.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase">Email</span>
                  <span className="text-sm font-bold text-slate-900">{hiredCandidate.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase">Match Score</span>
                  <span className="text-sm font-bold text-emerald-600">{hiredCandidate.score}%</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setHiredCandidate(null)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    onOnboardCandidate(hiredCandidate);
                    setHiredCandidate(null);
                  }}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                  Start Onboarding
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Job Postings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h4 className="font-bold text-slate-900">Active Job Postings</h4>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{jobPostings.length} Total</span>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Job Title</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Applicants</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {jobPostings.map((job) => (
              <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm font-bold text-slate-900">{job.title}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{job.department}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{job.type}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{job.applicants}</td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border bg-emerald-50 text-emerald-700 border-emerald-100">
                    {job.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-slate-400 hover:text-indigo-600">
                    <MoreVertical size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AI Screening Insights */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">AI Screening Insights</h4>
              <p className="text-xs text-slate-500">Automated resume analysis and candidate matching.</p>
            </div>
          </div>
          <button className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
            View Full Report <ArrowUpRight size={14} />
          </button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Top Matches This Week</h5>
              <div className="space-y-3">
                {candidates.sort((a, b) => b.score - a.score).slice(0, 2).map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                        {c.score}%
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{c.name}</p>
                        <p className="text-xs text-slate-500">{c.role}</p>
                      </div>
                    </div>
                    <button className="text-xs font-bold text-indigo-600 px-3 py-1.5 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                      View Profile
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Screening Summary</h5>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-2xl font-bold text-slate-900">124</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Resumes Scanned</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-2xl font-bold text-indigo-600">12</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">High Matches</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-3">
                <Clock size={16} className="text-amber-600 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-800">AI Suggestion</p>
                  <p className="text-[11px] text-amber-700">"Sarah Miller's technical score is 15% higher than the average for the Senior Frontend role. Recommend fast-tracking to final interview."</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AdminSettingsModal({ isOpen, onClose, currentName, onSave }: { isOpen: boolean, onClose: () => void, currentName: string, onSave: (name: string) => void }) {
  const [name, setName] = useState(currentName);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="text-xl font-bold text-slate-900">Admin Settings</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XCircle size={24} />
          </button>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); onSave(name); }} className="p-8 space-y-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Display Name</label>
            <input 
              required
              type="text" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-start gap-3">
            <ShieldCheck size={18} className="text-indigo-600 mt-0.5" />
            <p className="text-xs text-indigo-700 leading-relaxed">
              Changing your display name will update how you appear to other users and in the AI assistant logs.
            </p>
          </div>
          
          <div className="pt-2 flex gap-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              Save Changes
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function ComplianceView() {
  const complianceStats = [
    { label: 'Overall Compliance', value: '94%', color: 'text-emerald-600', icon: <ShieldCheck className="text-emerald-600" /> },
    { label: 'Pending Audits', value: '3', color: 'text-amber-600', icon: <Clock className="text-amber-600" /> },
    { label: 'Risk Alerts', value: '2', color: 'text-red-600', icon: <AlertTriangle className="text-red-600" /> },
    { label: 'Policy Updates', value: '12', color: 'text-indigo-600', icon: <FileText className="text-indigo-600" /> },
  ];

  const risks = [
    { id: 1, title: 'GDPR Data Retention', severity: 'High', status: 'In Review', department: 'IT', date: '2024-03-15' },
    { id: 2, title: 'Annual Safety Training', severity: 'Medium', status: 'Pending', department: 'Operations', date: '2024-03-20' },
    { id: 3, title: 'Equal Opportunity Audit', severity: 'Low', status: 'Completed', department: 'HR', date: '2024-03-01' },
  ];

  const policies = [
    { id: 1, name: 'Remote Work Policy', version: 'v2.4', lastAudit: '2024-01-10', status: 'Compliant' },
    { id: 2, name: 'Code of Conduct', version: 'v3.1', lastAudit: '2023-12-05', status: 'Compliant' },
    { id: 3, name: 'Data Privacy Policy', version: 'v4.0', lastAudit: '2024-02-28', status: 'Needs Review' },
    { id: 4, name: 'Anti-Harassment Policy', version: 'v2.0', lastAudit: '2023-11-15', status: 'Compliant' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {complianceStats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-slate-50 rounded-lg">
                {stat.icon}
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Status</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Alerts */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert size={18} className="text-red-500" />
              Risk Alerts
            </h3>
            <button className="text-xs font-bold text-indigo-600 hover:underline">View All</button>
          </div>
          <div className="p-6 space-y-4">
            {risks.map(risk => (
              <div key={risk.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer group">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                    risk.severity === 'High' ? 'bg-red-50 text-red-700 border-red-100' :
                    risk.severity === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                    'bg-blue-50 text-blue-700 border-blue-100'
                  }`}>
                    {risk.severity} Risk
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">{risk.date}</span>
                </div>
                <h4 className="font-semibold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">{risk.title}</h4>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Briefcase size={12} /> {risk.department}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock size={12} /> {risk.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Policy Audit Status */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Gavel size={18} className="text-indigo-600" />
              Policy Governance
            </h3>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2">
              <Plus size={14} /> New Audit
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Policy Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Version</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Audit</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {policies.map(policy => (
                  <tr key={policy.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <FileText size={16} />
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{policy.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{policy.version}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{policy.lastAudit}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                        policy.status === 'Compliant' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {policy.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-6 bg-slate-50 border-t border-slate-100">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500">
                <span className="font-bold text-slate-700">3 Compliance Officers</span> are currently monitoring these policies.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SignInPage({ onSignIn }: { onSignIn: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simple mock authentication
    setTimeout(() => {
      if (username === 'admin' && password === 'password') {
        onSignIn();
      } else {
        setError('Invalid username or password. Hint: admin / password');
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-50" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden relative z-10"
      >
        <div className="p-8 pb-0 flex flex-col items-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 mb-6">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome to HR Pulse</h1>
          <p className="text-slate-500 text-sm mt-2">Sign in to access your administrative dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl flex items-center gap-2"
            >
              <XCircle size={14} />
              {error}
            </motion.div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Username</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <User size={18} />
              </div>
              <input 
                required
                type="text" 
                placeholder="Enter username"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock size={18} />
              </div>
              <input 
                required
                type="password" 
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-xs text-slate-500 font-medium">Remember me</span>
            </label>
            <button type="button" className="text-xs font-bold text-indigo-600 hover:underline">Forgot password?</button>
          </div>

          <button 
            disabled={isLoading}
            type="submit"
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 group disabled:opacity-70"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                Sign In
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Don't have an account? <button className="font-bold text-indigo-600 hover:underline">Contact IT Support</button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

