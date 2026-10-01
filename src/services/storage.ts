import { UserProfile, MatchRecord } from '../types/user';

const USER_KEY = 'arenaboard_user_profile';
const MATCHES_KEY = 'arenaboard_match_history';
const AUDIO_KEY = 'arenaboard_sound_enabled';

const DEFAULT_AVATARS = ['dices', 'crown', 'brain', 'shield', 'zap', 'bot', 'user', 'rocket', 'star', 'trophy'];

const RANDOM_NAMES = [
  'MeepleMaster',
  'DiceWizard',
  'SquareGenius',
  'PolyominoPro',
  'BoardBaron',
  'TacticsTitan',
  'CatanKnight',
  'SpeedySolver',
  'PuzzleNinja',
  'GridCaptain',
];

export function getStoredUser(): UserProfile {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to read user from storage', e);
  }

  // Generate random default guest
  const randNum = Math.floor(100 + Math.random() * 900);
  const randName = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
  const randAvatar = DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];

  const newUser: UserProfile = {
    id: 'user_' + Math.random().toString(36).substring(2, 9),
    username: `${randName}${randNum}`,
    avatar: randAvatar,
    rating: 1200,
    gamesPlayed: 0,
    wins: 0,
    bestTimeSeconds: null,
    level: 1,
    badges: ['New Challenger'],
  };

  saveUser(newUser);
  return newUser;
}

export function saveUser(user: UserProfile): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to save user', e);
  }
}

export function getStoredMatches(): MatchRecord[] {
  try {
    const raw = localStorage.getItem(MATCHES_KEY);
    if (raw) {
      const list: MatchRecord[] = JSON.parse(raw);
      if (Array.isArray(list)) {
        const seen = new Set<string>();
        let hasDuplicates = false;
        const sanitized = list.map((m, idx) => {
          let id = m.id || `rec_${Date.now()}_${idx}`;
          if (seen.has(id)) {
            hasDuplicates = true;
            id = `${id}_${idx}_${Math.random().toString(36).substring(2, 6)}`;
          }
          seen.add(id);
          return { ...m, id };
        });
        if (hasDuplicates) {
          try {
            localStorage.setItem(MATCHES_KEY, JSON.stringify(sanitized.slice(0, 30)));
          } catch (e) {}
        }
        return sanitized;
      }
    }
  } catch (e) {}
  return [];
}

export function saveMatchRecord(record: MatchRecord): void {
  try {
    const list = getStoredMatches();
    const uniqueId =
      record.id && !list.some((r) => r.id === record.id)
        ? record.id
        : `rec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    list.unshift({ ...record, id: uniqueId });
    localStorage.setItem(MATCHES_KEY, JSON.stringify(list.slice(0, 30)));
  } catch (e) {}
}

export function getSoundEnabled(): boolean {
  try {
    const raw = localStorage.getItem(AUDIO_KEY);
    return raw !== 'false';
  } catch (e) {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(AUDIO_KEY, enabled ? 'true' : 'false');
  } catch (e) {}
}
