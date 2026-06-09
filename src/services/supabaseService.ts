import { supabase } from '../lib/supabase';

// ── STUDENTS ──────────────────────────────────────────
export const studentsService = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*, classes(name, grade, section)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('students')
      .select('*, classes(name, grade, section)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },
  create: async (student: object) => {
    const { data, error } = await supabase
      .from('students')
      .insert(student)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  update: async (id: string, updates: object) => {
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  remove: async (id: string) => {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// ── TEACHERS ──────────────────────────────────────────
export const teachersService = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  create: async (teacher: object) => {
    const { data, error } = await supabase
      .from('teachers')
      .insert(teacher)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  update: async (id: string, updates: object) => {
    const { data, error } = await supabase
      .from('teachers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  remove: async (id: string) => {
    const { error } = await supabase
      .from('teachers')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// ── CLASSES ───────────────────────────────────────────
export const classesService = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('classes')
      .select('*, teachers(first_name, last_name)')
      .order('grade', { ascending: true });
    if (error) throw error;
    return data;
  },
  create: async (cls: object) => {
    const { data, error } = await supabase
      .from('classes')
      .insert(cls)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  update: async (id: string, updates: object) => {
    const { data, error } = await supabase
      .from('classes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ── ATTENDANCE ────────────────────────────────────────
export const attendanceService = {
  getByDate: async (date: string, classId?: string) => {
    let query = supabase
      .from('attendance')
      .select('*, students(first_name, last_name, student_id)')
      .eq('date', date);
    if (classId) query = query.eq('class_id', classId);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
  upsert: async (records: object[]) => {
    const { data, error } = await supabase
      .from('attendance')
      .upsert(records, { onConflict: 'student_id,date' })
      .select();
    if (error) throw error;
    return data;
  },
};

// ── GRADES ────────────────────────────────────────────
export const gradesService = {
  getByStudent: async (studentId: string) => {
    const { data, error } = await supabase
      .from('grades')
      .select('*')
      .eq('student_id', studentId)
      .order('date', { ascending: false });
    if (error) throw error;
    return data;
  },
  create: async (grade: object) => {
    const { data, error } = await supabase
      .from('grades')
      .insert(grade)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ── FEES ──────────────────────────────────────────────
export const feesService = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('fees')
      .select('*, students(first_name, last_name, student_id)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  getByStudent: async (studentId: string) => {
    const { data, error } = await supabase
      .from('fees')
      .select('*')
      .eq('student_id', studentId);
    if (error) throw error;
    return data;
  },
  create: async (fee: object) => {
    const { data, error } = await supabase
      .from('fees')
      .insert(fee)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  update: async (id: string, updates: object) => {
    const { data, error } = await supabase
      .from('fees')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ── LIBRARY ───────────────────────────────────────────
export const libraryService = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('library_books')
      .select('*')
      .order('title', { ascending: true });
    if (error) throw error;
    return data;
  },
  create: async (book: object) => {
    const { data, error } = await supabase
      .from('library_books')
      .insert(book)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  update: async (id: string, updates: object) => {
    const { data, error } = await supabase
      .from('library_books')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ── EVENTS ────────────────────────────────────────────
export const eventsService = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });
    if (error) throw error;
    return data;
  },
  create: async (event: object) => {
    const { data, error } = await supabase
      .from('events')
      .insert(event)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  update: async (id: string, updates: object) => {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  remove: async (id: string) => {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};