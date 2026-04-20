import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { EscalacaoService } from '../../services/escalacao.service';
import { RepertorioService } from '../../services/repertorio.service';
import { Repertorio } from '../../models';

interface CalendarEvent {
  titulo: string;
  horario: string;
  tipo: 'minha-escala' | 'outros-cultos';
  passado: boolean;
  repertorioId: number;
}

interface CalendarDay {
  date: Date | null;
  events: CalendarEvent[];
}

@Component({
  selector: 'app-calendario',
  imports: [CommonModule, RouterLink],
  templateUrl: './calendario.component.html',
  styleUrl: './calendario.component.scss',
})
export class CalendarioComponent implements OnInit {
  viewYear = new Date().getFullYear();
  viewMonth = new Date().getMonth();
  weeks: CalendarDay[][] = [];
  loading = true;

  private minhasEscalacoesIds = new Set<number>();
  private repertorios: Repertorio[] = [];

  readonly dayHeaders = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

  readonly MONTH_NAMES_PT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

  constructor(
    private escalacaoService: EscalacaoService,
    private repertorioService: RepertorioService,
  ) {}

  ngOnInit(): void {
    forkJoin({
      escalacoes: this.escalacaoService.getMinhasEscalacoes(),
      repertorios: this.repertorioService.getRepertorios(0, 500),
    }).subscribe({
      next: ({ escalacoes, repertorios }) => {
        this.minhasEscalacoesIds = new Set(escalacoes.data.map(e => e.repertorioId));
        this.repertorios = repertorios.data.conteudo;
        this.loading = false;
        this.buildCalendar();
      },
      error: () => {
        this.loading = false;
        this.buildCalendar();
      },
    });
  }

  get monthLabel(): string {
    return `${this.MONTH_NAMES_PT[this.viewMonth]} ${this.viewYear}`;
  }

  prevMonth(): void {
    if (this.viewMonth === 0) {
      this.viewMonth = 11;
      this.viewYear--;
    } else {
      this.viewMonth--;
    }
    this.buildCalendar();
  }

  nextMonth(): void {
    if (this.viewMonth === 11) {
      this.viewMonth = 0;
      this.viewYear++;
    } else {
      this.viewMonth++;
    }
    this.buildCalendar();
  }

  goToToday(): void {
    const now = new Date();
    this.viewYear = now.getFullYear();
    this.viewMonth = now.getMonth();
    this.buildCalendar();
  }

  isToday(day: CalendarDay): boolean {
    if (!day.date) return false;
    const now = new Date();
    return (
      day.date.getDate() === now.getDate() &&
      day.date.getMonth() === now.getMonth() &&
      day.date.getFullYear() === now.getFullYear()
    );
  }

  private buildCalendar(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDay = new Date(this.viewYear, this.viewMonth, 1);
    const lastDay = new Date(this.viewYear, this.viewMonth + 1, 0);
    const startDow = firstDay.getDay(); // 0 = Sunday

    const allDays: CalendarDay[] = [];

    for (let i = 0; i < startDow; i++) {
      allDays.push({ date: null, events: [] });
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const cellDate = new Date(this.viewYear, this.viewMonth, d);
      allDays.push({ date: cellDate, events: this.getEventsForDate(cellDate, today) });
    }

    while (allDays.length % 7 !== 0) {
      allDays.push({ date: null, events: [] });
    }

    this.weeks = [];
    for (let i = 0; i < allDays.length; i += 7) {
      this.weeks.push(allDays.slice(i, i + 7));
    }
  }

  private getEventsForDate(date: Date, today: Date): CalendarEvent[] {
    const d = date.getDate();
    const m = date.getMonth() + 1;
    const y = date.getFullYear();
    const isPast = date < today;

    return this.repertorios
      .filter(r => {
        // dataCulto is formatted as "DD/MM/YYYY" by the service
        const parts = r.dataCulto.split('/');
        if (parts.length !== 3) return false;
        return (
          parseInt(parts[0], 10) === d &&
          parseInt(parts[1], 10) === m &&
          parseInt(parts[2], 10) === y
        );
      })
      .map(r => ({
        titulo: r.nome,
        horario: r.horario ?? '',
        tipo: this.minhasEscalacoesIds.has(r.id) ? 'minha-escala' : 'outros-cultos',
        passado: isPast,
        repertorioId: r.id,
      }));
  }
}
