import React from "react";

export function EmptyState({ icon, title, description, action }: { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode; }) {
  return (
    <div className="text-center py-12">
      {icon && <div className="text-4xl mb-4">{icon}</div>}
      <div className="text-lg font-medium text-white mb-2">{title}</div>
      {description && <div className="text-white/60 mb-4">{description}</div>}
      {action && <div>{action}</div>}
    </div>
  );
}
