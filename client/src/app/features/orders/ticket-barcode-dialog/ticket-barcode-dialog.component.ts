import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { Order } from '../../../core/models/order.model';

@Component({
  selector: 'app-ticket-barcode-dialog',
  imports: [
    FormsModule,
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './ticket-barcode-dialog.component.html',
  styleUrl: './ticket-barcode-dialog.component.scss',
})
export class TicketBarcodeDialogComponent implements OnInit, OnDestroy {
  private readonly orderService = inject(OrderService);
  private readonly auth = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly data = inject<Order>(MAT_DIALOG_DATA);

  protected readonly loading = signal(true);
  protected readonly emailSending = signal(false);
  protected readonly barcodeUrl = signal<string | null>(null);
  protected recipientEmail = this.auth.user()?.email ?? '';
  private objectUrl: string | null = null;

  ngOnInit(): void {
    if (!this.data.ticketCode) {
      this.loading.set(false);
      return;
    }
    this.orderService.getOrderBarcode(this.data._id).subscribe({
      next: (blob) => {
        this.objectUrl = URL.createObjectURL(blob);
        this.barcodeUrl.set(this.objectUrl);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  printTicket(): void {
    const url = this.barcodeUrl();
    if (!url) return;

    const visitDate = new Date(this.data.chosenDate).toLocaleDateString('he-IL');
    const printWin = window.open('', '_blank', 'width=480,height=640');
    if (!printWin) {
      this.snackBar.open('לא ניתן לפתוח חלון הדפסה', 'סגור', { duration: 3000 });
      return;
    }

    printWin.document.write(`<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>כרטיס ${this.data.ticketCode}</title>
  <style>
    body { font-family: Heebo, Arial, sans-serif; text-align: center; padding: 2rem; color: #1a2b49; }
    h1 { color: #ff5533; margin-bottom: 0.25rem; }
    img { max-width: 100%; margin: 1.5rem 0; }
    p { margin: 0.35rem 0; }
  </style>
</head>
<body>
  <h1>לונה פארק</h1>
  <p><strong>קוד כרטיס:</strong> ${this.data.ticketCode}</p>
  <p><strong>תאריך ביקור:</strong> ${visitDate}</p>
  <img src="${url}" alt="ברקוד כניסה" />
  <p>הציגו ברקוד זה בכניסה לפארק</p>
  <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); };</script>
</body>
</html>`);
    printWin.document.close();
  }

  sendEmail(): void {
    const email = this.recipientEmail.trim();
    if (!email) {
      this.snackBar.open('יש להזין כתובת אימייל', 'סגור', { duration: 3000 });
      return;
    }

    this.emailSending.set(true);
    this.orderService.resendOrderEmail(this.data._id, email).subscribe({
      next: (res) => {
        this.emailSending.set(false);
        if (res.emailSent && res.previewUrl) {
          this.snackBar.open(res.message || 'מייל דמו נשלח — פותח תצוגה מקדימה', 'צפייה', {
            duration: 12000,
          }).onAction().subscribe(() => window.open(res.previewUrl!, '_blank'));
          return;
        }
        const text = res.emailSent
          ? `הכרטיס נשלח ל-${res.recipient || email}`
          : res.message || 'לא ניתן לשלוח מייל כרגע';
        this.snackBar.open(text, 'סגור', { duration: 7000 });
      },
      error: (err) => {
        this.emailSending.set(false);
        this.snackBar.open(err.error?.message || 'שגיאה בשליחת המייל', 'סגור', { duration: 4000 });
      },
    });
  }

  ngOnDestroy(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }
  }
}
