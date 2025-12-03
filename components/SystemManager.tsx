import React, { useRef, useState } from 'react';
import { Download, Upload, Server, Activity, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { exportBackupData, importBackupData } from '../services/storageService';
import { runDiagnostics, TestResult } from '../utils/diagnostics';

interface SystemManagerProps {
  onUpdate: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const SystemManager: React.FC<SystemManagerProps> = ({ onUpdate, showToast }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [runningTests, setRunningTests] = useState(false);

  const handleDownloadBackup = () => {
    const dataStr = exportBackupData();
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `j1_backup_${new Date().toISOString().slice(0,10)}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    showToast('ดาวน์โหลดไฟล์สำรองข้อมูลเรียบร้อยแล้ว', 'success');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (importBackupData(content)) {
        showToast('นำเข้าข้อมูลสำเร็จ', 'success');
        onUpdate();
      } else {
        showToast('เกิดข้อผิดพลาดในการนำเข้าข้อมูล ไฟล์อาจไม่ถูกต้อง', 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRunDiagnostics = async () => {
    setRunningTests(true);
    setTestResults([]);
    setTimeout(async () => {
        const results = await runDiagnostics();
        setTestResults(results);
        setRunningTests(false);
    }, 500);
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow p-6 border border-gray-700 animate-fade-in text-gray-100">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Server className="text-blue-500" /> จัดการระบบและข้อมูล (System)
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backup / Restore Section */}
        <div className="bg-blue-900/20 p-6 rounded-lg border border-blue-900/50">
          <h3 className="font-bold text-blue-300 mb-4 flex items-center gap-2">
             สำรองและกู้คืนข้อมูล
          </h3>
          <p className="text-sm text-blue-200 mb-4">
             บันทึกข้อมูลทั้งหมด (แผนงาน, รายงาน, หน่วยงาน) เป็นไฟล์ JSON เพื่อเก็บไว้สำรอง หรือย้ายข้อมูลไปยังเครื่องอื่น
          </p>
          
          <div className="flex gap-3">
             <button 
                onClick={handleDownloadBackup}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow transition"
             >
                <Download size={18} /> ดาวน์โหลด (Backup)
             </button>
             
             <button 
                onClick={handleImportClick}
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-blue-300 border border-gray-600 px-4 py-2 rounded shadow-sm transition"
             >
                <Upload size={18} /> นำเข้าข้อมูล (Restore)
             </button>
             <input 
               type="file" 
               ref={fileInputRef}
               onChange={handleFileChange}
               className="hidden" 
               accept=".json"
             />
          </div>
          <div className="mt-4 flex items-start gap-2 text-xs text-orange-400 bg-orange-900/20 p-2 rounded border border-orange-900/50">
             <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
             <span>การนำเข้าข้อมูลจะ <u>ทับข้อมูลปัจจุบันทั้งหมด</u> กรุณาตรวจสอบไฟล์ให้แน่ใจก่อนนำเข้า</span>
          </div>
        </div>

        {/* Diagnostics / Unit Test Section */}
        <div className="bg-gray-700/30 p-6 rounded-lg border border-gray-600">
           <h3 className="font-bold text-gray-200 mb-4 flex items-center gap-2">
             <Activity className="text-purple-500" /> ตรวจสอบสถานะระบบ (Unit Tests)
           </h3>
           <p className="text-sm text-gray-400 mb-4">
             รันชุดทดสอบเบื้องต้น (Unit Tests) เพื่อตรวจสอบความถูกต้องของระบบจัดเก็บข้อมูลและการคำนวณ
           </p>
           
           <button 
              onClick={handleRunDiagnostics}
              disabled={runningTests}
              className={`flex items-center gap-2 px-4 py-2 rounded shadow transition text-white ${runningTests ? 'bg-gray-600' : 'bg-purple-600 hover:bg-purple-700'}`}
           >
              {runningTests ? 'กำลังตรวจสอบ...' : 'เริ่มการตรวจสอบ'}
           </button>

           {/* Results */}
           {testResults.length > 0 && (
             <div className="mt-4 space-y-2 bg-gray-900 p-3 rounded border border-gray-700 max-h-48 overflow-y-auto">
                {testResults.map((res, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm border-b border-gray-800 last:border-0 pb-1 last:pb-0">
                        <span className="flex items-center gap-2 text-gray-300">
                           {res.passed ? <CheckCircle size={14} className="text-green-500" /> : <XCircle size={14} className="text-red-500" />}
                           {res.name}
                        </span>
                        <span className="text-gray-500 text-xs">{res.message}</span>
                    </div>
                ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default SystemManager;