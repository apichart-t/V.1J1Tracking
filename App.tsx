import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { LayoutDashboard, PenTool, History, LogOut, Menu, Settings, Users, Server } from 'lucide-react';

// Firebase Imports
import { db } from './firebaseConfig'; 
import { collection, onSnapshot } from 'firebase/firestore';

// Component Imports
import Login from './components/Login';
import EntryForm from './components/EntryForm';
import ReportHistory from './components/ReportHistory';
import Dashboard from './components/Dashboard';
import ProjectManager from './components/ProjectManager';
import UnitManager from './components/UnitManager';
import SystemManager from './components/SystemManager';
import Toast, { ToastMessage, ToastType } from './components/Toast';

// Types
import { User } from './types';

// Services
import { initializeProjects, cleanupTrash } from './services/storageService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'entry' | 'history' | 'projects' | 'units' | 'system'>('dashboard');
  
  // State สำหรับรับข้อมูล Realtime
  const [reports, setReports] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const refreshData = () => {
    console.log("Data auto-synced via Firestore listeners");
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

  // --- Realtime Listeners ---
  useEffect(() => {
    initializeProjects(); 
    cleanupTrash();

    // 1. ดักฟัง Reports
    const unsubReports = onSnapshot(collection(db, "reports"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReports(data);
    });

    // 2. ดักฟัง Projects
    const unsubProjects = onSnapshot(collection(db, "projects"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(data);
    });

    // 3. ดักฟัง Units
    const unsubUnits = onSnapshot(collection(db, "units"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUnits(data);
    });

    // 4. ดักฟัง Project Groups (ถ้ามี)
    // ถ้ายังไม่มี collection นี้ใน firebase มันจะคืนค่าว่างมา ไม่ error ครับ
    const unsubGroups = onSnapshot(collection(db, "project_
