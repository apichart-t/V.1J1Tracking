import React, { useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import { Unit, Project, ProjectGroup } from '../types';

// นำเข้า Firebase
import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'; 

interface EntryFormProps {
  unit: Unit;
  projects: Project[];
  groups: ProjectGroup[];
  onSuccess: () => void;
}

const EntryForm: React.FC<EntryFormProps> = ({ unit, projects, groups, onSuccess }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [status, setStatus] = useState<'ontrack' | 'delayed' | 'risk'>('ontrack');
  const [progress, setProgress] = useState<number>(0);
  const [details, setDetails] = useState('');
  const [problems, setProblems] = useState('');
  
  // สถานะการโหลด (กันคนกดย้ำ)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setError('กรุณาเลือกโครงการ');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    try {
      // เตรียมข้อมูลที่จะส่งขึ้น Firebase
      const reportData = {
        unitId: unit.id,
        unitName: unit.name, // เก็บชื่อไปด้วยเลย เวลาดึงจะได้ไม่ต้อง join
        projectId: selectedProjectId,
        projectName: selectedProject?.name || 'ไม่ระบุ',
        status,
        progress: Number(progress),
        details,
        problems: problems || '-',
        timestamp: new Date().toISOString(), // เก็บเวลาแบบ string เพื่อความง่ายในการแสดงผล
        createdAt: serverTimestamp(), // เก็บเวลา server เพื่อใช้เรียงลำดับที่แม่นยำ
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear() + 543
      };

      // สั่งบันทึกลง Collection ชื่อ "reports"
      await addDoc(collection(db, "reports"), reportData);

      // เคลียร์ฟอร์ม
      setDetails('');
      setProblems('');
      setProgress(0);
      setStatus('ontrack');
      
      // แจ้งหน้าหลักว่าเสร็จแล้ว
      onSuccess();
      
    } catch (err) {
      console.error("Error adding document: ", err);
      setError("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  // กรองโครงการตามกลุ่ม (Logic เดิมของคุณ)
  const renderProjectOptions = () => {
    return groups.map(group => {
      const groupProjects = projects.filter(p => p.groupId === group.id);
      if (groupProjects.length === 0) return null;
      
      return (
        <optgroup key={group.id} label={group.name}>
          {groupProjects.map(project => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </optgroup>
      );
    });
  };

  return (
    <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
      <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
        <Save className="text-blue-400" /> บันทึกรายงานผลการดำเนินงาน
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded text-red-200 flex items-center gap-2">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ส่วนแสดงชื่อหน่วยงาน */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">หน่วยงาน</label>
          <div className="p-3 bg-gray-700 rounded text-gray-200 border border-gray-600">
            {unit.name}
          </div>
        </div>

        {/* เลือกโครงการ */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">โครงการ/กิจกรรม</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
            disabled={isSubmitting}
          >
            <option value="">-- กรุณาเลือก --</option>
            {renderProjectOptions()}
          </select>
        </div>

        {/* สถานะ และ ความคืบหน้า */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">สถานะการดำเนินการ</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              disabled={isSubmitting}
            >
              <option value="ontrack">🟢 เป็นไปตามแผน</option>
              <option value="delayed">🟡 ล่าช้ากว่าแผน</option>
              <option value="risk">🔴 มีความเสี่ยง/ปัญหา</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">ความคืบหน้า (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* รายละเอียด */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">รายละเอียดผลการดำเนินงาน</label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500 focus:outline-none h-24"
            placeholder="อธิบายสิ่งที่ได้ดำเนินการไป..."
            required
            disabled={isSubmitting}
          />
        </div>

        {/* ปัญหา/อุปสรรค */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">ปัญหา/อุปสรรค (ถ้ามี)</label>
          <textarea
            value={problems}
            onChange={(e) => setProblems(e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500 focus:outline-none h-20"
            placeholder="ระบุปัญหาที่พบ หรือข้อขัดข้อง..."
            disabled={isSubmitting}
          />
        </div>

        {/* ปุ่มบันทึก */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 px-4 rounded font-bold text-white shadow transition flex items-center justify-center gap-2
            ${isSubmitting ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/50'}
          `}
        >
          {isSubmitting ? 'กำลังบันทึก...' : <><Save size={20} /> บันทึกข้อมูล</>}
        </button>
      </form>
    </div>
  );
};

export default EntryForm;
