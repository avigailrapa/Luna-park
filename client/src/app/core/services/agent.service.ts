import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface AgentTool {
  id: string;
  method: string;
  path: string;
  roles: string[];
  description: string;
  params: { name: string; required?: boolean; optional?: boolean; description?: string }[];
}

export interface RidePickItem {
  _id: string;
  name: string;
  price: number;
}

export interface AgentClientAction {
  type: 'cart_add' | 'cart_remove' | 'cart_show' | 'cart_clear' | 'show_ride_picker';
  ride?: RidePickItem & { status?: string };
  rides?: RidePickItem[];
  rideId?: string;
  rideName?: string;
}

export interface AgentResponse {
  success: boolean;
  message: string;
  status?: number;
  tool?: string;
  data?: unknown;
  clientAction?: AgentClientAction;
}

@Injectable({ providedIn: 'root' })
export class AgentService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/agent`;

  chat(message: string) {
    return this.http.post<AgentResponse>(`${this.base}/chat`, { message });
  }

  execute(tool: string, params: Record<string, unknown> = {}) {
    return this.http.post<AgentResponse>(`${this.base}/execute`, { tool, params });
  }

  getTools() {
    return this.http.get<{ tools: AgentTool[] }>(`${this.base}/tools`);
  }
}
