import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MockApiService } from '../../services/mock-api.service';
import { Usuario, Stat, Escalacao } from '../../models';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  usuario: Usuario | null = null;
  stats: Stat[] = [];
  escalacoes: Escalacao[] = [];

  constructor(private api: MockApiService) {}

  ngOnInit(): void {
    this.api.getUsuarioLogado().subscribe(res => {
      this.usuario = res.data;
    });
    this.api.getStats().subscribe(res => {
      this.stats = res.data;
    });
    this.api.getEscalacoes().subscribe(res => {
      this.escalacoes = res.data;
    });
  }
}
