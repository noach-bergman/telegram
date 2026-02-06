
export interface TelegramMessage {
  id: number;
  text: string;
  date: number;
  author?: string;
  channelName: string;
  channelUsername: string;
  photoUrl?: string;
}

export interface NewsInsight {
  summary: string;
  impact: 'low' | 'medium' | 'high';
  tags: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
}

export enum AppStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS'
}
