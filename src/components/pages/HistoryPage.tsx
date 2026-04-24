import { useState } from 'react';
import { ChevronDown, ChevronRight, Users } from 'lucide-react';
import { useStore } from '../../store';
import { FOUNDERS, FOUNDER_IDS, FounderId, GROUP_TARGET, TASK_STATUS_LABELS } from '../../types';
import { getCurrentWeek, getAllWeeks, formatWeek, getRadarForFounder } from '../../lib/utils';
import { FounderRadar } from '../FounderRadar';

function SprintSummary({ week }: { week: string }) {
  const { state } = useStore();
  const [open, setOpen] = useState(week === getCurrentWeek());

  const weekFb = state.feedback.filter(f => f.sprintWeek === week);
  const weekTasks = state.tasks.filter(t => t.sprintWeek === week);
  const weekRetro = state.retros.find(r => r.sprintWeek === week);
  const isCurrent = week === getCurrentWeek();

  const kudosCount = weekFb.filter(f => f.type === 'kudos').length;
  const deltaCount = weekFb.filter(f => f.type === 'delta').length;
  const doneCount = weekTasks.filter(t => t.status === 'completed').length;

  return (
    <div className={`card ${isCurrent ? 'border-cobalt-200 ring-1 ring-cobalt-100' : ''}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <div className="flex items-center gap-3">
          {open ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
          <div>
            <span className="font-semibold text-gray-900">{formatWeek(week)}</span>
            {isCurrent && (
              <span className="ml-2 text-xs bg-cobalt-50 text-cobalt-700 rounded-full px-2 py-0.5 font-medium">
                Actual
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="text-emerald-600 font-medium">👍 {kudosCount}</span>
          <span className="text-coral-500 font-medium">△ {deltaCount}</span>
          <span className="text-gray-500">✓ {doneCount}/{weekTasks.length}</span>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-6 border-t border-gray-50 pt-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Performance por integrante
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {FOUNDER_IDS.map(id => {
                const info = FOUNDERS[id];
                const score = getRadarForFounder(id, state.feedback, week);
                const fbReceived = weekFb.filter(f => f.toId === id);
                const tasksAssigned = weekTasks.filter(t => t.assignedTo.includes(id));
                return (
                  <div key={id} className="text-center">
                    <div
                      className="w-8 h-8 rounded-lg text-sm font-bold flex items-center justify-center text-white mx-auto mb-1"
                      style={{ backgroundColor: info.color }}
                    >
                      {info.initial}
                    </div>
                    <p className="text-xs font-medium text-gray-700 mb-2">{info.name}</p>
                    <FounderRadar score={score} color={info.color} size={120} />
                    <div className="flex justify-center gap-2 mt-1 text-xs text-gray-400">
                      <span className="text-emerald-600">
                        👍 {fbReceived.filter(f => f.type === 'kudos').length}
                      </span>
                      <span className="text-coral-500">
                        △ {fbReceived.filter(f => f.type === 'delta').length}
                      </span>
                      <span>✓ {tasksAssigned.filter(t => t.status === 'completed').length}/{tasksAssigned.length}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {weekFb.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Feedback del sprint
              </p>
              <div className="space-y-2">
                {weekFb.map(fb => {
                  const isGroup = fb.toId === 'group';
                  const toInfo = isGroup ? GROUP_TARGET : FOUNDERS[fb.toId as FounderId];
                  return (
                    <div key={fb.id} className="flex items-start gap-2">
                      <span className={fb.type === 'kudos' ? 'badge-kudos shrink-0' : 'badge-delta shrink-0'}>
                        {fb.type === 'kudos' ? 'Kudos' : 'Delta'}
                      </span>
                      <span
                        className="w-4 h-4 rounded text-xs font-bold flex items-center justify-center shrink-0"
                        style={{ backgroundColor: toInfo.bg, color: toInfo.color }}
                      >
                        {isGroup ? <Users size={10} /> : toInfo.initial}
                      </span>
                      <p className="text-sm text-gray-700">{fb.content}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {weekTasks.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Tareas del sprint
              </p>
              <div className="space-y-1.5">
                {weekTasks.map(t => (
                  <div key={t.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1 shrink-0">
                        {t.assignedTo.map(id => (
                          <div
                            key={id}
                            className="w-4 h-4 rounded text-xs font-bold flex items-center justify-center text-white ring-1 ring-white"
                            style={{ backgroundColor: FOUNDERS[id].color }}
                          >
                            {FOUNDERS[id].initial}
                          </div>
                        ))}
                      </div>
                      <span className="text-sm text-gray-700">{t.title}</span>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{TASK_STATUS_LABELS[t.status]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {weekRetro && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Retrospectiva
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {weekRetro.strengths.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-emerald-600 mb-1">Fortalezas</p>
                    {weekRetro.strengths.map((s, i) => (
                      <p key={i} className="text-xs text-gray-600">• {s}</p>
                    ))}
                  </div>
                )}
                {weekRetro.improvements.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-coral-500 mb-1">Mejoras</p>
                    {weekRetro.improvements.map((s, i) => (
                      <p key={i} className="text-xs text-gray-600">• {s}</p>
                    ))}
                  </div>
                )}
                {weekRetro.nextTasks.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-cobalt-700 mb-1">Próx. tareas</p>
                    {weekRetro.nextTasks.map((s, i) => (
                      <p key={i} className="text-xs text-gray-600">• {s}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function HistoryPage() {
  const { state } = useStore();
  const weeks = getAllWeeks(state.feedback, state.tasks);

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-gray-900 text-lg">Historial de sprints</h2>
      {weeks.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-gray-400">Sin datos todavía. Empezá agregando feedback o tareas.</p>
        </div>
      ) : (
        weeks.map(w => <SprintSummary key={w} week={w} />)
      )}
    </div>
  );
}
