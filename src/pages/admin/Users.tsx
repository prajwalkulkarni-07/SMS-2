import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, createUser, updateUser, deleteUser } from "@/services/users";
import { enrollStudent } from "@/services/studentClasses";
import { getSectionsByClassNumber } from "@/services/classes";
import { getSubjects } from "@/services/subjects";
import { setStudentSubjects } from "@/services/studentSubjects";
import { getCurrentAcademicYear } from "@/lib/academicYear";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import RoleBadge from "@/components/RoleBadge";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import { Plus, Eye } from "lucide-react";
import { toast } from "sonner";
import type { User, Role } from "@/types";
import { useNavigate } from "react-router-dom";

const CLASS_NUMBERS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const CORE_SUBJECTS = ["Physics", "Chemistry", "Maths", "English"];
const SECOND_LANGUAGE_OPTIONS = [
  { value: "Kannada", label: "Kannada" },
  { value: "Hindi", label: "Hindi" },
  { value: "Sanskrit", label: "Sanskrit" },
];
const FOURTH_SUBJECT_OPTIONS = [
  { value: "Biology", label: "Biology" },
  { value: "Statistics", label: "Statistics" },
  { value: "Computer Science", label: "Computer Science" },
];

export default function UsersPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [filterRole, setFilterRole] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [isCreatingStudent, setIsCreatingStudent] = useState(false);
  const [secondLanguage, setSecondLanguage] = useState<string>("");
  const [fourthSubject, setFourthSubject] = useState<string>("");
  const [teacherSubjectId, setTeacherSubjectId] = useState<string>("");
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    phone: "",
    role: "student" as Role, 
    class_number: "",
    section: "",
    class_id: "",
    academic_year: getCurrentAcademicYear()
  });

  const { data: usersData, isLoading } = useQuery({ queryKey: ["users"], queryFn: () => getUsers().then((r) => r.data) });
  const { data: subjectsData, isFetching: isSubjectsLoading } = useQuery({ queryKey: ["subjects"], queryFn: () => getSubjects().then((r) => r.data), enabled: (form.role === "student" || form.role === "teacher") && !editing });
  
  const { data: sectionsData } = useQuery({
    queryKey: ["sections", form.class_number],
    queryFn: () => getSectionsByClassNumber(form.class_number).then((r) => r.data),
    enabled: !!form.class_number && !editing && form.role === "student",
  });

  // @ts-ignore
  const users = usersData?.data || [];
  // @ts-ignore
  const sections = sectionsData?.data || [];
  // @ts-ignore
  const subjects = subjectsData?.data || [];
  // @ts-ignore

  const createMut = useMutation({
    mutationFn: createUser,
    onSuccess: (response) => { 
      console.log("User created successfully, response:", response);
      try {
        qc.invalidateQueries({ queryKey: ["users"] }); 
        toast.success("User created successfully"); 
        setDialogOpen(false);
      } catch (err) {
        console.error("Error in onSuccess handler:", err);
        toast.error("User created but failed to refresh list");
      }
    },
    onError: (e: any) => {
      console.error("Create user mutation error:", e);
      console.error("Error response:", e.response);
      toast.error(e.response?.data?.message || "Failed to create user");
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<User> }) => updateUser(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast.success("User updated"); setDialogOpen(false); setEditing(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed"),
  });

  const deleteMut = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast.success("User deleted"); },
  });

  const filtered = (users || []).filter((u) => {
    if (filterRole !== "all" && u.role !== filterRole) return false;
    return true;
  });

  const openCreate = () => {
    setEditing(null);
    setIsCreatingStudent(false);
    setSecondLanguage("");
    setFourthSubject("");
    setTeacherSubjectId("");
    setForm({ 
      name: "", 
      email: "", 
      phone: "",
      role: "teacher", 
      class_number: "",
      section: "",
      class_id: "",
      academic_year: getCurrentAcademicYear()
    });
    setDialogOpen(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setSecondLanguage("");
    setFourthSubject("");
    setTeacherSubjectId("");
    setForm({ 
      name: u.name, 
      email: u.email, 
      phone: u.phone || "",
      role: u.role, 
      class_number: "",
      section: "",
      class_id: "",
      academic_year: new Date().getFullYear().toString()
    });
    setDialogOpen(true);
  };

  const handleClassNumberChange = (value: string) => {
    setForm((p) => ({ ...p, class_number: value, section: "", class_id: "" }));
  };

  const handleSectionChange = (value: string) => {
    const selectedSection = sections.find((s: any) => s.section === value);
    setForm((p) => ({ ...p, section: value, class_id: selectedSection?.classId || "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPhone = form.phone.trim();

    if (!trimmedPhone) {
      toast.error("Phone number is required");
      return;
    }

    const baseUserData = {
      name: form.name,
      email: form.email,
      phone: trimmedPhone,
    };
    if (editing) {
      updateMut.mutate({ id: editing.id, data: baseUserData });
    } else {
      // Create user data object
      const userData = {
        ...baseUserData,
        role: form.role,
      };

      console.log("Creating user:", userData);

      // If it's a teacher, create user (+ optional assignments)
      if (form.role === "teacher") {
        if (!teacherSubjectId) {
          toast.error("Select subject for the teacher");
          return;
        }
        createMut.mutate({
          ...userData,
          subject_id: Number(teacherSubjectId),
        });
        return;
      }

      // For students, we need to create user first, then enroll
      if (form.role === "student") {
        if (!form.class_id || !form.academic_year) {
          toast.error("Please select a class and academic year for the student");
          return;
        }

        if (!secondLanguage || !fourthSubject) {
          toast.error("Select second language and fourth subject");
          return;
        }

        const normalize = (s: string) => s.trim().toLowerCase();
        const findSubjectId = (names: string[]) => {
          const targets = names.map((n) => normalize(n));
          const found = subjects.find((sub: any) => targets.includes(normalize(sub.name || "")));
          return found?.id;
        };

        const physicsId = findSubjectId(["Physics"]);
        const chemistryId = findSubjectId(["Chemistry"]);
        const mathsId = findSubjectId(["Maths", "Mathematics"]);
        const englishId = findSubjectId(["English"]);
        const secondId = findSubjectId([secondLanguage]);
        const fourthId = findSubjectId([
          fourthSubject,
          fourthSubject === "Computer Science" ? "Computerscience" : fourthSubject,
          fourthSubject === "Computer Science" ? "Computer_science" : fourthSubject,
        ]);

        const subjectIds = [physicsId, chemistryId, mathsId, englishId, secondId, fourthId].filter(Boolean) as number[];

        if (subjectIds.length !== 6) {
          toast.error("Required subjects are missing in the catalog. Please ensure core + choices exist.");
          return;
        }

        setIsCreatingStudent(true);
        try {
          // Create user
          const userResponse = await createUser(userData);
          // @ts-ignore
          const newUser = userResponse.data.data;

          // Enroll student in the selected class
          await enrollStudent({
            student_id: newUser.id,
            class_id: Number(form.class_id),
            academic_year: form.academic_year
          });

          await setStudentSubjects(newUser.id, {
            academic_year: form.academic_year,
            class_id: Number(form.class_id),
            subject_ids: subjectIds,
          });

          qc.invalidateQueries({ queryKey: ["users"] });
          qc.invalidateQueries({ queryKey: ["student-classes"] });
          qc.invalidateQueries({ queryKey: ["student-subjects", newUser.id] });
          toast.success("Student created and enrolled successfully");
          setDialogOpen(false);
        } catch (e: any) {
          console.error("Create student error:", e);
          toast.error(e.response?.data?.message || "Failed to create student");
        } finally {
          setIsCreatingStudent(false);
        }
      }
    }
  };

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Users</h2>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add User</Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="teacher">Teacher</SelectItem>
            <SelectItem value="student">Student</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? <EmptyState message="No users found" /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.phone || "—"}</TableCell>
                    <TableCell><RoleBadge role={u.role} /></TableCell>
                    <TableCell className="text-right space-x-1">
                      {u.role !== "admin" ? (
                        <>
                          {u.role === "teacher" && (
                            <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/teachers/${u.id}`)} title="View teacher details">
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {u.role === "student" && (
                            <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/students/${u.id}`)} title="View student details">
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground px-2">Protected</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit User" : "Create User"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required /></div>
            <div className="space-y-2"><Label>Phone</Label><Input type="tel" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} required /></div>
            {!editing && (
              <div className="rounded-md border p-3 bg-muted/30 text-sm text-muted-foreground">
                Default password for new users is <span className="font-medium text-foreground">Password@123</span>. They must change it on first login.
              </div>
            )}
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm((p) => ({ ...p, role: v as Role }))} disabled={!!editing}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!editing && form.role === "teacher" && (
              <div className="space-y-3 rounded-md border p-3 bg-muted/30">
                <Label className="text-sm font-semibold">Teaching details</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Select value={teacherSubjectId || undefined} onValueChange={setTeacherSubjectId} disabled={isSubjectsLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((s: any) => (
                          <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
            
            {!editing && form.role === "student" && (
              <>
                <div className="space-y-2">
                  <Label>Class Number</Label>
                  <Select value={form.class_number} onValueChange={handleClassNumberChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class number" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASS_NUMBERS.map((num) => (
                        <SelectItem key={num} value={num}>
                          Class {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {form.class_number && (
                  <div className="space-y-2">
                    <Label>Section</Label>
                    <Select value={form.section} onValueChange={handleSectionChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        {sections.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">No sections available for Class {form.class_number}</div>
                        ) : (
                          sections.map((sec: any) => (
                            <SelectItem key={sec.section} value={sec.section}>
                              Section {sec.section}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Academic Year</Label>
                  <Input 
                    type="text" 
                    value={form.academic_year} 
                    onChange={(e) => setForm((p) => ({ ...p, academic_year: e.target.value }))} 
                    placeholder="e.g. 2025-2026"
                    required 
                  />
                </div>

                <div className="space-y-3 rounded-md border p-3 bg-muted/30">
                  <Label className="text-sm font-semibold">Subjects</Label>
                  <p className="text-xs text-muted-foreground">Core subjects are auto-added. Choose one second language and one fourth subject.</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {CORE_SUBJECTS.map((s) => (
                      <span key={s} className="rounded-full bg-secondary px-3 py-1">{s}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Second Language</Label>
                      <Select value={secondLanguage || undefined} onValueChange={setSecondLanguage} disabled={isSubjectsLoading}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select second language" />
                        </SelectTrigger>
                        <SelectContent>
                          {SECOND_LANGUAGE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Fourth Subject</Label>
                      <Select value={fourthSubject || undefined} onValueChange={setFourthSubject} disabled={isSubjectsLoading}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select fourth subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {FOURTH_SUBJECT_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={
                editing
                  ? updateMut.isPending
                  : (
                      createMut.isPending ||
                      isCreatingStudent ||
                      !form.phone ||
                      (form.role === "student" && (!form.class_id || !form.academic_year || !secondLanguage || !fourthSubject)) ||
                      (form.role === "teacher" && !teacherSubjectId) ||
                      isSubjectsLoading
                    )
              }
            >
              {editing ? "Update" : (createMut.isPending || isCreatingStudent) ? "Creating..." : "Create"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
