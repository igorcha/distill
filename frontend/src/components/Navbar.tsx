import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Diamond, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { label: "My Decks", to: "/dashboard" },
  { label: "Generate", to: "/generate" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [menuOpen]);

  const initials =
    user
      ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || user.email[0].toUpperCase()
      : "?";

  return (
    <nav className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-[#2a2f42] bg-[#0f1117] px-6">
      <Link to="/dashboard" className="flex items-center gap-2.5">
        <Diamond className="size-5 text-white" />
        <span className="text-lg font-bold text-white">Distill</span>
      </Link>

      <div className="flex items-center gap-1">
        {navLinks.map((link) => {
          const active = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`relative px-4 py-4 text-sm font-medium transition-colors ${
                active
                  ? "text-[#3B5BDB]"
                  : "text-[#8b92a5] hover:text-white"
              }`}
            >
              {link.label}
              {active && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#3B5BDB]" />
              )}
            </Link>
          );
        })}
      </div>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <span className="text-sm text-[#8b92a5] hidden sm:inline">
            {user?.first_name || user?.email}
          </span>
          <div className="flex size-8 items-center justify-center rounded-full bg-[#3B5BDB] text-xs font-semibold text-white">
            {initials}
          </div>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-40 rounded-lg border border-[#2a2f42] bg-[#1a1f2e] py-1 shadow-xl">
            <button
              onClick={() => {
                setMenuOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-[#8b92a5] hover:bg-[#2a2f42] hover:text-white transition-colors cursor-pointer"
            >
              <LogOut className="size-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
