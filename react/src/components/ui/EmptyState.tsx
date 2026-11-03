import type { ReactNode } from 'react';

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {icon ? <div className="empty-state-icon" aria-hidden="true">{icon}</div> : null}
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-copy">{description}</p>
      {action ? <div className="empty-state-action">{action}</div> : null}
    </div>
  );
}
