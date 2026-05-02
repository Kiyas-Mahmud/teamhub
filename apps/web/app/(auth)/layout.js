export default function AuthLayout({ children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden glass-bar lg:flex lg:flex-col lg:justify-between lg:border-r lg:border-border">
        <div className="flex items-center gap-2 px-12 pt-12">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-[color:var(--accent-contrast)]">
            <span className="text-xs font-bold">T</span>
          </span>
          <span className="text-sm font-semibold tracking-tight">Team Hub</span>
        </div>

        <div className="px-12">
          <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight text-fg">
            Where teams turn shared goals into shipped outcomes.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-muted">
            Goals, action items, announcements, analytics, and live presence — everything
            your team needs in one calm workspace.
          </p>

          <ul className="mt-10 grid gap-3 text-sm">
            {[
              'Real-time goals with milestones & progress',
              'Kanban action items synced across browsers',
              'Announcements with reactions and threaded comments',
              'Role-based access and live presence',
            ].map((point) => (
              <li key={point} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span className="text-fgMuted">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="px-12 pb-12 text-xs text-muted">© Team Hub · Collaborative workspace</p>
      </aside>

      <main className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
