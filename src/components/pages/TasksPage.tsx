import { useState } from 'react';
import { Plus, CheckCircle2, XCircle, ChevronDown, Pencil, Trash2, X } from 'lucide-react';
import { useStore } from '../../store';
import {
  FOUNDERS, FOUNDER_IDS, FounderId, Task, TaskStatus,
  TASK_STATUS_LABELS, TASK_STATUS_COLORS,
} from '../../types';
import { getCurrentWeek, getRecentWeeks, genId, formatWeek } from '../../lib/utils';

const STATUS_ORDER: TaskStatus[] = ['pending', 'in-progress', 'completed', 'needs-revision'];

const COLUMN_STYLES: Record<TaskStatus, { header: string; dot: string }> = {
  'pending':        { header: 'text-gray-500',    dot: 'bg-gray-400' },
  'in-progress':    { header: 'text-cobalt-700',  dot: 'bg-cobalt-600' },
  'completed':      { header: 'text-emerald-700', dot: 'bg-emerald-500' },
  'needs-revision': { header: 'text-coral-600',   dot: 'bg-coral-400' },
};

// ─── Shared sub-components ────────────────────────────────────────────────────

function AssigneeAvatars({ ids }: { ids: FounderId[] }) {
  return (
    <div className="flex -space-x-1 shrink-0">
      {ids.map(id => (
        <div
          key={id} title={FOUNDERS[id].name}
          className="w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center text-white ring-2 ring-white"
          style={{ backgroundColor: FOUNDERS[id].color }}
        >
          {FOUNDERS[id].initial}
        </div>
      ))}
    </div>
  );
}

