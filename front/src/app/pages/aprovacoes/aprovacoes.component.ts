import { Component, OnInit } from '@angular/core';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { RepertorioService } from '../../services/repertorio.service';
import { EscalacaoService } from '../../services/escalacao.service';
import { UsuarioService } from '../../services/usuario.service';
import { IgrejaService } from '../../services/igreja.service';
import {
  Repertorio,
  VisaoGeralConfirmacoes,
  Usuario,
  Tag,
} from '../../models';
import { MockApiService } from '../../services/mock-api.service';

interface RepertorioComConfirmacoes {
  repertorio: Repertorio;
  visaoGeral: VisaoGeralConfirmacoes | null;
  carregando: boolean;
}

@Component({
  selector: 'app-aprovacoes',
  imports: [CommonModule, FormsModule, KeyValuePipe],
  templateUrl: './aprovacoes.component.html',
  styleUrl: './aprovacoes.component.scss',
})
export class AprovacoesComponent implements OnInit {
  usuario: Usuario | null = null;
  itens: RepertorioComConfirmacoes[] = [];
  isLoading = true;

  expandidoId: number | null = null;
  rejeitandoId: number | null = null;
  motivoRejeicao = '';
  motivoErro = false;

  processandoId: number | null = null;
  feedbacks = new Map<number, { tipo: 'ok' | 'erro'; mensagem: string }>();

  tags: Tag[] = [];

  constructor(
    private repertorioService: RepertorioService,
    private escalacaoService: EscalacaoService,
    private usuarioService: UsuarioService,
    private igrejaService: IgrejaService,
    private api: MockApiService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.api.getTags().subscribe(res => { this.tags = res.data; });

    this.usuarioService.getUsuarioLogado().subscribe(res => {
      this.usuario = res.data;
      if (res.data.perfil === 'ADM') {
        this.carregarPendentes();
      } else {
        this.igrejaService.getIgrejasByUsuarioId(res.data.id).subscribe(membRes => {
          const igrejaIds = membRes.data.map(m => m.igrejaId);
          this.carregarPendentes(igrejaIds);
        });
      }
    });
  }

  private carregarPendentes(igrejaIds?: number[]): void {
    this.isLoading = true;
    this.repertorioService.getRepertoriosPendentesAprovacao(igrejaIds).subscribe(res => {
      this.itens = res.data.map(rep => ({
        repertorio: rep,
        visaoGeral: null,
        carregando: false,
      }));
      this.isLoading = false;
    });
  }

  toggleExpandir(item: RepertorioComConfirmacoes): void {
    const id = item.repertorio.id;
    if (this.expandidoId === id) {
      this.expandidoId = null;
      this.fecharRejeicao();
      return;
    }
    this.expandidoId = id;
    this.fecharRejeicao();
    if (!item.visaoGeral && !item.carregando) {
      item.carregando = true;
      this.escalacaoService.getConfirmacoesRepertorio(id).subscribe(conf => {
        item.visaoGeral = conf.data;
        item.carregando = false;
      });
    }
  }

  isExpandido(id: number): boolean {
    return this.expandidoId === id;
  }

  iniciarRejeicao(id: number): void {
    this.rejeitandoId = id;
    this.motivoRejeicao = '';
    this.motivoErro = false;
  }

  fecharRejeicao(): void {
    this.rejeitandoId = null;
    this.motivoRejeicao = '';
    this.motivoErro = false;
  }

  aprovar(item: RepertorioComConfirmacoes): void {
    if (!this.usuario || this.processandoId !== null) return;
    const id = item.repertorio.id;
    this.processandoId = id;
    this.repertorioService.aprovarRepertorio(id, this.usuario.id).subscribe(res => {
      this.processandoId = null;
      if (res.sucesso) {
        this.itens = this.itens.filter(i => i.repertorio.id !== id);
        this.feedbacks.set(id, { tipo: 'ok', mensagem: `"${item.repertorio.nome}" aprovado com sucesso!` });
        if (this.expandidoId === id) this.expandidoId = null;
      } else {
        this.feedbacks.set(id, { tipo: 'erro', mensagem: res.mensagem });
      }
    });
  }

  confirmarRejeicao(item: RepertorioComConfirmacoes): void {
    if (!this.motivoRejeicao.trim()) {
      this.motivoErro = true;
      return;
    }
    if (!this.usuario || this.processandoId !== null) return;
    const id = item.repertorio.id;
    this.processandoId = id;
    this.repertorioService
      .reprovarRepertorio(id, this.usuario.id, this.motivoRejeicao.trim())
      .subscribe(res => {
        this.processandoId = null;
        this.fecharRejeicao();
        if (res.sucesso) {
          this.itens = this.itens.filter(i => i.repertorio.id !== id);
          this.feedbacks.set(id, { tipo: 'ok', mensagem: `"${item.repertorio.nome}" reprovado. O Ministro será notificado.` });
          if (this.expandidoId === id) this.expandidoId = null;
        } else {
          this.feedbacks.set(id, { tipo: 'erro', mensagem: res.mensagem });
        }
      });
  }

  getFeedback(id: number) {
    return this.feedbacks.get(id) ?? null;
  }

  verRepertorio(id: number): void {
    this.router.navigate(['/repertorios', id]);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      rascunho: 'Rascunho',
      pendente: 'Pendente',
      publicado: 'Publicado',
      confirmado: 'Confirmado',
      aguardando_aprovacao: 'Aguardando Aprovação',
      aprovado: 'Aprovado',
      reprovado: 'Reprovado',
    };
    return labels[status] ?? status;
  }

  getPercentualConhece(vg: VisaoGeralConfirmacoes): number {
    const total = vg.totalConhecem + vg.totalNaoConhecem + vg.totalPendentes;
    if (total === 0) return 0;
    return Math.round((vg.totalConhecem / total) * 100);
  }

  getTagCor(tagNome: string): string {
    return this.tags.find(t => t.nome === tagNome)?.cor ?? '#6B7280';
  }

  get isAdm(): boolean {
    return this.usuario?.perfil === 'ADM';
  }

  get isPastor(): boolean {
    return this.usuario?.perfil === 'Pastor';
  }

  trackById(_: number, item: RepertorioComConfirmacoes): number {
    return item.repertorio.id;
  }
}
