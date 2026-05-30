// src/CheckoutPage.jsx
import React from "react";

const CheckoutPage = () => {
  // For now this is just dummy data; later you can pull from state/cart
  const items = [
    { id: 1, name: "Premium Plan", price: 19.99, qty: 1 },
    { id: 2, name: "Support Add‑on", price: 4.99, qty: 1 },
  ];

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = subtotal * 0.06; // example 6% tax
  const total = subtotal + tax;

  const handlePlaceOrder = () => {
    // Later this will start the Stripe embedded checkout
    console.log("Place order clicked");
  };

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "40px auto",
        padding: "24px",
        borderRadius: "12px",
        border: "1px solid #e2e2e2",
        boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
        background: "linear-gradient(135deg, #0f172a 0%, #020617 40%, #020617 100%)",
        color: "#f9fafb",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
      }}
    >
      {/* Header */}
      <header style={{ marginBottom: "24px" }}>
        <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 700 }}>
          Checkout
        </h1>
        <p
          style={{
            margin: "4px 0 0",
            color: "#9ca3af",
            fontSize: "14px",
          }}
        >
          Review your order and complete payment.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1.3fr)",
          gap: "24px",
        }}
      >
        {/* Left: order summary */}
        <section
          style={{
            borderRadius: "12px",
            background:
              "radial-gradient(circle at top left, rgba(96, 165, 250, 0.15), transparent 55%), rgba(15, 23, 42, 0.95)",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            padding: "18px 18px 12px",
          }}
        >
          <h2
            style={{
              margin: "0 0 12px",
              fontSize: "16px",
              fontWeight: 600,
              color: "#e5e7eb",
            }}
          >
            Order summary
          </h2>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 500 }}>
                    {item.name}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#9ca3af",
                      marginTop: "2px",
                    }}
                  >
                    Qty {item.qty}
                  </div>
                </div>
                <div style={{ fontSize: "14px", fontWeight: 500 }}>
                  ${(item.price * item.qty).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <hr style={{ borderColor: "rgba(31, 41, 55, 0.9)", margin: "8px 0" }} />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "13px",
              marginBottom: "4px",
            }}
          >
            <span style={{ color: "#9ca3af" }}>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "13px",
              marginBottom: "8px",
            }}
          >
            <span style={{ color: "#9ca3af" }}>Estimated tax</span>
            <span>${tax.toFixed(2)}</span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "14px",
              fontWeight: 600,
              marginTop: "4px",
            }}
          >
            <span>Total due</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </section>

        {/* Right: payment area / placeholder for Stripe */}
        <section
          style={{
            borderRadius: "12px",
            background:
              "radial-gradient(circle at top right, rgba(251, 191, 36, 0.18), transparent 55%), rgba(15, 23, 42, 0.96)",
            border: "1px solid rgba(148, 163, 184, 0.25)",
            padding: "18px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#e5e7eb",
                }}
              >
                Payment
              </h2>
              <span
                style={{
                  fontSize: "11px",
                  color: "#9ca3af",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Secure • Encrypted
              </span>
            </div>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: "12px",
                color: "#9ca3af",
              }}
            >
              This is a UI preview. Stripe’s embedded form will appear here once
              it’s wired up.
            </p>
          </div>

          {/* Placeholder container where EmbeddedCheckout will mount later */}
          <div
            style={{
              borderRadius: "10px",
              border: "1px dashed rgba(148, 163, 184, 0.6)",
              background: "rgba(15, 23, 42, 0.9)",
              padding: "14px 12px",
              minHeight: "180px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: "13px",
                color: "#6b7280",
                textAlign: "center",
              }}
            >
              Embedded Stripe checkout form goes here.
            </span>
          </div>

          <button
            onClick={handlePlaceOrder}
            style={{
              marginTop: "4px",
              width: "100%",
              borderRadius: "999px",
              border: "none",
              padding: "10px 16px",
              fontSize: "14px",
              fontWeight: 600,
              background:
                "linear-gradient(135deg, #22c55e 0%, #16a34a 40%, #22c55e 100%)",
              color: "#0b1120",
              cursor: "pointer",
              boxShadow: "0 12px 35px rgba(34, 197, 94, 0.35)",
              transition:
                "transform 0.15s ease-out, box-shadow 0.15s ease-out, filter 0.15s ease-out",
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = "translateY(1px)";
              e.currentTarget.style.boxShadow =
                "0 6px 18px rgba(34, 197, 94, 0.25)";
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 12px 35px rgba(34, 197, 94, 0.35)";
            }}
          >
            Place order
          </button>

          <p
            style={{
              margin: "4px 0 0",
              fontSize: "11px",
              color: "#6b7280",
              textAlign: "center",
            }}
          >
            You’ll be charged ${total.toFixed(2)} today. By placing this order,
            you agree to our terms of service.
          </p>
        </section>
      </div>
    </div>
  );
};

export default CheckoutPage;