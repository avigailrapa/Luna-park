import { JsonPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { AgentService } from '../../../core/services/agent.service';
import { AuthService } from '../../../core/services/auth.service';

interface ChatMessage {
  role: 'user' | 'agent';
  text: string;
  success?: boolean;
  data?: unknown;
}

@Component({
  selector: 'app-agent-chat',
  imports: [
    JsonPipe,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
  templateUrl: './agent-chat.component.html',
  styleUrl: './agent-chat.component.scss',
})
export class AgentChatComponent {
  private readonly agent = inject(AgentService);
  protected readonly auth = inject(AuthService);

  protected readonly messages = signal<ChatMessage[]>([
    {
      role: 'agent',
      text: 'שלום! אני סוכן לונה פארק 🤖\nאפשר לבקש בעברית: "הצג מתקנים", "ההזמנות שלי", "הזמן כרטיס יום מלא ל-2026-06-15" ועוד.',
      success: true,
    },
  ]);
  protected readonly loading = signal(false);
  protected input = '';

  protected readonly quickActions = [
    { label: 'מתקנים', message: 'הצג מתקנים' },
    { label: 'ההזמנות שלי', message: 'ההזמנות שלי', needsAuth: 'customer' as const },
    { label: 'עזרה', message: 'עזרה' },
    { label: 'סטטוס שרת', message: 'health' },
  ];

  send(message?: string): void {
    const text = (message ?? this.input).trim();
    if (!text || this.loading()) return;

    this.messages.update((list) => [...list, { role: 'user', text }]);
    this.input = '';
    this.loading.set(true);

    this.agent.chat(text).subscribe({
      next: (res) => {
        this.messages.update((list) => [
          ...list,
          {
            role: 'agent',
            text: res.message,
            success: res.success,
            data: res.data,
          },
        ]);
        this.loading.set(false);
      },
      error: (err) => {
        this.messages.update((list) => [
          ...list,
          {
            role: 'agent',
            text: err.error?.message || 'שגיאה בתקשורת עם הסוכן',
            success: false,
          },
        ]);
        this.loading.set(false);
      },
    });
  }

  canUseQuick(action: { needsAuth?: 'customer' | 'admin' }): boolean {
    if (!action.needsAuth) return true;
    if (action.needsAuth === 'customer') return this.auth.isCustomer();
    return this.auth.isAdmin();
  }
}
