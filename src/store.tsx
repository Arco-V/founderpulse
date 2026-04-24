import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from './lib/supabase';
import { AppState, FounderId, Feedback, Task, TaskStatus, GroupRetro, TaskValidation } from './types';

// ─── Action types ─────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_USER'; payload: FounderId }
  | { type: 'ADD_FEEDBACK'; payload: Feedback }
  | { type: 'DELETE_FEEDBACK'; payload: string }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK_STATUS'; payload: { id: string; status: TaskStatus } }
  | { type: 'ADD_VALIDATION'; payload: { taskId: string; validation: TaskValidation } }
  | { type: 'ADD_RETRO'; payload: GroupRetro }
  | { type: 'UPDATE_RETRO'; payload: GroupRetro }
  | { type: 'LOAD'; payload: Partial<AppState> }
  // Real-time only — no Supabase write triggered
  | { type: '_RT_FEEDBACK_INSERT'; payload: Feedback }
  | { type: '_RT_FEEDBACK_DELETE'; payload: string }
  | { type: '_RT_TASK_INSERT'; payload: Task }
  | { type: '_RT_TASK_UPDATE'; payload: Task }
  | { type: '_RT_RETRO_UPSERT'; payload: GroupRetro };

// ─── Reducer ──────────────────────────────────────────────────────────────────

const initialState: AppState = {
  currentUser: (localStorage.getItem('fp-user') as FounderId) || 'valen',
  feedback: [],
  tasks: [],
  retros: [],
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, currentUser: action.payload };

    case 'ADD_FEEDBACK':
    case '_RT_FEEDBACK_INSERT':
      if (state.feedback.some(f => f.id === action.payload.id)) return state;
      return { ...state, feedback: [action.payload, ...state.feedback] };

    case 'DELETE_FEEDBACK':
    case '_RT_FEEDBACK_DELETE':
      return { ...state, feedback: state.feedback.filter(f => f.id !== action.payload) };

    case 'ADD_TASK':
    case '_RT_TASK_INSERT':
      if (state.tasks.some(t => t.id === action.payload.id)) return state;
      return { ...state, tasks: [action.payload, ...state.tasks] };

    case 'UPDATE_TASK_STATUS':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.payload.id ? { ...t, status: action.payload.status } : t
        ),
      };

    case '_RT_TASK_UPDATE':
      return {
        ...state,
        tasks: state.tasks.map(t => (t.id === action.payload.id ? action.payload : t)),
      };

    case 'ADD_VALIDATION':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.payload.taskId
            ? {
                ...t,
                validations: [
                  ...t.validations.filter(v => v.byId !== action.payload.validation.byId),
                  action.payload.validation,
                ],
              }
            : t
        ),
      };

    case 'ADD_RETRO':
    case '_RT_RETRO_UPSERT':
      if (state.retros.some(r => r.id === action.payload.id)) {
        return { ...state, retros: state.retros.map(r => r.id === action.payload.id ? action.payload : r) };
      }
      return { ...state, retros: [action.payload, ...state.retros] };

    case 'UPDATE_RETRO':
      return {
        ...state,
        retros: state.retros.map(r => (r.id === action.payload.id ? action.payload : r)),
      };

    case 'LOAD':
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

// ─── DB ↔ TypeScript mappers ──────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function mapFeedbackFromDb(row: Row): Feedback {
  return {
    id: row.id,
    type: row.type,
    fromId: row.from_id,
    toId: row.to_id,
    content: row.content,
    radarScore: row.radar_score ?? undefined,
    sprintWeek: row.sprint_week,
    createdAt: row.created_at,
  };
}

function mapFeedbackToDb(fb: Feedback): Row {
  return {
    id: fb.id,
    type: fb.type,
    from_id: fb.fromId,
    to_id: fb.toId,
    content: fb.content,
    radar_score: fb.radarScore ?? null,
    sprint_week: fb.sprintWeek,
    created_at: fb.createdAt,
  };
}

function mapValidationFromDb(v: Row): TaskValidation {
  return {
    byId: v.by_id ?? v.byId,
    approved: v.approved,
    comment: v.comment ?? '',
    at: v.at,
  };
}

function mapValidationToDb(v: TaskValidation): Row {
  return { by_id: v.byId, approved: v.approved, comment: v.comment, at: v.at };
}

function mapTaskFromDb(row: Row): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    assignedTo: Array.isArray(row.assigned_to) ? row.assigned_to : [row.assigned_to],
    status: row.status,
    sprintWeek: row.sprint_week,
    createdAt: row.created_at,
    validations: (row.validations ?? []).map(mapValidationFromDb),
  };
}

