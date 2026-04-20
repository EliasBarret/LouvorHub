import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats the tone display for a music piece.
 * Usage: {{ musica.tomFeminino | tomDisplay: musica.tom }}
 *
 * - Both tones:       "♀ A · ♂ F"
 * - Feminine only:    "♀ A"
 * - Masculine only:   "♂ F"
 * - Neither:          "—"
 */
@Pipe({
  name: 'tomDisplay',
  standalone: true,
})
export class TomDisplayPipe implements PipeTransform {
  transform(tomFeminino: string | undefined | null, tomMasculino: string | undefined | null): string {
    const fem = tomFeminino?.trim();
    const masc = tomMasculino?.trim();

    if (fem && masc) return `👩‍🎤 ${fem} · 👨‍🎤 ${masc}`;
    if (fem) return `👩‍🎤 ${fem}`;
    if (masc) return `👨‍🎤 ${masc}`;
    return '—';
  }
}
