export interface Student {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female';
  class_id?: string;
  parent_name?: string;
  parent_phone?: string;
  address?: string;
  enrollment_date: string;
  status: 'active' | 'inactive' | 'graduated' | 'transferred';
  avatar_url?: string;
  created_at?: string;
}

export interface Teacher {
  id: string;
  staff_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  subjects: string[];
  qualification?: string;
  hire_date: string;
  status: 'active' | 'inactive';
  avatar_url?: string;
  created_at?: string;
}

export interface Class {
  id: string;
  name: string;
  grade: string;
  section: string;
  teacher_id?: string;
  academic_year: string;
  capacity: number;
  created_at?: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  note?: string;
  created_at?: string;
}

export interface Grade {
  id: string;
  student_id: string;
  class_id: string;
  subject: string;
  score: number;
  max_score: number;
  grade_type: 'exam' | 'assignment' | 'quiz' | 'project';
  term: string;
  academic_year: string;
  date: string;
  created_at?: string;
}

export interface FeeRecord {
  id: string;
  student_id: string;
  fee_type: string;
  amount: number;
  paid: number;
  due_date: string;
  paid_date?: string;
  status: 'paid' | 'partial' | 'unpaid' | 'overdue';
  academic_year: string;
  term: string;
  created_at?: string;
}

export interface LibraryBook {
  id: string;
  isbn?: string;
  title: string;
  author: string;
  category?: string;
  total_copies: number;
  available_copies: number;
  published_year?: number;
  created_at?: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  end_date?: string;
  location?: string;
  event_type: 'academic' | 'sports' | 'cultural' | 'holiday' | 'meeting';
  audience: 'all' | 'students' | 'teachers' | 'parents';
  created_at?: string;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'teacher' | 'staff' | 'viewer';
}

export type ApiStatus = 'idle' | 'loading' | 'success' | 'error';