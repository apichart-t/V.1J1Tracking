import React, { useState } from 'react';
import { Unit } from '../types';
import { saveUnit, deleteUnit } from '../services/storageService';
import { Plus, Trash2, Edit2, Save, X, Users, User, Key } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface UnitManagerProps {
  units: Unit[];
  onUpdate: () => void;
}

const UnitManager: React.FC<UnitManagerProps> = ({ units, onUpdate }) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editShortName, setEditShortName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');

  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitShortName, setNewUnitShortName] = useState('');
  const [newUnitUsername, setNewUnitUsername] = useState('');
  const [newUnitPassword, setNewUnitPassword] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitName.trim() || !newUnitShortName.trim() || !newUnitUsername.trim() || !newUnitPassword.trim()) return;

    const newUnit: Unit = {
      id: uuidv4(),
      name: newUnitName,
      shortName: newUnitShortName,
      username: newUnitUsername,
      password: newUnitPassword
    };

    saveUnit(newUnit);
    setNewUnitName('');
    setNewUnitShortName('');
    setNewUnitUsername('');
    setNewUnitPassword('');
    onUpdate();
    alert(`เพิ่มหน่วยงาน ${newUnitShortName} เรียบร้อยแล้ว`);
  };

  const handleEditStart = (unit: Unit) => {
    setIsEditing(unit.id);
    setEditName(unit.name);
    setEditShortName(unit.shortName);
    setEditUsername(unit.username);
    setEditPassword(unit.password || '');
  };

  const handleEditSave = (unit: Unit) => {
    if (!editName.trim() || !editShortName.trim()) return;
    
    saveUnit({ 
        ...unit, 
        name: editName,
        shortName: editShortName,
        username: editUsername,
        password: editPassword
    });
    
    setIsEditing(null);
    onUpdate();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('ยืนยันการลบหน่วยงานนี้? (แผนงานและรายงานที่เกี่ยวข้องอาจแสดงผลชื่อหน่วยผิดพลาด)')) {
      deleteUnit(id);
      onUpdate();
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow p-6 border border-gray-700 animate-fade-in text-gray-100">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Users className="text-blue-500" /> จัดการหน่วยงานและรหัสผ่าน
      </h2>

      {/* Add New Unit */}
      <div className="bg-green-900/20 p-4 rounded-lg border border-green-900 mb-8">
        <h3 className="font-semibold text-green-400 mb-3 flex items-center gap-2">
            <Plus size={18} /> เพิ่มหน่วยงานใหม่
        </h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div className="col-span-1">
              <label className="text-xs text-gray-400 mb-1 block">ชื่อย่อหน่วย</label>
              <input 
                type="text" 
                value={newUnitShortName}
                onChange={e => setNewUnitShortName(e.target.value)}
                placeholder="เช่น กนผ."
                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:ring-green-500"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">ชื่อเต็มหน่วยงาน</label>
              <input 
                type="text" 
                value={newUnitName} 
                onChange={e => setNewUnitName(e.target.value)}
                placeholder="ระบุชื่อเต็มหน่วยงาน..."
                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:ring-green-500"
                required
              />
            </div>
            <div className="col-span-1">
              <label className="text-xs text-gray-400 mb-1 block">Username</label>
              <input 
                type="text" 
                value={newUnitUsername} 
                onChange={e => setNewUnitUsername(e.target.value)}
                placeholder="เช่น user8"
                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:ring-green-500"
                required
              />
            </div>
             <div className="col-span-1">
              <label className="text-xs text-gray-400 mb-1 block">Password</label>
              <input 
                type="text" 
                value={newUnitPassword} 
                onChange={e => setNewUnitPassword(e.target.value)}
                placeholder="รหัสผ่าน"
                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:ring-green-500"
                required
              />
            </div>
            <div className="md:col-span-5 flex justify-end mt-2">
                <button 
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded text-sm font-semibold shadow transition whitespace-nowrap"
                >
                บันทึกหน่วยงาน
                </button>
            </div>
        </form>
      </div>

      {/* List */}
      <div className="overflow-hidden border border-gray-700 rounded-lg">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-700 text-gray-300">
            <tr>
              <th className="px-4 py-3 font-semibold border-b border-gray-600 w-32">ชื่อย่อ</th>
              <th className="px-4 py-3 font-semibold border-b border-gray-600">ชื่อเต็มหน่วยงาน</th>
              <th className="px-4 py-3 font-semibold border-b border-gray-600 w-32">Username</th>
              <th className="px-4 py-3 font-semibold border-b border-gray-600 w-32">Password</th>
              <th className="px-4 py-3 font-semibold border-b border-gray-600 w-24 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {units.map(unit => (
              <tr key={unit.id} className="hover:bg-gray-700/50">
                {isEditing === unit.id ? (
                  <>
                    <td className="px-4 py-2 align-top">
                        <input 
                            type="text" 
                            value={editShortName}
                            onChange={e => setEditShortName(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white"
                        />
                    </td>
                    <td className="px-4 py-2 align-top">
                      <input 
                        type="text" 
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white"
                      />
                    </td>
                    <td className="px-4 py-2 align-top">
                       <input 
                        type="text" 
                        value={editUsername}
                        onChange={e => setEditUsername(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white"
                      />
                    </td>
                    <td className="px-4 py-2 align-top">
                       <input 
                        type="text" 
                        value={editPassword}
                        onChange={e => setEditPassword(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white"
                      />
                    </td>
                    <td className="px-4 py-2 align-top text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleEditSave(unit)} className="text-green-400 hover:bg-green-900/30 p-1 rounded"><Save size={16} /></button>
                        <button onClick={() => setIsEditing(null)} className="text-gray-400 hover:bg-gray-700 p-1 rounded"><X size={16} /></button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 align-top text-blue-400 font-bold">
                        {unit.shortName}
                    </td>
                    <td className="px-4 py-3 align-top text-gray-200">
                      {unit.name}
                    </td>
                    <td className="px-4 py-3 align-top text-gray-500">
                      <div className="flex items-center gap-1"><User size={12} /> {unit.username}</div>
                    </td>
                    <td className="px-4 py-3 align-top text-gray-600">
                      <div className="flex items-center gap-1"><Key size={12} /> ******</div>
                    </td>
                    <td className="px-4 py-3 align-top text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleEditStart(unit)} className="text-blue-400 hover:bg-blue-900/30 p-1 rounded"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(unit.id)} className="text-red-400 hover:bg-red-900/30 p-1 rounded"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UnitManager;