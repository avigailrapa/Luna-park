import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { AgentPanelComponent } from './shared/components/agent-panel/agent-panel.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, AgentPanelComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
