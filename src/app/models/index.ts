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
  tipoCulto: string;
  status: 'confirmado' | 'pendente' | 'rascunho';
  musicasIds: number[];
  musicas?: Musica[];
  criadoEm: string;
}

export interface RepertorioForm {
  nome: string;
  dataCulto: string;
  tipoCulto: string;
  status: 'confirmado' | 'pendente' | 'rascunho';
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
