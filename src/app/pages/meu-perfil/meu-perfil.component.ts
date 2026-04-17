import { Component } from '@angular/core';

@Component({
  selector: 'app-meu-perfil',
  imports: [],
  templateUrl: './meu-perfil.component.html',
  styleUrl: './meu-perfil.component.scss'
})
export class MeuPerfilComponent {
  user = {
    name: 'Elias Barreto',
    email: 'eliaspensador@gmail.com',
    role: 'Músico',
    initials: 'E',
    phone: '(11) 99999-9999',
    instruments: ['Violão', 'Guitarra'],
    memberSince: 'Janeiro 2024',
  };

  stats = [
    { label: 'Cultos participados', value: 42 },
    { label: 'Músicas tocadas', value: 128 },
    { label: 'Repertórios', value: 15 },
  ];
}
