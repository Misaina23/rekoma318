export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      className={className}
      alt="REKOMA"
      aria-hidden={false}
    />
  )
}
