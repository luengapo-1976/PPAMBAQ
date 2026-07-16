import { Component, computed, inject, input, signal } from '@angular/core';
import { CircuitoSummaryRow, SummaryCounts } from '../../data/circuito-summary.util';
import { exportCircuitoSummaryToPdf } from '../../data/circuito-summary-pdf.util';
import { Button } from '../../../../shared/ui/button/button';
import { SnackbarService } from '../../../../shared/ui/snackbar/snackbar.service';

@Component({
  selector: 'app-circuito-summary-table',
  imports: [Button],
  templateUrl: './circuito-summary-table.html',
  styleUrl: './circuito-summary-table.scss',
})
export class CircuitoSummaryTable {
  private readonly snackbar = inject(SnackbarService);

  readonly rows = input.required<CircuitoSummaryRow[]>();

  protected readonly expandedCircuitos = signal<Set<string>>(new Set());
  protected readonly expandedCongregaciones = signal<Set<number>>(new Set());
  protected readonly exportingPdf = signal(false);

  protected readonly totals = computed<SummaryCounts>(() => {
    const totals: SummaryCounts = {
      total: 0,
      primerEntrenamiento: 0,
      segundoEntrenamiento: 0,
      entrenamientoCompletado: 0,
      privilegioMinNinguno: 0,
      privilegioMinAnciano: 0,
      privilegioMinSiervo: 0,
      privilegioSerPublicador: 0,
      privilegioSerPrecursorRegular: 0,
      privilegioSerPrecursorEspecial: 0,
      privilegioSerMisionero: 0,
      privilegioSerBetel: 0,
    };
    for (const row of this.rows()) {
      for (const key of Object.keys(totals) as (keyof SummaryCounts)[]) {
        totals[key] += row[key];
      }
    }
    return totals;
  });

  protected isCircuitoExpanded(codigoCircuito: string): boolean {
    return this.expandedCircuitos().has(codigoCircuito);
  }

  protected isCongregacionExpanded(codigoCongregacion: number): boolean {
    return this.expandedCongregaciones().has(codigoCongregacion);
  }

  protected toggleCircuito(codigoCircuito: string): void {
    const next = new Set(this.expandedCircuitos());
    if (next.has(codigoCircuito)) {
      next.delete(codigoCircuito);
    } else {
      next.add(codigoCircuito);
    }
    this.expandedCircuitos.set(next);
  }

  protected toggleCongregacion(codigoCongregacion: number): void {
    const next = new Set(this.expandedCongregaciones());
    if (next.has(codigoCongregacion)) {
      next.delete(codigoCongregacion);
    } else {
      next.add(codigoCongregacion);
    }
    this.expandedCongregaciones.set(next);
  }

  protected async onExportPdf(): Promise<void> {
    this.exportingPdf.set(true);
    try {
      await exportCircuitoSummaryToPdf(this.rows(), this.totals());
    } catch {
      this.snackbar.error('No se pudo generar el PDF del resumen por circuito.');
    } finally {
      this.exportingPdf.set(false);
    }
  }
}
