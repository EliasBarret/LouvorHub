import { Component } from '@angular/core';

interface Notificacao {
  id: number;
  type: 'escalacao' | 'musica' | 'aviso' | 'confirmacao';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

@Component({
  selector: 'app-notificacoes',
  imports: [],
  templateUrl: './notificacoes.component.html',
  styleUrl: './notificacoes.component.scss'
})
export class NotificacoesComponent {
  notificacoes: Notificacao[] = [
    {
      id: 1,
      type: 'escalacao',
      title: 'Nova escalação',
      message: 'Você foi escalado para o Culto de Quarta — Oração em 23/04.',
      time: 'Há 2 horas',
      read: false,
    },
    {
      id: 2,
      type: 'musica',
      title: 'Repertório atualizado',
      message: 'O repertório do Culto de Domingo — Manhã foi atualizado com novas músicas.',
      time: 'Há 5 horas',
      read: false,
    },
    {
      id: 3,
      type: 'confirmacao',
      title: 'Confirmação pendente',
      message: 'Confirme sua participação no Culto de Domingo — Noite.',
      time: 'Ontem',
      read: false,
    },
    {
      id: 4,
      type: 'aviso',
      title: 'Ensaio remarcado',
      message: 'O ensaio de sexta foi remarcado para sábado às 16:00.',
      time: '2 dias atrás',
      read: true,
    },
    {
      id: 5,
      type: 'musica',
      title: 'Nova música adicionada',
      message: 'A música "Oceanos" foi adicionada ao repertório geral.',
      time: '3 dias atrás',
      read: true,
    },
  ];

  get unreadCount(): number {
    return this.notificacoes.filter(n => !n.read).length;
  }

  getIcon(type: string): string {
    const icons: Record<string, string> = {
      escalacao: 'event',
      musica: 'music_note',
      aviso: 'campaign',
      confirmacao: 'check_circle',
    };
    return icons[type] || 'notifications';
  }

  markAsRead(notif: Notificacao): void {
    notif.read = true;
  }

  markAllAsRead(): void {
    this.notificacoes.forEach(n => n.read = true);
  }
}
