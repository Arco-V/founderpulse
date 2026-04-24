import { useState } from 'react';
import { ThumbsUp, TrendingDown, Trash2, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { useStore } from '../../store';
import {
  FOUNDERS, FOUNDER_IDS, FounderId, FeedbackTarget, GROUP_TARGET,
  Feedback, RADAR_AXES, RadarScore,
} from '../../types';
import { getCurrentWeek, genId, formatDate, formatWeek } from '../../lib/utils';

function RatingSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-24 shrink-0">{label}</span>
      <input
        type="range" min={1} max={10} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 accent-cobalt-700"
      />
      <span className="text-xs font-bold text-cobalt-700 w-6 text-right">{value}</span>
    </div>
  );
}

function TargetButton({
  id, selected, onSelect,
}: {
  id: FeedbackTarget;
  selected: boolean;
  onSelect: () => void;
}) {
  const isGroup = id === 'group';
  const info = isGroup ? GROUP_TARGET : FOUNDERS[id as FounderId];
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
        selected ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
      }`}
      style={selected ? { backgroundColor: info.color, borderColor: info.color } : {}}
    >
      <span
        className="w-5 h-5 rounded-md text-xs font-bold flex items-center justify-center"
        style={{
          backgroundColor: selected ? 'rgba(255,255,255,0.25)' : info.bg,
          color: selected ? '#fff' : info.color,
        }}
      >
        {isGroup ? <Users size={11} /> : info.initial}
      </span>
      {info.name}
    </button>
  );
}

function AddFeedbackForm() {
  const { state, dispatch } = useStore();
  const [toId, setToId] = useState<FeedbackTarget>('group');
  const [type, setType] = useState<'kudos' | 'delta'>('kudos');
  const [content, setContent] = useState('');
  const [showRating, setShowRating] = useState(false);
  const [scores, setScores] = useState<RadarScore>({ proactivity: 5, execution: 5, innovation: 5, ownership: 5 });

  const others = FOUNDER_IDS.filter(id => id !== state.currentUser);
  const isGroup = toId === 'group';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    const feedback: Feedback = {
      id: genId(),
      type,
      fromId: state.currentUser,
      toId,
      content: content.trim(),
      radarScore: (!isGroup && showRating) ? { ...scores } : undefined,
      sprintWeek: getCurrentWeek(),
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_FEEDBACK', payload: feedback });
    setContent('');
    setShowRating(false);
    setScores({ proactivity: 5, execution: 5, innovation: 5, ownership: 5 });
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 space-y-4">
      <h2 className="font-bold text-gray-900 text-lg">Nuevo feedback</h2>

      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Para</label>
        <div className="flex flex-wrap gap-2 mt-2">
          <TargetButton id="group" selected={toId === 'group'} onSelect={() => setToId('group')} />
          <div className="w-px bg-gray-100 self-stretch" />
          {others.map(id => (
            <TargetButton key={id} id={id} selected={toId === id} onSelect={() => setToId(id)} />
          ))}
        </div>
        {isGroup && (
          <p className="text-xs text-gray-400 mt-1.5">
            Feedback sobre el equipo en general (dinámica, comunicación, resultados grupales).
          </p>
        )}
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tipo</label>
        <div className="flex gap-2 mt-2">
          <button
            type="button" onClick={() => setType('kudos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              type === 'kudos' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <ThumbsUp size={14} /> Kudos
          </button>
          <button
            type="button" onClick={() => setType('delta')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              type === 'delta' ? 'bg-coral-500 text-white' : 'bg-coral-50 text-coral-600 hover:bg-coral-100'
            }`}
          >
            <TrendingDown size={14} /> Delta
          </button>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {type === 'kudos'
            ? isGroup ? 'Fortaleza o logro del equipo' : 'Highlight / fortaleza demostrada'
            : isGroup ? 'Punto de mejora grupal' : 'Área de mejora (basada en evidencia)'}
        </label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={
            type === 'kudos'
              ? isGroup
                ? 'Ej: "Como equipo estamos muy alineados en la visión del producto"'
                : 'Ej: "Hizo 3 entrevistas con contadores esta semana sin que se lo pidan"'
              : isGroup
                ? 'Ej: "La distribución de carga de trabajo está siendo desigual entre los integrantes"'
                : 'Ej: "El entregable no incluyó el análisis de mercado acordado en la reunión del lunes"'
          }
          rows={3}
          className="input mt-2 resize-none"
          required
        />
      </div>

      {!isGroup && (
        <div>
          <button
            type="button"
            onClick={() => setShowRating(!showRating)}
            className="flex items-center gap-1.5 text-xs text-cobalt-600 hover:text-cobalt-800 font-medium transition-colors"
          >
            {showRating ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showRating ? 'Ocultar' : 'Calificar ejes de performance'} (opcional)
          </button>
          {showRating && (
            <div className="mt-3 p-4 bg-gray-50 rounded-xl space-y-3">
              <p className="text-xs text-gray-500">Calificá cada eje del 1 al 10 para este sprint:</p>
              {RADAR_AXES.map(ax => (
                <RatingSlider
                  key={ax.key} label={ax.label} value={scores[ax.key]}
                  onChange={v => setScores(prev => ({ ...prev, [ax.key]: v }))}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <button type="submit" className="btn-primary w-full">
        Enviar feedback
      </button>
    </form>
  );
}

function FeedbackItem({ fb, canDelete }: { fb: Feedback; canDelete: boolean }) {
  const { dispatch } = useStore();
  const from = FOUNDERS[fb.fromId];
  const isGroup = fb.toId === 'group';
  const toInfo = isGroup ? GROUP_TARGET : FOUNDERS[fb.toId as FounderId];

  return (
    <div className="card p-4 group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={fb.type === 'kudos' ? 'badge-kudos' : 'badge-delta'}>
            {fb.type === 'kudos' ? '👍 Kudos' : '△ Delta'}
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className="w-5 h-5 rounded text-xs font-bold flex items-center justify-center text-white"
              style={{ backgroundColor: from.color }}
            >
              {from.initial}
            </span>
            <span className="text-xs text-gray-400">→</span>
            <span
              className="w-5 h-5 rounded text-xs font-bold flex items-center justify-center"
              style={{ backgroundColor: toInfo.bg, color: toInfo.color }}
            >
              {isGroup ? <Users size={11} /> : toInfo.initial}
            </span>
            <span className="text-xs text-gray-500 font-medium">{toInfo.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-400 hidden sm:block">{formatDate(fb.createdAt)}</span>
          {canDelete && (
            <button
              onClick={() => dispatch({ type: 'DELETE_FEEDBACK', payload: fb.id })}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400 transition-all"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-800 mt-2">{fb.content}</p>
      {fb.radarScore && (
        <div className="flex gap-3 mt-2 flex-wrap">
          {RADAR_AXES.map(ax => (
            <span key={ax.key} className="text-xs text-gray-400">
              {ax.label}: <span className="font-semibold text-gray-700">{fb.radarScore![ax.key]}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function FeedbackPage() {
  const { state } = useStore();
  const [filterTarget, setFilterTarget] = useState<FeedbackTarget | 'all'>('all');
  const week = getCurrentWeek();

  const filtered = state.feedback
    .filter(f => f.sprintWeek === week)
    .filter(f => filterTarget === 'all' || f.toId === filterTarget);

  const kudos = filtered.filter(f => f.type === 'kudos');
  const deltas = filtered.filter(f => f.type === 'delta');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-2">
        <AddFeedbackForm />
      </div>

      <div className="lg:col-span-3 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-bold text-gray-900">
            Feedback · <span className="text-gray-400 font-normal">{formatWeek(week)}</span>
          </h2>
          <select
            value={filterTarget}
            onChange={e => setFilterTarget(e.target.value as FeedbackTarget | 'all')}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-cobalt-500"
          >
            <option value="all">Todos</option>
            <option value="group">Grupo</option>
            {FOUNDER_IDS.map(id => (
              <option key={id} value={id}>{FOUNDERS[id].name}</option>
            ))}
          </select>
        </div>

        {kudos.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">
              Kudos ({kudos.length})
            </p>
            <div className="space-y-2">
              {kudos.map(fb => (
                <FeedbackItem key={fb.id} fb={fb} canDelete={fb.fromId === state.currentUser} />
              ))}
            </div>
          </div>
        )}

        {deltas.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-coral-500 uppercase tracking-wide mb-2">
              Deltas ({deltas.length})
            </p>
            <div className="space-y-2">
              {deltas.map(fb => (
                <FeedbackItem key={fb.id} fb={fb} canDelete={fb.fromId === state.currentUser} />
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="card p-8 text-center">
            <p className="text-gray-400 text-sm">Sin feedback este sprint todavía.</p>
            <p className="text-gray-300 text-xs mt-1">Sé el primero en reconocer el trabajo del equipo.</p>
          </div>
        )}
      </div>
    </div>
  );
}
