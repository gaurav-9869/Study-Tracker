export type SubjectKey = string;
export type SessionMode = 'Study' | 'Revise' | 'Exercise';

export interface UserSettings {
  name: string;
  className: string;
  activeSubjects: string[];
  subjectGoals: Record<string, number>;
}

export interface PlanItem {
  id: string;
  subject: SubjectKey;
  topic: string;
  sessionType: SessionMode;
  targetMins: number;
  status?: 'pending' | 'completed';
}

export interface LogItem {
  id: string;
  planId?: string;
  associatedPlanId?: string;
  subject: SubjectKey;
  topic: string;
  sessionType: SessionMode;
  revisionType?: string;
  startPage?: number;
  endPage?: number;
  vsaCount?: number;
  saCount?: number;
  laCount?: number;
  activeMins: number;
  distractionMins: number;
  recoveryMins: number;
  retentionScore?: number;
  frictionAnalysis?: string;
  notes: string;
  isMissed?: boolean;
  synced?: boolean;
}

const DEFAULT_SUBJECTS: Record<string, { name: string; text: string; bg: string; from: string; color: string }> = {
  bio: { name: 'Biology', text: 'text-[#50C878]', bg: 'bg-[#50C878]', from: 'from-[#50C878]', color: '#50C878' },
  phys: { name: 'Physics', text: 'text-[#00BFFF]', bg: 'bg-[#00BFFF]', from: 'from-[#00BFFF]', color: '#00BFFF' },
  chem: { name: 'Chemistry', text: 'text-[#7851A9]', bg: 'bg-[#7851A9]', from: 'from-[#7851A9]', color: '#7851A9' },
  math: { name: 'Mathematics', text: 'text-[#FF4500]', bg: 'bg-[#FF4500]', from: 'from-[#FF4500]', color: '#FF4500' },
};

export const getSubjectConfig = (key: string) => {
    if (DEFAULT_SUBJECTS[key]) return DEFAULT_SUBJECTS[key];
    const normalized = key.toLowerCase().trim();
    const found = Object.values(DEFAULT_SUBJECTS).find(s => s.name.toLowerCase() === normalized);
    if (found) return found;
    return { name: key, text: 'text-primary', bg: 'bg-primary', from: 'from-primary', color: '#00BFFF' };
};

export function getLocalDateString(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export const getFocusScore = (log: LogItem) => {
    if (log.isMissed) return 0;
    const total = log.activeMins + log.distractionMins + log.recoveryMins;
    if (total === 0) return 0;
    return Math.round((log.activeMins / total) * 100);
}
