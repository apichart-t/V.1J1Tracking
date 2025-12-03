import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Report, Unit, Project, ProjectGroup } from '../types';
import { FileText, CheckCircle, Clock, Sparkles, Filter, Search } from 'lucide-react';
import { generateExecutiveSummary } from '../services/geminiService';
import { getAvailableYears } from '../services/storageService';

interface DashboardProps {
  reports: Report[];
  units: Unit[];
  projects: Project[];
  groups: ProjectGroup[];
  currentUserUnitId?: string; 
}

const COLORS = ['#4b5563', '#eab308', '#22c55e']; // Gray-600 (Not Started), Yellow-500, Green-500

const Dashboard: React.FC<DashboardProps> = ({ reports, units, projects, groups, currentUserUnitId }) => {
  const [filterUnit, setFilterUnit] = useState<string>(currentUserUnitId || 'all');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('2569'); 
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const availableYears = getAvailableYears();
  const [aiSummary, setAiSummary] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);

  const filteredData = useMemo(() => {
    let filteredReports = [...reports];

    if (filterUnit !== 'all') {
      filteredReports = filteredReports.filter(r => r.unitId === filterUnit);
    }
    if (filterProject !== 'all') {
      filteredReports = filteredReports.filter(r => r.projectId === filterProject);
    }
    if (filterDateStart) {
      filteredReports = filteredReports.filter(r => r.reportDateStart >= filterDateStart);
    }
    if (filterDateEnd) {
      filteredReports = filteredReports.filter(r => r.reportDateEnd <= filterDateEnd);
    }

    let targetProjects = projects.filter(p => (p.fiscalYear || "2569") === filterYear);

    if (filterUnit !== 'all') {
      targetProjects = targetProjects.filter(p => p.unitId === filterUnit);
    }
    if (filterProject !== 'all') {
      targetProjects = targetProjects.filter(p => p.id === filterProject);
    }

    if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        targetProjects = targetProjects.filter(p => 
            p.name.toLowerCase().includes(lowerTerm) ||
            units.find(u => u.id === p.unitId)?.name.toLowerCase().includes(lowerTerm) ||
            units.find(u => u.id === p.unitId)?.shortName.toLowerCase().includes(lowerTerm)
        );
    }

    const projectStatusMap = new Map<string, Report | null>();
    targetProjects.forEach(p => {
      const pReports = filteredReports.filter(r => r.projectId === p.id);
      if (pReports.length > 0) {
        pReports.sort((a, b) => b.timestamp - a.timestamp);
        projectStatusMap.set(p.id, pReports[0]);
      } else {
        projectStatusMap.set(p.id, null);
      }
    });

    return {
      reports: filteredReports,
      projectMap: projectStatusMap,
      targetProjects
    };

  }, [reports, projects, filterUnit, filterProject, filterYear, filterDateStart, filterDateEnd, searchTerm, units]);

  const stats = useMemo(() => {
    let notStarted = 0;
    let inProgress = 0;
    let completed = 0;
    let totalProgress = 0;
    let countWithProgress = 0;

    filteredData.targetProjects.forEach(p => {
      const r = filteredData.projectMap.get(p.id);
      if (!r || r.progress === 0) {
        notStarted++;
      } else if (r.progress === 100) {
        completed++;
        totalProgress += 100;
        countWithProgress++;
      } else {
        inProgress++;
        totalProgress += r.progress;
        countWithProgress++;
      }
    });

    const avgProgress = countWithProgress > 0 ? (totalProgress / filteredData.targetProjects.length) : 0; 

    return {
      totalProjects: filteredData.targetProjects.length,
      notStarted,
      inProgress,
      completed,
      avgProgress: Math.round(avgProgress),
      reportedCount: filteredData.reports.filter(r => filteredData.targetProjects.some(p => p.id === r.projectId)).length
    };
  }, [filteredData]);

  const pieData = [
    { name: 'ยังไม่เริ่ม', value: stats.notStarted },
    { name: 'อยู่ระหว่างดำเนินการ', value: stats.inProgress },
    { name: 'เสร็จสิ้น', value: stats.completed },
  ];

  const barData = filteredData.targetProjects.map(p => {
    const r = filteredData.projectMap.get(p.id);
    return {
      name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
      fullName: p.name,
      progress: r ? r.progress : 0
    };
  });

  const handleAiAnalysis = async () => {
    setLoadingAi(true);
    setAiSummary('');
    const latestReports: Report[] = [];
    filteredData.projectMap.forEach((value) => {
        if(value) latestReports.push(value);
    });
    const result = await generateExecutiveSummary(latestReports, units);
    setAiSummary(result);
    setLoadingAi(false);
  };

  const availableProjectsForFilter = useMemo(() => {
    let pList = projects.filter(p => (p.fiscalYear || "2569") === filterYear);
    if (filterUnit !== 'all') {
        pList = pList.filter(p => p.unitId === filterUnit);
    }
    const grouped: { [key: string]: Project[] } = {};
    const ungrouped: Project[] = [];
    pList.forEach(p => {
        if (p.groupId) {
            if (!grouped[p.groupId]) grouped[p.groupId] = [];
            grouped[p.groupId].push(p);
        } else {
            ungrouped.push(p);
        }
    });
    return { grouped, ungrouped };
  }, [projects, filterUnit, filterYear]);

  return (
    <div className="space-y-6 animate-fade-in no-print text-gray-100">
      
      {/* Filters */}
      <div className="bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-700">
        <div className="flex items-center justify-between mb-3 border-b border-gray-700 pb-2">
            <div className="flex items-center gap-2 text-white font-semibold">
                <Filter size={18} className="text-orange-500" /> ตัวกรองข้อมูล
            </div>
            <div className="relative">
                <Search size={16} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="ค้นหาชื่อแผนงาน / หน่วยงาน..." 
                    className="pl-8 pr-3 py-1 text-sm bg-gray-700 border border-gray-600 rounded-full focus:outline-none focus:ring-1 focus:ring-orange-500 w-64 text-white placeholder-gray-400"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            
            <div className="flex flex-col">
                <label className="text-xs font-medium text-gray-400 mb-1">ปีงบประมาณ</label>
                <select 
                    value={filterYear}
                    onChange={e => { setFilterYear(e.target.value); setFilterProject('all'); }}
                    className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-white font-bold"
                >
                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            {!currentUserUnitId && (
            <div className="flex flex-col">
                <label className="text-xs font-medium text-gray-400 mb-1">หน่วยงาน</label>
                <select 
                value={filterUnit} 
                onChange={(e) => { setFilterUnit(e.target.value); setFilterProject('all'); }}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                <option value="all">ทั้งหมด (All Units)</option>
                {units.map(u => (
                    <option key={u.id} value={u.id}>{u.shortName}</option>
                ))}
                </select>
            </div>
            )}
            
            <div className="flex flex-col lg:col-span-2">
                <label className="text-xs font-medium text-gray-400 mb-1">แผนงาน / โครงการ</label>
                <select 
                value={filterProject} 
                onChange={(e) => setFilterProject(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-white truncate"
                >
                <option value="all">ทั้งหมด (All Projects)</option>
                 {groups.map(group => {
                    const groupProjects = availableProjectsForFilter.grouped[group.id];
                    if (!groupProjects || groupProjects.length === 0) return null;
                    return (
                        <optgroup key={group.id} label={group.name} className="bg-gray-800 text-gray-300">
                            {groupProjects.map(p => (
                                <option key={p.id} value={p.id}>{p.name.substring(0, 80) + (p.name.length > 80 ? '...' : '')}</option>
                            ))}
                        </optgroup>
                    );
                })}
                {availableProjectsForFilter.ungrouped.length > 0 && (
                    <optgroup label="อื่นๆ / ทั่วไป" className="bg-gray-800 text-gray-300">
                        {availableProjectsForFilter.ungrouped.map(p => (
                            <option key={p.id} value={p.id}>{p.name.substring(0, 80) + (p.name.length > 80 ? '...' : '')}</option>
                        ))}
                    </optgroup>
                )}
                </select>
            </div>

            <div className="flex items-end justify-end">
                <button 
                    onClick={() => { setFilterUnit(currentUserUnitId || 'all'); setFilterProject('all'); setFilterYear('2569'); setFilterDateStart(''); setFilterDateEnd(''); setSearchTerm(''); }}
                    className="text-xs text-gray-400 hover:text-orange-500 underline mb-2 transition"
                >
                    ล้างตัวกรองทั้งหมด
                </button>
            </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">แผนงาน (ปี {filterYear})</p>
              <p className="text-2xl font-bold text-white">{stats.totalProjects}</p>
            </div>
            <FileText className="text-blue-500 h-8 w-8 opacity-80" />
          </div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">รายงานทั้งหมด</p>
              <p className="text-2xl font-bold text-white">{stats.reportedCount}</p>
            </div>
            <Clock className="text-yellow-500 h-8 w-8 opacity-80" />
          </div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">เสร็จสมบูรณ์</p>
              <p className="text-2xl font-bold text-white">{stats.completed}</p>
            </div>
            <CheckCircle className="text-green-500 h-8 w-8 opacity-80" />
          </div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">ความคืบหน้ารวม</p>
              <p className="text-2xl font-bold text-white">{stats.avgProgress}%</p>
            </div>
            <div className="h-8 w-8 rounded-full border-4 border-gray-700 flex items-center justify-center">
              <div className="h-full w-full bg-orange-500 rounded-full opacity-80" style={{ transform: `scale(${stats.avgProgress/100})`}}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Bar Chart */}
        <div className="bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-700 lg:col-span-2">
          <h3 className="font-bold text-lg text-white mb-4">ความคืบหน้าตามนโยบาย (ปี {filterYear})</h3>
          <div className="h-80">
            {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: '#9ca3af' }} />
                    <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 12, fill: '#d1d5db'}} />
                    <Tooltip 
                        formatter={(value: number) => [`${value}%`, 'ความคืบหน้า']} 
                        labelFormatter={(name, payload) => payload?.[0]?.payload?.fullName || name}
                        contentStyle={{ fontFamily: 'Sarabun', backgroundColor: '#1f2937', borderColor: '#4b5563', color: 'white' }}
                        itemStyle={{ color: '#fbbf24' }}
                    />
                    <Bar dataKey="progress" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-gray-500">ไม่มีข้อมูลแผนงานสำหรับปีนี้ หรือไม่ตรงกับคำค้นหา</div>
            )}
          </div>
        </div>

        {/* Status Pie Chart */}
        <div className="bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-700">
          <h3 className="font-bold text-lg text-white mb-4">สถานะรวมของงาน</h3>
          <div className="h-64">
             {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    >
                    {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#4b5563', color: 'white' }} />
                    <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-gray-300">{value}</span>} />
                </PieChart>
                </ResponsiveContainer>
             ) : (
                <div className="h-full flex items-center justify-center text-gray-500">ไม่มีข้อมูล</div>
             )}
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-300">
               <span className="flex items-center"><div className="w-3 h-3 bg-gray-600 rounded-full mr-2"></div>ยังไม่เริ่ม</span>
               <span className="font-semibold">{stats.notStarted}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-300">
               <span className="flex items-center"><div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>กำลังดำเนินการ</span>
               <span className="font-semibold">{stats.inProgress}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-300">
               <span className="flex items-center"><div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>เสร็จสิ้น</span>
               <span className="font-semibold">{stats.completed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Analysis Section */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg shadow-lg p-6 text-white relative overflow-hidden border border-gray-700">
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles size={120} />
        </div>
        <div className="relative z-10">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2 mb-2 text-orange-400">
                        <Sparkles className="text-orange-500" />
                        AI Executive Summary
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">
                        สร้างบทสรุปผู้บริหารโดยใช้ AI (Gemini 2.5 Flash) จากข้อมูลปี {filterYear}
                    </p>
                </div>
            </div>

            {!aiSummary && !loadingAi && (
                <div className="flex gap-2">
                  <button 
                    onClick={handleAiAnalysis}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded shadow transition text-sm"
                  >
                    วิเคราะห์ข้อมูล
                  </button>
                </div>
            )}

            {loadingAi && (
                <div className="flex items-center gap-2 text-orange-300 animate-pulse">
                    <Sparkles size={20} />
                    <span>กำลังประมวลผลข้อมูลและสร้างรายงาน...</span>
                </div>
            )}

            {aiSummary && (
                <div className="bg-gray-900/50 rounded p-4 mt-2 backdrop-blur-sm border border-gray-700">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-300">
                        {aiSummary}
                    </pre>
                    <button 
                        onClick={() => setAiSummary('')}
                        className="mt-4 text-xs text-orange-400 hover:text-white underline"
                    >
                        ล้างผลลัพธ์
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;