import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Truck, Users, Fuel, Wrench,
  Map, CalendarDays, AlertTriangle, BarChart3,
  Brain, Database, ChevronRight, Sparkles,
} from 'lucide-react';

const navSections = [
  {
    title: 'Fleet & Resources',
    personBadge: 'Person 1',
    badgeColor: 'bg-secondary text-white',
    items: [
      { to: '/vehicles',    icon: Truck,    label: 'Vehicles',      iconColor: 'bg-sky-200' },
      { to: '/drivers',     icon: Users,    label: 'Drivers',       iconColor: 'bg-emerald-200' },
      { to: '/fuel',        icon: Fuel,     label: 'Fuel Logs',     iconColor: 'bg-amber-200' },
      { to: '/maintenance', icon: Wrench,   label: 'Maintenance',   iconColor: 'bg-rose-200' },
    ],
  },
  {
    title: 'Transit & Operations',
    personBadge: 'Person 2',
    badgeColor: 'bg-tertiary text-foreground',
    items: [
      { to: '/routes',    icon: Map,          label: 'Routes',     iconColor: 'bg-violet-200' },
      { to: '/trips',     icon: CalendarDays, label: 'Trips',      iconColor: 'bg-pink-200' },
      { to: '/incidents', icon: AlertTriangle, label: 'Incidents', iconColor: 'bg-amber-200' },
    ],
  },
  {
    title: 'Intelligence & Schema',
    personBadge: 'Person 3',
    badgeColor: 'bg-accent text-white',
    items: [
      { to: '/dashboard',  icon: LayoutDashboard, label: 'Overview',     iconColor: 'bg-sky-200' },
      { to: '/reports',    icon: BarChart3,        label: 'SQL Reports',  iconColor: 'bg-emerald-200' },
      { to: '/predict',    icon: Brain,            label: 'AI Predictor', iconColor: 'bg-purple-200' },
      { to: '/schema',     icon: Database,         label: 'ER Schema',    iconColor: 'bg-yellow-200' },
    ],
  },
];

export default function Layout() {
  return (
    <div className="flex h-screen bg-background bg-dot-grid overflow-hidden font-sans">
      {/* Playful Geometric Sidebar */}
      <aside className="w-72 bg-white border-r-2 border-foreground flex flex-col flex-shrink-0 z-20 shadow-pop-xs">
        {/* Brand Header */}
        <div className="px-6 py-5 border-b-2 border-foreground bg-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-tertiary rounded-2xl border-2 border-foreground shadow-pop-xs flex items-center justify-center wiggle">
              <Truck className="w-6 h-6 text-foreground stroke-[2.5px]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-black text-xl text-foreground tracking-tight">RoadRunner</span>
                <span className="w-2.5 h-2.5 rounded-full bg-secondary inline-block animate-pulse" />
              </div>
              <p className="text-slate-500 font-heading font-bold text-xs uppercase tracking-wider">
                Fleet & Traffic OS
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {navSections.map((section) => (
            <div key={section.title}>
              <div className="flex items-center justify-between mb-2.5 px-2">
                <span className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider">
                  {section.title}
                </span>
                <span className={`text-[10px] font-heading font-extrabold px-2 py-0.5 rounded-full border-2 border-foreground shadow-pop-xs ${section.badgeColor}`}>
                  {section.personBadge}
                </span>
              </div>
              
              <div className="space-y-1.5">
                {section.items.map(({ to, icon: Icon, label, iconColor }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-heading font-bold text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-amber-100 text-foreground border-2 border-foreground shadow-pop translate-x-1'
                          : 'text-slate-600 hover:text-foreground hover:bg-slate-50 hover:border-2 hover:border-foreground/30 border-2 border-transparent'
                      }`
                    }
                  >
                    <div className={`w-8 h-8 rounded-xl border-2 border-foreground flex items-center justify-center shrink-0 ${iconColor} shadow-pop-xs`}>
                      <Icon className="w-4 h-4 text-foreground stroke-[2.5px]" />
                    </div>
                    <span className="flex-1 text-sm tracking-tight">{label}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 stroke-[2.5px]" />
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer info card */}
        <div className="p-4 border-t-2 border-foreground bg-muted/60">
          <div className="card-sm bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent fill-accent" />
              <span className="text-xs font-heading font-bold text-foreground">Playful Geometric</span>
            </div>
            <span className="text-[10px] font-extrabold font-heading px-2 py-0.5 rounded-full bg-quaternary border border-foreground">
              v2.0
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 md:p-8 fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
