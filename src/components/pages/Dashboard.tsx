import { useState } from 'react';
import { ThumbsUp, AlertCircle, CheckCircle2, ChevronRight, X, Users } from 'lucide-react';
import { useStore } from '../../store';
import { FounderRadar } from '../FounderRadar';
import { FOUNDERS, FOUNDER_IDS, FounderId, GROUP_TARGET, TASK_STATUS_LABELS, TASK_STATUS_COLORS } from '../../types';
import { getCurrentWeek, getRadarForFounder, formatDate, formatWeek } from '../../lib/utils';

function FounderModal({ founderId, onClose }: { founderId: FounderId; onClose: () => void }) {
  const { state } = useStore();
  const week = getCurrentWeek();
  const info = FOUNDERS[founderId];
  const score = getRadarForFounder(founderId, state.feedback, week);

  const fbList = state.feedback.filter(f => f.toId === founderId);
  const taskList = state.tasks.filter(t => t.assignedTo.includes(founderId));
  const kudos = fbList.filter(f => f.type === 'kudos' && f.sprintWeek === week);
  const deltas = fbList.filter(f => f.type === 'delta' && f.sprintWeek === week);

  const allWeeks = [...new Set(fbList.map(f => f.sprintWeek))].sort().reverse();

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white"
              style={{ backgroundColor: info.color }}
            >
              {info.initial}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{info.name}</h2>
              <p className="text-sm text-gray-500">{formatWeek(week)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-4 gap-3">
            {(['proactivity', 'execution', 'innovation', 'ownership'] as const).map((key, i) => {
              const labels = ['Proactividad', 'Ejecución', 'Innovación', 'Ownership'];
              const val = score[key];
              return (
                <div key={key} className="card p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">{labels[i]}</p>
                  <p className="text-2xl font-bold" style={{ color: info.color }}>
                    {val.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-400">/10</p>
                </div>
              );
            })}
          </div>

          <FounderRadar score={score} color={info.color} size={220} />

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Feedback por sprint</h3>
            {allWeeks.length === 0 && (
              <p className="text-sm text-gray-400">Sin feedback aún.</p>
            )}
            {allWeeks.map(w => {
              const wKudos = fbList.filter(f => f.sprintWeek === w && f.type === 'kudos');
              const wDeltas = fbList.filter(f => f.sprintWeek === w && f.type === 'delta');
              return (
                <div key={w} className="mb-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    {formatWeek(w)}
                  </p>
                  {wKudos.map(f => (
                    <div key={f.id} className="flex gap-2 mb-2">
                      <span className="badge-kudos shrink-0 mt-0.5">Kudos</span>
                      <p className="text-sm text-gray-700">{f.content}</p>
                    </div>
                  ))}
                  {wDeltas.map(f => (
                    <div key={f.id} className="flex gap-2 mb-2">
                      <span className="badge-delta shrink-0 mt-0.5">Delta</span>
                      <p className="text-sm text-gray-700">{f.content}</p>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Tareas asignadas</h3>
            {taskList.length === 0 && <p className="text-sm text-gray-400">Sin tareas aún.</p>}
            {taskList.slice(0, 8).map(t => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <p className="text-sm text-gray-800">{t.title}</p>
                <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${TASK_STATUS_COLORS[t.status]}`}>
                  {TASK_STATUS_LABELS[t.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FounderCard({ founderId, onOpen }: { founderId: FounderId; onOpen: () => void }) {
  const { state } = useStore();
  const week = getCurrentWeek();
  const info = FOUNDERS[founderId];
  const score = getRadarForFounder(founderId, state.feedback, week);

  const weekFb = state.feedback.filter(f => f.toId === founderId && f.sprintWeek === week);
  const kudosCount = weekFb.filter(f => f.type === 'kudos').length;
  const deltaCount = weekFb.filter(f => f.type === 'delta').length;
  const weekTasks = state.tasks.filter(t => t.assignedTo.includes(founderId) && t.sprintWeek === week);
  const doneTasks = weekTasks.filter(t => t.status === 'completed').length;

  return (
    <div
      className="card p-5 hover:shadow-md transition-shadow cursor-pointer group"
      onClick={onOpen}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold text-white"
            style={{ backgroundColor: info.color }}
          >
            {info.initial}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{info.name}</p>
            <p className="text-xs text-gray-400">{formatWeek(week)}</p>
          </div>
        </div>
        <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
      </div>

      <FounderRadar score={score} color={info.color} size={160} />

      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
        <div className="flex items-center gap-1 text-emerald-600">
          <ThumbsUp size={13} />
          <span className="text-xs font-medium">{kudosCount}</span>
        </div>
        <div className="flex items-center gap-1 text-coral-500">
          <AlertCircle size={13} />
          <span className="text-xs font-medium">{deltaCount}</span>
        </div>
        <div className="flex items-center gap-1 text-cobalt-600 ml-auto">
          <CheckCircle2 size={13} />
          <span className="text-xs font-medium">{doneTasks}/{weekTasks.length} tareas</span>
        </div>
      </div>
    </div>
  );
}

function TeamHealthBanner() {
  const { state } = useStore();
  const week = getCurrentWeek();
  const retro = state.retros.find(r => r.sprintWeek === week);

  if (!retro) return null;

  return (
    <div className="card p-4 mb-6 border-l-4 border-cobalt-600">
      <p className="text-xs font-semibold text-cobalt-600 uppercase tracking-wide mb-2">
        Salud del equipo · {formatWeek(week)}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {retro.strengths.length > 0 && (
          <div>
            <p className="text-xs font-medium text-emerald-600 mb-1">Fortalezas</p>
            {retro.strengths.map((s, i) => (
              <p key={i} className="text-sm text-gray-700">• {s}</p>
            ))}
          </div>
        )}
        {retro.improvements.length > 0 && (
          <div>
            <p className="text-xs font-medium text-coral-500 mb-1">Puntos de mejora</p>
            {retro.improvements.map((s, i) => (
              <p key={i} className="text-sm text-gray-700">• {s}</p>
            ))}
          </div>
        )}
        {retro.nextTasks.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Próximas tareas</p>
            {retro.nextTasks.map((s, i) => (
              <p key={i} className="text-sm text-gray-700">• {s}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GroupFeedFeed() {
  const { state } = useStore();
  const week = getCurrentWeek();
  const groupFb = state.feedback.filter(f => f.toId === 'group' && f.sprintWeek === week);
  if (groupFb.length === 0) return null;

  const kudos = groupFb.filter(f => f.type === 'kudos');
  const deltas = groupFb.filter(f => f.type === 'delta');

  return (
    <div className="card p-4 mt-6">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: GROUP_TARGET.bg }}
        >
          <Users size={14} style={{ color: GROUP_TARGET.color }} />
        </div>
        <p className="text-sm font-semibold text-gray-700">Feedback al equipo</p>
        <span className="text-xs text-gray-400 ml-auto">{formatWeek(week)}</span>
      </div>
      <div className="space-y-2">
        {kudos.map(fb => (
          <div key={fb.id} className="flex gap-2 items-start">
            <span className="badge-kudos shrink-0">Kudos</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className="w-4 h-4 rounded text-xs font-bold flex items-center justify-center text-white"
                style={{ backgroundColor: FOUNDERS[fb.fromId].color }}
              >
                {FOUNDERS[fb.fromId].initial}
              </span>
            </div>
            <p className="text-sm text-gray-700">{fb.content}</p>
          </div>
        ))}
        {deltas.map(fb => (
          <div key={fb.id} className="flex gap-2 items-start">
            <span className="badge-delta shrink-0">Delta</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className="w-4 h-4 rounded text-xs font-bold flex items-center justify-center text-white"
                style={{ backgroundColor: FOUNDERS[fb.fromId].color }}
              >
                {FOUNDERS[fb.fromId].initial}
              </span>
            </div>
            <p className="text-sm text-gray-700">{fb.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Dashboard() {
  const [selectedFounder, setSelectedFounder] = useState<FounderId | null>(null);

  return (
    <div>
      <TeamHealthBanner />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FOUNDER_IDS.map(id => (
          <FounderCard key={id} founderId={id} onOpen={() => setSelectedFounder(id)} />
        ))}
      </div>
      <GroupFeedFeed />
      {selectedFounder && (
        <FounderModal founderId={selectedFounder} onClose={() => setSelectedFounder(null)} />
      )}
    </div>
  );
}
