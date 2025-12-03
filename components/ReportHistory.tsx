import React, { useState, useMemo } from 'react';
import { Report, Unit, Project, ProjectGroup } from '../types';
import { deleteReport, getAvailableYears } from '../services/storageService';
import { Trash2, FileText, Download, Calendar, Filter, Printer, Search } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ReportHistoryProps {
  reports: Report[];
  units: Unit[];
  projects: Project[];
  groups: ProjectGroup[];
  currentUserUnitId?: string;
  onUpdate: () => void;
}

const ReportHistory: React.FC<ReportHistoryProps> = ({ reports, units, projects, groups, currentUserUnitId, onUpdate }) => {
  const [filterProject, setFilterProject] = useState('all');
  const [filterYear, setFilterYear] = useState('2569');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');

  const availableYears = getAvailableYears();

  const visibleReports = currentUserUnitId 
    ? reports.filter(r => r.unitId === currentUserUnitId)
    : reports;

  const filteredReports = visibleReports.filter(r => {
    const project = projects.find(p => p.id === r.projectId);
    const projectYear = project?.fiscalYear || "2569";
    
    if (filterYear !== 'all' && projectYear !== filterYear) return false;
    if (filterProject !== 'all' && r.projectId !== filterProject) return false;
    if (filterDateStart && r.reportDateStart < filterDateStart) return false;
    if (filterDateEnd && r.reportDateStart > filterDateEnd) return false;

    if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        const projectName = r.projectName.toLowerCase();
        const unitName = units.find(u => u.id === r.unitId)?.shortName.toLowerCase() || "";
        const details = (r.pastPerformance + r.nextPlan + r.obstacles + r.remarks).toLowerCase();
        
        if (!projectName.includes(lowerTerm) && !unitName.includes(lowerTerm) && !details.includes(lowerTerm)) {
            return false;
        }
    }

    return true;
  });

  filteredReports.sort((a, b) => b.timestamp - a.timestamp);

  const availableProjects = useMemo(() => {
     let filtered = projects.filter(p => (p.fiscalYear || "2569") === filterYear);
     if (currentUserUnitId) {
        filtered = filtered.filter(p => p.unitId === currentUserUnitId);
     }
     
    const grouped: { [key: string]: Project[] } = {};
    const ungrouped: Project[] = [];
    filtered.forEach(p => {
        if (p.groupId) {
            if (!grouped[p.groupId]) grouped[p.groupId] = [];
            grouped[p.groupId].push(p);
        } else {
            ungrouped.push(p);
        }
    });

    return { grouped, ungrouped };
  }, [projects, filterYear, currentUserUnitId]);

  const handleDelete = (id: string) => {
    if (window.confirm('คุณต้องการลบรายงานนี้ใช่หรือไม่?')) {
      deleteReport(id);
      onUpdate();
    }
  };

  const handleExportExcel = () => {
    const data = filteredReports.map(r => {
      const p = projects.find(proj => proj.id === r.projectId);
      return {
        'ปีงบประมาณ': p?.fiscalYear || "2569",
        'วันที่บันทึก': new Date(r.timestamp).toLocaleDateString('th-TH'),
        'แผนงาน': r.projectName,
        'หน่วยงาน': units.find(u => u.id === r.unitId)?.shortName,
        'ห้วงเวลา': `${r.reportDateStart} ถึง ${r.reportDateEnd}`,
        'ความคืบหน้า': `${r.progress}%`,
        'ผลการดำเนินงาน': r.pastPerformance,
        'แผนต่อไป': r.nextPlan,
        'ปัญหา/อุปสรรค': r.obstacles,
        'หมายเหตุ': r.remarks
      }
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reports");
    XLSX.writeFile(wb, `j1_reports_${filterYear}.xlsx`);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6 animate-fade-in print:shadow-none print:border-none print:p-0 text-gray-100">
       <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 no-print">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="text-blue-500" /> ประวัติรายงาน
          </h2>
          
          <div className="flex gap-2">
             <button 
                onClick={handleExportExcel}
                className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm transition"
             >
                <Download size={16} /> Excel
             </button>
             <button 
                onClick={handlePrintPDF}
                className="flex items-center gap-1 bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded text-sm transition"
             >
                <Printer size={16} /> Print / PDF
             </button>
          </div>
       </div>

       {/* Print Header */}
       <div className="hidden print-only mb-6 text-center">
          <h1 className="text-2xl font-bold text-black">รายงานผลการดำเนินการ ด้านกำลังพล ประจำปีงบประมาณ {filterYear}</h1>
          <p className="text-sm text-gray-600">วันที่พิมพ์รายงาน: {new Date().toLocaleDateString('th-TH')}</p>
       </div>

       {/* Filter (Hide on Print) */}
       <div className="mb-4 p-4 bg-gray-700/50 rounded border border-gray-600 no-print">
         <div className="flex items-center justify-between mb-2">
             <div className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                <Filter size={16} className="text-orange-500" /> กรองข้อมูล
             </div>
             <div className="relative">
                <Search size={16} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="ค้นหาแผนงาน / รายละเอียด..." 
                    className="pl-8 pr-3 py-1 text-sm bg-gray-800 border border-gray-600 rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500 w-64 text-white placeholder-gray-500"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <div className="flex flex-col">
                <label className="text-xs text-gray-400 block mb-1">ปีงบประมาณ</label>
                <select 
                    value={filterYear}
                    onChange={e => { setFilterYear(e.target.value); setFilterProject('all'); }}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-white"
                >
                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            <div className="md:col-span-3">
                <label className="text-xs text-gray-400 block mb-1">แผนงาน / โครงการ</label>
                <select 
                    value={filterProject} 
                    onChange={e => setFilterProject(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                    <option value="all">ทั้งหมด (All Projects)</option>
                    {groups.map(group => {
                        const groupProjects = availableProjects.grouped[group.id];
                        if (!groupProjects || groupProjects.length === 0) return null;
                        return (
                            <optgroup key={group.id} label={group.name} className="bg-gray-800 text-gray-300">
                                {groupProjects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name.substring(0, 80) + (p.name.length > 80 ? '...' : '')}</option>
                                ))}
                            </optgroup>
                        );
                    })}
                    {availableProjects.ungrouped.length > 0 && (
                        <optgroup label="อื่นๆ / ทั่วไป" className="bg-gray-800 text-gray-300">
                            {availableProjects.ungrouped.map(p => (
                                <option key={p.id} value={p.id}>{p.name.substring(0, 80) + (p.name.length > 80 ? '...' : '')}</option>
                            ))}
                        </optgroup>
                    )}
                </select>
            </div>

            <div className="md:col-span-2">
                <label className="text-xs text-gray-400 block mb-1">ตั้งแต่วันที่</label>
                <input 
                  type="date"
                  value={filterDateStart}
                  onChange={e => setFilterDateStart(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                />
            </div>
            <div className="md:col-span-2 flex gap-2">
                <div className="flex-grow">
                    <label className="text-xs text-gray-400 block mb-1">ถึงวันที่</label>
                    <input 
                    type="date"
                    value={filterDateEnd}
                    onChange={e => setFilterDateEnd(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                    />
                </div>
                <div className="flex items-end">
                    <button 
                    onClick={() => { setFilterProject('all'); setFilterDateStart(''); setFilterDateEnd(''); setSearchTerm(''); }}
                    className="px-3 py-2 text-sm text-gray-400 hover:text-orange-500 underline whitespace-nowrap"
                    >
                        ล้างค่า
                    </button>
                </div>
            </div>
         </div>
       </div>

       {/* Table */}
       <div className="overflow-x-auto rounded-lg border border-gray-700">
         <table className="w-full text-left text-sm print:border-black">
           <thead className="bg-gray-700 text-gray-200 border-b border-gray-600 print:bg-gray-200 print:text-black">
             <tr>
               <th className="px-4 py-3 font-semibold border-r border-gray-600 print:border-black">วันที่ / แผนงาน (ปี {filterYear})</th>
               <th className="px-4 py-3 font-semibold text-center border-r border-gray-600 print:border-black w-16">%</th>
               <th className="px-4 py-3 font-semibold border-r border-gray-600 print:border-black">รายละเอียดผลการดำเนินงาน</th>
               <th className="px-4 py-3 font-semibold text-center no-print">จัดการ</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-gray-700 print:divide-black">
             {filteredReports.length === 0 ? (
               <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">ไม่พบข้อมูลรายงานตามเงื่อนไขที่ระบุ</td></tr>
             ) : (
                filteredReports.map(r => (
                  <tr key={r.id} className="hover:bg-gray-700/50 transition print:break-inside-avoid bg-gray-800">
                    <td className="px-4 py-3 align-top border-r border-gray-600 print:border-black w-1/3">
                      <div className="font-bold text-white mb-1">{r.projectName}</div>
                      <div className="text-xs text-gray-400 mb-1">หน่วย: {units.find(u => u.id === r.unitId)?.shortName}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar size={12} /> {new Date(r.timestamp).toLocaleDateString('th-TH')}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                          (รอบ: {r.reportDateStart} - {r.reportDateEnd})
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-center border-r border-gray-600 print:border-black">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
                        r.progress === 100 ? 'bg-green-900 text-green-300 print:bg-transparent print:text-black' :
                        r.progress > 0 ? 'bg-yellow-900 text-yellow-300 print:bg-transparent print:text-black' :
                        'bg-gray-700 text-gray-400 print:bg-transparent print:text-black'
                      }`}>
                        {r.progress}%
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top border-r border-gray-600 print:border-black text-gray-300">
                      <div className="mb-2">
                          <span className="font-semibold text-xs text-gray-500 block">ผลการปฏิบัติ:</span>
                          {r.pastPerformance || "-"}
                      </div>
                      {r.nextPlan && (
                          <div className="mb-2">
                            <span className="font-semibold text-xs text-gray-500 block">แผนต่อไป:</span>
                            {r.nextPlan}
                          </div>
                      )}
                      {r.obstacles && (
                          <div className="mb-2 text-red-400 print:text-black">
                            <span className="font-semibold text-xs text-red-500 print:text-black block">ปัญหา/อุปสรรค:</span>
                            {r.obstacles}
                          </div>
                      )}
                      {r.fileLink && (
                         <div className="mt-2 text-xs no-print">
                            <a href={r.fileLink} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                                <FileText size={12} /> เอกสารแนบ
                            </a>
                         </div>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top text-center no-print">
                      {(!currentUserUnitId || currentUserUnitId === r.unitId) && (
                        <button 
                          onClick={() => handleDelete(r.id)}
                          className="text-red-400 hover:text-red-300 transition p-2 rounded hover:bg-red-900/30"
                          title="ลบรายงาน"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
             )}
           </tbody>
         </table>
       </div>
    </div>
  );
};

export default ReportHistory;