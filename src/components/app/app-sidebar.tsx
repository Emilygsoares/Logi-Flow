import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  Truck,
  CalendarClock,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Logo, LogoMark } from "./logo";
import { supabase } from "@/integrations/supabase/client";
import { profileQuery } from "@/lib/api/data";

const operations = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Pedidos", url: "/pedidos", icon: Package },
  { title: "Conferência", url: "/conferencia", icon: ClipboardCheck },
  { title: "Coletas", url: "/coletas", icon: CalendarClock },
  { title: "Entregas", url: "/entregas", icon: Truck },
  { title: "Ocorrências", url: "/ocorrencias", icon: AlertTriangle },
] as const;

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useQuery(profileQuery());

  const isActive = (url: string) => pathname === url || pathname.startsWith(url + "/");

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { mode: "login" }, replace: true });
  }

  const initials = (profile?.fullName || profile?.email || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        {collapsed ? <LogoMark className="mx-auto" /> : <Logo inverted />}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">Operação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {operations.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} onClick={() => setOpenMobile(false)}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">Conta</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/configuracoes")} tooltip="Configurações">
                  <Link to="/configuracoes" onClick={() => setOpenMobile(false)}>
                    <Settings />
                    <span>Configurações</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3">
        {!collapsed && (
          <div className="flex items-center gap-3 px-1 pb-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-sidebar-accent-foreground">
                {profile?.fullName || "—"}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/70">{profile?.companyName}</p>
            </div>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} tooltip="Sair">
              <LogOut />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
