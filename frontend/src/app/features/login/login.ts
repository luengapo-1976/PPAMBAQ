import { Component, HostListener, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FormField } from '../../shared/ui/form-field/form-field';
import { Button } from '../../shared/ui/button/button';
import { Dialog } from '../../shared/ui/dialog/dialog';
import { AuthService } from '../../core/auth.service';
import { ApiError } from '../../core/error.interceptor';
import { EMAIL_PATTERN } from '../../shared/utils/format.util';

/** Por debajo de este ancho se considera acceso móvil: se omite la imagen de fondo
 * (evita su descarga) y el layout pasa a un diseño de una sola columna centrado. */
const MOBILE_BREAKPOINT = 900;

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, FormField, Button, Dialog],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  protected readonly isMobileViewport = signal(this.isMobile());

  @HostListener('window:resize')
  protected onResize(): void {
    this.isMobileViewport.set(this.isMobile());
  }

  private isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT;
  }

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly passwordVisible = signal(false);

  protected readonly form = this.fb.group({
    login: ['', [Validators.required, Validators.maxLength(60)]],
    password: ['', [Validators.required, Validators.maxLength(100)]],
  });

  protected readonly forgotPasswordOpen = signal(false);
  protected readonly forgotSubmitting = signal(false);
  protected readonly forgotFeedback = signal<string | null>(null);

  protected readonly forgotForm = this.fb.group({
    correo: ['', [Validators.required, Validators.pattern(EMAIL_PATTERN), Validators.maxLength(100)]],
  });

  protected togglePasswordVisible(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  protected onSubmit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.submitting.set(true);
    const { login, password } = this.form.getRawValue();

    this.authService.login(login!, password!).subscribe({
      next: () => {
        this.submitting.set(false);
        const returnUrl = this.activatedRoute.snapshot.queryParamMap.get('returnUrl') ?? this.authService.defaultRoute();
        this.router.navigateByUrl(returnUrl);
      },
      error: (err: ApiError) => {
        this.submitting.set(false);
        this.errorMessage.set(err?.message ?? 'No se pudo iniciar sesión. Intenta nuevamente.');
      },
    });
  }

  protected onOpenForgotPassword(): void {
    this.forgotForm.reset();
    this.forgotFeedback.set(null);
    this.forgotPasswordOpen.set(true);
  }

  protected onCancelForgotPassword(): void {
    this.forgotPasswordOpen.set(false);
  }

  protected onSubmitForgotPassword(): void {
    if (this.forgotForm.invalid || this.forgotSubmitting()) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.forgotSubmitting.set(true);
    this.forgotFeedback.set(null);
    const { correo } = this.forgotForm.getRawValue();

    this.authService.forgotPassword(correo!).subscribe({
      next: (response) => {
        this.forgotSubmitting.set(false);
        this.forgotFeedback.set(response.message);
        this.forgotForm.reset();
      },
      error: (err: ApiError) => {
        this.forgotSubmitting.set(false);
        this.forgotFeedback.set(err?.message ?? 'No se pudo procesar la solicitud. Intenta nuevamente.');
      },
    });
  }
}
