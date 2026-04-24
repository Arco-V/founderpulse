export type FounderId = 'luli' | 'martin' | 'sofi' | 'valen';

export const FOUNDERS: Record<FounderId, { name: string; initial: string; color: string; bg: string }> = {
  luli:   { name: 'Luli',   initial: 'L', color: '#7C3AED', bg: '#EDE9FE' },
  martin: { name: 'Martín', initial: 'M', color: '#059669', bg: '#D1FAE5' },
  sofi:   { name: 'Sofi',   initial: 'S', color: '#D97706', bg: '#FEF3C7' },
  valen:  { name: 'Valen',  initial: 'V', color: '#1D4ED8', bg: '#DBEAFE' },
};

export const FOUNDER_IDS: FounderId[] = ['luli', 'martin', 'sofi', 'valen'];

export const RADAR_AXES = [
  { key: 'proactivity', label: 'Proactividad' },
  { key: 'execution',   label: 'Ejecución' },
  { key: 'innovation',  label: 'Innovación' },
  { key: 'ownership',   label: 'Ownership' },
] as const;

export type RadarKey = typeof RADAR_AXES[number]['key'];
export type RadarScore = Record<RadarKey, number>;

export type FeedbackTarget = FounderId | 'group';

export const GROUP_TARGET = {
  name: 'Grupo',
  initial: '★',
  color: '#475569',
  bg: '#F1F5F9',
} as const;

export interface Feedback {
  id: string;
  type: 'kudos' | 'delta';
  fromId: FounderId;
  toId: FeedbackTarget;
  content: string;
  radarScore?: RadarScore;
  sprintWeek: string;
  createdAt: string;
}

export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'needs-revision';

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  'pending':          'Pendiente',
  'in-progress':      'En Proceso',
  'completed':        'Completado',
  'needs-revision':   'Necesita Revisión',
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  'pending':          'bg-gray-100 text-gray-600',
  'in-progress':      'bg-cobalt-50 text-cobalt-700',
  'completed':        'bg-emerald-50 text-emerald-700',
  'needs-revision':   'bg-coral-50 text-coral-600',
};

export interface TaskValidation {
  byId: FounderId;
  approved: boolean;
  comment: string;
  at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: FounderId[];
  status: TaskStatus;
  sprintWeek: string;
  createdAt: string;
  validations: TaskValidation[];
}

export interface GroupRetro {
  id: string;
  sprintWeek: string;
  strengths: string[];
  improvements: string[];
  nextTasks: string[];
  createdAt: string;
}

export type TabId = 'dashboard' | 'feedback' | 'tasks' | 'retro' | 'history';

export interface AppState {
  currentUser: FounderId;
  feedback: Feedback[];
  tasks: Task[];
  retros: GroupRetro[];
}
