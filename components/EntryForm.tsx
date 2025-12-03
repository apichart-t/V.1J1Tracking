import React, { useState, useEffect, useMemo } from 'react';
import { Project, Report, Unit, ProjectGroup } from '../types';
import { saveReport, getProjectLatestReport, getAvailableYears } from '../services/storageService';
import { GOOGLE_DRIVE_FOLDER } from '../constants';
import { Save, Upload, ExternalLink, Calendar } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface EntryFormProps {
  unit: Unit;
  projects: Project[];
  groups: ProjectGroup[];
  onSuccess: () => void;
}

const EntryForm: React.FC<EntryFormProps> = ({ unit, projects, groups, onSuccess }) => {
  const availableYears = getAvailableYears();
  const [selectedYear, setSelectedYear] = useState<string>("2569");

  const unitProjects = projects.filter(p => 
    p.unitId === unit.id && (p.fiscalYear || "2569") === selectedYear
  );

  const [selectedProjectId, setSelectedProjectId] = useState('');
  
  useEffect(() => {
    if (unitProjects.length > 0) {
        const stillExists = unitProjects.find(p => p.id === selectedProjectId);
        if (!stillExists) {
            setSelectedProjectId(unitProjects[0].id);
        }
    } else {
        setSelectedProjectId('');
    }
  }, [selectedYear, projects]); 

  const [reportDateStart, setReportDateStart] = useState('');
  const [reportDateEnd, setReportDateEnd] = useState(new Date().toISOString().split('T')[0]);
  
  const [pastPerformance, setPastPerformance] = useState('');
  const [nextPlan, setNextPlan] = useState('');
  const [progress, setProgress] = useState(0);
  const [obstacles, setObstacles] = useState('');
  const [remarks, setRemarks] = useState('');
  const [fileLink, setFileLink] = useState('');

  useEffect(() => {
    if (selectedProjectId) {
      const latest = getProjectLatestReport(selectedProjectId);
      if (latest) {
        setPastPerformance(latest.pastPerformance || ''); 
        setProgress(latest.progress); 
      } else {
        setPastPerformance('');
        setProgress(0);
      }
    }
  }, [selectedProjectId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;

    const project = unitProjects.find(p => p.id === selectedProjectId);

    const newReport: Report = {
      id: uuidv4(),
      unitId: unit.id,
      projectId: selectedProjectId,
      projectName: project?.name || '',
      reportDateStart,
      reportDateEnd,
      pastPerformance,
      nextPlan,
      progress,
      obstacles,
      remarks,
      fileLink,
      timestamp: Date.now()
    };

    saveReport(newReport);
    alert('บันทึกข้อมูลเรียบร้อยแล้ว');
    
    setNextPlan('');
    setObstacles('');
    setRemarks('');
    setFileLink('');
    onSuccess();
  };

  const getProgressColor = (val: number) => {
    if (val < 30) return 'text-red-500';
    if (val < 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  const groupedProjects = useMemo(() => {
    const grouped: { [key: string]: Project[] } = {};
    const ungrouped: Project[] = [];

    unitProjects.forEach(p => {
        if (p.groupId) {
            if (!grouped[p.groupId]) grouped[p.groupId] = [];
            grouped[p.groupId].push(p);
        } else {
            ungrouped.push(p);
        }
    });
    return { grouped, ungrouped };
  }, [unitProjects]);

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700 max-w-4xl mx-auto animate-fade-in text-gray-100">
      <div className="border-b border-gray-700 pb-4 mb-6">
        <h2 className="text-xl font-bold text-white flex items-center">
            📝 บันทึกข้อมูลผลการดำเนินงาน
        </h2>
        <p className="text-sm text-gray-400 mt-1">หน่วย: <span className="text-orange-400">{unit.name}</span></p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600 space-y-4">
            <div>
               <label className="block text-sm font-bold text-gray-300 mb-2 flex items-center gap-2">
                 <Calendar size={16} /> เลือกปีงบประมาณ
               </label>
               <div className="flex flex-wrap gap-2">
                   {availableYears.map(year => (
                       <button
                         key={year}
                         type="button"
                         onClick={() => setSelectedYear(year)}
                         className={`px-4 py-2 rounded-full text-sm font-semibold transition ${selectedYear === year ? 'bg-blue-600 text-white shadow' : 'bg-gray-800 text-gray-400 border border-gray-600 hover:bg-gray-700'}`}
                       >
                           {year}
                       </button>
                   ))}
               </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">เลือกแผนงาน / โครงการ (ปี {selectedYear}) <span className="text-red-500">*</span></label>
                {unitProjects.length > 0 ? (
                    <select 
                        className="w-full border border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-900 text-white"
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        required
                    >
                        {groups.map(group => {
                            const groupProjects = groupedProjects.grouped[group.id];
                            if (!groupProjects || groupProjects.length === 0) return null;
                            return (
                                <optgroup key={group.id} label={group.name} className="bg-gray-800 text-gray-300">
                                    {groupProjects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </optgroup>
                            );
                        })}
                        {groupedProjects.ungrouped.length > 0 && (
                            <optgroup label="อื่นๆ / ทั่วไป" className="bg-gray-800 text-gray-300">
                                {groupedProjects.ungrouped.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </optgroup>
                        )}
                    </select>
                ) : (
                    <div className="text-red-400 text-sm bg-red-900/20 p-2 rounded border border-red-900/50">
                        ยังไม่มีโครงการสำหรับปี {selectedYear} กรุณาแจ้ง Admin ให้เพิ่มโครงการ
                    </div>
                )}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">ห้วงเวลารายงาน (เริ่ม) <span className="text-red-500">*</span></label>
            <input 
              type="date" 
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:ring-blue-500 focus:outline-none"
              value={reportDateStart}
              onChange={e => setReportDateStart(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">ห้วงเวลารายงาน (สิ้นสุด) <span className="text-red-500">*</span></label>
            <input 
              type="date" 
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:ring-blue-500 focus:outline-none"
              value={reportDateEnd}
              onChange={e => setReportDateEnd(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="bg-gray-700/30 p-5 rounded-lg border border-gray-600">
          <label className="block text-sm font-bold text-gray-300 mb-4 flex justify-between items-center">
            <span>ความคืบหน้าการดำเนินงาน (%)</span>
            <span className={`text-xl font-bold px-3 py-1 rounded bg-gray-800 border border-gray-600 ${getProgressColor(progress)}`}>{progress}%</span>
          </label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={progress} 
            onChange={(e) => setProgress(Number(e.target.value))}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
            style={{
                background: `linear-gradient(to right, #ef4444 0%, #eab308 50%, #22c55e 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-2 font-medium">
            <span>0% (ยังไม่เริ่ม)</span>
            <span>50% (กำลังดำเนินการ)</span>
            <span>100% (เสร็จสิ้น)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-1">
            <label className="block text-sm font-semibold text-gray-400 mb-2">ผลการดำเนินการที่ผ่านมา</label>
            <textarea 
              rows={5}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-500"
              placeholder="ระบุรายละเอียดสิ่งที่ได้ดำเนินการไปแล้ว..."
              value={pastPerformance}
              onChange={e => setPastPerformance(e.target.value)}
            />
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-semibold text-gray-400 mb-2">แผนการดำเนินงานต่อไป</label>
            <textarea 
              rows={5}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-500"
              placeholder="ระบุสิ่งที่จะดำเนินการในห้วงต่อไป..."
              value={nextPlan}
              onChange={e => setNextPlan(e.target.value)}
            />
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-semibold text-red-400 mb-2">ปัญหา / อุปสรรค</label>
            <textarea 
              rows={3}
              className="w-full bg-gray-700 border border-red-900/50 rounded px-3 py-2 text-white focus:ring-2 focus:ring-red-500 focus:outline-none placeholder-gray-500"
              placeholder="ถ้าไม่มีให้ระบุ -"
              value={obstacles}
              onChange={e => setObstacles(e.target.value)}
            />
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-semibold text-gray-400 mb-2">หมายเหตุ</label>
            <textarea 
              rows={3}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-500"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-gray-700/50 p-4 rounded border border-gray-600">
           <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-blue-400">อัปโหลดไฟล์แนบ</label>
              <a 
                href={GOOGLE_DRIVE_FOLDER} 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-medium"
              >
                <Upload size={14} /> 1. ไปยัง Google Drive Folder
              </a>
           </div>
           <div className="flex gap-2">
             <input 
                type="text"
                placeholder="2. วางลิงก์ไฟล์ Google Drive ที่นี่ (หลังจากอัปโหลดแล้ว)"
                className="flex-grow bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-500"
                value={fileLink}
                onChange={e => setFileLink(e.target.value)}
             />
             <a 
               href={fileLink || '#'} 
               target="_blank" 
               rel="noreferrer"
               className={`flex items-center justify-center px-3 py-2 rounded border ${fileLink ? 'bg-gray-800 text-blue-400 border-blue-900 hover:bg-gray-700' : 'bg-gray-800 text-gray-600 border-gray-700 cursor-not-allowed'}`}
               title="เปิดลิงก์"
             >
                <ExternalLink size={16} />
             </a>
           </div>
        </div>

        <button 
          type="submit" 
          disabled={!selectedProjectId}
          className={`w-full text-white font-bold py-3 rounded-lg shadow-md transition flex items-center justify-center gap-2 transform active:scale-[0.99] ${!selectedProjectId ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          <Save size={20} /> ยืนยันการบันทึกข้อมูล
        </button>

      </form>
    </div>
  );
};

export default EntryForm;