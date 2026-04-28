export type Role = "admin" | "teacher" | "student";

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  must_change_password?: boolean;
  created_at?: string;
}

export interface Class {
  id: number;
  name: string;
  standard?: number;
  section?: string;
  class_teacher_id?: number;
  class_teacher?: User;
  class_teacher_name?: string;
  created_at?: string;
  student_count?: number;
  subject_count?: number;
}

export interface StudentClass {
  id: number;
  student_id: number;
  class_id: number;
  academic_year: string;
  student?: User;
  class?: Class;
}

export interface Subject {
  id: number;
  name: string;
  assignment_count?: number;
  created_at?: string;
}

export interface TeacherAssignment {
  id: number;
  teacher_id: number;
  class_id: number;
  subject_id: number;
  teacher?: User;
  class?: Class;
  subject?: Subject;
}

export type TeacherExamType =
  | "Periodic Test 1"
  | "Periodic Test 2"
  | "Mid Term Exam"
  | "Periodic Test 3"
  | "Periodic Test 4"
  | "End Term Exam";

export interface TeacherMarkClass {
  id: number;
  standard: number;
  section: string;
  class_label: string;
}

export interface TeacherExamMarkStudent {
  student_id: number;
  student_name: string;
  email?: string;
  obtained_marks: number | null;
  lab_marks: number | null;
}

export interface TeacherExamMarksheet {
  class_id: number;
  exam_type: TeacherExamType;
  marksheet_id: number | null;
  max_marks: number | null;
  students: TeacherExamMarkStudent[];
}

export interface Question {
  id?: number;
  assessment_id?: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: "A" | "B" | "C" | "D";
  marks: number;
}

export interface Assessment {
  id: number;
  subject_id: number;
  title: string;
  created_by: number;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  created_at?: string;
  subject?: Subject;
  subject_name?: string;
  class_ids?: number[];
  class_labels?: string[];
  questions?: Question[];
}

export interface Test {
  id: number;
  title: string;
  subject_id: number;
  created_by: number;
  total_marks: number;
  time_limit?: number;
  passing_percentage?: number;
  is_active: boolean;
  created_at?: string;
  subject?: Subject;
  teacher?: User;
  classes?: Class[];
}

export interface TestClass {
  id: number;
  test_id: number;
  class_id: number;
  test?: Test;
  class?: Class;
}

export interface TestAttempt {
  id: number;
  test_id: number;
  student_id: number;
  score?: number;
  started_at?: string;
  completed_at?: string;
  test?: Test;
  student?: User;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: Role;
  phone: string;
  class_id?: number;
}

