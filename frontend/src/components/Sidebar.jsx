import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '⬡' },
  { to: '/scan', label: 'Scan', icon: '⌖' },
  { to: '/history', label: 'History', icon: '◫' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
]

export default function Sidebar() {
  return (
    <aside className="flex flex-col w-56 min-h-screen bg-[#0f172a] border-r border-[#1e2d4a] shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[#1e2d4a]">
        <img src="/logo.svg" alt="logo" className="w-8 h-8" />
        <div>
          <div className="text-cyan-400 font-bold text-base tracking-widest uppercase">BULK IOC</div>
          <div className="text-cyan-600 text-xs tracking-[0.3em] -mt-1">SCANNER</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-5 py-3 text-sm transition-all',
                isActive
                  ? 'text-cyan-400 bg-cyan-950/40 border-r-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40',
              ].join(' ')
            }
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 text-[10px] text-slate-600 border-t border-[#1e2d4a]">
        v1.0.0 · SOC Analyst Tool
      </div>
    </aside>
  )
}
