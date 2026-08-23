import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
  selector: 'app-proximamente',
  imports: [RouterLink],
  templateUrl: './proximamente.html',
  styleUrl: './proximamente.scss',
})
export class Proximamente {
  private readonly route = inject(ActivatedRoute);

  protected readonly title = toSignal(
    this.route.data.pipe(map((data) => (data['title'] as string) ?? '')),
    { initialValue: (this.route.snapshot?.data?.['title'] as string) ?? '' },
  );

  protected readonly description = toSignal(
    this.route.data.pipe(map((data) => (data['description'] as string) ?? '')),
    { initialValue: (this.route.snapshot?.data?.['description'] as string) ?? '' },
  );

  protected readonly icon = toSignal(
    this.route.data.pipe(map((data) => (data['icon'] as string) ?? 'construction')),
    { initialValue: (this.route.snapshot?.data?.['icon'] as string) ?? 'construction' },
  );
}
