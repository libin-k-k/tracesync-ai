type IconProps = {
  className?: string;
};

export function IconLiveFeed({ className = 'nav-icon' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H13l-3.2 3.2a.75.75 0 0 1-1.28-.53V16H6.5A2.5 2.5 0 0 1 4 13.5v-7Zm2.5-.5a.5.5 0 0 0-.5.5v7c0 .28.22.5.5.5H9.5v1.94L12.44 15H17.5a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.5-.5h-11Z"
      />
      <circle cx="8.25" cy="10" r="1" fill="currentColor" />
      <circle cx="12" cy="10" r="1" fill="currentColor" />
      <circle cx="15.75" cy="10" r="1" fill="currentColor" />
    </svg>
  );
}

export function IconDocs({ className = 'nav-icon' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6.5 3.75A1.75 1.75 0 0 0 4.75 5.5v13.25c0 .41.34.75.75.75H18.5a.75.75 0 0 0 0-1.5H6.25V5.5c0-.14.11-.25.25-.25H17.5a.75.75 0 0 1 .75.75v10.5h-8.5a.75.75 0 0 0 0 1.5h9.25a.75.75 0 0 0 .75-.75V6A2.25 2.25 0 0 0 17.5 3.75H6.5Zm2.25 4.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3.25a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-4.5Z"
      />
    </svg>
  );
}

export function IconMembers({ className = 'nav-icon' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M9.25 11.25a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Zm0 1.5c-2.9 0-5.25 1.72-5.25 3.85 0 .55.45 1 1 1h8.5c.55 0 1-.45 1-1 0-2.13-2.35-3.85-5.25-3.85Zm6.2-1.15a2.7 2.7 0 1 0-1.15-5.15.75.75 0 0 1-.33-1.46 4.2 4.2 0 0 1 1.8 7.95c2.22.62 3.73 2.08 3.73 3.76 0 .55-.45 1-1 1h-2.1a.75.75 0 0 1 0-1.5h1.22c-.42-.86-1.48-1.64-2.84-1.95a.75.75 0 0 1 .67-1.35Z"
      />
    </svg>
  );
}

export function IconRoles({ className = 'nav-icon' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7.25 4.75A2.25 2.25 0 0 0 5 7v10.25A2.25 2.25 0 0 0 7.25 19.5h9.5A2.25 2.25 0 0 0 19 17.25V7a2.25 2.25 0 0 0-2.25-2.25h-9.5Zm0 1.5h9.5c.41 0 .75.34.75.75v10.25a.75.75 0 0 1-.75.75h-9.5a.75.75 0 0 1-.75-.75V7c0-.41.34-.75.75-.75Zm2 2.5a.75.75 0 0 0 0 1.5h5.5a.75.75 0 0 0 0-1.5h-5.5Zm0 3.25a.75.75 0 0 0 0 1.5h5.5a.75.75 0 0 0 0-1.5h-5.5Zm0 3.25a.75.75 0 0 0 0 1.5h3.5a.75.75 0 0 0 0-1.5h-3.5Z"
      />
    </svg>
  );
}

export function IconProjects({ className = 'nav-icon' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4.75 5.5A1.75 1.75 0 0 1 6.5 3.75h4.1c.4 0 .78.17 1.04.47l1.1 1.28h4.76A1.75 1.75 0 0 1 19.25 7.25v11A1.75 1.75 0 0 1 17.5 20H6.5A1.75 1.75 0 0 1 4.75 18.25v-12.75Zm1.5 0v12.75c0 .14.11.25.25.25h11a.25.25 0 0 0 .25-.25v-11a.25.25 0 0 0-.25-.25h-5.05a.75.75 0 0 1-.56-.25L10.7 5.47a.25.25 0 0 0-.19-.09H6.5a.25.25 0 0 0-.25.25Z"
      />
    </svg>
  );
}

export function IconSettings({ className = 'nav-icon' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M11.1 3.5c.4-1 1.8-1 2.2 0l.3.8a1.6 1.6 0 0 0 2 .95l.8-.3c1-.4 2 .6 1.6 1.6l-.3.8a1.6 1.6 0 0 0 .95 2l.8.3c1 .4 1 1.8 0 2.2l-.8.3a1.6 1.6 0 0 0-.95 2l.3.8c.4 1-.6 2-1.6 1.6l-.8-.3a1.6 1.6 0 0 0-2 .95l-.3.8c-.4 1-1.8 1-2.2 0l-.3-.8a1.6 1.6 0 0 0-2-.95l-.8.3c-1 .4-2-.6-1.6-1.6l.3-.8a1.6 1.6 0 0 0-.95-2l-.8-.3c-1-.4-1-1.8 0-2.2l.8-.3a1.6 1.6 0 0 0 .95-2l-.3-.8c-.4-1 .6-2 1.6-1.6l.8.3a1.6 1.6 0 0 0 2-.95l.3-.8ZM12.2 9.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Z"
      />
    </svg>
  );
}

export function IconSearch({ className = 'nav-icon' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M10.5 3.75a6.75 6.75 0 1 0 4.2 12.05l3.75 3.75a.75.75 0 1 0 1.06-1.06l-3.75-3.75A6.75 6.75 0 0 0 10.5 3.75Zm-5.25 6.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Z"
      />
    </svg>
  );
}

