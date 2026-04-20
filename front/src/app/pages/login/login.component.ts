import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

type Mode = 'login' | 'register' | 'forgot';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  mode: Mode = 'login';
  loginForm: FormGroup;
  registerForm: FormGroup;
  forgotForm: FormGroup;
  isSubmitting = false;
  showPassword = false;
  showPasswordReg = false;
  errorMessage = '';
  // Post-action states
  registerEmailSent = false;
  forgotEmailSent = false;
  registeredEmail = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
  ) {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/inicio']);
    }
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
    });
    this.registerForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      funcao: [''],
      ministerio: [''],
    });
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  get activeForm(): FormGroup {
    if (this.mode === 'register') return this.registerForm;
    if (this.mode === 'forgot') return this.forgotForm;
    return this.loginForm;
  }

  switchMode(m: Mode): void {
    this.mode = m;
    this.errorMessage = '';
    this.showPassword = false;
    this.showPasswordReg = false;
    this.registerEmailSent = false;
    this.forgotEmailSent = false;
  }

  togglePassword(): void { this.showPassword = !this.showPassword; }
  togglePasswordReg(): void { this.showPasswordReg = !this.showPasswordReg; }

  onSubmit(): void {
    const form = this.activeForm;
    if (form.invalid) { form.markAllAsTouched(); return; }

    this.isSubmitting = true;
    this.errorMessage = '';

    if (this.mode === 'login') {
      this.authService.login(this.loginForm.value).subscribe({
        next: () => { this.isSubmitting = false; this.router.navigate(['/inicio']); },
        error: (err: any) => {
          this.isSubmitting = false;
          this.errorMessage = err?.error?.mensagem ?? 'E-mail ou senha incorretos.';
        },
      });

    } else if (this.mode === 'register') {
      this.authService.register(this.registerForm.value).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.registeredEmail = this.registerForm.value.email;
          this.registerEmailSent = true;
        },
        error: (err: any) => {
          this.isSubmitting = false;
          this.errorMessage = err?.error?.mensagem ?? 'Não foi possível criar a conta.';
        },
      });

    } else if (this.mode === 'forgot') {
      this.authService.forgotPassword(this.forgotForm.value.email).subscribe({
        next: () => { this.isSubmitting = false; this.forgotEmailSent = true; },
        error: () => { this.isSubmitting = false; this.forgotEmailSent = true; },
      });
    }
  }

  resendVerification(): void {
    this.authService.resendVerification(this.registeredEmail).subscribe();
  }

  get emailControl() { return this.activeForm.get('email'); }
  get senhaControl() { return this.activeForm.get('senha'); }
  get nomeControl()  { return this.registerForm.get('nome'); }
}

