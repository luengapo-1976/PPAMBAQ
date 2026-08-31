import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Button } from '../../shared/ui/button/button';

@Component({
  selector: 'app-aviso-actualizacion-datos',
  imports: [Button],
  templateUrl: './aviso-actualizacion-datos.html',
  styleUrl: './aviso-actualizacion-datos.scss',
})
export class AvisoActualizacionDatos {
  private readonly router = inject(Router);

  protected onContinuar(): void {
    this.router.navigateByUrl('/actualizar-datos');
  }
}
