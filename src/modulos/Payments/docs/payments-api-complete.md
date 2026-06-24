# Payments Module - API Documentation

The frontend Payments module interacts with the backend modular DDD Payments v3 API (`/v3/payments`). 

---

## 🛠️ Endpoints API v3

| Method | Endpoint | Description |
|--------|----------|-------------|
| **GET** | `/v3/payments` | Lists all payments registered. Supports search and pagination filters. |
| **GET** | `/v3/payments/admin/debts` | Retrieve pending debts for a specific apartment unit (`dptoId`). |
| **POST** | `/v3/payments` | Create a payment (full or partial). Amount determines distribution oldest-first; amount > total → 422. |
| **POST** | `/v3/payments/simulate` | Simulate payment distribution without persisting. Returns per-debt breakdown. |
| **POST** | `/v3/payments/{id}/confirm` | Confirms/approves a payment under submitted status. |
| **POST** | `/v3/payments/{id}/voucher` | Submits a voucher file path or reference for validation. |
| **GET** | `/v3/payments/owner/pending` | Fetch pending debts for the authenticated owner mobile view. |
| **GET** | `/v3/payments/owner/history` | Retrieve payments history for the authenticated owner mobile view. |

---

## 📊 Enum Mappings

### Payment Status

| Name | V3 (Numeric) | V2 (Legacy) | Label |
|------|:------------:|:-----------:|-------|
| `SUBMITTED` | `1` | `"S"` | Por confirmar |
| `PAID` | `2` | `"P"` | Confirmado / Cobrado |
| `REJECTED` | `3` | `"R"` | Rechazado |
| `CANCELLED` | `4` | `"X"` | Anulado |

### Payment Method

| Name | V3 (Numeric) | V2 (Legacy) | Label |
|------|:------------:|:-----------:|-------|
| `TRANSFER` | `1` | `"T"` | Transferencia bancaria |
| `OFFICE` | `2` | `"O"` | Pago en oficina |
| `QR` | `3` | `"Q"` | Pago QR |
| `CASH` | `4` | `"E"` | Efectivo |
| `CHEQUE` | `5` | `"C"` | Cheque |

### Payment Types

| Name | V3 (Numeric) | V2 (Legacy) | Label |
|------|:------------:|:-----------:|-------|
| `ALL_DEBTS` | `1` | `"T"` | Todas las deudas |
| `EXPENSES` | `2` | `"E"` | Expensas |
| `RESERVATIONS` | `3` | `"R"` | Reservas |
| `CONDONATION` | `4` | `"F"` | Condonación |
| `PAYMENT_PLAN` | `5` | `"P"` | Plan de pago |
| `OTHER_DEBTS` | `6` | `"O"` | Otras deudas |
| `DIRECT_INCOME` | `7` | `"I"` | Pago directo (sin deuda) |

---

## 📦 Request / Response DTO Schema

### Create Payment (`POST /v3/payments`)

Amount determines whether the payment is full or partial — no separate endpoints.
Distribution is oldest-first by `due_at`. Amount > total outstanding → 422.

**Payload Schema:**
```json
{
  "dpto_id": 12,
  "paid_at": "YYYY-MM-DD",
  "method": 1,
  "amount": 250.00,
  "debt_dpto_ids": [152, 153],
  "bank_account_id": 3,
  "obs": "Observaciones del pago",
  "voucher": "V-123456",
  "url_file": ["/uploads/file.png"]
}
```

**Response Schema:**
```json
{
  "success": true,
  "message": "Pago registrado con éxito",
  "data": {
    "id": "e00b8c26-5c69-4370-9027-fa6abd947bd8",
    "status": 1,
    "amount": 250.0,
    "paid_at": "2026-06-14T00:00:00.000000Z"
  }
}
```

---

### Simulate Payment (`POST /v3/payments/simulate`)

Use on amount blur to preview distribution before confirming. Does not persist.

**Payload Schema:**
```json
{
  "amount": 180.00,
  "debt_dpto_ids": [152, 153]
}
```

**Response Schema:**
```json
{
  "is_overpayment": false,
  "payment_is_partial": true,
  "items": [
    {
      "debt_dpto_id": 152,
      "applied_amount": 180.00,
      "is_partial": true,
      "excluded": false,
      "balance_before": 250.00,
      "balance_after": 70.00
    },
    {
      "debt_dpto_id": 153,
      "applied_amount": 0,
      "is_partial": false,
      "excluded": true,
      "balance_before": 100.00,
      "balance_after": 100.00
    }
  ]
}
```
