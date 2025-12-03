import React, { useState } from 'react';
import { User, Unit } from '../types';
import { ShieldCheck, User as UserIcon, LayoutDashboard, ChevronRight, Lock, X } from 'lucide-react';
import { DEFAULT_ADMIN_PASSWORD } from '../constants';

interface LoginProps {
  onLogin: (user: User) => void;
  units: Unit[];
}

const Login: React.FC<LoginProps> = ({ onLogin, units }) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<{ type: 'ADMIN' | 'UNIT', id?: string, name?: string } | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleUnitClick = (unit: Unit) => {
    setSelectedTarget({ type: 'UNIT', id: unit.id, name: unit.shortName });
    setPasswordInput('');
    setErrorMsg('');
    setShowPasswordModal(true);
  };

  const handleAdminClick = () => {
    setSelectedTarget({ type: 'ADMIN', name: 'J1 Admin' });
    setPasswordInput('');
    setErrorMsg('');
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTarget) return;

    if (selectedTarget.type === 'ADMIN') {
        if (passwordInput === DEFAULT_ADMIN_PASSWORD) {
            onLogin({ username: 'J1Admin', role: 'ADMIN' });
        } else {
            setErrorMsg('รหัสผ่านไม่ถูกต้อง');
        }
    } 
    else if (selectedTarget.type === 'UNIT' && selectedTarget.id) {
        const unit = units.find(u => u.id === selectedTarget.id);
        if (unit) {
            const correctPassword = unit.password || '123';
            if (passwordInput === correctPassword) {
                onLogin({ username: unit.username, role: 'USER', unitId: unit.id });
            } else {
                setErrorMsg('รหัสผ่านไม่ถูกต้อง');
            }
        } else {
             setErrorMsg('ไม่พบข้อมูลหน่วยงาน');
        }
    }
  };

  const closeModal = () => {
    setShowPasswordModal(false);
    setSelectedTarget(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4 py-8">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-2xl border-t-4 border-blue-600">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-700 rounded-full mb-4 shadow-inner">
            <ShieldCheck className="w-10 h-10 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">ระบบติดตามผลการดำเนินการ</h1>
          <p className="text-orange-500 text-sm mt-1">นโยบายด้านกำลังพล 2569</p>
        </div>

        <div className="space-y-4">
          <div className="text-center mb-2">
            <h2 className="text-lg font-semibold text-gray-300">เข้าใช้งานระบบ</h2>
            <p className="text-xs text-gray-500">เลือกหน่วยงานของท่านเพื่อยืนยันตัวตน</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
             {/* Admin Button */}
             <button
              onClick={handleAdminClick}
              className="w-full flex items-center justify-between p-4 bg-blue-700 text-white rounded-lg hover:bg-blue-600 transition shadow-md group border border-transparent hover:scale-[1.01]"
            >
              <div className="flex items-center">
                <div className="bg-white/20 p-2 rounded-full mr-4 group-hover:bg-white/30">
                  <LayoutDashboard size={24} />
                </div>
                <div className="text-left">
                  <div className="font-bold text-lg">ผู้ดูแลภาพรวม (J1 Admin)</div>
                  <div className="text-blue-100 text-sm">สำหรับติดตามและดูสรุปผล</div>
                </div>
              </div>
              <ChevronRight className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition" />
            </button>

            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-700"></div>
                <span className="flex-shrink-0 mx-4 text-gray-500 text-xs uppercase tracking-wider">หน่วยงานที่รับผิดชอบ</span>
                <div className="flex-grow border-t border-gray-700"></div>
            </div>

            {/* Unit Buttons */}
            {units.map((unit) => (
              <button
                key={unit.id}
                onClick={() => handleUnitClick(unit)}
                className="w-full flex items-center justify-between p-4 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 hover:border-blue-500 transition shadow-sm group text-left hover:scale-[1.01]"
              >
                <div className="flex items-center">
                    <div className="bg-gray-800 p-2 rounded-full mr-4 group-hover:bg-gray-900 group-hover:text-blue-500 transition-colors">
                    <UserIcon size={24} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <div>
                    <div className="font-bold text-gray-200 group-hover:text-white transition-colors">{unit.shortName}</div>
                    <div className="text-gray-400 text-xs group-hover:text-gray-300 transition-colors">{unit.name}</div>
                    </div>
                </div>
                <ChevronRight className="text-gray-500 group-hover:text-blue-400 group-hover:translate-x-1 transition" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && selectedTarget && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-sm p-6 relative border border-gray-700">
               <button 
                 onClick={closeModal} 
                 className="absolute top-4 right-4 text-gray-500 hover:text-gray-300"
               >
                 <X size={20} />
               </button>

               <div className="text-center mb-6">
                 <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-500">
                    <Lock size={32} />
                 </div>
                 <h3 className="text-xl font-bold text-white">ยืนยันรหัสผ่าน</h3>
                 <p className="text-sm text-gray-400 mt-1">
                    กรุณากรอกรหัสผ่านสำหรับ <span className="font-semibold text-blue-400">{selectedTarget.name}</span>
                 </p>
               </div>

               <form onSubmit={handlePasswordSubmit}>
                  <div className="mb-4">
                     <input 
                        type="password"
                        autoFocus
                        placeholder="กรอกรหัสผ่าน..."
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className={`w-full text-center text-lg bg-gray-900 text-white border-2 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${errorMsg ? 'border-red-500 bg-red-900/20' : 'border-gray-600'}`}
                     />
                     {errorMsg && (
                        <p className="text-red-500 text-xs text-center mt-2 font-semibold">{errorMsg}</p>
                     )}
                  </div>
                  
                  <button 
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow transition transform active:scale-95"
                  >
                     เข้าสู่ระบบ
                  </button>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};

export default Login;