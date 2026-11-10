import { haptics } from './hapticsService';

export interface InteractionNotification {
  id: string;
  type: 'KEY_REQUEST' | 'REACTION_LIKE' | 'REACTION_FLIRT' | 'CHAT_INVITE';
  senderId: string;
  senderAlias: string;
  senderAvatar: string;
  senderRole: 'couple' | 'solo_female' | 'solo_male';
  message: string;
  timestamp: string;
  isRead: boolean;
  status?: 'pending' | 'accepted' | 'declined';
  mediaPreviewUrl?: string;
}

const INITIAL_NOTIFICATIONS: InteractionNotification[] = [
  {
    id: 'notif_01',
    type: 'KEY_REQUEST',
    senderId: 'cpl_bogota_01',
    senderAlias: 'Carlos & Sofia (Pareja VIP)',
    senderAvatar: 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&w=800&q=80',
    senderRole: 'couple',
    message: 'Ha solicitado el intercambio mutuo de Llaves de Bóveda Privada.',
    timestamp: 'Hace 5 min',
    isRead: false,
    status: 'pending'
  },
  {
    id: 'notif_02',
    type: 'REACTION_FLIRT',
    senderId: 'usr_unicorn_bog_02',
    senderAlias: 'Camila (Unicornio VIP)',
    senderAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
    senderRole: 'solo_female',
    message: 'Te envió un Guiño de Coqueteo 😉 y Fuego 🔥 a tu foto de Anapoima.',
    timestamp: 'Hace 18 min',
    isRead: false,
    status: 'pending'
  },
  {
    id: 'notif_03',
    type: 'CHAT_INVITE',
    senderId: 'usr_bull_bogota_07',
    senderAlias: 'Andrés Bull VIP',
    senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
    senderRole: 'solo_male',
    message: 'Inició una sala de Chat Efímero Cifrado contigo.',
    timestamp: 'Hace 1 hora',
    isRead: true,
    status: 'accepted'
  }
];

class NotificationService {
  private notifications: InteractionNotification[] = [];

  constructor() {
    const saved = localStorage.getItem('aethel_notifications');
    if (saved) {
      try {
        this.notifications = JSON.parse(saved);
      } catch {
        this.notifications = INITIAL_NOTIFICATIONS;
      }
    } else {
      this.notifications = INITIAL_NOTIFICATIONS;
      this.save();
    }
  }

  private save() {
    localStorage.setItem('aethel_notifications', JSON.stringify(this.notifications));
  }

  public getNotifications(): InteractionNotification[] {
    return [...this.notifications];
  }

  public getUnreadCount(): number {
    return this.notifications.filter((n) => !n.isRead).length;
  }

  public markAllAsRead(): void {
    this.notifications = this.notifications.map((n) => ({ ...n, isRead: true }));
    this.save();
  }

  public addNotification(notification: Omit<InteractionNotification, 'id' | 'timestamp' | 'isRead'>): void {
    const newNotif: InteractionNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      timestamp: 'Ahora mismo',
      isRead: false
    };
    this.notifications.unshift(newNotif);
    this.save();
    haptics.success();
  }

  public updateStatus(id: string, status: 'accepted' | 'declined'): void {
    this.notifications = this.notifications.map((n) => {
      if (n.id === id) {
        return { ...n, status, isRead: true };
      }
      return n;
    });
    this.save();
    haptics.selection();
  }

  public info(message: string): void {
    haptics.selection();
    this.addNotification({
      type: 'CHAT_INVITE',
      senderId: 'system',
      senderAlias: 'Aethel Concierge',
      senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      senderRole: 'couple',
      message
    });
  }

  public success(message: string): void {
    haptics.success();
    this.addNotification({
      type: 'CHAT_INVITE',
      senderId: 'system',
      senderAlias: 'Aethel VIP',
      senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      senderRole: 'couple',
      message
    });
  }
}

export const notificationService = new NotificationService();
