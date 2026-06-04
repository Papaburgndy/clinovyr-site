export function PaymentSuccessCheckmark() {
  return (
    <div
      className="mx-auto flex h-20 w-20 items-center justify-center"
      role="img"
      aria-label="Payment confirmed"
    >
      <svg
        className="h-20 w-20"
        viewBox="0 0 52 52"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <circle
          className="payment-check-circle"
          cx="26"
          cy="26"
          r="24"
          stroke="#2d9e88"
          strokeWidth="2"
          fill="none"
        />
        <path
          className="payment-check-mark"
          d="M14 27l8 8 16-18"
          stroke="#f5f2ed"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}
