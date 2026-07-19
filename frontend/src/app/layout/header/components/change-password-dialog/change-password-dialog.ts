import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Dialog } from '../../../../shared/ui/dialog/dialog';
import { Button } from '../../../../shared/ui/button/button';
import { FormField } from '../../../../shared/ui/form-field/form-field';
import { SnackbarService } from '../../../../shared/ui/snackbar/snackbar.service';
import { ApiError } from '../../../../core/error.interceptor';
import { AuthService } from '../../../../core/auth.service';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.parent?.get('newPassword')?.value;
  if (!newPassword || !control.value) {
    return null;
  }
  return newPassword === control.value ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-change-password-dialog',
  imports: [ReactiveFormsModule, Dialog, Button, FormField],
  templateUrl: './change-password-dialog.html',
  styleUrl: './change-password-dialog.scss',
})
export class ChangePasswordDialog {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly snackbar = inject(SnackbarService);

  readonly open = input(false);
  readonly closed = output<void>();

  protected readonly saving = signal(false);

  protected readonly form = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
    confirmPassword: ['', [Validators.required, passwordsMatchValidator]],
  });

  private readonly confirmPasswordStatus = toSignal(this.form.controls.confirmPassword.statusChanges, {
    initialValue: this.form.controls.confirmPassword.status,
  });

  protected readonly confirmPasswordError = computed(() => {
    this.confirmPasswordStatus();
    return this.form.controls.confirmPassword.hasError('passwordsMismatch') ? 'Las contraseñas no coinciden.' : null;
  });

  constructor() {
    effect(() => {
      if (this.open()) {
        this.form.reset();
      }
    });

    this.form.controls.newPassword.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.form.controls.confirmPassword.updateValueAndValidity({ onlySelf: true });
    });
  }

  protected onCancel(): void {
    this.form.reset();
    this.closed.emit();
  }

  protected onSave(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword } = this.form.getRawValue();
    this.saving.set(true);

    this.authService.changePassword(currentPassword!, newPassword!).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackbar.success('Contraseña actualizada correctamente.');
        this.form.reset();
        this.closed.emit();
      },
      error: (err: ApiError) => {
        this.saving.set(false);
        this.snackbar.error(err?.message ?? 'No se pudo actualizar la contraseña.');
      },
    });
  }
}
