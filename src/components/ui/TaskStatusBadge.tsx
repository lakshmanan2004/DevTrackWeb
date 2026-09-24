import React from 'react';
import { CheckCircle2Icon, CircleDashedIcon, LoaderIcon, OctagonAlertIcon } from 'lucide-react';
import { TaskStatus } from '../../types';
import { Badge, BadgeTone } from './Badge';

export const taskStatusMeta: Record<
  TaskStatus,
  {label: string;tone: BadgeTone;icon: React.ReactNode;border: string;}> =
{
  todo: {
    label: 'Todo',
    tone: 'grey',
    icon: <CircleDashedIcon className="h-3.5 w-3.5" />,
    border: 'border-l-offline'
  },
  progress: {
    label: 'In Progress',
    tone: 'blue',
    icon: <LoaderIcon className="h-3.5 w-3.5" />,
    border: 'border-l-brand-light'
  },
  done: {
    label: 'Done',
    tone: 'green',
    icon: <CheckCircle2Icon className="h-3.5 w-3.5" />,
    border: 'border-l-ok'
  },
  blocked: {
    label: 'Blocked',
    tone: 'red',
    icon: <OctagonAlertIcon className="h-3.5 w-3.5" />,
    border: 'border-l-danger'
  }
};

export function TaskStatusBadge({ status }: {status: TaskStatus;}) {
  const meta = taskStatusMeta[status];
  return (
    <Badge tone={meta.tone}>
      {meta.icon}
      {meta.label}
    </Badge>);

}