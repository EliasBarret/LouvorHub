import { Component } from '@angular/core';

interface Escalacao {
  month: string;
  day: number;
  title: string;
  musicCount: number;
  participationCount: number;
  time: string;
}

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  userName = 'Elias';
  userFullName = 'Elias Barreto';
  userRole = 'Músico';
  userInitials = 'E';

  stats = [
    { icon: 'calendar_today', label: 'PRÓXIMOS CULTOS', value: 2, color: '#8B5FC0' },
    { icon: 'music_note', label: 'MÚSICAS ESCALADAS', value: 6, color: '#8B5FC0' },
    { icon: 'schedule', label: 'AGUARDANDO CONFIRMAÇÃO', value: 0, color: '#C9A84C' },
  ];

  escalacoes: Escalacao[] = [
    {
      month: 'ABR',
      day: 23,
      title: 'Culto de Quarta — Oração',
      musicCount: 2,
      participationCount: 1,
      time: '19:30',
    },
    {
      month: 'ABR',
      day: 20,
      title: 'Culto de Domingo — Manhã',
      musicCount: 5,
      participationCount: 5,
      time: '10:00',
    },
  ];
}
