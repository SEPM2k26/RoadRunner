import React from 'react';

export function StatusBadge({ value }) {
  const map = {
    AVAILABLE:    'badge-green',
    ACTIVE:       'badge-green',
    COMPLETED:    'badge-green',
    RESOLVED:     'badge-green',
    IN_USE:       'badge-blue',
    SCHEDULED:    'badge-blue',
    IN_PROGRESS:  'badge-blue',
    MONITORING:   'badge-blue',
    ON_TRIP:      'badge-purple',
    MAINTENANCE:  'badge-yellow',
    ON_LEAVE:     'badge-yellow',
    DELAYED:      'badge-yellow',
    INACTIVE:     'badge-yellow',
    SUSPENDED:    'badge-red',
    RETIRED:      'badge-gray',
    CANCELLED:    'badge-gray',
    LOW:          'badge-green',
    MEDIUM:       'badge-yellow',
    HIGH:         'badge-red',
    CRITICAL:     'badge-red',
  };
  const cls = map[value] || 'badge-gray';
  return (
    <span className={cls}>
      {value?.replace(/_/g, ' ')}
    </span>
  );
}

export function CandyIcon({ icon: Icon, color = 'bg-accent', size = 'md' }) {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
  };
  const iconSizeMap = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  return (
    <div
      className={`${sizeMap[size]} ${color} rounded-full border-2 border-foreground shadow-pop-xs flex items-center justify-center shrink-0 wiggle`}
    >
      <Icon className={`${iconSizeMap[size]} text-foreground stroke-[2.5px]`} />
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="relative w-12 h-12">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-accent spin" />
        <div className="absolute inset-2 w-8 h-8 rounded-full border-4 border-slate-200 border-b-secondary spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
      </div>
      <span className="font-heading font-bold text-sm text-slate-500">Loading magic...</span>
    </div>
  );
}

export function ErrorMsg({ msg }) {
  return (
    <div className="card bg-rose-50 border-2 border-foreground shadow-pop-xs text-rose-900 flex items-center gap-3 p-4">
      <div className="w-9 h-9 rounded-full bg-rose-200 border-2 border-foreground flex items-center justify-center font-bold text-base shrink-0">
        ⚠️
      </div>
      <div className="text-sm font-semibold">{msg}</div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action, badgeText, badgeColor = 'bg-tertiary' }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <h1 className="page-title">{title}</h1>
          {badgeText && (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-heading font-extrabold border-2 border-foreground ${badgeColor} shadow-pop-xs`}>
              {badgeText}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-slate-500 font-medium text-sm mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function EmptyState({ message = 'No items found', action }) {
  return (
    <div className="card text-center py-16 bg-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-yellow-100 border-2 border-foreground/10 -z-0 pointer-events-none" />
      <div className="absolute -bottom-6 -left-6 w-16 h-16 rounded-full bg-pink-100 border-2 border-foreground/10 -z-0 pointer-events-none" />
      
      <div className="w-16 h-16 rounded-2xl bg-muted border-2 border-foreground shadow-pop flex items-center justify-center text-3xl mb-4 z-10">
        📦
      </div>
      <h3 className="font-heading font-bold text-lg text-foreground mb-1 z-10">{message}</h3>
      <p className="text-slate-500 text-sm max-w-sm mb-4 z-10">
        Everything looks quiet here. Try adjusting your filters or create a new entry!
      </p>
      {action && <div className="z-10">{action}</div>}
    </div>
  );
}

export function DecorativeSquiggle({ className = '' }) {
  return (
    <svg
      className={`w-16 h-3 text-secondary ${className}`}
      viewBox="0 0 70 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 6C10 0 16 12 24 6C32 0 38 12 46 6C54 0 60 12 68 6"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
