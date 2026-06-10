import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Subject {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

interface AcademicYear {
  id: string;
  year_name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

interface GradeLevel {
  id: string;
  name: string;
  level_order: number;
  is_active: boolean;
}

interface ClassSection {
  id: string;
  name: string;
  is_active: boolean;
}

const inputClass = "w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 focus:outline-none bg-gray-50 transition-all";
const inputStyle = { fontSize: '16px' };

const tabs = [
  { id: 'school',    label: 'School Profile',   icon: '🏫' },
  { id: 'academic',  label: 'Academic Years',    icon: '📅' },
  { id: 'subjects',  label: 'Subjects',          icon: '📚' },
  { id: 'classes',   label: 'Grade & Sections',  icon: '🏷️' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('school');

  // School Profile
  const [schoolName, setSchoolName] = useState('Glowing Future Academy');
  const [schoolMotto, setSchoolMotto] = useState('Glow With Pride');
  const [schoolAddress, setSchoolAddress] = useState('');
  const [schoolPhone, setSchoolPhone] = useState('');
  const [schoolEmail, setSchoolEmail] = useState('');
  const [schoolSaved, setSchoolSaved] = useState(false);

  // Academic Years
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [showYearForm, setShowYearForm] = useState(false);
  const [yearForm, setYearForm] = useState({ year_name: '', start_date: '', end_date: '' });
  const [savingYear, setSavingYear] = useState(false);

  // Subjects
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newSubject, setNewSubject] = useState('');
  const [newSubjectDesc, setNewSubjectDesc] = useState('');
  const [savingSubject, setSavingSubject] = useState(false);

  // Grade Levels
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [newGradeLevel, setNewGradeLevel] = useState('');
  const [savingGrade, setSavingGrade] = useState(false);

  // Class Sections
  const [classSections, setClassSections] = useState<ClassSection[]>([]);
  const [newSection, setNewSection] = useState('');
  const [savingSection, setSavingSection] = useState(false);

  useEffect(() => {
    fetchAcademicYears();
    fetchSubjects();
    fetchGradeLevels();
    fetchClassSections();
    loadSchoolProfile();
  }, []);

  const loadSchoolProfile = () => {
    const saved = localStorage.getItem('gfa_school_profile');
    if (saved) {
      const profile = JSON.parse(saved);
      setSchoolName(profile.name || 'Glowing Future Academy');
      setSchoolMotto(profile.motto || 'Glow With Pride');
      setSchoolAddress(profile.address || '');
      setSchoolPhone(profile.phone || '');
      setSchoolEmail(profile.email || '');
    }
  };

  const saveSchoolProfile = () => {
    const profile = {
      name: schoolName, motto: schoolMotto,
      address: schoolAddress, phone: schoolPhone, email: schoolEmail,
    };
    localStorage.setItem('gfa_school_profile', JSON.stringify(profile));
    setSchoolSaved(true);
    setTimeout(() => setSchoolSaved(false), 3000);
  };

  const fetchAcademicYears = async () => {
    const { data } = await supabase.from('academic_years').select('*').order('year_name', { ascending: false });
    setAcademicYears(data || []);
  };

  const fetchSubjects = async () => {
    const { data } = await supabase.from('subjects').select('*').order('name');
    setSubjects(data || []);
  };

  const setCurrentYear = async (id: string) => {
    await supabase.from('academic_years').update({ is_current: false }).neq('id', id);
    await supabase.from('academic_years').update({ is_current: true }).eq('id', id);
    await fetchAcademicYears();
  };

  const saveAcademicYear = async () => {
    if (!yearForm.year_name || !yearForm.start_date || !yearForm.end_date) return;
    setSavingYear(true);
    try {
      await supabase.from('academic_years').insert({
        year_name: yearForm.year_name,
        start_date: yearForm.start_date,
        end_date: yearForm.end_date,
        is_current: false,
      });
      setYearForm({ year_name: '', start_date: '', end_date: '' });
      setShowYearForm(false);
      await fetchAcademicYears();
    } finally {
      setSavingYear(false);
    }
  };

  const deleteAcademicYear = async (id: string) => {
    if (!confirm('Delete this academic year?')) return;
    await supabase.from('academic_years').delete().eq('id', id);
    await fetchAcademicYears();
  };

  const addSubject = async () => {
    if (!newSubject.trim()) return;
    setSavingSubject(true);
    try {
      await supabase.from('subjects').insert({
        name: newSubject.trim(),
        description: newSubjectDesc.trim() || null,
        is_active: true,
      });
      setNewSubject('');
      setNewSubjectDesc('');
      await fetchSubjects();
    } finally {
      setSavingSubject(false);
    }
  };

  const toggleSubjectStatus = async (id: string, is_active: boolean) => {
    await supabase.from('subjects').update({ is_active: !is_active }).eq('id', id);
    await fetchSubjects();
  };

  const deleteSubject = async (id: string) => {
    if (!confirm('Delete this subject?')) return;
    await supabase.from('subjects').delete().eq('id', id);
    await fetchSubjects();
  };

  const fetchGradeLevels = async () => {
    const { data } = await supabase.from('grade_levels').select('*').order('level_order');
    setGradeLevels(data || []);
  };

  const fetchClassSections = async () => {
    const { data } = await supabase.from('class_sections').select('*').order('name');
    setClassSections(data || []);
  };

  const addGradeLevel = async () => {
    if (!newGradeLevel.trim()) return;
    setSavingGrade(true);
    try {
      const nextOrder = gradeLevels.length > 0
        ? Math.max(...gradeLevels.map((g) => g.level_order)) + 1
        : 1;
      const { error } = await supabase.from('grade_levels').insert({
        name: newGradeLevel.trim(),
        level_order: nextOrder,
        is_active: true,
      });
      if (!error) {
        setNewGradeLevel('');
        await fetchGradeLevels();
      }
    } finally {
      setSavingGrade(false);
    }
  };

  const deleteGradeLevel = async (id: string) => {
    if (!confirm('Delete this grade level? This may affect existing classes.')) return;
    await supabase.from('grade_levels').delete().eq('id', id);
    await fetchGradeLevels();
  };

  const addSection = async () => {
    if (!newSection.trim()) return;
    setSavingSection(true);
    try {
      const { error } = await supabase.from('class_sections').insert({
        name: newSection.trim().toUpperCase(),
        is_active: true,
      });
      if (!error) {
        setNewSection('');
        await fetchClassSections();
      }
    } finally {
      setSavingSection(false);
    }
  };

  const deleteSection = async (id: string) => {
    if (!confirm('Delete this section? This may affect existing classes.')) return;
    await supabase.from('class_sections').delete().eq('id', id);
    await fetchClassSections();
  };

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="rounded-2xl p-6 flex items-center justify-between relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #2c2c2c 0%, #3a3a3a 50%, #454545 100%)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div className="absolute right-0 top-0 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #D4AF37, transparent)', transform: 'translate(20%, -20%)' }} />
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-white">Settings</h1>
          <p className="text-sm mt-1" style={{ color: '#D4AF37' }}>
            Configure your school management system
          </p>
        </div>
        <div className="relative z-10 hidden md:flex items-center justify-center w-16 h-16 rounded-2xl"
          style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)' }}>
          <span className="text-2xl">⚙️</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="rounded-2xl p-4 text-center transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: activeTab === tab.id ? 'linear-gradient(135deg, #2c2c2c, #3a3a3a)' : '#fff',
              boxShadow: activeTab === tab.id ? '0 8px 24px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)',
              border: activeTab === tab.id ? '1px solid #D4AF37' : '1px solid rgba(0,0,0,0.06)',
            }}>
            <p className="text-xl mb-1">{tab.icon}</p>
            <p className="text-xs font-bold" style={{ color: activeTab === tab.id ? '#D4AF37' : '#374151' }}>
              {tab.label}
            </p>
          </button>
        ))}
      </div>

      {/* ── SCHOOL PROFILE ── */}
      {activeTab === 'school' && (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="p-5 border-b border-gray-100"
            style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)' }}>
            <h2 className="font-black text-white">🏫 School Profile</h2>
            <p className="text-gray-400 text-xs mt-0.5">Basic information about your school</p>
          </div>
          <div className="p-6 space-y-4">

            {/* Logo Preview */}
            <div className="flex items-center gap-4 p-4 rounded-xl"
              style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0"
                style={{ border: '2px solid rgba(212,175,55,0.5)' }}>
                <img src="/images/gfa-logo.jpeg" alt="GFA Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-black text-gray-800">{schoolName}</p>
                <p className="text-sm italic text-gray-500">{schoolMotto}</p>
                <p className="text-xs text-gray-400 mt-1">Logo: /public/images/gfa-logo.jpeg</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">School Name</label>
                <input type="text" value={schoolName} onChange={(e) => setSchoolName(e.target.value)}
                  className={inputClass} style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.background = '#fff'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#f3f4f6'; e.target.style.background = '#f9fafb'; }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Motto</label>
                <input type="text" value={schoolMotto} onChange={(e) => setSchoolMotto(e.target.value)}
                  className={inputClass} style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.background = '#fff'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#f3f4f6'; e.target.style.background = '#f9fafb'; }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Phone</label>
                <input type="text" value={schoolPhone} onChange={(e) => setSchoolPhone(e.target.value)}
                  placeholder="+220 XXX XXXX"
                  className={inputClass} style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.background = '#fff'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#f3f4f6'; e.target.style.background = '#f9fafb'; }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Email</label>
                <input type="email" value={schoolEmail} onChange={(e) => setSchoolEmail(e.target.value)}
                  placeholder="info@gfa.edu.gm"
                  className={inputClass} style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.background = '#fff'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#f3f4f6'; e.target.style.background = '#f9fafb'; }}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Address</label>
                <textarea value={schoolAddress} onChange={(e) => setSchoolAddress(e.target.value)}
                  placeholder="School physical address" rows={2}
                  className={inputClass} style={{ ...inputStyle, resize: 'none' }}
                  onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.background = '#fff'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#f3f4f6'; e.target.style.background = '#f9fafb'; }}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={saveSchoolProfile}
                className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
                style={{
                  background: schoolSaved ? 'rgba(22,163,74,0.1)' : 'linear-gradient(135deg, #2c2c2c, #3a3a3a)',
                  color: schoolSaved ? '#16a34a' : '#D4AF37',
                  boxShadow: schoolSaved ? 'none' : '0 4px 16px rgba(0,0,0,0.3)',
                }}>
                {schoolSaved ? '✅ Saved!' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ACADEMIC YEARS ── */}
      {activeTab === 'academic' && (
        <div className="space-y-4">
          <div className="rounded-2xl overflow-hidden"
            style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div className="p-5 flex items-center justify-between border-b border-gray-100"
              style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)' }}>
              <div>
                <h2 className="font-black text-white">📅 Academic Years</h2>
                <p className="text-gray-400 text-xs mt-0.5">Manage school academic years and terms</p>
              </div>
              <button onClick={() => setShowYearForm(!showYearForm)}
                className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
                style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)', color: '#2c2c2c' }}>
                + Add Year
              </button>
            </div>

            {showYearForm && (
              <div className="p-5 border-b border-gray-100"
                style={{ background: 'rgba(212,175,55,0.04)' }}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Year Name</label>
                    <input type="text" value={yearForm.year_name}
                      onChange={(e) => setYearForm({ ...yearForm, year_name: e.target.value })}
                      placeholder="e.g. 2025-2026"
                      className={inputClass} style={inputStyle}
                      onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.background = '#fff'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#f3f4f6'; e.target.style.background = '#f9fafb'; }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Start Date</label>
                    <input type="date" value={yearForm.start_date}
                      onChange={(e) => setYearForm({ ...yearForm, start_date: e.target.value })}
                      className={inputClass} style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">End Date</label>
                    <input type="date" value={yearForm.end_date}
                      onChange={(e) => setYearForm({ ...yearForm, end_date: e.target.value })}
                      className={inputClass} style={inputStyle} />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowYearForm(false)}
                    className="px-4 py-2 text-sm text-gray-500 border-2 border-gray-100 rounded-xl hover:bg-gray-50 font-medium">
                    Cancel
                  </button>
                  <button onClick={saveAcademicYear} disabled={savingYear}
                    className="px-5 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)', color: '#D4AF37' }}>
                    {savingYear ? 'Saving...' : 'Save Year'}
                  </button>
                </div>
              </div>
            )}

            <div className="divide-y divide-gray-50">
              {academicYears.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-3xl mb-2">📅</p>
                  <p className="text-sm">No academic years yet</p>
                </div>
              ) : academicYears.map((year) => (
                <div key={year.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm"
                      style={{
                        background: year.is_current ? 'linear-gradient(135deg, #D4AF37, #F5C842)' : '#f3f4f6',
                        color: year.is_current ? '#2c2c2c' : '#9ca3af',
                      }}>
                      {year.is_current ? '★' : '○'}
                    </div>
                    <div>
                      <p className="font-black text-gray-800">{year.year_name}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(year.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' → '}
                        {new Date(year.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    {year.is_current && (
                      <span className="text-xs px-2.5 py-1 rounded-full font-bold"
                        style={{ background: 'rgba(212,175,55,0.15)', color: '#B8860B' }}>
                        Current
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!year.is_current && (
                      <button onClick={() => setCurrentYear(year.id)}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                        style={{ background: 'rgba(212,175,55,0.1)', color: '#B8860B' }}>
                        Set Current
                      </button>
                    )}
                    <button onClick={() => deleteAcademicYear(year.id)}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium bg-red-50 text-red-500">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SUBJECTS ── */}
      {activeTab === 'subjects' && (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="p-5 border-b border-gray-100"
            style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)' }}>
            <h2 className="font-black text-white">📚 Subjects Management</h2>
            <p className="text-gray-400 text-xs mt-0.5">
              Add or remove subjects · {subjects.filter(s => s.is_active).length} active subjects
            </p>
          </div>

          {/* Add Subject Form */}
          <div className="p-5 border-b border-gray-100" style={{ background: 'rgba(212,175,55,0.04)' }}>
            <p className="text-xs font-bold text-gray-600 mb-3 uppercase tracking-wide">Add New Subject</p>
            <div className="flex gap-3">
              <input type="text" value={newSubject} onChange={(e) => setNewSubject(e.target.value)}
                placeholder="Subject name e.g. Computer Science"
                className={`flex-1 ${inputClass}`} style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.background = '#fff'; }}
                onBlur={(e) => { e.target.style.borderColor = '#f3f4f6'; e.target.style.background = '#f9fafb'; }}
                onKeyDown={(e) => { if (e.key === 'Enter') addSubject(); }}
              />
              <button onClick={addSubject} disabled={savingSubject || !newSubject.trim()}
                className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)', color: '#2c2c2c', boxShadow: '0 4px 16px rgba(212,175,55,0.4)' }}>
                {savingSubject ? '...' : '+ Add'}
              </button>
            </div>
          </div>

          {/* Subjects List */}
          <div className="divide-y divide-gray-50">
            {subjects.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-3xl mb-2">📚</p>
                <p className="text-sm">No subjects yet</p>
              </div>
            ) : subjects.map((subject, idx) => (
              <div key={subject.id}
                className="px-5 py-3.5 flex items-center justify-between transition-colors hover:bg-gray-50"
                style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black"
                    style={{
                      background: subject.is_active ? 'linear-gradient(135deg, #2c2c2c, #3a3a3a)' : '#f3f4f6',
                      color: subject.is_active ? '#D4AF37' : '#9ca3af',
                    }}>
                    {subject.name[0]}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${subject.is_active ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                      {subject.name}
                    </p>
                    {subject.description && (
                      <p className="text-xs text-gray-400">{subject.description}</p>
                    )}
                  </div>
                  {!subject.is_active && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 font-medium">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleSubjectStatus(subject.id, subject.is_active)}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                    style={subject.is_active
                      ? { background: 'rgba(212,175,55,0.1)', color: '#B8860B' }
                      : { background: 'rgba(22,163,74,0.1)', color: '#16a34a' }
                    }>
                    {subject.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => deleteSubject(subject.id)}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium bg-red-50 text-red-500">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── GRADE & SECTIONS ── */}
      {activeTab === 'classes' && (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="p-5 border-b border-gray-100"
            style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)' }}>
            <h2 className="font-black text-white">🏷️ Grade Levels & Sections</h2>
            <p className="text-gray-400 text-xs mt-0.5">
              {gradeLevels.length} grade levels · {classSections.length} sections — changes apply immediately to Classes page
            </p>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* ── Grade Levels ── */}
            <div>
              <p className="text-xs font-bold text-gray-600 mb-3 uppercase tracking-wide">Grade Levels</p>

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newGradeLevel}
                  onChange={(e) => setNewGradeLevel(e.target.value)}
                  placeholder="e.g. Grade 7, KG1, Nursery"
                  className={`flex-1 ${inputClass}`}
                  style={inputStyle}
                  onKeyDown={(e) => { if (e.key === 'Enter') addGradeLevel(); }}
                  onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.background = '#fff'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#f3f4f6'; e.target.style.background = '#f9fafb'; }}
                />
                <button onClick={addGradeLevel} disabled={savingGrade || !newGradeLevel.trim()}
                  className="px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50 hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)', color: '#2c2c2c', boxShadow: '0 4px 16px rgba(212,175,55,0.3)', whiteSpace: 'nowrap' }}>
                  {savingGrade ? '...' : '+ Add'}
                </button>
              </div>

              <div className="space-y-2">
                {gradeLevels.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No grade levels yet</p>
                ) : gradeLevels.map((grade, idx) => (
                  <div key={grade.id} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: idx % 2 === 0 ? '#f9fafb' : '#fff', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)', color: '#D4AF37' }}>
                      {grade.level_order}
                    </div>
                    <span className="flex-1 text-sm font-semibold text-gray-700">{grade.name}</span>
                    <button onClick={() => deleteGradeLevel(grade.id)}
                      className="text-xs px-2.5 py-1.5 rounded-lg font-medium bg-red-50 text-red-400 hover:text-red-600 hover:bg-red-100 transition-all flex-shrink-0">
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Class Sections ── */}
            <div>
              <p className="text-xs font-bold text-gray-600 mb-3 uppercase tracking-wide">Class Sections</p>

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  placeholder="e.g. E, F, Gold, Blue"
                  className={`flex-1 ${inputClass}`}
                  style={inputStyle}
                  onKeyDown={(e) => { if (e.key === 'Enter') addSection(); }}
                  onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.background = '#fff'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#f3f4f6'; e.target.style.background = '#f9fafb'; }}
                />
                <button onClick={addSection} disabled={savingSection || !newSection.trim()}
                  className="px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50 hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)', color: '#2c2c2c', boxShadow: '0 4px 16px rgba(212,175,55,0.3)', whiteSpace: 'nowrap' }}>
                  {savingSection ? '...' : '+ Add'}
                </button>
              </div>

              <div className="space-y-2">
                {classSections.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No sections yet</p>
                ) : classSections.map((section, idx) => (
                  <div key={section.id} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: idx % 2 === 0 ? '#f9fafb' : '#fff', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)', color: '#2c2c2c' }}>
                      {section.name}
                    </div>
                    <span className="flex-1 text-sm font-semibold text-gray-700">Section {section.name}</span>
                    <button onClick={() => deleteSection(section.id)}
                      className="text-xs px-2.5 py-1.5 rounded-lg font-medium bg-red-50 text-red-400 hover:text-red-600 hover:bg-red-100 transition-all flex-shrink-0">
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
