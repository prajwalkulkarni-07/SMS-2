import { useAuth, getRoleDashboard } from "@/contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import RoleBadge from "@/components/RoleBadge";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  School,
  Upload,
  LogOut,
  UserCircle,
} from "lucide-react";

const adminNav = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Classes", url: "/admin/classes", icon: School },
  { title: "Subjects", url: "/admin/subjects", icon: BookOpen },
];

const teacherNav = [
  { title: "Dashboard", url: "/teacher/dashboard", icon: LayoutDashboard },
  { title: "Profile", url: "/teacher/profile", icon: UserCircle },
  { title: "Upload Marks", url: "/teacher/upload-marks", icon: Upload },
  { title: "Students Performances", url: "/teacher/performance", icon: Users },
];

const studentNav = [
  { title: "Dashboard", url: "/student/dashboard", icon: LayoutDashboard },
  { title: "Profile", url: "/student/profile", icon: UserCircle },
  { title: "My Performance", url: "/student/performance", icon: BookOpen },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = user?.role === "admin" ? adminNav : user?.role === "teacher" ? teacherNav : studentNav;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar className="border-r-0">
          <SidebarHeader className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-7 w-7 text-sidebar-primary" />
              <span className="text-lg font-bold text-sidebar-foreground tracking-tight">SMS</span>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="uppercase text-[10px] tracking-widest text-sidebar-foreground/50">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end
                          className="hover:bg-sidebar-accent"
                          activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                        >
                          <item.icon className="mr-2 h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-semibold text-sidebar-primary">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</p>
                <RoleBadge role={user?.role || "student"} />
              </div>
            </div>
            <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b flex items-center px-4 gap-3 bg-card">
            <SidebarTrigger />
            <h1 className="text-sm font-semibold text-foreground capitalize">
              {user?.role} Panel
            </h1>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
