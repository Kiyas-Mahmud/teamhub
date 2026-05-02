import Link from 'next/link';
import { ArrowRight, BarChart3, Bell, CheckSquare, Target, Users } from 'lucide-react';

const cards = [
  {
    title: 'Goals',
    body: 'Create goals, milestones, and progress notes the team can track.',
    href: 'goals',
    icon: Target,
  },
  {
    title: 'Action items',
    body: 'Move work through Todo, In progress, and Done on a live Kanban.',
    href: 'action-items',
    icon: CheckSquare,
  },
  {
    title: 'Announcements',
    body: 'Post updates, collect reactions, and discuss decisions in one feed.',
    href: 'announcements',
    icon: Bell,
  },
  {
    title: 'Members',
    body: 'Invite teammates, set roles, and see who is online in real time.',
    href: 'members',
    icon: Users,
  },
  {
    title: 'Analytics',
    body: 'Review completion trends and export CSV reports for stakeholders.',
    href: 'analytics',
    icon: BarChart3,
  },
];

export default function WorkspaceOverviewPage({ params }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-fg">Get started</h2>
        <p className="mt-1 text-sm text-muted">
          Everything in this workspace, organized into focused sections.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ title, body, href, icon: Icon }) => (
          <Link key={title} href={`/${params.workspaceId}/${href}`} className="group">
            <article className="flex h-full flex-col rounded-lg glass-panel p-4 transition-colors hover:border-borderStrong">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-accentSoft text-accent">
                <Icon className="h-4 w-4" />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-fg">{title}</h3>
              <p className="mt-1 flex-1 text-sm text-muted">{body}</p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-muted transition-colors group-hover:text-accent">
                Open
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
