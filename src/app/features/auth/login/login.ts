import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-white">
          Sign in to your account
        </h2>
        <p class="mt-2 text-center text-sm text-slate-400">
          Or
          <a href="#" class="font-medium text-blue-500 hover:text-blue-400">
            register for a new account (mock)
          </a>
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-slate-900 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-800">
          <form [formGroup]="loginForm" class="space-y-6" (ngSubmit)="onSubmit()">
            <div>
              <label for="email" class="block text-sm font-medium text-slate-300">
                Email address
              </label>
              <div class="mt-1">
                <input id="email" 
                       type="email" 
                       formControlName="email"
                       class="block w-full rounded-md border-0 bg-slate-950 py-1.5 text-white shadow-sm ring-1 ring-inset ring-slate-700 placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6">
              </div>
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-slate-300">
                Password
              </label>
              <div class="mt-1">
                <input id="password" 
                       type="password" 
                       formControlName="password"
                       class="block w-full rounded-md border-0 bg-slate-950 py-1.5 text-white shadow-sm ring-1 ring-inset ring-slate-700 placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6">
              </div>
            </div>

            <div *ngIf="errorMessage" class="rounded-md bg-red-900/50 p-4">
              <div class="flex">
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-red-400">{{ errorMessage }}</h3>
                </div>
              </div>
            </div>

            <div>
              <button type="submit" 
                      [disabled]="isLoading"
                      class="flex w-full justify-center rounded-md bg-white px-3 py-1.5 text-sm font-semibold leading-6 text-slate-900 shadow-sm hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50 disabled:cursor-not-allowed">
                <span *ngIf="isLoading" class="mr-2">...</span>
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  async onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    try {
      const { error } = await this.authService.signInWithPassword(email, password);
      if (error) {
        this.errorMessage = error.message;
      }
    } catch (err: any) {
      this.errorMessage = 'An unexpected error occurred.';
    } finally {
      this.isLoading = false;
    }
  }
}
