import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { format } from 'date-fns';

// ============================================================================
// CONFIGURARE GOOGLE CALENDAR API
// Înlocuiește valorile de mai jos cu cele reale.
// 1. Obține un API Key din Google Cloud Console
// 2. Asigură-te că Calendarul tău (terapeutmaria@gmail.com) este PUBLIC pentru a putea citi orele disponibile.
// ============================================================================
export const CALENDAR_API_KEY = "AIzaSyAmEK1Y9_6Xp6m9ygYUgE0XGm9nq4TznwwI";
export const CALENDAR_ID = "terapeutmaria@gmail.com";

export interface TimeSlot {
  time: string;
  available: boolean;
}

export async function checkAvailability(date: Date): Promise<TimeSlot[]> {
  const slots: TimeSlot[] = [];
  for (let i = 9; i <= 17; i++) {
    slots.push({ time: `${i.toString().padStart(2, '0')}:00`, available: true });
  }

  const formattedDate = format(date, 'yyyy-MM-dd');

  const fetchFirebase = async () => {
    try {
      const q = query(collection(db, 'appointments'), where('date', '==', formattedDate));
      const snapshot = await getDocs(q);
      snapshot.forEach((doc) => {
        const appt = doc.data();
        if (appt.status !== 'cancelled') {
          const slot = slots.find(s => s.time === appt.time);
          if (slot) slot.available = false;
        }
      });
    } catch (error) {
      console.error("Eroare Firebase:", error);
    }
  };

  const fetchGoogle = async () => {
    if (!CALENDAR_API_KEY || CALENDAR_API_KEY === "PUNE_CHEIA_TA_AICI") return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000); // Max 2 seconds wait for Calendar
    
    try {
      const timeMin = new Date(date.setHours(0, 0, 0, 0)).toISOString();
      const timeMax = new Date(date.setHours(23, 59, 59, 999)).toISOString();
      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?key=${CALENDAR_API_KEY}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true`;
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      
      if (!response.ok) return;
      const data = await response.json();
      
      (data.items || []).forEach((event: any) => {
        if (event.start?.dateTime) {
          const eventDate = new Date(event.start.dateTime);
          const hourStr = `${eventDate.getHours().toString().padStart(2, '0')}:00`;
          const slot = slots.find(s => s.time === hourStr);
          if (slot) slot.available = false;
        }
      });
    } catch (e) {
      clearTimeout(timeout);
      // Ignore abort/network errors to keep it fast
    }
  };

  // Run both checks concurrently with a strict 500ms timeout to ensure INSTANT UI response
  await Promise.race([
    Promise.allSettled([fetchFirebase(), fetchGoogle()]),
    new Promise(resolve => setTimeout(resolve, 500))
  ]);

  return slots;
}
