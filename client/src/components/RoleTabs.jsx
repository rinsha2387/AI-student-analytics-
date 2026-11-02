import { BarChart3, Wallet } from "lucide-react";

const ROLES = [
  { value: "manager", label: "Manager", icon: BarChart3 },
  { value: "sales", label: "Sales team", icon: Wallet },
];

export default function RoleTabs({ role, setRole }) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-1 rounded-md bg-[#f6f8fd] p-1">
      {ROLES.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setRole(value)}
          className={`flex h-[38px] items-center justify-center gap-2 rounded text-xs font-semibold transition ${
            role === value
              ? "bg-white text-[#5269d6] shadow-sm"
              : "text-[#7d899f] hover:text-[#35425e]"
          }`}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  );
}