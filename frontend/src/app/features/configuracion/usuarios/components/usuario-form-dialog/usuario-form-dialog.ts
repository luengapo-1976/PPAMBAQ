import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Dialog } from '../../../../../shared/ui/dialog/dialog';
import { Button } from '../../../../../shared/ui/button/button';
import { FormField } from '../../../../../shared/ui/form-field/form-field';
import { Select, SelectOption } from '../../../../../shared/ui/select/select';
import { SnackbarService } from '../../../../../shared/ui/snackbar/snackbar.service';
import { ApiError } from '../../../../../core/error.interceptor';
import { EMAIL_PATTERN } from '../../../../../shared/utils/format.util';
import { ReferenceDataService } from '../../../data/reference-data.service';
import { ROLES, Usuario } from '../../../data/models';

const ROL_OPTIONS: SelectOption[] = ROLES.map((value) => ({ value, label: value }));

@Component({
  selector: 'app-usuario-form-dialog',
  imports: [ReactiveFormsModule, Dialog, Button, FormField, Select],
  templateUrl: './usuario-form-dialog.html',
  styleUrl: './usuario-form-dialog.scss',
})
export class UsuarioFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly referenceDataService = inject(ReferenceDataService);
  private readonly snackbar = inject(SnackbarService);

  readonly open = input(false);
  readonly mode = input<'create' | 'edit'>('create');
  readonly record = input<Usuario | null>(null);

  readonly closed = output<void>();
  readonly saved = output<void>();

  protected readonly saving = signal(false);
  protected readonly rolOptions = ROL_OPTIONS;

  protected readonly dialogTitle = computed(() => (this.mode() === 'create' ? 'Nuevo usuario' : 'Editar usuario'));
  protected readonly passwordHint = computed(() =>
    this.mode() === 'edit' ? 'Déjala en blanco para no cambiar la contraseña actual.' : null,
  );

  protected readonly form = this.fb.group({
    login: ['', [Validators.required, Validators.maxLength(20)]],
    rol: ['', Validators.required],
    password: ['', [Validators.minLength(6), Validators.maxLength(100)]],
    correo: ['', [Validators.required, Validators.pattern(EMAIL_PATTERN), Validators.maxLength(100)]],
    movil: ['', [Validators.required, Validators.pattern(/^\d{1,10}$/)]],
  });

  constructor() {
    effect(() => {
      const isOpen = this.open();
      if (!isOpen) {
        return;
      }
      if (this.mode() === 'create') {
        this.applyCreateDefaults();
      } else {
        const record = this.record();
        if (record) {
          this.populateForm(record);
        }
      }
    });
  }

  protected onCancel(): void {
    this.form.reset();
    this.closed.emit();
  }

  protected onClear(): void {
    this.form.reset();
    if (this.mode() === 'edit' && this.record()) {
      this.form.controls.login.setValue(this.record()!.login);
    }
  }

  protected onSave(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.saving.set(true);

    const request$ =
      this.mode() === 'edit'
        ? this.referenceDataService.updateUsuario(this.record()!.login, {
            rol: raw.rol as 'Administrador' | 'Coordinador',
            password: raw.password || undefined,
            correo: raw.correo!,
            movil: raw.movil!,
          })
        : this.referenceDataService.createUsuario({
            login: raw.login!,
            rol: raw.rol as 'Administrador' | 'Coordinador',
            password: raw.password!,
            correo: raw.correo!,
            movil: raw.movil!,
          });

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.snackbar.success(
          this.mode() === 'edit' ? 'Usuario actualizado correctamente.' : 'Usuario registrado correctamente.',
        );
        this.form.reset();
        this.saved.emit();
        this.closed.emit();
      },
      error: (err: ApiError) => {
        this.saving.set(false);
        this.snackbar.error(err?.message ?? 'No se pudo guardar el usuario.');
      },
    });
  }

  private applyCreateDefaults(): void {
    this.form.reset();
    this.form.controls.login.enable({ emitEvent: false });
    this.form.controls.password.setValidators([Validators.required, Validators.minLength(6), Validators.maxLength(100)]);
    this.form.controls.password.updateValueAndValidity({ emitEvent: false });
  }

  private populateForm(record: Usuario): void {
    this.form.controls.password.setValidators([Validators.minLength(6), Validators.maxLength(100)]);
    this.form.controls.password.updateValueAndValidity({ emitEvent: false });
    this.form.patchValue({
      login: record.login,
      rol: record.rol,
      password: '',
      correo: record.correo ?? '',
      movil: record.movil ?? '',
    });
    this.form.controls.login.disable({ emitEvent: false });
  }
}
