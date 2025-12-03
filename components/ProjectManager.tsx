import React, { useState, useEffect } from 'react';
import { Project, Unit, ProjectGroup } from '../types';
import { saveProject, deleteProject, getAvailableYears, saveProjectGroup, deleteProjectGroup, softDeleteProject, restoreProject } from '../services/storageService';
import { Plus, Trash2, Edit2, Save, X, Settings, FolderTree, FolderPlus, RefreshCw, AlertTriangle, ArrowRightCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ProjectManagerProps {
  projects: Project[];
  units: Unit[];
  groups: ProjectGroup[];
  onUpdate: () => void;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({ projects, units, groups, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'projects' | 'groups' | 'trash'>('projects');

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editGroupId, setEditGroupId] = useState('');
  const [editUnitId, setEditUnitId] = useState('');

  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectUnit, setNewProjectUnit] = useState('');
  const [newProjectYear, setNewProjectYear] = useState('2569');
  const [newProjectGroup, setNewProjectGroup] = useState('');

  useEffect(() => {
    if (!newProjectUnit && units.length > 0) {
      setNewProjectUnit(units[0].id);
    }
  }, [units, newProjectUnit]);

  const [isEditingGroup, setIsEditingGroup] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [newGroupName, setNewGroupName] = useState('');

  const [filterYear, setFilterYear] = useState<string>('all');
  const availableYears = getAvailableYears();

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
        alert("กรุณาระบุชื่อแผนงาน");
        return;
    }

    const targetUnit = newProjectUnit || units[0]?.id;
    if (!targetUnit) {
        alert("กรุณาสร้างหน่วยงานก่อนเพิ่มแผนงาน");
        return;
    }

    const yearToSave = newProjectYear.trim() || "2569";

    const newProject: Project = {
      id: uuidv4(),
      name: newProjectName,
      unitId: targetUnit,
      fiscalYear: yearToSave,
      groupId: newProjectGroup || undefined
    };

    saveProject(newProject);
    setNewProjectName('');
    onUpdate();
    alert(`เพิ่มแผนงานสำหรับปี ${yearToSave} เรียบร้อยแล้ว`);

    if (filterYear !== 'all' && filterYear !== yearToSave) {
        setFilterYear(yearToSave);
    }
  };

  const handleEditProjectStart = (project: Project) => {
    setIsEditing(project.id);
    setEditName(project.name);
    setEditYear(project.fiscalYear || "2569");
    setEditGroupId(project.groupId || '');
    setEditUnitId(project.unitId);
  };

  const handleEditProjectSave = (project: Project) => {
    if (!editName.trim()) return;
    
    saveProject({ 
        ...project, 
        name: editName,
        fiscalYear: editYear,
        unitId: editUnitId,
        groupId: editGroupId || undefined
    });
    
    setIsEditing(null);
    onUpdate();
  };

  const handleSoftDeleteProject = (id: string) => {
    softDeleteProject(id);
    onUpdate();
    alert('ย้ายแผนงานไปถังขยะเรียบร้อยแล้ว');
  };

  const handleRestoreProject = (id: string) => {
    restoreProject(id);
    onUpdate();
    alert('กู้คืนแผนงานเรียบร้อยแล้ว');
  };

  const handlePermanentDeleteProject = (id: string) => {
    if (window.confirm('ยืนยันการลบถาวร? ข้อมูลรายงานที่เกี่ยวข้องจะหายไปทั้งหมดและไม่สามารถกู้คืนได้')) {
      deleteProject(id);
      onUpdate();
    }
  }

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    saveProjectGroup({ id: uuidv4(), name: newGroupName });
    setNewGroupName('');
    onUpdate();
  };

  const handleEditGroupStart = (group: ProjectGroup) => {
    setIsEditingGroup(group.id);
    setEditGroupName(group.name);
  };

  const handleEditGroupSave = (group: ProjectGroup) => {
    if (!editGroupName.trim()) return;
    saveProjectGroup({ ...group, name: editGroupName });
    setIsEditingGroup(null);
    onUpdate();
  };

  const handleDeleteGroup = (id: string) => {
    if (window.confirm('ยืนยันการลบกลุ่มงานนี้? (แผนงานในกลุ่มนี้จะถูกยกเลิกการจัดกลุ่ม)')) {
      deleteProjectGroup(id);
      onUpdate();
    }
  };


  const activeProjects = projects.filter(p => 
     !p.deletedAt && (filterYear === 'all' ? true : (p.fiscalYear || "2569") === filterYear)
  );

  const deletedProjects = projects.filter(p => p.deletedAt);

  const calculateDaysRemaining = (deletedAt?: number) => {
      if (!deletedAt) return 0;
      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
      const expiresAt = deletedAt + THIRTY_DAYS_MS;
      const now = Date.now();
      const diff = expiresAt - now;
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return days > 0 ? days : 0;
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow p-6 border border-gray-700 animate-fade-in text-gray-100">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="text-blue-500" /> จัดการแผนงานและกลุ่มงาน
        </h2>
        <div className="flex bg-gray-700 p-1 rounded-lg">
            <button 
                onClick={() => setActiveTab('projects')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'projects' ? 'bg-gray-600 shadow text-white' : 'text-gray-400 hover:text-gray-200'}`}
            >
                แผนงาน/โครงการ
            </button>
            <button 
                onClick={() => setActiveTab('groups')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'groups' ? 'bg-gray-600 shadow text-white' : 'text-gray-400 hover:text-gray-200'}`}
            >
                กลุ่มลักษณะงาน
            </button>
            <button 
                onClick={() => setActiveTab('trash')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition flex items-center gap-1 ${activeTab === 'trash' ? 'bg-red-900/40 text-red-400 shadow border border-red-900' : 'text-gray-400 hover:text-gray-200'}`}
            >
                <Trash2 size={14} /> ถังขยะ ({deletedProjects.length})
            </button>
        </div>
      </div>

      {activeTab === 'projects' && (
        <>
            {/* Add New Project */}
            <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-900 mb-8">
                <h3 className="font-semibold text-blue-300 mb-3 flex items-center gap-2">
                    <Plus size={18} /> เพิ่มแผนงานใหม่
                </h3>
                <form onSubmit={handleAddProject} className="flex flex-col gap-3">
                   <div className="flex flex-col md:flex-row gap-3">
                        <div className="w-full md:w-1/6">
                            <label className="text-xs text-gray-400 mb-1 block">ปีงบประมาณ</label>
                            <input 
                                type="text" 
                                value={newProjectYear}
                                onChange={e => setNewProjectYear(e.target.value)}
                                placeholder="เช่น 2570"
                                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div className="w-full md:w-1/4">
                            <label className="text-xs text-gray-400 mb-1 block">หน่วยงานเจ้าของเรื่อง</label>
                            <select 
                                value={newProjectUnit}
                                onChange={e => setNewProjectUnit(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:ring-blue-500"
                            >
                                {units.map(u => (
                                <option key={u.id} value={u.id}>{u.shortName}</option>
                                ))}
                            </select>
                        </div>
                         <div className="w-full md:w-1/4">
                            <label className="text-xs text-gray-400 mb-1 block">กลุ่มงาน (Optional)</label>
                            <select 
                                value={newProjectGroup}
                                onChange={e => setNewProjectGroup(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:ring-blue-500"
                            >
                                <option value="">- ไม่ระบุ -</option>
                                {groups.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>
                        </div>
                   </div>
                    <div className="flex flex-col md:flex-row gap-3 items-end">
                        <div className="w-full md:flex-grow">
                            <label className="text-xs text-gray-400 mb-1 block">ชื่อแผนงาน / โครงการ</label>
                            <input 
                                type="text" 
                                value={newProjectName} 
                                onChange={e => setNewProjectName(e.target.value)}
                                placeholder="ระบุชื่อแผนงาน..."
                                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:ring-blue-500"
                                required
                            />
                        </div>
                        <button 
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold shadow transition whitespace-nowrap"
                        >
                            บันทึก
                        </button>
                    </div>
                </form>
            </div>

            {/* Filter */}
            <div className="flex justify-end mb-4 items-center gap-2">
                <span className="text-sm text-gray-400">แสดงข้อมูลปี:</span>
                <select 
                value={filterYear}
                onChange={e => setFilterYear(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                >
                <option value="all">ทั้งหมด</option>
                {availableYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                ))}
                </select>
            </div>

            {/* List */}
            <div className="overflow-hidden border border-gray-700 rounded-lg">
                <table className="w-full text-left text-sm">
                <thead className="bg-gray-700 text-gray-300">
                    <tr>
                    <th className="px-4 py-3 font-semibold border-b border-gray-600 w-20 text-center">ปี</th>
                    <th className="px-4 py-3 font-semibold border-b border-gray-600 w-24">หน่วย</th>
                    <th className="px-4 py-3 font-semibold border-b border-gray-600 w-32">กลุ่มงาน</th>
                    <th className="px-4 py-3 font-semibold border-b border-gray-600">ชื่อแผนงาน</th>
                    <th className="px-4 py-3 font-semibold border-b border-gray-600 w-32 text-center">จัดการ</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {activeProjects.length === 0 && (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">ไม่พบแผนงานในปีที่เลือก</td></tr>
                    )}
                    {activeProjects.map(project => (
                    <tr key={project.id} className="hover:bg-gray-700/50">
                        {isEditing === project.id ? (
                        <>
                            <td className="px-4 py-2 align-top">
                                <input 
                                    type="text" 
                                    value={editYear}
                                    onChange={e => setEditYear(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-center text-white"
                                />
                            </td>
                            <td className="px-4 py-2 align-top">
                                <select 
                                    value={editUnitId}
                                    onChange={e => setEditUnitId(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                                >
                                    {units.map(u => (
                                        <option key={u.id} value={u.id}>{u.shortName}</option>
                                    ))}
                                </select>
                            </td>
                            <td className="px-4 py-2 align-top">
                                <select 
                                    value={editGroupId}
                                    onChange={e => setEditGroupId(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                                >
                                    <option value="">-</option>
                                    {groups.map(g => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </select>
                            </td>
                            <td className="px-4 py-2 align-top">
                              <textarea 
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white"
                                rows={2}
                              />
                            </td>
                            <td className="px-4 py-2 align-top text-center">
                            <div className="flex justify-center gap-2">
                                <button type="button" onClick={() => handleEditProjectSave(project)} className="text-green-400 hover:bg-green-900/30 p-1 rounded"><Save size={16} /></button>
                                <button type="button" onClick={() => setIsEditing(null)} className="text-gray-400 hover:bg-gray-700 p-1 rounded"><X size={16} /></button>
                            </div>
                            </td>
                        </>
                        ) : (
                        <>
                            <td className="px-4 py-3 align-top text-center font-semibold text-gray-400">
                                {project.fiscalYear || "2569"}
                            </td>
                            <td className="px-4 py-3 align-top text-blue-400 font-medium">
                              {units.find(u => u.id === project.unitId)?.shortName || <span className="text-red-400">ระบุใหม่</span>}
                            </td>
                            <td className="px-4 py-3 align-top text-purple-400 text-xs">
                              {groups.find(g => g.id === project.groupId)?.name || "-"}
                            </td>
                            <td className="px-4 py-3 align-top text-gray-200">
                                {project.name}
                            </td>
                            <td className="px-4 py-3 align-top text-center">
                            <div className="flex justify-center gap-2 items-center">
                                <button 
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleSoftDeleteProject(project.id); }} 
                                    className="text-red-400 hover:text-red-300 hover:bg-red-900/30 p-1 px-2 rounded transition flex items-center gap-1 border border-red-900/50"
                                    title="ย้ายไปถังขยะ"
                                >
                                    <Trash2 size={14} />
                                    <span className="text-xs whitespace-nowrap font-medium">ลบ</span>
                                </button>
                                
                                <button 
                                    type="button" 
                                    onClick={() => handleEditProjectStart(project)} 
                                    className="text-blue-400 hover:bg-blue-900/30 p-1.5 rounded border border-transparent hover:border-blue-900/50"
                                    title="แก้ไข"
                                >
                                    <Edit2 size={16} />
                                </button>
                            </div>
                            </td>
                        </>
                        )}
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
        </>
      )}

      {activeTab === 'groups' && (
        <>
             <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-900 mb-8">
                <h3 className="font-semibold text-purple-300 mb-3 flex items-center gap-2">
                    <FolderPlus size={18} /> เพิ่มกลุ่มงานใหม่ (เช่น งานประจำ, งานนโยบายเร่งด่วน)
                </h3>
                <form onSubmit={handleAddGroup} className="flex gap-3">
                    <input 
                        type="text" 
                        value={newGroupName} 
                        onChange={e => setNewGroupName(e.target.value)}
                        placeholder="ชื่อกลุ่มงาน..."
                        className="flex-grow bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:ring-purple-500"
                        required
                    />
                    <button 
                        type="submit"
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm font-semibold shadow transition whitespace-nowrap"
                    >
                        บันทึกกลุ่มงาน
                    </button>
                </form>
            </div>

            <div className="overflow-hidden border border-gray-700 rounded-lg">
                <table className="w-full text-left text-sm">
                <thead className="bg-gray-700 text-gray-300">
                    <tr>
                    <th className="px-4 py-3 font-semibold border-b border-gray-600">ชื่อกลุ่มงาน</th>
                    <th className="px-4 py-3 font-semibold border-b border-gray-600 w-32 text-center">จำนวนโครงการ</th>
                    <th className="px-4 py-3 font-semibold border-b border-gray-600 w-24 text-center">จัดการ</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {groups.length === 0 && (
                         <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">ยังไม่มีการกำหนดกลุ่มงาน</td></tr>
                    )}
                    {groups.map(group => (
                    <tr key={group.id} className="hover:bg-gray-700/50">
                        {isEditingGroup === group.id ? (
                            <>
                                <td className="px-4 py-2">
                                    <input 
                                        type="text" 
                                        value={editGroupName}
                                        onChange={e => setEditGroupName(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white"
                                    />
                                </td>
                                <td className="px-4 py-2 text-center text-gray-500">-</td>
                                <td className="px-4 py-2 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button type="button" onClick={() => handleEditGroupSave(group)} className="text-green-400 hover:bg-green-900/30 p-1 rounded"><Save size={16} /></button>
                                        <button type="button" onClick={() => setIsEditingGroup(null)} className="text-gray-400 hover:bg-gray-700 p-1 rounded"><X size={16} /></button>
                                    </div>
                                </td>
                            </>
                        ) : (
                            <>
                                <td className="px-4 py-3 font-medium text-gray-200 flex items-center gap-2">
                                   <FolderTree size={16} className="text-purple-400" /> {group.name}
                                </td>
                                <td className="px-4 py-3 text-center text-gray-400">
                                   {projects.filter(p => p.groupId === group.id).length}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button type="button" onClick={() => handleEditGroupStart(group)} className="text-blue-400 hover:bg-blue-900/30 p-1 rounded"><Edit2 size={16} /></button>
                                        <button type="button" onClick={() => handleDeleteGroup(group.id)} className="text-red-400 hover:bg-red-900/30 p-1 rounded"><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </>
                        )}
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
        </>
      )}

      {activeTab === 'trash' && (
        <div className="animate-fade-in">
             <div className="bg-red-900/20 p-4 rounded-lg border border-red-900/50 mb-6 flex items-start gap-3">
                <AlertTriangle className="text-red-500 flex-shrink-0" />
                <div className="text-sm text-red-200">
                    <p className="font-bold">ถังขยะ (Recycle Bin)</p>
                    <p>รายการในถังขยะจะถูกลบถาวรโดยอัตโนมัติหากเกิน 30 วัน ท่านสามารถกู้คืนข้อมูลได้ก่อนระยะเวลาดังกล่าว</p>
                </div>
             </div>

             <div className="overflow-hidden border border-gray-700 rounded-lg">
                <table className="w-full text-left text-sm">
                <thead className="bg-gray-700 text-gray-300">
                    <tr>
                    <th className="px-4 py-3 font-semibold border-b border-gray-600 w-32">ลบเมื่อวันที่</th>
                    <th className="px-4 py-3 font-semibold border-b border-gray-600 w-32 text-center">เหลือเวลา (วัน)</th>
                    <th className="px-4 py-3 font-semibold border-b border-gray-600">ชื่อแผนงาน</th>
                    <th className="px-4 py-3 font-semibold border-b border-gray-600 w-32 text-center">จัดการ</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {deletedProjects.length === 0 && (
                         <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">ถังขยะว่างเปล่า</td></tr>
                    )}
                    {deletedProjects.map(project => (
                    <tr key={project.id} className="hover:bg-red-900/10 bg-red-900/5">
                        <td className="px-4 py-3 text-gray-400">
                           {project.deletedAt ? new Date(project.deletedAt).toLocaleDateString('th-TH') : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                           <span className="bg-red-900 text-red-200 px-2 py-1 rounded text-xs font-bold border border-red-800">
                               {calculateDaysRemaining(project.deletedAt)} วัน
                           </span>
                        </td>
                        <td className="px-4 py-3 text-gray-200 font-medium">
                           {project.name}
                        </td>
                        <td className="px-4 py-3 text-center">
                            <div className="flex justify-center gap-2">
                                <button 
                                    type="button"
                                    onClick={() => handleRestoreProject(project.id)} 
                                    className="text-green-400 hover:bg-green-900/30 p-2 rounded flex items-center gap-1 text-xs font-semibold"
                                    title="กู้คืน"
                                >
                                    <RefreshCw size={14} /> กู้คืน
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => handlePermanentDeleteProject(project.id)} 
                                    className="text-red-400 hover:bg-red-900/30 p-2 rounded flex items-center gap-1 text-xs font-semibold"
                                    title="ลบถาวร"
                                >
                                    <Trash2 size={14} /> ลบ
                                </button>
                            </div>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
             </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManager;