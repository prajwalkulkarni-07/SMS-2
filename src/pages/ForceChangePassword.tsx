import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, getRoleDashboard } from "@/contexts/AuthContext";
import { changePasswordApi } from "@/services/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export default function ForceChangePasswordPage() {
  const { user, setMustChangePassword } = useAuth();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    setLoading(true);
    try {
      await changePasswordApi({ newPassword });
      setMustChangePassword(false);
      toast.success("Password changed successfully");
      if (user) {
        navigate(getRoleDashboard(user));
      } else {
        navigate("/login");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-border/50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <CardTitle className="text-xl">Change Password</CardTitle>
            <CardDescription>
              You must change your default password before accessing the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
