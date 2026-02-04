"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Store,
  Truck,
  MessageCircle,
  Crown,
  Building2,
  LogOut,
  User,
  ChevronDown,
  ClipboardList,
} from "lucide-react";
import { AppIcon } from "./AppIcon";

interface UserData {
  id: string;
  username: string;
  name: string;
  role: string;
  tenant_id?: string | null;
}

const iconSize = 18;

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUser(data.user);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [userMenuOpen]);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  if (
    pathname === "/login" ||
    pathname === "/suporte" ||
    pathname === "/" ||
    pathname === "/vendas" ||
    loading
  ) {
    return null;
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/stream", label: "Pedidos", icon: ClipboardList },
    { href: "/cardapio", label: "Cardápio", icon: UtensilsCrossed },
    { href: "/loja", label: "Loja", icon: Store },
    { href: "/dashboard/entregas", label: "Entregas", icon: Truck },
    { href: "/atendimento", label: "Atendimento", icon: MessageCircle },
  ];

  if (user && !user.tenant_id) {
    navItems.push({ href: "/admin", label: "Master", icon: Crown });
    navItems.push({
      href: "/admin/restaurantes",
      label: "Restaurantes",
      icon: Building2,
    });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <a href="/dashboard" className="flex items-center gap-3">
            <AppIcon size={28} />
            <span className="text-lg font-bold text-gray-900 font-display">
              Pedidos Express
            </span>
          </a>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon
                    size={iconSize}
                    className={isActive ? "text-primary-600" : "text-gray-500"}
                  />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>

        {user && (
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-gray-50"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                <User size={16} className="text-gray-600" />
              </div>
              <span className="hidden sm:inline font-medium text-gray-900 max-w-[120px] truncate">
                {user.name}
              </span>
              <ChevronDown
                size={16}
                className={`text-gray-400 transition-transform ${
                  userMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                <div className="border-b border-gray-100 px-3 py-2">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {user.name}
                  </p>
                  <p className="truncate text-xs capitalize text-gray-500">
                    {user.role}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <LogOut size={iconSize} className="text-gray-500" />
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile: nav em linha rolável */}
      <div className="md:hidden border-t border-gray-100">
        <div className="flex gap-1 overflow-x-auto px-4 py-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon
                  size={16}
                  className={isActive ? "text-primary-600" : "text-gray-500"}
                />
                <span>{item.label}</span>
              </a>
            );
          })}
        </div>
      </div>
    </header>
  );
}
