import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { LayoutDashboard, PenTool, History, LogOut, Menu, Settings, Users, Server } from 'lucide-react';

// แก้ไขบรรทัดนี้ให้ถูกต้อง
import { db } from './firebaseConfig'; 
import { collection, onSnapshot } from 'firebaseConfig';
import Login from './components/Login';
import EntryForm from './components/EntryForm';
import ReportHistory from './components/ReportHistory';
import Dashboard from './components/Dashboard';
import ProjectManager from './components/ProjectManager';
import UnitManager from './components/UnitManager';
import SystemManager from './components/SystemManager';
import Toast, { ToastMessage, ToastType } from './components/Toast';
import { User } from './types';
import { getReports, getProjects, getUnits, getProjectGroups, initializeProjects, cleanupTrash } from './services/storageService';



const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'entry' | 'history' | 'projects' | 'units' | 'system'>('dashboard');
  const [reports, setReports] = useState(getReports());
  const [projects, setProjects] = useState(getProjects());
  const [units, setUnits] = useState(getUnits());
  const [groups, setGroups] = useState(getProjectGroups());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const refreshData = () => {
    setReports(getReports());
    setProjects(getProjects());
    setUnits(getUnits());
    setGroups(getProjectGroups());
  };

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = uuidv4();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
        dismissToast(id);
    }, 3000);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    initializeProjects(); 
    cleanupTrash();
    refreshData();
  }, []);

  useEffect(() => {
    if (user && user.role === 'USER') {
       const unitStillExists = units.find(u => u.id === user.unitId);
       if (!unitStillExists) {
           setUser(null);
           alert("หน่วยงานของคุณถูกลบออกจากระบบ กรุณาติดต่อผู้ดูแลระบบ");
       }
    }
  }, [units, user]);

  if (!user) {
    return <Login onLogin={setUser} units={units} />;
  }

  const currentUnit = units.find(u => u.id === user.unitId);
  const unitName = currentUnit ? currentUnit.name : 'ส่วนกลาง (J1 Admin)';

  const activeProjects = projects.filter(p => !p.deletedAt);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard 
                  reports={reports} 
                  units={units} 
                  projects={activeProjects}
                  groups={groups} 
                  currentUserUnitId={user.unitId} 
               />;
      case 'entry':
        if (user.role === 'ADMIN') return <div className="p-8 text-center text-gray-500">Admin ไม่สามารถบันทึกข้อมูลได้</div>;
        if (!currentUnit) return null;
        return <EntryForm 
                  unit={currentUnit} 
                  projects={activeProjects}
                  groups={groups} 
                  onSuccess={() => {
                    refreshData();
                    showToast('บันทึกข้อมูลเรียบร้อยแล้ว', 'success');
                    setActiveTab('history');
                  }} 
                />;
      case 'history':
        return <ReportHistory 
                  reports={reports} 
                  units={units} 
                  projects={activeProjects}
                  groups={groups} 
                  currentUserUnitId={user.unitId}
                  onUpdate={() => {
                      refreshData();
                      showToast('ลบข้อมูลเรียบร้อยแล้ว', 'success');
                  }}
                />;
      case 'projects':
        if (user.role !== 'ADMIN') return <div className="p-8 text-center text-gray-500">เฉพาะ Admin เท่านั้น</div>;
        return <ProjectManager 
                  projects={projects}
                  units={units}
                  groups={groups}
                  onUpdate={refreshData}
                />;
      case 'units':
        if (user.role !== 'ADMIN') return <div className="p-8 text-center text-gray-500">เฉพาะ Admin เท่านั้น</div>;
        return <UnitManager 
                  units={units}
                  onUpdate={refreshData}
                />;
      case 'system':
        if (user.role !== 'ADMIN') return <div className="p-8 text-center text-gray-500">เฉพาะ Admin เท่านั้น</div>;
        return <SystemManager 
                  onUpdate={refreshData} 
                  showToast={showToast}
               />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-900/50">
               <span className="font-bold text-lg">J1</span>
             </div>
             <div>
               <h1 className="font-bold text-lg leading-tight hidden md:block text-white">ระบบติดตามผลการดำเนินการ <span className="text-orange-500">นโยบายกำลังพล 2569</span></h1>
               <p className="text-xs text-gray-400">{unitName}</p>
             </div>
          </div>
          
          <button className="md:hidden text-white hover:text-orange-500" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
             <Menu />
          </button>

          <nav className="hidden md:flex gap-1 items-center bg-gray-900/50 p-1 rounded-lg border border-gray-700">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3 py-2 rounded transition font-medium ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
            >
              <LayoutDashboard size={18} /> สรุปผล
            </button>
            {user.role === 'USER' && (
              <button 
                onClick={() => setActiveTab('entry')}
                className={`flex items-center gap-2 px-3 py-2 rounded transition font-medium ${activeTab === 'entry' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
              >
                <PenTool size={18} /> บันทึกข้อมูล
              </button>
            )}
            <button 
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3 py-2 rounded transition font-medium ${activeTab === 'history' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
            >
              <History size={18} /> ประวัติ
            </button>
            {user.role === 'ADMIN' && (
              <>
                <div className="w-px h-6 bg-gray-700 mx-1"></div>
                <button 
                    onClick={() => setActiveTab('projects')}
                    className={`flex items-center gap-2 px-3 py-2 rounded transition font-medium ${activeTab === 'projects' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                >
                    <Settings size={18} /> โครงการ
                </button>
                <button 
                    onClick={() => setActiveTab('units')}
                    className={`flex items-center gap-2 px-3 py-2 rounded transition font-medium ${activeTab === 'units' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                >
                    <Users size={18} /> หน่วยงาน
                </button>
                <button 
                    onClick={() => setActiveTab('system')}
                    className={`flex items-center gap-2 px-3 py-2 rounded transition font-medium ${activeTab === 'system' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                >
                    <Server size={18} /> ระบบ
                </button>
              </>
            )}
          </nav>
            
          <button onClick={() => setUser(null)} className="hidden md:flex items-center gap-2 text-red-400 hover:text-red-300 transition ml-4 border border-red-900/50 px-3 py-1.5 rounded bg-red-900/10 hover:bg-red-900/30">
             <LogOut size={16} /> <span className="text-sm">ออก</span>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-gray-800 border-t border-gray-700 p-4 space-y-2 text-gray-300">
            <button 
              onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
              className="w-full text-left py-2 px-4 rounded hover:bg-gray-700 flex items-center gap-2"
            >
              <LayoutDashboard size={18} /> สรุปผล
            </button>
            {user.role === 'USER' && (
              <button 
                onClick={() => { setActiveTab('entry'); setIsMobileMenuOpen(false); }}
                className="w-full text-left py-2 px-4 rounded hover:bg-gray-700 flex items-center gap-2"
              >
                <PenTool size={18} /> บันทึกข้อมูล
              </button>
            )}
            <button 
              onClick={() => { setActiveTab('history'); setIsMobileMenuOpen(false); }}
              className="w-full text-left py-2 px-4 rounded hover:bg-gray-700 flex items-center gap-2"
            >
              <History size={18} /> ประวัติ
            </button>
            {user.role === 'ADMIN' && (
              <>
                <button 
                    onClick={() => { setActiveTab('projects'); setIsMobileMenuOpen(false); }}
                    className="w-full text-left py-2 px-4 rounded hover:bg-gray-700 flex items-center gap-2"
                >
                    <Settings size={18} /> จัดการโครงการ
                </button>
                <button 
                    onClick={() => { setActiveTab('units'); setIsMobileMenuOpen(false); }}
                    className="w-full text-left py-2 px-4 rounded hover:bg-gray-700 flex items-center gap-2"
                >
                    <Users size={18} /> จัดการหน่วยงาน
                </button>
                 <button 
                    onClick={() => { setActiveTab('system'); setIsMobileMenuOpen(false); }}
                    className="w-full text-left py-2 px-4 rounded hover:bg-gray-700 flex items-center gap-2"
                >
                    <Server size={18} /> ระบบ
                </button>
              </>
            )}
            <button 
              onClick={() => setUser(null)}
              className="w-full text-left py-2 px-4 rounded text-red-400 hover:bg-red-900/30 flex items-center gap-2 mt-4 border-t border-gray-700 pt-4"
            >
              <LogOut size={18} /> ออกจากระบบ
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-grow">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 py-4 text-center text-sm text-gray-500">
         &copy; 2569 กองกำลังพลทหาร (กพ.ทหาร) - <span className="text-orange-500">ระบบติดตามผลการดำเนินการ</span>
      </footer>
    </div>
  );
};

export default App;
