import "./globals.css";

export const metadata = {
  title: "SoundSplit — Distribuição musical com royalties reais",
  description: "Distribui a tua música e recebe a tua parte das receitas de streaming.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}
