import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { EscalacaoService } from '../../services/escalacao.service';
import { RepertorioService } from '../../services/repertorio.service';
import { MockApiService } from '../../services/mock-api.service';
import { UsuarioService } from '../../services/usuario.service';
import {
  Repertorio,
  VisaoGeralConfirmacoes,
  ConfirmacaoPorMusico,
  StatusConfirmacao,
  Tag,
  Usuario,
} from '../../models';

/** Visão por música: quais músicos confirmaram/negaram/pendente */
interface ConfirmacaoDeMusica {
  musicaId: number;
  musicaTitulo: string;
  musicaTom: string;
  confirmacoes: Array<{
    usuario: Usuario;
    instrumento: string;
    status: StatusConfirmacao;
  }>;
  totalConhece: number;
  totalNaoConhece: number;
  totalPendente: number;
  risco: 'ok' | 'atencao' | 'critico';
}

@Component({
  selector: 'app-status-confirmacoes',
  imports: [CommonModule, FormsModule],
  templateUrl: './status-confirmacoes.component.html',
  styleUrl: './status-confirmacoes.component.scss',
})
export class StatusConfirmacoesComponent implements OnInit {
  usuario: Usuario | null = null;
  repertorio: Repertorio | null = null;
  visaoGeral: VisaoGeralConfirmacoes | null = null;
  porMusica: ConfirmacaoDeMusica[] = [];
  tags: Tag[] = [];
  isLoading = true;
  enviando = false;
  mensagemSucesso = '';
  mensagemErro = '';

  constructor(
    private escalacaoService: EscalacaoService,
    private repertorioService: RepertorioService,
    private usuarioService: UsuarioService,
    private api: MockApiService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getTags().subscribe(res => { this.tags = res.data; });
    this.usuarioService.getUsuarioLogado().subscribe(res => { this.usuario = res.data; });

    this.repertorioService.getRepertorioById(id).subscribe(res => {
      if (!res.sucesso) { this.isLoading = false; return; }
      this.repertorio = res.data;

      this.escalacaoService.getConfirmacoesRepertorio(id).subscribe(conf => {
        this.visaoGeral = conf.data;
        this.porMusica = this.buildPorMusica(conf.data);
        this.isLoading = false;
      });
    });
  }

  private buildPorMusica(vg: VisaoGeralConfirmacoes): ConfirmacaoDeMusica[] {
    const map = new Map<number, ConfirmacaoDeMusica>();

    for (const pm of vg.porMusico) {
      for (const mc of pm.musicasComConfirmacao) {
        const id = mc.musica.id;
        if (!map.has(id)) {
          map.set(id, {
            musicaId: id,
            musicaTitulo: mc.musica.titulo,
            musicaTom: mc.musica.tom,
            confirmacoes: [],
            totalConhece: 0,
            totalNaoConhece: 0,
            totalPendente: 0,
            risco: 'ok',
          });
        }
        const entry = map.get(id)!;
        entry.confirmacoes.push({
          usuario: pm.usuario,
          instrumento: mc.instrumento,
          status: mc.confirmacao,
        });
        if (mc.confirmacao === 'conhece') entry.totalConhece++;
        else if (mc.confirmacao === 'nao_conhece') entry.totalNaoConhece++;
        else entry.totalPendente++;
      }
    }

    // Define risco da música
    map.forEach(entry => {
      if (entry.totalNaoConhece > 0) entry.risco = 'critico';
      else if (entry.totalPendente > 0) entry.risco = 'atencao';
      else entry.risco = 'ok';
    });

    // Preserva a ordem das músicas do repertório
    const ordenados: ConfirmacaoDeMusica[] = [];
    if (this.repertorio?.musicas) {
      for (const m of this.repertorio.musicas) {
        const entry = map.get(m.id);
        if (entry) ordenados.push(entry);
      }
    }
    return ordenados.length > 0 ? ordenados : Array.from(map.values());
  }

  get isAdm(): boolean {
    return this.usuario?.perfil === 'ADM';
  }

  get podeEnviarAprovacao(): boolean {
    if (!this.repertorio) return false;
    // ADM tem permissão geral: pode enviar de qualquer status,
    // exceto quando já está em fluxo ativo de aprovação ou já aprovado.
    if (this.isAdm) {
      return (
        this.repertorio.status !== 'aguardando_aprovacao' &&
        this.repertorio.status !== 'aprovado'
      );
    }
    return this.repertorio.status === 'reprovado';
  }

  get totalMusicos(): number {
    return this.visaoGeral?.totalMusicos ?? 0;
  }

  get totalConhecem(): number {
    return this.porMusica.filter(m => m.risco === 'ok').length;
  }

  get totalAtencao(): number {
    return this.porMusica.filter(m => m.risco !== 'ok').length;
  }

  enviarParaAprovacao(): void {
    if (!this.repertorio || this.enviando) return;
    this.enviando = true;
    this.mensagemSucesso = '';
    this.mensagemErro = '';
    this.repertorioService.enviarParaAprovacao(this.repertorio.id).subscribe(res => {
      this.enviando = false;
      if (res.sucesso) {
        this.repertorio = res.data;
        this.mensagemSucesso = 'Repertório enviado para aprovação do pastor!';
      } else {
        this.mensagemErro = res.mensagem;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/repertorios', this.repertorio?.id ?? '']);
  }

  goToRepertorio(): void {
    this.router.navigate(['/repertorios', this.repertorio?.id ?? '']);
  }

  getStatusClass(status: string): string { return `status-${status}`; }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      aguardando_aprovacao: 'Aguardando Aprovação',
      aprovado: 'Aprovado',
      reprovado: 'Reprovado',
    };
    return labels[status] ?? status;
  }

  getTagCor(tagNome: string): string {
    return this.tags.find(t => t.nome === tagNome)?.cor ?? '#6B7280';
  }

  trackByMusicaId(_: number, item: ConfirmacaoDeMusica): number {
    return item.musicaId;
  }

  trackByUserId(_: number, item: { usuario: Usuario }): number {
    return item.usuario.id;
  }

  trackByPorMusico(_: number, item: ConfirmacaoPorMusico): number {
    return item.usuario.id;
  }
}
