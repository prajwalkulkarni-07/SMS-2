import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth, getRoleDashboard } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Role } from "@/types";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "" as Role | "",
    class_id: "",
    roll_number: "",
    qualification: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.role || !form.phone) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        role: form.role as Role,
        ...(form.role === "student" && { class_id: Number(form.class_id), roll_number: form.roll_number }),
        ...(form.role === "teacher" && { qualification: form.qualification }),
      });
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      navigate(getRoleDashboard(user.role));
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <GraduationCap className="h-10 w-10 text-primary" />
          <h1 className="text-3xl font-bold text-foreground tracking-tight">SMS</h1>
        </div>

        <Card className="shadow-lg border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Create Account</CardTitle>
            <CardDescription>Register for a new account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input placeholder="Full name" value={form.name} onChange={(e) => update("name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="you@example.com" value={form.email} onChange={(e) => update("email", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input type="tel" placeholder="Phone number" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" placeholder="••••••••" value={form.password} onChange={(e) => update("password", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => update("role", v)}>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.role === "student" && (
                <>
                  <div className="space-y-2">
                    <Label>Class ID</Label>
                    <Input type="number" placeholder="Class ID" value={form.class_id} onChange={(e) => update("class_id", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Roll Number</Label>
                    <Input placeholder="Roll number" value={form.roll_number} onChange={(e) => update("roll_number", e.target.value)} />
                  </div>
                </>
              )}

              {form.role === "teacher" && (
                <div className="space-y-2">
                  <Label>Qualification</Label>
                  <Input placeholder="e.g. M.Sc Mathematics" value={form.qualification} onChange={(e) => update("qualification", e.target.value)} />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Register
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
