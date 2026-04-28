import { Badge } from "@/components/ui/badge";
import type { Role } from "@/types";

const roleStyles: Record<Role, string> = {
  admin: "bg-primary/10 text-primary border-primary/20",
  teacher: "bg-accent/10 text-accent border-accent/20",
  student: "bg-warning/10 text-warning border-warning/20",
};

export default function RoleBadge({ role }: { role: Role }) {
  return (
    <Badge variant="outline" className={`capitalize ${roleStyles[role]}`}>
      {role}
    </Badge>
  );
}
