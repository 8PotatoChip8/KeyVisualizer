import Store from 'electron-store';
import { AppConfig, Profile } from '../shared/types';
import { getConfig, setConfig } from './store';
import { DEFAULT_CONFIG } from '../shared/constants';

interface ProfileStoreSchema {
  profiles: Profile[];
  activeProfile: string | null;
}

const profileStore = new Store<ProfileStoreSchema>({
  name: 'profiles',
  defaults: {
    profiles: [],
    activeProfile: null,
  },
});

export function getProfiles(): Profile[] {
  return profileStore.get('profiles') as Profile[];
}

export function getActiveProfileName(): string | null {
  return profileStore.get('activeProfile') as string | null;
}

export function saveProfile(name: string): void {
  const profiles = getProfiles();
  const config = getConfig();
  const existing = profiles.findIndex(p => p.name === name);

  const profile: Profile = { name, config };

  if (existing >= 0) {
    profiles[existing] = profile;
  } else {
    profiles.push(profile);
  }

  profileStore.set('profiles', profiles);
  profileStore.set('activeProfile', name);
}

export function loadProfile(name: string): AppConfig | null {
  const profiles = getProfiles();
  const profile = profiles.find(p => p.name === name);
  if (!profile) return null;

  // Merge with defaults to handle missing fields from older profiles
  const config = { ...DEFAULT_CONFIG, ...profile.config };
  setConfig(config);
  profileStore.set('activeProfile', name);
  return config;
}

export function deleteProfile(name: string): void {
  const profiles = getProfiles().filter(p => p.name !== name);
  profileStore.set('profiles', profiles);
  const active = getActiveProfileName();
  if (active === name) {
    profileStore.set('activeProfile', null);
  }
}

export function renameProfile(oldName: string, newName: string): void {
  const profiles = getProfiles();
  const profile = profiles.find(p => p.name === oldName);
  if (profile) {
    profile.name = newName;
    profileStore.set('profiles', profiles);
    if (getActiveProfileName() === oldName) {
      profileStore.set('activeProfile', newName);
    }
  }
}