function AssigneeSelector({
  selected, onChange,
}: {
  selected: FounderId[];
  onChange: (ids: FounderId[]) => void;
}) {
  const allSelected = FOUNDER_IDS.every(id => selected.includes(id));

  function toggle(id: FounderId) {
    onChange(
      selected.includes(id)
        ? selected.length > 1 ? selected.filter(x => x !== id) : selected
        : [...selected, id]
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* "Todos" shortcut */}
      <button
        type="button"
        onClick={() => onChange([...FOUNDER_IDS])}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all"
        style={
          allSelected
            ? { backgroundColor: '#475569', color: '#fff', borderColor: '#475569' }
            : { backgroundColor: '#F1F5F9', color: '#475569', borderColor: '#E2E8F0' }
        }
      >
        ★ Todos
      </button>

      <div className="w-px bg-gray-100 self-stretch" />

      {FOUNDER_IDS.map(id => {
        const info = FOUNDERS[id];
        const on = selected.includes(id);
        return (
          <button
            key={id} type="button" onClick={() => toggle(id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all"
            style={
              on
                ? { backgroundColor: info.color, color: '#fff', borderColor: info.color }
                : { backgroundColor: '#fff', color: '#374151', borderColor: '#E5E7EB' }
            }
          >
            <span
              className="w-4 h-4 rounded text-xs font-bold flex items-center justify-center"
              style={{ backgroundColor: on ? 'rgba(255,255,255,0.25)' : info.bg, color: on ? '#fff' : info.color }}
            >
              {info.initial}
            </span>
            {info.name}
            {on && <span className="text-white/70 text-xs">✓</span>}
          </button>
        );
      })}
    </div>
  );
}

function SprintSelect({ value, onChange }: { value: string; onChange: (w: string) => void }) {
  const weeks = getRecentWeeks(8);
  if (!weeks.includes(value)) weeks.push(value);

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="input"
    >
      {weeks.sort().reverse().map(w => (
        <option key={w} value={w}>{formatWeek(w)}</option>
      ))}
    </select>
  );
}

// ─── Task form modal (add + edit) ─────────────────────────────────────────────

function TaskFormModal({ task, onClose }: { task?: Task; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const isEdit = !!task;

  const [title, setTitle]           = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [assignedTo, setAssignedTo] = useState<FounderId[]>(task?.assignedTo ?? [state.currentUser]);
  const [sprintWeek, setSprintWeek] = useState(task?.sprintWeek ?? getCurrentWeek());

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || assignedTo.length === 0) return;

    if (isEdit && task) {
      dispatch({
        type: 'UPDATE_TASK',
        payload: { ...task, title: title.trim(), description: description.trim(), assignedTo, sprintWeek },
      });
    } else {
      dispatch({
        type: 'ADD_TASK',
        payload: {
          id: genId(),
          title: title.trim(),
          description: description.trim(),
          assignedTo,
          status: 'pending',
          sprintWeek,
          createdAt: new Date().toISOString(),
          validations: [],
        },
      });
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">
            {isEdit ? 'Editar tarea' : 'Nueva tarea'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Título</label>
            <input
              type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Ej: Armar deck para avance 6"
              className="input mt-2" autoFocus required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Descripción / Definition of Done
            </label>
            <textarea
              value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Ej: Incluir slide de problema, dolor, validaciones, solución y mercado"
              rows={3} className="input mt-2 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Asignado a{' '}
              <span className="normal-case text-gray-400 font-normal">(uno o varios)</span>
            </label>
            <div className="mt-2">
              <AssigneeSelector selected={assignedTo} onChange={setAssignedTo} />
            </div>
            {assignedTo.length > 1 && (
              <p className="text-xs text-cobalt-600 mt-1.5">
                {assignedTo.length === FOUNDER_IDS.length ? 'Todo el equipo' : `${assignedTo.length} personas`} asignadas
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sprint</label>
            <div className="mt-2">
              <SprintSelect value={sprintWeek} onChange={setSprintWeek} />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1">
              {isEdit ? 'Guardar cambios' : 'Crear tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Validation panel ─────────────────────────────────────────────────────────

function ValidationPanel({ task }: { task: Task }) {
  const { state, dispatch } = useStore();
  const existing = task.validations.find(v => v.byId === state.currentUser);
  const [comment, setComment] = useState('');
  const [open, setOpen] = useState(false);

  if (task.assignedTo.includes(state.currentUser)) return null;
  if (task.status !== 'completed' && task.status !== 'needs-revision') return null;

  function validate(approved: boolean) {
    dispatch({
      type: 'ADD_VALIDATION',
      payload: {
        taskId: task.id,
        validation: { byId: state.currentUser, approved, comment: comment.trim(), at: new Date().toISOString() },
      },
    });
    if (!approved) dispatch({ type: 'UPDATE_TASK_STATUS', payload: { id: task.id, status: 'needs-revision' } });
    setComment('');
    setOpen(false);
  }

  return (
    <div className="mt-2 pt-2 border-t border-gray-50">
      {existing ? (
        <div className={`flex items-center gap-1.5 text-xs ${existing.approved ? 'text-emerald-600' : 'text-coral-500'}`}>
          {existing.approved ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
          Tu validación: {existing.approved ? 'Aprobado' : 'Necesita revisión'}
        </div>
      ) : (
        <>
          <button
            onClick={() => setOpen(!open)}
            className="text-xs text-cobalt-600 hover:text-cobalt-800 font-medium flex items-center gap-1 transition-colors"
          >
            Validar tarea <ChevronDown size={11} className={open ? 'rotate-180' : ''} />
          </button>
          {open && (
            <div className="mt-2 space-y-2">
              <input
                type="text" value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Comentario (opcional)" className="input text-xs py-1"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => validate(true)}
                  className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
                >
                  <CheckCircle2 size={12} /> Aprobado
                </button>
                <button
                  onClick={() => validate(false)}
                  className="flex items-center gap-1 text-xs bg-coral-50 text-coral-600 hover:bg-coral-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
                >
                  <XCircle size={12} /> Necesita revisión
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Task card ────────────────────────────────────────────────────────────────

function TaskCard({ task }: { task: Task }) {
  const { state, dispatch } = useStore();
  const [editing, setEditing] = useState(false);
  const isOwner = task.assignedTo.includes(state.currentUser);
  const approvals  = task.validations.filter(v => v.approved).length;
  const rejections = task.validations.filter(v => !v.approved).length;

  function confirmDelete() {
    if (window.confirm(`¿Borrar "${task.title}"?`)) {
      dispatch({ type: 'DELETE_TASK', payload: task.id });
    }
  }

  return (
    <>
      <div className="card p-3.5 space-y-2 group">
        <div className="flex items-start gap-2">
          <AssigneeAvatars ids={task.assignedTo} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 leading-snug">{task.title}</p>
            {task.description && (
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{task.description}</p>
            )}
          </div>
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              title="Editar"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={confirmDelete}
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
              title="Borrar"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {isOwner && (
          <div>
            <label className="text-xs text-gray-400">Mover a:</label>
            <div className="flex gap-1 flex-wrap mt-1">
              {STATUS_ORDER.filter(s => s !== task.status).map(s => (
                <button
                  key={s}
                  onClick={() => dispatch({ type: 'UPDATE_TASK_STATUS', payload: { id: task.id, status: s } })}
                  className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${TASK_STATUS_COLORS[s]}`}
                >
                  {TASK_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        )}

        {(task.status === 'completed' || task.status === 'needs-revision') && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            {approvals > 0 && (
              <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 size={11} /> {approvals}</span>
            )}
            {rejections > 0 && (
              <span className="flex items-center gap-1 text-coral-500"><XCircle size={11} /> {rejections}</span>
            )}
          </div>
        )}

        <ValidationPanel task={task} />
      </div>

      {editing && <TaskFormModal task={task} onClose={() => setEditing(false)} />}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function TasksPage() {
  const { state } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const week = getCurrentWeek();
  const [viewAll, setViewAll] = useState(false);

  const tasks = state.tasks.filter(t => viewAll || t.sprintWeek === week);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-gray-900 text-lg">Tareas</h2>
          <button
            onClick={() => setViewAll(!viewAll)}
            className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
              viewAll ? 'bg-gray-200 text-gray-700' : 'bg-cobalt-50 text-cobalt-700'
            }`}
          >
            {viewAll ? 'Todos los sprints' : 'Sprint actual'}
          </button>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-1.5">
          <Plus size={15} /> Nueva tarea
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATUS_ORDER.map(status => {
          const col = tasks.filter(t => t.status === status);
          const style = COLUMN_STYLES[status];
          return (
            <div key={status}>
              <div className={`flex items-center gap-2 mb-3 ${style.header}`}>
                <div className={`w-2 h-2 rounded-full ${style.dot}`} />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  {TASK_STATUS_LABELS[status]}
                </span>
                <span className="text-xs opacity-60 ml-auto">{col.length}</span>
              </div>
              <div className="space-y-2">
                {col.map(t => <TaskCard key={t.id} task={t} />)}
                {col.length === 0 && (
                  <div className="border-2 border-dashed border-gray-100 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-300">Sin tareas</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showAddModal && <TaskFormModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
