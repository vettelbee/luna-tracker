// Los avisos, con cuidado: expo-notifications protesta al cargarse
// en Expo Go de Android (quitaron el push remoto en el SDK 53+).
// Por eso lo pido con require perezoso y, si no está, no hay avisos
// pero la app sigue funcionando. En la versión de desarrollo va todo.
import { Platform } from 'react-native';
import type * as Notifs from 'expo-notifications';

type Modulo = typeof Notifs;

let modulo: Modulo | null = null;
let intentado = false;
let manejadorPuesto = false;

function cargar(): Modulo | null {
  if (intentado) return modulo;
  intentado = true;
  try {
    modulo = require('expo-notifications') as Modulo;
  } catch {
    modulo = null;
  }
  return modulo;
}

export function avisosDisponibles(): boolean {
  if (Platform.OS === 'web') return false;
  return cargar() !== null;
}

export function prepararAvisos() {
  const m = cargar();
  if (!m || manejadorPuesto) return;
  manejadorPuesto = true;
  m.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function permisoAvisos(): Promise<boolean> {
  const m = cargar();
  if (!m) return false;
  try {
    const { status } = await m.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function programarFecha(titulo: string, cuerpo: string, fecha: Date): Promise<string | null> {
  const m = cargar();
  if (!m) return null;
  try {
    return await m.scheduleNotificationAsync({
      content: { title: titulo, body: cuerpo },
      trigger: { type: m.SchedulableTriggerInputTypes.DATE, date: fecha },
    });
  } catch {
    return null;
  }
}

export async function programarDiaria(
  titulo: string,
  cuerpo: string,
  hora: number,
  minuto: number,
): Promise<string | null> {
  const m = cargar();
  if (!m) return null;
  try {
    return await m.scheduleNotificationAsync({
      content: { title: titulo, body: cuerpo },
      trigger: { type: m.SchedulableTriggerInputTypes.DAILY, hour: hora, minute: minuto },
    });
  } catch {
    return null;
  }
}

export async function olvidarAviso(id: string) {
  const m = cargar();
  if (!m) return;
  try {
    await m.cancelScheduledNotificationAsync(id);
  } catch {
    // si no se puede, no se puede.
  }
}

export async function olvidarTodos() {
  const m = cargar();
  if (!m) return;
  try {
    await m.cancelAllScheduledNotificationsAsync();
  } catch {
    // si no se puede, no se puede.
  }
}
