import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { EscalacaoService } from '../../services/escalacao.service';
import { RepertorioService } from '../../services/repertorio.service';
import { AuthService } from '../../services/auth.service';
import { IgrejaService } from '../../services/igreja.service';
import { Repertorio, Usuario } from '../../models';

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
  private usuario: Usuario | null = null;

  readonly dayHeaders = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

  readonly MONTH_NAMES_PT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

  constructor(
    private escalacaoService: EscalacaoService,
    private repertorioService: RepertorioService,
    private authService: AuthService,
    private igrejaService: IgrejaService,
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUsuarioLogado();

    forkJoin({
      escalacoes: this.escalacaoService.getMinhasEscalacoes(),
      repertorios: this.repertorioService.getRepertorios(0, 500),
    }).subscribe({
      next: ({ escalacoes, repertorios }) => {
        this.minhasEscalacoesIds = new Set(escalacoes.data.map(e => e.repertorioId));
        this.applyRoleFilter(repertorios.data.conteudo);
      },
      error: () => {
        this.loading = false;
        this.buildCalendar();
      },
    });
  }

  private applyRoleFilter(allReps: Repertorio[]): void {
    const perfil = this.usuario?.perfil;

    if (perfil === 'ADM') {
      // Administrador vê todos os repertórios
      this.repertorios = allReps;
      this.loading = false;
      this.buildCalendar();
    } else if (perfil === 'Musico' || perfil === 'Cantor') {
      // Músico/Cantor vê apenas repertórios onde está escalado
      this.repertorios = allReps.filter(r => this.minhasEscalacoesIds.has(r.id));
      this.loading = false;
      this.buildCalendar();
    } else {
      // Pastor/Ministro vê todos os repertórios da(s) sua(s) igreja(s)
      this.igrejaService.getIgrejasByUsuarioId(this.usuario!.id).subscribe({
        next: res => {
          const igrejaIds = new Set(res.data.map(m => m.id));
          this.repertorios = allReps.filter(r => !r.igrejaId || igrejaIds.has(r.igrejaId));
          this.loading = false;
          this.buildCalendar();
        },
        error: () => {
          this.repertorios = allReps;
          this.loading = false;
          this.buildCalendar();
        },
      });
    }
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
