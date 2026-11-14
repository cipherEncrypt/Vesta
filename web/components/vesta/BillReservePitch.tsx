export function BillReservePitch({ className }: { className?: string }) {
  return (
    <p className={`bill-reserve-pitch${className ? ` ${className}` : ""}`}>
      Vesta saves toward your bills and tells you the moment they&apos;re
      covered. You cash out and pay. The agent saves; it never spends.
    </p>
  );
}