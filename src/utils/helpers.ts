// src/utils/helpers.ts

export const prepareData = (workouts: any[]) => {
  return workouts.map(workout => ({
    ...workout,
    exercises: workout.exercises.map((ex: any) => ({
      ...ex,
      logs: ex.logs || Array.from({ length: ex.sets }).map(() => ({
        weight: '',
        reps: '',
        completed: false
      }))
    }))
  }));
};

export const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute:'2-digit' });
};
