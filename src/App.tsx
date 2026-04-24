import { useState } from 'react';
import { Zap, LayoutDashboard, MessageSquare, CheckSquare, RotateCcw, History, type LucideIcon } from 'lucide-react';
import { StoreProvider, useStore } from './store';
import { FOUNDERS, FOUNDER_IDS, FounderId, TabId } from './types';
import { getCurrentWeek, formatWeek } from './lib/utils';
import { Dashboard } from './components/pages/Dashboard';
import { FeedbackPage } from './components/pages/FeedbackPage';
import { TasksPage } from './components/pages/TasksPage';
import { RetroPage } from './components/pages/RetroPage';
import { HistoryPage } from './components/pages/HistoryPage';

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'tasks',     label: 'Tareas',     icon: CheckSquare },
  { id: 'retro',     label: 'Retro',      icon: RotateCcw },
  { id: 'feedback',  label: 'Feedback',   icon: MessageSquare },
  { id: 'dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { id: 'history',   label: 'Historial',  icon: History },
];

function Header({ activeTab, onTabChange }: { activeTab: TabId; onTabChange: (t: TabId) => void }) {
  const { state, dispatch } = useStore();
  const week = getCurrentWeek();
  const currentInfo = FOUNDERS[state.currentUser];

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-cobalt-700 rounded-lg flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-base">FounderPulse</span>
            <span className="hidden sm:block text-xs text-gray-400 ml-2 border-l border-gray-100 pl-2">
              {formatWeek(week)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 hidden sm:block">Soy:</span>
            <div className="flex gap-1">
              {FOUNDER_IDS.map(id => {
                const info = FOUNDERS[id];
                const isActive = state.currentUser === id;
                return (
                  <button
                    key={id}
                    onClick={() => dispatch({ type: 'SET_USER', payload: id })}
                    title={info.name}
                    className="w-8 h-8 rounded-lg text-xs font-bold transition-all border-2"
                    style={
                      isActive
                        ? { backgroundColor: info.color, color: '#fff', borderColor: info.color }
                        : { backgroundColor: info.bg, color: info.color, borderColor: 'transparent' }
                    }
                  >
                    {info.initial}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <nav className="flex gap-0 -mb-px overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm whitespace-nowrap transition-colors ${
                  isActive ? 'tab-active' : 'tab-inactive'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

function AppInner() {
  const [activeTab, setActiveTab] = useState<TabId>('tasks');
  const { loading } = useStore();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cobalt-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Conectando con el equipo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'feedback'  && <FeedbackPage />}
        {activeTab === 'tasks'     && <TasksPage />}
        {activeTab === 'retro'     && <RetroPage />}
        {activeTab === 'history'   && <HistoryPage />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppInner />
    </StoreProvider>
  );
}
