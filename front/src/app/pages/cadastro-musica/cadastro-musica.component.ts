import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MockApiService } from '../../services/mock-api.service';
import { Tag } from '../../models';

@Component({
  selector: 'app-cadastro-musica',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cadastro-musica.component.html',
  styleUrl: './cadastro-musica.component.scss',
})
export class CadastroMusicaComponent implements OnInit {
  form!: FormGroup;
  tons: string[] = [];
  tags: Tag[] = [];
  isSubmitting = false;
  submitError = '';
  submitSuccess = false;

  constructor(
    private fb: FormBuilder,
    private api: MockApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadMetadata();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(2)]],
      artista: ['', [Validators.required, Validators.minLength(2)]],
      tom: ['', Validators.required],
      bpm: [null, [Validators.min(20), Validators.max(300)]],
      linkYoutube: [''],
      linkSpotify: [''],
      observacoes: [''],
    });
  }

  private loadMetadata(): void {
    this.api.getTons().subscribe(res => {
      this.tons = res.data;
    });
    this.api.getTags().subscribe(res => {
      this.tags = res.data;
    });
  }

  selectedTags = new Set<number>();

  toggleTag(tagId: number): void {
    if (this.selectedTags.has(tagId)) {
      this.selectedTags.delete(tagId);
    } else {
      this.selectedTags.add(tagId);
    }
  }

  isTagSelected(tagId: number): boolean {
    return this.selectedTags.has(tagId);
  }

  get f() {
    return this.form.controls;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.submitError = '';

    const payload = {
      ...this.form.value,
      tagIds: Array.from(this.selectedTags),
    };

    this.api.createMusica(payload).subscribe({
      next: (res) => {
        if (res.sucesso) {
          this.submitSuccess = true;
          setTimeout(() => this.router.navigate(['/repertorios']), 1500);
        } else {
          this.submitError = res.mensagem;
        }
        this.isSubmitting = false;
      },
      error: () => {
        this.submitError = 'Erro ao salvar a música. Tente novamente.';
        this.isSubmitting = false;
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/repertorios']);
  }
}
