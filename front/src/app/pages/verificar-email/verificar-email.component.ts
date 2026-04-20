import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

type State = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-verificar-email',
  imports: [CommonModule],
  templateUrl: './verificar-email.component.html',
  styleUrl: './verificar-email.component.scss',
})
export class VerificarEmailComponent implements OnInit {
  state: State = 'loading';
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!token) {
      this.state = 'error';
      this.errorMessage = 'Token de verificação não encontrado.';
      return;
    }

    this.authService.verifyEmail(token).subscribe({
      next: () => {
        this.state = 'success';
        setTimeout(() => this.router.navigate(['/inicio']), 3000);
      },
      error: (err: any) => {
        this.state = 'error';
        this.errorMessage = err?.error?.mensagem ?? 'Não foi possível verificar o e-mail.';
      },
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
