import { Term } from './googleSheetsService';
import { isEqual } from 'lodash';

export interface DiffSummary {
  added: number;
  updated: number;
  removed: number;
  isDifferent: boolean;
  newTerms: Term[];
}

export const computeDiff = (localTerms: Term[], fetchedTerms: Term[]): DiffSummary => {
  const localMap = new Map(localTerms.map(t => [t.id, t]));
  const fetchedMap = new Map(fetchedTerms.map(t => [t.id, t]));

  let added = 0;
  let updated = 0;
  let removed = 0;

  fetchedTerms.forEach(fetchedTerm => {
    const localTerm = localMap.get(fetchedTerm.id);
    if (!localTerm) {
      added++;
    } else if (!isEqual(localTerm, fetchedTerm)) {
      updated++;
    }
  });

  localTerms.forEach(localTerm => {
    if (!fetchedMap.has(localTerm.id)) {
      removed++;
    }
  });

  return {
    added,
    updated,
    removed,
    isDifferent: added > 0 || updated > 0 || removed > 0,
    newTerms: fetchedTerms
  };
};
