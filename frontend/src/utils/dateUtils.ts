import { format, isToday, isTomorrow, isYesterday, parseISO, differenceInMinutes, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatTime(isoStr: string): string {
  return format(parseISO(isoStr), 'HH:mm');
}

export function formatDate(isoStr: string): string {
  const d = parseISO(isoStr);
  if (isToday(d))     return 'Hoje';
  if (isTomorrow(d))  return 'Amanhã';
  if (isYesterday(d)) return 'Ontem';
  return format(d, "d 'de' MMMM", { locale: ptBR });
}

export function formatDateTime(isoStr: string): string {
  return format(parseISO(isoStr), "d MMM, HH:mm", { locale: ptBR });
}

export function formatDateFull(isoStr: string): string {
  return format(parseISO(isoStr), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
}

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function nowISO(): string {
  return format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");
}

export function minutesUntil(isoStr: string): number {
  return differenceInMinutes(parseISO(isoStr), new Date());
}

export function isOverdue(isoStr: string): boolean {
  return isBefore(parseISO(isoStr), new Date());
}

export function isFuture(isoStr: string): boolean {
  return isAfter(parseISO(isoStr), new Date());
}

export function timeLabel(isoStr: string): string {
  const mins = minutesUntil(isoStr);
  if (mins < -60)   return `${Math.abs(Math.floor(mins / 60))}h atrás`;
  if (mins < 0)     return `${Math.abs(mins)}min atrás`;
  if (mins === 0)   return 'Agora';
  if (mins < 60)    return `em ${mins}min`;
  if (mins < 1440)  return `em ${Math.floor(mins / 60)}h`;
  return `em ${Math.floor(mins / 1440)}d`;
}

export function addMinutesISO(isoStr: string, minutes: number): string {
  const d = new Date(parseISO(isoStr).getTime() + minutes * 60000);
  return format(d, "yyyy-MM-dd'T'HH:mm:ss");
}

export function formatShortDate(dateStr: string): string {
  return format(parseISO(`${dateStr}T00:00:00`), "dd/MM/yyyy");
}