export function IconSpark({ className = 'empty-icon' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2.5 13.7 8.3 19.5 10 13.7 11.7 12 17.5 10.3 11.7 4.5 10 10.3 8.3 12 2.5Zm6.5 9.5 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3ZM5.5 14l.75 2.25L8.5 17l-2.25.75L5.5 20l-.75-2.25L2.5 17l2.25-.75L5.5 14Z"
      />
    </svg>
  );
}

export function IconInbox({ className = 'empty-icon' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4.75 5.5A1.75 1.75 0 0 1 6.5 3.75h11A1.75 1.75 0 0 1 19.25 5.5v13A1.75 1.75 0 0 1 17.5 20.25h-11A1.75 1.75 0 0 1 4.75 18.5v-13Zm1.5 0v8.25h3.2l1.05 1.4c.25.33.64.52 1.05.52h1.9c.41 0 .8-.19 1.05-.52l1.05-1.4h3.2V5.5a.25.25 0 0 0-.25-.25h-11a.25.25 0 0 0-.25.25Zm0 9.75V18.5c0 .14.11.25.25.25h11a.25.25 0 0 0 .25-.25v-3.25h-2.55l-1.05 1.4a2.25 2.25 0 0 1-1.8.9h-1.9a2.25 2.25 0 0 1-1.8-.9l-1.05-1.4H6.25Z"
      />
    </svg>
  );
}

export function IconFolder({ className = 'empty-icon' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3.75 6.5A2.75 2.75 0 0 1 6.5 3.75h3.2c.5 0 .98.2 1.33.55l1.17 1.2h5.3A2.75 2.75 0 0 1 20.25 8.25v9A2.75 2.75 0 0 1 17.5 20H6.5A2.75 2.75 0 0 1 3.75 17.25v-10.75Zm1.5 0v10.75c0 .69.56 1.25 1.25 1.25h11c.69 0 1.25-.56 1.25-1.25v-9c0-.69-.56-1.25-1.25-1.25h-5.55a.75.75 0 0 1-.53-.22l-1.35-1.38a.25.25 0 0 0-.18-.07H6.5c-.69 0-1.25.56-1.25 1.25Z"
      />
    </svg>
  );
}

export function IconOverview({ className = 'nav-icon' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4.75 4.75h5.5v5.5h-5.5v-5.5Zm9 0h5.5v5.5h-5.5v-5.5Zm-9 9h5.5v5.5h-5.5v-5.5Zm9 0h5.5v5.5h-5.5v-5.5Z"
      />
    </svg>
  );
}

export function IconChevron({ className = 'nav-icon' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8.47 5.47a.75.75 0 0 1 1.06 0l5 5a.75.75 0 0 1 0 1.06l-5 5a.75.75 0 1 1-1.06-1.06L12.94 12 8.47 7.53a.75.75 0 0 1 0-1.06Z"
      />
    </svg>
  );
}

export function IconCalendar({ className = 'nav-icon' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 3.25a.75.75 0 0 1 .75.75v.75h6.5V4a.75.75 0 0 1 1.5 0v.75h.5A2.75 2.75 0 0 1 20 7.5v10A2.75 2.75 0 0 1 17.25 20.25h-10.5A2.75 2.75 0 0 1 4 17.5v-10A2.75 2.75 0 0 1 6.75 4.75h.5V4A.75.75 0 0 1 8 3.25Zm-1.25 6V17.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25V9.25H6.75Z"
      />
    </svg>
  );
}

export function IconBell({ className = 'nav-icon' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 3.25a5.25 5.25 0 0 0-5.25 5.25v2.3c0 .53-.17 1.05-.48 1.48l-1.1 1.5A1.25 1.25 0 0 0 6.2 15.75h11.6a1.25 1.25 0 0 0 1.03-1.97l-1.1-1.5a2.5 2.5 0 0 1-.48-1.48V8.5A5.25 5.25 0 0 0 12 3.25Zm-1.6 14.25a1.6 1.6 0 1 0 3.2 0h-3.2Z"
      />
    </svg>
  );
}

export function IconKpiWarning({ className = 'kpi-glyph' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 3.4 21.2 19.3A1.25 1.25 0 0 1 20.1 21H3.9a1.25 1.25 0 0 1-1.1-1.7L12 3.4Zm0 5.35a.9.9 0 0 0-.9.9v3.7a.9.9 0 1 0 1.8 0V9.65a.9.9 0 0 0-.9-.9Zm0 7.1a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"
      />
    </svg>
  );
}

export function IconKpiStack({ className = 'kpi-glyph' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 3.5 20 7.5 12 11.5 4 7.5 12 3.5Zm8 7.2-8 4-8-4v2.3l8 4 8-4v-2.3Zm0 4.2-8 4-8-4v2.3l8 4 8-4v-2.3Z"
      />
    </svg>
  );
}

export function IconKpiCheck({ className = 'kpi-glyph' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17Zm3.6 5.7-4.5 5.1-2.6-2.5a.9.9 0 1 0-1.25 1.3l3.25 3.1a.9.9 0 0 0 1.3-.05l5.15-5.85a.9.9 0 0 0-1.35-1.2Z"
      />
    </svg>
  );
}

export function IconKpiSpark({ className = 'kpi-glyph' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2.5 13.7 8.3 19.5 10 13.7 11.7 12 17.5 10.3 11.7 4.5 10 10.3 8.3 12 2.5Z"
      />
    </svg>
  );
}
