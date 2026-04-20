export type Perfil = 'ADM' | 'Pastor' | 'Ministro' | 'Musico' | 'Cantor';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginForm {
  email: string;
  senha: string;
}

export interface RegisterForm {
  nome: string;
  email: string;
  senha: string;
  funcao?: string;
  ministerio?: string;
}

export interface ChangePasswordForm {
  senhaAtual: string;
  novaSenha: string;
}

export interface AuthData {
  token: string;
  usuario: Usuario;
}

export interface Igreja {
  id: number;
  nome: string;
  cidade?: string;
  observacoes?: string;
}

export interface TipoCulto {
  id: number;
  nome: string;
  horario: string;
  horarioFim?: string;
  igrejaId?: number;
  igreja?: { id: number; nome: string };
  criadoEm?: string;
}

export interface MembroIgreja {
  id: number;
  usuarioId: number;
  igrejaId: number;
  perfil: Perfil;
  usuario?: Usuario;
  igreja?: Igreja;
}

export interface Usuario {
  id: number;
  nome: string;
  primeiroNome: string;
  email: string;
  iniciais: string;
  funcao: string;
  ministerio: string;
  avatar: string | null;
  perfil?: Perfil;
  instrumentos?: string[];
  dataMembro?: string; // formato ISO: YYYY-MM-DD
}

export interface PerfilForm {
  nome: string;
  email: string;
  funcao: string;
  ministerio: string;
  avatar?: string | null;
}

export interface PerfilEditavel {
  instrumentos: string[];
  dataMembro: string;
}

export interface UpdatePerfilForm {
  nome?: string;
  email?: string;
  funcao?: string;
  ministerio?: string;
  avatar?: string | null;
  instrumentos?: string[];
  dataMembro?: string;
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

export type StatusRepertorio =
  | 'aguardando_aprovacao'
  | 'aprovado'
  | 'reprovado';

export interface AprovacaoRepertorio {
  id: number;
  repertorioId: number;
  pastorId: number;
  pastor?: Usuario;
  status: 'aprovado' | 'reprovado';
  motivo?: string;
  data: string;
}

export interface Repertorio {
  id: number;
  nome: string;
  dataCulto: string;
  horario?: string;
  horarioFim?: string;
  tipoCulto: string;
  localCulto?: string;
  aviso?: string;
  status: StatusRepertorio;
  igrejaId?: number;
  aprovacao?: AprovacaoRepertorio;
  musicasIds: number[];
  musicas?: MusicaRepertorio[];
  criadoEm: string;
}

export interface RepertorioForm {
  nome: string;
  dataCulto: string;
  horario?: string;
  horarioFim?: string;
  tipoCulto: string;
  localCulto?: string;
  aviso?: string;
  status: StatusRepertorio;
  igrejaId?: number;
  musicas: MusicaRepertorioItem[];
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

/** Um músico/cantor escalado para uma música específica de um repertório. */
export interface CantorescaladoItem {
  id: number;
  nome: string;
  email: string;
  perfil?: Perfil;
  instrumentos?: string[];
}

/** Um músico escalado com instrumento específico. */
export interface MusicoEscaladoItem extends CantorescaladoItem {
  instrumento: string;
}

/** Uma música dentro de um repertório, com cantores e músicos escalados. */
export interface MusicaRepertorio extends Musica {
  cantores: CantorescaladoItem[];
  musicos: MusicoEscaladoItem[];
}

/** Item de música para envio no formulário de criação/edição de repertório. */
export interface MusicaRepertorioItem {
  musicaId: number;
  cantores?: number[];
  musicos?: { usuarioId: number; instrumento: string }[];
}

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

export type TipoNotificacao =
  | 'escalacao'
  | 'confirmacao'
  | 'aviso'
  | 'sistema'
  | 'lembrete_culto'
  | 'lembrete_culto_hora'
  | 'repertorio_alterado'
  | 'repertorio_aprovado'
  | 'repertorio_reprovado'
  | 'repertorio_pendente_aprovacao'
  | 'confirmacao_pendente'
  | 'musico_confirmou';

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
