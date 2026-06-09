import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  end_date?: string;
  location?: string;
  event_type: 'academic' | 'sports' | 'cultural' | 'holiday' | 'meeting';
  audience: 'all' | 'students' | 'teachers' | 'parents';
  created_at: string;
}

const emptyForm = {
  title: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  end_date: '',
  location: '',
  event_type: 'academic' as Event['event_type'],
  audience: 'all' as Event['audience'],
};

const typeConfig: Record<string, { icon: string; color: string; bg: string }> = {
  academic: { icon: '📚', color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
  sports:   { icon: '⚽', color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
  cultural: { icon: '🎭', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
  holiday:  { icon: '🎉', color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
  meeting:  { icon: '👥', color: '#0891b2', bg: 'rgba(8,145,178,0.1)' },
};

const audienceConfig: Record<string, { label: string; color: string; bg: string }> = {
  all:      { label: 'Everyone',  color: '#2c2c2c', bg: 'rgba(44,44,44,0.08)' },
  students: { label: 'Students',  color: '#2563eb', bg: 'rgba(37,99,235,0.08)' },
  teachers: { label: 'Teachers',  color: '#16a34a', bg: 'rgba(22,163,74,0.08)' },
  parents:  { label: 'Parents',   color: '#d97706', bg: 'rgba(217,119,6,0.08)' },
};

const inputClass = "w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 focus:outline-none bg-gray-50 transition-all";
const inputStyle = { fontSize: '16px' };

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterAudience, setFilterAudience] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });
    setEvents(data || []);
    setLoading(false);
  };

  const openAddModal = () => {
    setEditingEvent(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (event: Event) => {
    setEditingEvent(event);
    setForm({
      title: event.title,
      description: event.description || '',
      date: event.date,
      end_date: event.end_date || '',
      location: event.location || '',
      event_type: event.event_type,
      audience: event.audience,
    });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEvent(null);
    setForm(emptyForm);
    setError('');
  };

  const handleSave = async () => {
    if (!form.title || !form.date) {
      setError('Title and date are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        date: form.date,
        end_date: form.end_date || null,
        location: form.location || null,
        event_type: form.event_type,
        audience: form.audience,
      };
      if (editingEvent) {
        const { error } = await supabase.from('events').update(payload).eq('id', editingEvent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('events').insert(payload);
        if (error) throw error;
      }
      await fetchEvents();
      closeModal();
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    await supabase.from('events').delete().eq('id', id);
    await fetchEvents();
  };

  const today = new Date().toISOString().split('T')[0];
  const upcoming = events.filter((e) => e.date >= today);
  const past = events.filter((e) => e.date < today);

  const filtered = events.filter((e) => {
    const matchSearch = search === '' ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.location && e.location.toLowerCase().includes(search.toLowerCase()));
    const matchType = filterType === '' || e.event_type === filterType;
    const matchAudience = filterAudience === '' || e.audience === filterAudience;
    return matchSearch && matchType && matchAudience;
  });

  const upcomingFiltered = filtered.filter((e) => e.date >= today);
  const pastFiltered = filtered.filter((e) => e.date < today);

  const EventCard = ({ event }: { event: Event }) => {
    const tc = typeConfig[event.event_type];
    const ac = audienceConfig[event.audience];
    const isPast = event.date < today;
    const eventDate = new Date(event.date);

    return (
      <div
        className={`rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 ${isPast ? 'opacity-60' : ''}`}
        style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: `1px solid ${isPast ? 'rgba(0,0,0,0.04)' : 'rgba(0,0,0,0.06)'}` }}
      >
        <div className="flex gap-4">
          {/* Date Block */}
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center"
            style={{ background: isPast ? '#f3f4f6' : 'linear-gradient(135deg, #2c2c2c, #3a3a3a)' }}>
            <p className={`text-xs font-semibold ${isPast ? 'text-gray-400' : 'text-gray-300'}`}>
              {eventDate.toLocaleDateString('en-GB', { month: 'short' })}
            </p>
            <p className={`text-xl font-black leading-none ${isPast ? 'text-gray-500' : 'text-white'}`}>
              {eventDate.getDate()}
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-black text-gray-900 leading-tight">{event.title}</h3>
              <span className="text-lg flex-shrink-0">{tc.icon}</span>
            </div>

            {event.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{event.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold capitalize"
                style={{ background: tc.bg, color: tc.color }}>
                {event.event_type}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                style={{ background: ac.bg, color: ac.color }}>
                {ac.label}
              </span>
              {event.location && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  📍 {event.location}
                </span>
              )}
              {event.end_date && event.end_date !== event.date && (
                <span className="text-xs text-gray-400">
                  → {new Date(event.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
          <button onClick={() => openEditModal(event)}
            className="flex-1 text-xs py-2 rounded-xl font-semibold transition-all hover:-translate-y-0.5"
            style={{ background: 'rgba(212,175,55,0.1)', color: '#B8860B' }}>
            Edit
          </button>
          <button onClick={() => handleDelete(event.id)}
            className="flex-1 text-xs py-2 rounded-xl font-semibold bg-red-50 text-red-500 hover:-translate-y-0.5 transition-all">
            Delete
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="rounded-2xl p-6 flex items-center justify-between relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #2c2c2c 0%, #3a3a3a 50%, #454545 100%)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div className="absolute right-0 top-0 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #D4AF37, transparent)', transform: 'translate(20%, -20%)' }} />
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-white">Events</h1>
          <p className="text-sm mt-1" style={{ color: '#D4AF37' }}>
            {upcoming.length} upcoming · {past.length} past events
          </p>
        </div>
        <button onClick={openAddModal}
          className="relative z-10 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)', color: '#2c2c2c', boxShadow: '0 4px 16px rgba(212,175,55,0.4)' }}>
          + Add Event
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total',    value: events.length,                                       color: '#2c2c2c' },
          { label: 'Upcoming', value: upcoming.length,                                     color: '#D4AF37' },
          { label: 'Academic', value: events.filter(e => e.event_type === 'academic').length, color: '#2563eb' },
          { label: 'Sports',   value: events.filter(e => e.event_type === 'sports').length,   color: '#16a34a' },
          { label: 'Holiday',  value: events.filter(e => e.event_type === 'holiday').length,  color: '#d97706' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-4 text-center"
            style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <p className="text-2xl font-black" style={{ color }}>{value}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-2xl p-4"
        style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="relative col-span-2 md:col-span-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">🔍</span>
            <input type="text" placeholder="Search events..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className={inputClass} style={{ ...inputStyle, paddingLeft: '2.2rem' }} />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className={inputClass} style={inputStyle}>
            <option value="">All Types</option>
            <option value="academic">📚 Academic</option>
            <option value="sports">⚽ Sports</option>
            <option value="cultural">🎭 Cultural</option>
            <option value="holiday">🎉 Holiday</option>
            <option value="meeting">👥 Meeting</option>
          </select>
          <select value={filterAudience} onChange={(e) => setFilterAudience(e.target.value)}
            className={inputClass} style={inputStyle}>
            <option value="">All Audiences</option>
            <option value="all">Everyone</option>
            <option value="students">Students</option>
            <option value="teachers">Teachers</option>
            <option value="parents">Parents</option>
          </select>
        </div>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="flex items-center justify-center h-48 rounded-2xl bg-white"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: '#D4AF37', borderTopColor: 'transparent' }}></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-white"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p className="text-5xl mb-3">📅</p>
          <p className="font-bold text-gray-600">No events found</p>
          <p className="text-sm text-gray-400 mt-1">Add your first school event to get started</p>
          <button onClick={openAddModal} className="mt-4 px-5 py-2 rounded-xl text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)', color: '#2c2c2c' }}>
            + Add Event
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upcoming Events */}
          {upcomingFiltered.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-6 rounded-full" style={{ background: '#D4AF37' }}></div>
                <h2 className="font-black text-gray-800">Upcoming Events</h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(212,175,55,0.1)', color: '#B8860B' }}>
                  {upcomingFiltered.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingFiltered.map((event) => <EventCard key={event.id} event={event} />)}
              </div>
            </div>
          )}

          {/* Past Events */}
          {pastFiltered.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-6 rounded-full bg-gray-300"></div>
                <h2 className="font-black text-gray-500">Past Events</h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-500">
                  {pastFiltered.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pastFiltered.map((event) => <EventCard key={event.id} event={event} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}>

            <div className="p-6 rounded-t-3xl" style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)', color: '#2c2c2c' }}>
                  📅
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">
                    {editingEvent ? 'Edit Event' : 'Add New Event'}
                  </h2>
                  <p className="text-gray-400 text-xs mt-0.5">Fill in the event details below</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Event Title <span className="text-red-400">*</span>
                </label>
                <input type="text" value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Annual Sports Day"
                  className={inputClass} style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.background = '#fff'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#f3f4f6'; e.target.style.background = '#f9fafb'; }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Description</label>
                <textarea value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of the event..."
                  rows={3} className={inputClass} style={{ ...inputStyle, resize: 'none' }}
                  onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.background = '#fff'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#f3f4f6'; e.target.style.background = '#f9fafb'; }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Start Date <span className="text-red-400">*</span>
                  </label>
                  <input type="date" value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">End Date</label>
                  <input type="date" value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className={inputClass} style={inputStyle} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Location</label>
                <input type="text" value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. School Compound, Assembly Hall"
                  className={inputClass} style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.background = '#fff'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#f3f4f6'; e.target.style.background = '#f9fafb'; }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Event Type</label>
                  <select value={form.event_type}
                    onChange={(e) => setForm({ ...form, event_type: e.target.value as Event['event_type'] })}
                    className={inputClass} style={inputStyle}>
                    <option value="academic">📚 Academic</option>
                    <option value="sports">⚽ Sports</option>
                    <option value="cultural">🎭 Cultural</option>
                    <option value="holiday">🎉 Holiday</option>
                    <option value="meeting">👥 Meeting</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Audience</label>
                  <select value={form.audience}
                    onChange={(e) => setForm({ ...form, audience: e.target.value as Event['audience'] })}
                    className={inputClass} style={inputStyle}>
                    <option value="all">Everyone</option>
                    <option value="students">Students Only</option>
                    <option value="teachers">Teachers Only</option>
                    <option value="parents">Parents Only</option>
                  </select>
                </div>
              </div>

              {/* Preview */}
              {form.title && (
                <div className="p-4 rounded-xl"
                  style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)' }}>
                  <p className="text-xs text-gray-400 mb-2 font-bold uppercase tracking-wide">Preview</p>
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)' }}>
                      <p className="text-xs text-gray-300">
                        {form.date ? new Date(form.date).toLocaleDateString('en-GB', { month: 'short' }) : 'Mon'}
                      </p>
                      <p className="text-lg font-black text-white leading-none">
                        {form.date ? new Date(form.date).getDate() : '?'}
                      </p>
                    </div>
                    <div>
                      <p className="font-black text-gray-800">{form.title}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: typeConfig[form.event_type].bg, color: typeConfig[form.event_type].color }}>
                          {typeConfig[form.event_type].icon} {form.event_type}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: audienceConfig[form.audience].bg, color: audienceConfig[form.audience].color }}>
                          {audienceConfig[form.audience].label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 pb-6 flex gap-3 justify-end border-t border-gray-100 pt-4">
              <button onClick={closeModal}
                className="px-5 py-2.5 text-sm text-gray-500 border-2 border-gray-100 rounded-xl hover:bg-gray-50 transition-colors font-medium">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-2.5 text-sm rounded-xl transition-all disabled:opacity-60 font-bold hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)', color: '#D4AF37', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
                {saving ? 'Saving...' : editingEvent ? 'Update Event' : 'Add Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
