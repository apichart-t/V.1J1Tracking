import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { LayoutDashboard, PenTool, History, LogOut, Menu, Settings, Users, Server } from 'lucide-react';

// Firebase Imports (หัวใจสำคัญของ Realtime)
import { db } from './firebaseConfig'; 
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

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

// Service (ใช้เฉพาะบางตัวที่ไม่ได้ดึงจาก DB โดยตรง หรือจะเลิกใช้ก็ได้ถ้าเปลี่ยนมาใช้ Firebase หมด)
import { initializeProjects, cleanupTrash } from './services/storageService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'entry' | 'history' | 'projects' | 'units' | 'system'>('dashboard');
  
  // เปลี่ยน State เริ่มต้นเป็น Array ว่าง [] เพื่อรอรับข้อมูลจาก Firebase
  const [reports, setReports] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // ฟังก์ชันนี้ไม่ต้องทำงานหนักแล้ว เพราะ onSnapshot ทำให้เองอัตโนมัติ
  // แต่ยังคงไว้เพื่อให้ส่งเป็น Props ไปยัง Child Components ไม่ให้ error
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

  // --- Realtime Listeners (พระเอกของเรา) ---
  useEffect(() => {
    initializeProjects(); 
    cleanupTrash();

    // 1. ดักฟัง Reports (ข้อมูลรายงาน)
    const unsubReports = onSnapshot(collection(db, "reports"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // แปลงข้อมูล Timestamp ถ้าจำเป็น หรือจัดการ Sort ที่นี่
      setReports(data);
    });

    // 2. ดักฟัง Projects (โครงการ)
    const unsubProjects = onSnapshot(collection(db, "projects"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(data);
    });

    // 3. ดักฟัง Units (หน่วยงาน)
    const unsubUnits = onSnapshot(collection(db, "units"),
