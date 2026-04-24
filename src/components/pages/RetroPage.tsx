import { useState } from 'react';
import { Plus, Trash2, Pencil, CheckCircle2 } from 'lucide-react';
import { useStore } from '../../store';
import { GroupRetro } from '../../types';
import { getCurrentWeek, genId, formatDate, formatWeek } from '../../lib/utils';

function StringListInput({
  label,
  placeholder,
  values,
  onChange,
  color,
}: {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (v: string[]) => void;
  color: string;
}) {
  const [input, setInput] = useState('');

  function add() {
    if (!input.trim()) return;
    onChange([...values, input.trim()]);
    setInput('');
  }

  return (
    <div className="space-y-2">
      <label className={`text-xs font-semibold uppercase tracking-wide ${color}`}>{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder}
          className="input flex-1"
        />
        <button
          type="button"
          onClick={add}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors shrink-0"
        >
          <Plus size={16} className="text-gray-600" />
        </button>
      </div>
      {values.length > 0 && (
        <ul className="space-y-1">
          {values.map((v, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
              <span className="flex-1">{v}</span>
              <button
                type="button"
                onClick={() => onChange(values.filter((_, j) => j !== i))}
                className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors"
              >
                <Trash2 size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RetroForm({ existing, onSave }: { existing?: GroupRetro; onSave: () => void }) {
  const { dispatch } = useStore();
  const week = getCurrentWeek();
  const [strengths, setStrengths] = useState<string[]>(existing?.strengths ?? []);
  const [improvements, setImprovements] = useState<string[]>(existing?.improvements ?? []);
  const [nextTasks, setNextTasks] = useState<string[]>(existing?.nextTasks ?? []);

  function handleSave() {
    if (strengths.length === 0 && improvements.length === 0 && nextTasks.length === 0) return;
    if (existing) {
      dispatch({
        type: 'UPDATE_RETRO',
        payload: { ...existing, strengths, improvements, nextTasks },
      });
    } else {
      dispatch({
        type: 'ADD_RETRO',
        payload: {
          id: genId(),
          sprintWeek: week,
          strengths,
          improvements,
          nextTasks,
          createdAt: new Date().toISOString(),
        },
      });
    }
    onSave();
  }

  return (
    <div className="card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-900 text-lg">
          {existing ? 'Editar retro' : 'Nueva retro'}
        </h2>
        <span className="text-xs text-gray-400">{formatWeek(week)}</span>
      </div>

      <StringListInput
        label="¿Qué salió bien? Fortalezas del equipo"
        placeholder="Ej: Entregamos el avance completo y a tiempo"
        values={strengths}
        onChange={setStrengths}
        color="text-emerald-600"
      />

      <StringListInput
        label="¿Qué mejorar? Puntos críticos"
        placeholder="Ej: Distribución desigual de carga de trabajo"
        values={improvements}
        onChange={setImprovements}
        color="text-coral-500"
      />

      <StringListInput
        label="Tareas críticas próximo sprint"
        placeholder="Ej: Conseguir 5 entrevistas con pymes"
        values={nextTasks}
        onChange={setNextTasks}
        color="text-cobalt-700"
      />

      <button
        onClick={handleSave}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        <CheckCircle2 size={15} />
        {existing ? 'Guardar cambios' : 'Guardar retro'}
      </button>
    </div>
  );
}

function RetroCard({ retro, onEdit }: { retro: GroupRetro; onEdit: () => void }) {
  const week = getCurrentWeek();
  const isCurrent = retro.sprintWeek === week;

  return (
    <div className={`card p-5 ${isCurrent ? 'border-cobalt-200 ring-1 ring-cobalt-100' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-semibold text-gray-900">{formatWeek(retro.sprintWeek)}</p>
          {isCurrent && (
            <span className="text-xs text-cobalt-600 font-medium">Sprint actual</span>
          )}
        </div>
        {isCurrent && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            <Pencil size={12} /> Editar
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <p className="text-xs font-semibold text-emerald-600 mb-2 uppercase tracking-wide">
            Fortalezas
          </p>
          {retro.strengths.length === 0 ? (
            <p className="text-xs text-gray-300">—</p>
          ) : (
            retro.strengths.map((s, i) => (
              <p key={i} className="text-sm text-gray-700 mb-1">• {s}</p>
            ))
          )}
        </div>
        <div>
          <p className="text-xs font-semibold text-coral-500 mb-2 uppercase tracking-wide">
            Puntos de mejora
          </p>
          {retro.improvements.length === 0 ? (
            <p className="text-xs text-gray-300">—</p>
          ) : (
            retro.improvements.map((s, i) => (
              <p key={i} className="text-sm text-gray-700 mb-1">• {s}</p>
            ))
          )}
        </div>
        <div>
          <p className="text-xs font-semibold text-cobalt-700 mb-2 uppercase tracking-wide">
            Próximas tareas
          </p>
          {retro.nextTasks.length === 0 ? (
            <p className="text-xs text-gray-300">—</p>
          ) : (
            retro.nextTasks.map((s, i) => (
              <p key={i} className="text-sm text-gray-700 mb-1">• {s}</p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function RetroPage() {
  const { state } = useStore();
  const week = getCurrentWeek();
  const currentRetro = state.retros.find(r => r.sprintWeek === week);
  const [editing, setEditing] = useState(false);

  const showForm = !currentRetro || editing;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-900 text-lg">Retrospectiva grupal</h2>
        {currentRetro && !editing && (
          <button onClick={() => setEditing(true)} className="btn-secondary flex items-center gap-1.5">
            <Plus size={14} /> Nueva retro (nuevo sprint)
          </button>
        )}
      </div>

      {showForm && (
        <RetroForm
          existing={editing && currentRetro ? currentRetro : undefined}
          onSave={() => setEditing(false)}
        />
      )}

      {state.retros.length > 0 && (
        <div className="space-y-4">
          {!showForm && (
            <RetroCard retro={currentRetro!} onEdit={() => setEditing(true)} />
          )}
          {state.retros
            .filter(r => r.sprintWeek !== week || showForm)
            .slice(0, 10)
            .map(r => (
              <RetroCard key={r.id} retro={r} onEdit={() => setEditing(true)} />
            ))}
        </div>
      )}

      {state.retros.length === 0 && !showForm && (
        <div className="card p-10 text-center">
          <p className="text-gray-400">Sin retrospectivas aún.</p>
        </div>
      )}
    </div>
  );
}
