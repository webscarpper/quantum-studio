import { atom } from 'nanostores';

export const isTopDropModalOpen = atom<boolean>(false);

export function openTopDropModal() {
  isTopDropModalOpen.set(true);
}

export function closeTopDropModal() {
  isTopDropModalOpen.set(false);
}

export function toggleTopDropModal() {
  isTopDropModalOpen.set(!isTopDropModalOpen.get());
}
