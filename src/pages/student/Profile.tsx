import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Phone, User2 } from "lucide-react";

export default function StudentProfile() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <User2 className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold text-foreground">Profile</h2>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Personal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
            <User2 className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="font-medium text-foreground">{user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium text-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
            <Phone className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Phone Number</p>
              <p className="font-medium text-foreground">{user?.phone || "Not provided"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
