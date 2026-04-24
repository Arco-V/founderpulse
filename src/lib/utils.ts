import { Feedback, RadarScore, RADAR_AXES } from '../types';

export function getCurrentWeek(): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-S${String(weekNo).padStart(2, '0')}`;
}

export function formatWeek(week: string): string {
  const [year, sprint] = week.split('-');
  return `Sprint ${sprint} · ${year}`;
}

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export function getRadarForFounder(
  founderId: string,
  feedback: Feedback[],
  sprintWeek: string
): RadarScore {
  const relevant = feedback.filter(
    f => f.toId === founderId && f.sprintWeek === sprintWeek && f.radarScore
  );
  if (relevant.length === 0) {
    return { proactivity: 5, execution: 5, innovation: 5, ownership: 5 };
  }
  const result = {} as RadarScore;
  for (const ax of RADAR_AXES) {
    const vals = relevant.map(f => f.radarScore![ax.key]).filter(v => v > 0);
    result[ax.key] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 5;
  }
  return result;
}

export function getAllWeeks(feedback: Feedback[], tasks: { sprintWeek: string }[]): string[] {
  const weeks = new Set<string>();
  feedback.forEach(f => weeks.add(f.sprintWeek));
  tasks.forEach(t => weeks.add(t.sprintWeek));
  weeks.add(getCurrentWeek());
  return Array.from(weeks).sort().reverse();
}
