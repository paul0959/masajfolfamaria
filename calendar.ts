export interface TimeSlot {
  time: string;
  available: boolean;
}

export const checkAvailability = async (date: Date): Promise<TimeSlot[]> => {
  // Simulare încărcare
  await new Promise(resolve => setTimeout(resolve, 500));

  const slots: TimeSlot[] = [];
  // Generăm orele între 08:00 și 19:00
  for (let i = 8; i <= 19; i++) {
    slots.push({
      time: `${i.toString().padStart(2, '0')}:00`,
      available: true
    });
  }

  return slots;
};