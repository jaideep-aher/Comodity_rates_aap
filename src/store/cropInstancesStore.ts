import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Per-crop farmer state — the sowing-date anchor drives the stage ribbon,
// countdown, and weekly-tasks. Identified by commodity id.
export type CropInstance = {
  commodityId: number;
  sowingDate: string | null;   // ISO yyyy-mm-dd
  variety: string | null;
  areaAcres: number | null;
  // Map of taskId → ISO completion date. Never removed; lets us build a
  // farm diary later.
  tasksDone: Record<string, string>;
};

type State = {
  byId: Record<number, CropInstance>;
  get: (id: number) => CropInstance | undefined;
  setSowingDate: (id: number, date: string | null) => void;
  setVariety: (id: number, v: string | null) => void;
  setArea: (id: number, acres: number | null) => void;
  markTaskDone: (id: number, taskId: string, isoDate: string) => void;
  unmarkTask: (id: number, taskId: string) => void;
  reset: (id: number) => void;
};

function ensure(byId: Record<number, CropInstance>, id: number): CropInstance {
  return (
    byId[id] ?? {
      commodityId: id,
      sowingDate: null,
      variety: null,
      areaAcres: null,
      tasksDone: {},
    }
  );
}

export const useCropInstances = create<State>()(
  persist(
    (set, get) => ({
      byId: {},
      get: (id) => get().byId[id],
      setSowingDate: (id, date) =>
        set((s) => ({
          byId: { ...s.byId, [id]: { ...ensure(s.byId, id), sowingDate: date } },
        })),
      setVariety: (id, variety) =>
        set((s) => ({
          byId: { ...s.byId, [id]: { ...ensure(s.byId, id), variety } },
        })),
      setArea: (id, acres) =>
        set((s) => ({
          byId: { ...s.byId, [id]: { ...ensure(s.byId, id), areaAcres: acres } },
        })),
      markTaskDone: (id, taskId, isoDate) =>
        set((s) => {
          const cur = ensure(s.byId, id);
          return {
            byId: {
              ...s.byId,
              [id]: { ...cur, tasksDone: { ...cur.tasksDone, [taskId]: isoDate } },
            },
          };
        }),
      unmarkTask: (id, taskId) =>
        set((s) => {
          const cur = ensure(s.byId, id);
          const { [taskId]: _removed, ...rest } = cur.tasksDone;
          return {
            byId: { ...s.byId, [id]: { ...cur, tasksDone: rest } },
          };
        }),
      reset: (id) =>
        set((s) => {
          const { [id]: _dropped, ...rest } = s.byId;
          return { byId: rest };
        }),
    }),
    {
      name: 'bajarbhav:crop-instances',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

// Pure helper — kept outside the store so it's usable in selectors.
export function daysSince(iso: string): number {
  const then = new Date(iso + 'T00:00:00').getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - then) / 86_400_000));
}