function mapTaskToDb(task: Task): Row {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    assigned_to: task.assignedTo,
    status: task.status,
    sprint_week: task.sprintWeek,
    created_at: task.createdAt,
    validations: task.validations.map(mapValidationToDb),
  };
}

function mapRetroFromDb(row: Row): GroupRetro {
  return {
    id: row.id,
    sprintWeek: row.sprint_week,
    strengths: row.strengths ?? [],
    improvements: row.improvements ?? [],
    nextTasks: row.next_tasks ?? [],
    createdAt: row.created_at,
  };
}

function mapRetroToDb(retro: GroupRetro): Row {
  return {
    id: retro.id,
    sprint_week: retro.sprintWeek,
    strengths: retro.strengths,
    improvements: retro.improvements,
    next_tasks: retro.nextTasks,
    created_at: retro.createdAt,
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

const StoreContext = createContext<{
  state: AppState;
  dispatch: (action: Action) => void;
  loading: boolean;
} | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, _dispatch] = useReducer(reducer, initialState);
  const [loading, setLoading] = useState(true);

  // stateRef always holds the latest state (for pre-dispatch reads in async callbacks)
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  // ── Initial data fetch ──────────────────────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      const [fbRes, taskRes, retroRes] = await Promise.all([
        supabase.from('feedback').select('*').order('created_at', { ascending: false }),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('retros').select('*').order('created_at', { ascending: false }),
      ]);
      _dispatch({
        type: 'LOAD',
        payload: {
          feedback: (fbRes.data ?? []).map(mapFeedbackFromDb),
          tasks:    (taskRes.data ?? []).map(mapTaskFromDb),
          retros:   (retroRes.data ?? []).map(mapRetroFromDb),
        },
      });
      setLoading(false);
    }
    loadData();
  }, []);

  // ── Real-time subscriptions ─────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('fp-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feedback' },
        p => _dispatch({ type: '_RT_FEEDBACK_INSERT', payload: mapFeedbackFromDb(p.new) })
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'feedback' },
        p => _dispatch({ type: '_RT_FEEDBACK_DELETE', payload: (p.old as Row).id })
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tasks' },
        p => _dispatch({ type: '_RT_TASK_INSERT', payload: mapTaskFromDb(p.new) })
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tasks' },
        p => _dispatch({ type: '_RT_TASK_UPDATE', payload: mapTaskFromDb(p.new) })
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'retros' },
        p => _dispatch({ type: '_RT_RETRO_UPSERT', payload: mapRetroFromDb(p.new) })
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'retros' },
        p => _dispatch({ type: '_RT_RETRO_UPSERT', payload: mapRetroFromDb(p.new) })
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── Persist selected user in localStorage ───────────────────────────────────
  useEffect(() => {
    localStorage.setItem('fp-user', state.currentUser);
  }, [state.currentUser]);

  // ── Wrapped dispatch: optimistic local update + async Supabase write ────────
  const dispatch = useCallback((action: Action): void => {
    const prevState = stateRef.current; // snapshot BEFORE local update
    _dispatch(action);

    // Fire-and-forget Supabase writes
    void (async () => {
      switch (action.type) {
        case 'ADD_FEEDBACK':
          await supabase.from('feedback').insert([mapFeedbackToDb(action.payload)]);
          break;

        case 'DELETE_FEEDBACK':
          await supabase.from('feedback').delete().eq('id', action.payload);
          break;

        case 'ADD_TASK':
          await supabase.from('tasks').insert([mapTaskToDb(action.payload)]);
          break;

        case 'UPDATE_TASK_STATUS':
          await supabase
            .from('tasks')
            .update({ status: action.payload.status })
            .eq('id', action.payload.id);
          break;

        case 'ADD_VALIDATION': {
          const task = prevState.tasks.find(t => t.id === action.payload.taskId);
          if (task) {
            const newValidations = [
              ...task.validations.filter(v => v.byId !== action.payload.validation.byId),
              action.payload.validation,
            ].map(mapValidationToDb);
            await supabase
              .from('tasks')
              .update({ validations: newValidations })
              .eq('id', action.payload.taskId);
          }
          break;
        }

        case 'ADD_RETRO':
          await supabase.from('retros').insert([mapRetroToDb(action.payload)]);
          break;

        case 'UPDATE_RETRO':
          await supabase
            .from('retros')
            .update(mapRetroToDb(action.payload))
            .eq('id', action.payload.id);
          break;

        // SET_USER, LOAD, _RT_* → no DB write needed
        default:
          break;
      }
    })();
  }, []);

  return (
    <StoreContext.Provider value={{ state, dispatch, loading }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore outside StoreProvider');
  return ctx;
}
