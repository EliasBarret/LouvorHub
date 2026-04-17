export interface Usuario {
  id: number;
  nome: string;
  primeiroNome: string;
  email: string;
  iniciais: string;
  funcao: string;
  ministerio: string;
  avatar: string | null;
}

export interface PerfilForm {
  nome: string;
  email: string;
  funcao: string;
  ministerio: string;
  avatar?: string | null;
}

export interface Stat {
  icon: string;
  label: string;
  value: number;
  color: string;
}

export interface Escalacao {
  id: number;
  mes: string;
  dia: number;
  titulo: string;
  totalMusicas: number;
  totalParticipacoes: number;
  horario: string;
  repertorioId: number;
}

export interface Tag {
  id: number;
  nome: string;
  cor: string;
}

export interface Musica {
  id: number;
  titulo: string;
  artista: string;
  tom: string;
  bpm: number;
  tags: string[];
  linkYoutube: string;
  linkSpotify: string;
  observacoes: string;
  ultimoUso: string | null;
  criadoEm: string;
}

export interface MusicaForm {
  titulo: string;
  artista: string;
  tom: string;
  bpm: number | null;
  tags: string[];
  linkYoutube: string;
  linkSpotify: string;
  observacoes: string;
}

export interface Repertorio {
  id: number;
  nome: string;
  dataCulto: string;
  horario?: string;
  tipoCulto: string;
  localCulto?: string;
  aviso?: string;
  status: 'confirmado' | 'pendente' | 'rascunho' | 'publicado';
  musicasIds: number[];
  musicas?: Musica[];
  criadoEm: string;
}

export interface RepertorioForm {
  nome: string;
  dataCulto: string;
  horario?: string;
  tipoCulto: string;
  localCulto?: string;
  aviso?: string;
  status: 'confirmado' | 'pendente' | 'rascunho' | 'publicado';
  musicasIds: number[];
}

export interface ApiResponse<T> {
  data: T;
  sucesso: boolean;
  mensagem: string;
  timestamp: string;
}

export interface PageResponse<T> {
  conteudo: T[];
  total: number;
  pagina: number;
  tamanhoPagina: number;
}

// ─── Escalação e Confirmações ─────────────────────────────────────────────────

export type StatusConfirmacao = 'conhece' | 'nao_conhece' | 'pendente';

/** Um item de música dentro de uma escalação de músico, com instrumento. */
export interface MusicaEscaladaItem {
  musicaId: number;
  instrumento: string;
  musica?: Musica;
}

/** Registro de escalação de um músico em um repertório. */
export interface EscalacaoMusico {
  id: number;
  repertorioId: number;
  usuarioId: number;
  usuario?: Usuario;
  musicasEscaladas: MusicaEscaladaItem[];
}

/** Formulário para escalar um músico em um repertório. */
export interface EscalacaoMusicoForm {
  repertorioId: number;
  usuarioId: number;
  musicasEscaladas: { musicaId: number; instrumento: string }[];
}

/** Registro de confirmação de uma música por um músico. */
export interface ConfirmacaoMusica {
  id: number;
  escalacaoMusicoId: number;
  musicaId: number;
  musica?: Musica;
  status: StatusConfirmacao;
}

/** Formulário para confirmar ou negar conhecimento de uma música. */
export interface ConfirmacaoForm {
  escalacaoMusicoId: number;
  musicaId: number;
  status: 'conhece' | 'nao_conhece';
}

/** Música enriquecida com instrumento e status de confirmação. */
export interface MusicaComConfirmacao {
  musica: Musica;
  instrumento: string;
  confirmacao: StatusConfirmacao;
}

/** Visão detalhada do músico ao abrir uma escalação. */
export interface DetalheEscalacao {
  repertorio: Repertorio;
  escalacaoMusico: EscalacaoMusico;
  musicasComConfirmacao: MusicaComConfirmacao[];
}

/** Confirmações de um músico específico num repertório (visão do líder). */
export interface ConfirmacaoPorMusico {
  usuario: Usuario;
  musicasComConfirmacao: MusicaComConfirmacao[];
}

/** Visão geral das confirmações de todos os músicos de um repertório (visão do líder). */
export interface VisaoGeralConfirmacoes {
  repertorioId: number;
  totalMusicos: number;
  totalConhecem: number;
  totalNaoConhecem: number;
  totalPendentes: number;
  porMusico: ConfirmacaoPorMusico[];
}

// ─── Notificações ─────────────────────────────────────────────────────────────

export type TipoNotificacao = 'escalacao' | 'confirmacao' | 'aviso' | 'sistema';

export interface Notificacao {
  id: number;
  usuarioId: number;
  titulo: string;
  mensagem: string;
  tipo: TipoNotificacao;
  lida: boolean;
  criadoEm: string;
  referenciaId?: number;
  referenciaTipo?: string;
}
