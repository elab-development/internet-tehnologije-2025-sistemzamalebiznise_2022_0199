export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sr">    
        <body>
        <main>{children}</main>
      </body>
    </html>
  );
}