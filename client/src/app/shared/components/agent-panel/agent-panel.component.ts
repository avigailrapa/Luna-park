import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AgentService, AgentResponse, RidePickItem } from '../../../core/services/agent.service';
import { AgentUiService } from '../../../core/services/agent-ui.service';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { RideService } from '../../../core/services/ride.service';
import { Ride } from '../../../core/models/ride.model';

interface ChatMessage {
  role: 'user' | 'agent';
  text: string;
  success?: boolean;
  ridePicker?: RidePickItem[];
}

@Component({
  selector: 'app-agent-panel',
  imports: [FormsModule, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './agent-panel.component.html',
  styleUrl: './agent-panel.component.scss',
})
export class AgentPanelComponent {
  private readonly agent = inject(AgentService);
  private readonly agentUi = inject(AgentUiService);
  private readonly cart = inject(CartService);
  private readonly ridesApi = inject(RideService);
  protected readonly auth = inject(AuthService);

  protected readonly isOpen = this.agentUi.isOpen;
  protected readonly messages = signal<ChatMessage[]>([
    {
      role: 'agent',
      text: 'היי! אני כאן לעזור 🎡\nלחצי "הוסף לסל" ובחרי מתקן מהרשימה',
      success: true,
    },
  ]);
  protected readonly loading = signal(false);
  protected input = '';

  private readonly pendingRides = signal<RidePickItem[]>([]);
  private readonly messagesEl = viewChild<ElementRef<HTMLDivElement>>('messagesEl');

  protected readonly suggestions = ['הוסף לסל', 'הצג מתקנים', 'מה בסל', 'עזרה'];

  toggle(): void {
    this.agentUi.toggle();
  }

  close(): void {
    this.agentUi.close();
  }

  send(message?: string): void {
    const text = (message ?? this.input).trim();
    if (!text || this.loading()) return;

    if (this.tryPickFromList(text)) return;

    if (this.isGenericAddRequest(text)) {
      this.messages.update((list) => [...list, { role: 'user', text }]);
      this.input = '';
      this.showRidePicker();
      return;
    }

    this.messages.update((list) => [...list, { role: 'user', text }]);
    this.input = '';
    this.loading.set(true);
    this.agentUi.open();

    this.agent.chat(text).subscribe({
      next: (res) => this.handleResponse(res),
      error: (err) => {
        this.pushAgent(err.error?.message || 'שגיאה בתקשורת עם הסוכן', false);
        this.loading.set(false);
      },
    });
  }

  private isGenericAddRequest(text: string): boolean {
    const norm = text.trim().toLowerCase();
    return (
      /^(הוסף|תוסיף|הוסיפי)\s*(מתקן|מתקנים|משהו|כלשהו)?\s*(ל)?(סל|עגלה)?$/.test(norm) ||
      norm === 'הוסף לסל' ||
      norm === 'תוסיף לסל'
    );
  }

  private showRidePicker(): void {
    this.loading.set(true);
    this.agentUi.open();

    this.ridesApi.getRides('active').subscribe({
      next: ({ rides }) => {
        const list: RidePickItem[] = rides.map((ride) => ({
          _id: ride._id,
          name: ride.name,
          price: ride.price,
        }));
        this.pendingRides.set(list);
        this.pushAgent('בחרי מתקן להוספה לסל 👇', true, list);
        this.loading.set(false);
      },
      error: () => {
        this.pushAgent('לא הצלחתי לטעון את המתקנים. נסי שוב.', false);
        this.loading.set(false);
      },
    });
  }

  pickRide(ride: RidePickItem): void {
    this.pendingRides.set([]);
    this.messages.update((list) => [...list, { role: 'user', text: ride.name }]);
    this.addRideToCart(ride);
  }

  private tryPickFromList(text: string): boolean {
    const rides = this.pendingRides();
    if (!rides.length) return false;

    const numMatch = text.match(/^(\d+)$/);
    if (numMatch) {
      const ride = rides[Number(numMatch[1]) - 1];
      if (!ride) {
        this.pushAgent('מספר לא תקין. בחרי מהרשימה או לחצי על מתקן.', false);
        return true;
      }
      this.messages.update((list) => [...list, { role: 'user', text }]);
      this.input = '';
      this.pendingRides.set([]);
      this.addRideToCart(ride);
      return true;
    }

    const match = rides.find(
      (ride) =>
        ride.name.toLowerCase().includes(text.toLowerCase()) ||
        text.toLowerCase().includes(ride.name.toLowerCase())
    );
    if (match) {
      this.messages.update((list) => [...list, { role: 'user', text }]);
      this.input = '';
      this.pendingRides.set([]);
      this.addRideToCart(match);
      return true;
    }

    this.pendingRides.set([]);
    return false;
  }

  private addRideToCart(ride: RidePickItem): void {
    if (this.cart.hasRide(ride._id)) {
      this.pushAgent(`"${ride.name}" כבר נמצא בסל`, true);
      return;
    }
    this.cart.addRide({ ...ride, status: 'active' } as Ride);
    this.pushAgent(`הוספתי את "${ride.name}" לסל 🛒 (₪${ride.price})`, true);
  }

  private handleResponse(res: AgentResponse): void {
    let text = res.message;
    let ridePicker: RidePickItem[] | undefined;

    if (res.clientAction?.type === 'show_ride_picker' && res.clientAction.rides?.length) {
      this.pendingRides.set(res.clientAction.rides);
      ridePicker = res.clientAction.rides;
    } else if (res.clientAction) {
      const localMessage = this.applyClientAction(res.clientAction);
      if (localMessage) text = localMessage;
    }

    this.pushAgent(text, res.success, ridePicker);
    this.loading.set(false);
  }

  private applyClientAction(action: AgentResponse['clientAction']): string | null {
    if (!action) return null;

    switch (action.type) {
      case 'cart_add':
        if (action.ride) {
          this.cart.addRide(action.ride as Ride);
        }
        return null;
      case 'cart_remove':
        if (action.rideId) {
          this.cart.removeRide(action.rideId);
        }
        return null;
      case 'cart_show': {
        const items = this.cart.cartItems();
        if (!items.length) return 'הסל ריק כרגע 🛒';
        const lines = items.map((item) => `• ${item.name} — ₪${item.price}`);
        return `בסל שלך ${items.length} פריטים (סה"כ ₪${this.cart.total()}):\n${lines.join('\n')}`;
      }
      case 'cart_clear':
        this.cart.clear();
        return 'ריקנתי את הסל ✓';
      default:
        return null;
    }
  }

  private pushAgent(text: string, success = true, ridePicker?: RidePickItem[]): void {
    this.messages.update((list) => [...list, { role: 'agent', text, success, ridePicker }]);
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = this.messagesEl()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }
}
