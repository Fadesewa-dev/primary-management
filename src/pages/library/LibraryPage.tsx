import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Book {
  id: string;
  isbn?: string;
  title: string;
  author: string;
  category?: string;
  total_copies: number;
  available_copies: number;
  published_year?: number;
  created_at: string;
}

const emptyForm = {
  isbn: '',
  title: '',
  author: '',
  category: 'Mathematics',
  total_copies: 1,
  available_copies: 1,
  published_year: new Date().getFullYear(),
};

const categories = [
  'Mathematics', 'English', 'Science', 'Social Studies',
  'Arabic', 'French', 'Arts & Craft', 'Music', 'ICT',
  'Religious Studies', 'Home Economics', 'Reference', 'Fiction', 'Other',
];

const inputClass = "w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 focus:outline-none bg-gray-50 transition-all";
const inputStyle = { fontSize: '16px' };

const categoryColors: Record<string, string> = {
  'Mathematics':       '#2563eb',
  'English':           '#16a34a',
  'Science':           '#7c3aed',
  'Social Studies':    '#d97706',
  'Arabic':            '#dc2626',
  'French':            '#0891b2',
  'Arts & Craft':      '#db2777',
  'Music':             '#65a30d',
  'ICT':               '#0f766e',
  'Religious Studies': '#92400e',
  'Home Economics':    '#be185d',
  'Reference':         '#475569',
  'Fiction':           '#b45309',
  'Other':             '#6b7280',
};

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterAvailability, setFilterAvailability] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchBooks(); }, []);

  const fetchBooks = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('library_books')
      .select('*')
      .order('title', { ascending: true });
    setBooks(data || []);
    setLoading(false);
  };

  const openAddModal = () => {
    setEditingBook(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setForm({
      isbn: book.isbn || '',
      title: book.title,
      author: book.author,
      category: book.category || 'Other',
      total_copies: book.total_copies,
      available_copies: book.available_copies,
      published_year: book.published_year || new Date().getFullYear(),
    });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBook(null);
    setForm(emptyForm);
    setError('');
  };

  const handleSave = async () => {
    if (!form.title || !form.author) {
      setError('Title and author are required.');
      return;
    }
    if (form.available_copies > form.total_copies) {
      setError('Available copies cannot exceed total copies.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        isbn: form.isbn || null,
        title: form.title,
        author: form.author,
        category: form.category,
        total_copies: form.total_copies,
        available_copies: form.available_copies,
        published_year: form.published_year || null,
      };
      if (editingBook) {
        const { error } = await supabase.from('library_books').update(payload).eq('id', editingBook.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('library_books').insert(payload);
        if (error) throw error;
      }
      await fetchBooks();
      closeModal();
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this book?')) return;
    await supabase.from('library_books').delete().eq('id', id);
    await fetchBooks();
  };

  const filtered = books.filter((b) => {
    const matchSearch = search === '' ||
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase()) ||
      (b.isbn && b.isbn.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = filterCategory === '' || b.category === filterCategory;
    const matchAvailability =
      filterAvailability === '' ||
      (filterAvailability === 'available' && b.available_copies > 0) ||
      (filterAvailability === 'unavailable' && b.available_copies === 0);
    return matchSearch && matchCategory && matchAvailability;
  });

  const totalBooks = books.reduce((s, b) => s + b.total_copies, 0);
  const totalAvailable = books.reduce((s, b) => s + b.available_copies, 0);
  const totalBorrowed = totalBooks - totalAvailable;
  

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="rounded-2xl p-6 flex items-center justify-between relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #2c2c2c 0%, #3a3a3a 50%, #454545 100%)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div className="absolute right-0 top-0 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #D4AF37, transparent)', transform: 'translate(20%, -20%)' }} />
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-white">Library</h1>
          <p className="text-sm mt-1" style={{ color: '#D4AF37' }}>
            {books.length} books · {totalAvailable} available
          </p>
        </div>
        <button onClick={openAddModal}
          className="relative z-10 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)', color: '#2c2c2c', boxShadow: '0 4px 16px rgba(212,175,55,0.4)' }}>
          + Add Book
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Books',    value: books.length,    color: '#2c2c2c' },
          { label: 'Total Copies',   value: totalBooks,      color: '#2563eb' },
          { label: 'Available',      value: totalAvailable,  color: '#16a34a' },
          { label: 'Borrowed',       value: totalBorrowed,   color: '#d97706' },
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
            <input type="text" placeholder="Search title, author, ISBN..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className={inputClass} style={{ ...inputStyle, paddingLeft: '2.2rem' }} />
          </div>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
            className={inputClass} style={inputStyle}>
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterAvailability} onChange={(e) => setFilterAvailability(e.target.value)}
            className={inputClass} style={inputStyle}>
            <option value="">All Availability</option>
            <option value="available">Available</option>
            <option value="unavailable">All Borrowed</option>
          </select>
        </div>
      </div>

      {/* Books Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48 rounded-2xl bg-white"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: '#D4AF37', borderTopColor: 'transparent' }}></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-white"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p className="text-5xl mb-3">📚</p>
          <p className="font-bold text-gray-600">No books found</p>
          <p className="text-sm text-gray-400 mt-1">Add your first book to get started</p>
          <button onClick={openAddModal} className="mt-4 px-5 py-2 rounded-xl text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)', color: '#2c2c2c' }}>
            + Add Book
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((book) => {
            const catColor = categoryColors[book.category || 'Other'] || '#6b7280';
            const availPct = book.total_copies > 0
              ? Math.round((book.available_copies / book.total_copies) * 100)
              : 0;
            const isFullyBorrowed = book.available_copies === 0;

            return (
              <div key={book.id}
                className="rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1"
                style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>

                {/* Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: `${catColor}15` }}>
                    📖
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {book.category && (
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                        style={{ background: `${catColor}15`, color: catColor }}>
                        {book.category}
                      </span>
                    )}
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      isFullyBorrowed
                        ? 'bg-red-50 text-red-500'
                        : 'bg-green-50 text-green-600'
                    }`}>
                      {isFullyBorrowed ? 'All Borrowed' : `${book.available_copies} Available`}
                    </span>
                  </div>
                </div>

                {/* Book Info */}
                <h3 className="font-black text-gray-900 leading-tight line-clamp-2">{book.title}</h3>
                <p className="text-sm text-gray-500 mt-1">by {book.author}</p>

                {book.isbn && (
                  <p className="text-xs font-mono text-gray-400 mt-1">ISBN: {book.isbn}</p>
                )}
                {book.published_year && (
                  <p className="text-xs text-gray-400 mt-0.5">Published: {book.published_year}</p>
                )}

                {/* Availability Bar */}
                <div className="mt-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-400">Availability</span>
                    <span className="text-xs font-bold" style={{ color: isFullyBorrowed ? '#ef4444' : '#16a34a' }}>
                      {book.available_copies}/{book.total_copies} copies
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all"
                      style={{
                        width: `${availPct}%`,
                        background: isFullyBorrowed
                          ? '#ef4444'
                          : `linear-gradient(90deg, #D4AF37, #F5C842)`,
                      }} />
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2 pt-4 border-t border-gray-100">
                  <button onClick={() => openEditModal(book)}
                    className="flex-1 text-xs py-2 rounded-xl font-semibold transition-all hover:-translate-y-0.5"
                    style={{ background: 'rgba(212,175,55,0.1)', color: '#B8860B' }}>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(book.id)}
                    className="flex-1 text-xs py-2 rounded-xl font-semibold bg-red-50 text-red-500 hover:-translate-y-0.5 transition-all">
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
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
                  📖
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">
                    {editingBook ? 'Edit Book' : 'Add New Book'}
                  </h2>
                  <p className="text-gray-400 text-xs mt-0.5">Fill in the book details below</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Book Title <span className="text-red-400">*</span>
                </label>
                <input type="text" value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Mathematics for Primary 4"
                  className={inputClass} style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.background = '#fff'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#f3f4f6'; e.target.style.background = '#f9fafb'; }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Author <span className="text-red-400">*</span>
                </label>
                <input type="text" value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  placeholder="e.g. Fatou Bojang"
                  className={inputClass} style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.background = '#fff'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#f3f4f6'; e.target.style.background = '#f9fafb'; }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Category</label>
                  <select value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className={inputClass} style={inputStyle}>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">ISBN</label>
                  <input type="text" value={form.isbn}
                    onChange={(e) => setForm({ ...form, isbn: e.target.value })}
                    placeholder="Optional"
                    className={inputClass} style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.background = '#fff'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#f3f4f6'; e.target.style.background = '#f9fafb'; }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Total Copies</label>
                  <input type="number" value={form.total_copies} min={1}
                    onChange={(e) => {
                      const total = parseInt(e.target.value) || 1;
                      setForm({ ...form, total_copies: total, available_copies: Math.min(form.available_copies, total) });
                    }}
                    className={inputClass} style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.background = '#fff'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#f3f4f6'; e.target.style.background = '#f9fafb'; }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Available</label>
                  <input type="number" value={form.available_copies} min={0} max={form.total_copies}
                    onChange={(e) => setForm({ ...form, available_copies: parseInt(e.target.value) || 0 })}
                    className={inputClass} style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.background = '#fff'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#f3f4f6'; e.target.style.background = '#f9fafb'; }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Year</label>
                  <input type="number" value={form.published_year} min={1900} max={new Date().getFullYear()}
                    onChange={(e) => setForm({ ...form, published_year: parseInt(e.target.value) || new Date().getFullYear() })}
                    className={inputClass} style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; e.target.style.background = '#fff'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#f3f4f6'; e.target.style.background = '#f9fafb'; }}
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 rounded-xl"
                style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)' }}>
                <p className="text-xs text-gray-400 mb-2 font-bold uppercase tracking-wide">Preview</p>
                <p className="font-black text-gray-800">{form.title || 'Book Title'}</p>
                <p className="text-sm text-gray-500 mt-0.5">by {form.author || 'Author Name'}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: `${categoryColors[form.category] || '#6b7280'}15`, color: categoryColors[form.category] || '#6b7280' }}>
                    {form.category}
                  </span>
                  <span className="text-xs text-gray-400">
                    {form.available_copies}/{form.total_copies} copies available
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3 justify-end border-t border-gray-100 pt-4">
              <button onClick={closeModal}
                className="px-5 py-2.5 text-sm text-gray-500 border-2 border-gray-100 rounded-xl hover:bg-gray-50 transition-colors font-medium">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-2.5 text-sm rounded-xl transition-all disabled:opacity-60 font-bold hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #2c2c2c, #3a3a3a)', color: '#D4AF37', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
                {saving ? 'Saving...' : editingBook ? 'Update Book' : 'Add Book'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
