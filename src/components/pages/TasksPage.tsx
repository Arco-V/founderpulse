import { useState } from 'react';
import { Plus, CheckCircle2, XCircle, ChevronDown, User } from 'lucide-react';
import { useStore } from '../../store';
import {
  FOUNDERS, FOUNDER_IDS, FounderId, Task, TaskStatus,
  TASK_STATUS_LABELS, TASK_STATUS_COLORS
} from '../../types';
import { getCurrentWeek, genId, formatDate } from '../../lib/utils';

const STATUS_ORDER: TaskStatus[] = ['pending', 'in-progress', 'completed', 'needs-revision'];

const COLUMN_STYLES: Record<TaskStatus, { header: string; dot: string }> = {
  'pending':        { header: 'text-gray-500', dot: 'bg-gray-400' },
  'in-progress':    { header: 'text-cobalt-700', dot: 'bg-cobalt-600' },
  'completed':      { header: 'text-emerald-700', dot: 'bg-emerald-500' },
  'needs-revision': { header: 'text-coral-600', dot: 'bg-coral-400' },
};

function AddTaskModal({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState<FounderId>(state.currentUser);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const task: Task = {
      id: genId(),
      title: title.trim(),
      description: description.trim(),
      assignedTo,
      status: 'pending',
      sprintWeek: getCurrentWeek(),
      createdAt: new Date().toISOString(),
      validations: [],
    };
    dispatch({ type: 'ADD_TASK', payload: task });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">Nueva tarea</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Título</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ej: Armar deck para avance 6"
              className="input mt-2"
              autoFocus
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Descripción / Definition of Done
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ej: Incluir slide de problema, dolor, validaciones, solución y mercado"
              rows={3}
              className="input mt-2 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Asignado a</label>
            <div className="flex gap-2 mt-2 flex-wrap">
              {FOUNDER_IDS.map(id => {
                const info = FOUNDERS[id];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setAssignedTo(id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all"
                    style={
                      assignedTo === id
                        ? { backgroundColor: info.color, color: '#fff', borderColor: info.color }
                        : { backgroundColor: '#fff', color: '#374151', borderColor: '#E5E7EB' }
                    }
                  >
                    <span
                      className="w-4 h-4 rounded text-xs font-bold flex items-center justify-center"
                      style={{ backgroundColor: assignedTo === id ? 'rgba(255,255,255,0.25)' : info.bg, color: info.color }}
                    >
                      {info.initial}
                    </span>
                    {info.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex-1">
              Crear tarea
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ValidationPanel({ task }: { task: Task }) {
  const { state, dispatch } = useStore();
  const existing = task.validations.find(v => v.byId === state.currentUser);
  const [comment, setComment] = useState('');
  const [open, setOpen] = useState(false);

  if (task.assignedTo === state.currentUser) return null;
  if (task.status !== 'completed' && task.status !== 'needs-revision') return null;

  function validate(approved: boolean) {
    dispatch({
      type: 'ADD_VALIDATION',
      payload: {
        taskId: task.id,
        validation: {
          byId: state.currentUser,
          approved,
          comment: comment.trim(),
          at: new Date().toISOString(),
        },
      },
    });
    if (!approved) {
      dispatch({ type: 'UPDATE_TASK_STATUS', payload: { id: task.id, status: 'needs-revision' } });
    }
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
                type="text"
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Comentario (opcional)"
                className="input text-xs py-1"
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

function TaskCard({ task }: { task: Task }) {
  const { state, dispatch } = useStore();
  const info = FOUNDERS[task.assignedTo];
  const isOwner = task.assignedTo === state.currentUser;
  const approvals = task.validations.filter(v => v.approved).length;
  const rejections = task.validations.filter(v => !v.approved).length;

  return (
    <div className="card p-3.5 space-y-2">
      <div className="flex items-start gap-2">
        <div
          className="w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center text-white shrink-0 mt-0.5"
          style={{ backgroundColor: info.color }}
        >
          {info.initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 leading-snug">{task.title}</p>
          {task.description && (
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{task.description}</p>
          )}
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
            <span className="flex items-center gap-1 text-emerald-600">
              <CheckCircle2 size={11} /> {approvals}
            </span>
          )}
          {rejections > 0 && (
            <span className="flex items-center gap-1 text-coral-500">
              <XCircle size={11} /> {rejections}
            </span>
          )}
        </div>
      )}

      <ValidationPanel task={task} />
    </div>
  );
}

export function TasksPage() {
  const { state } = useStore();
  const [showModal, setShowModal] = useState(false);
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
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1.5">
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

      {showModal && <AddTaskModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
