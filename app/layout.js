import "./globals.css";

export const metadata = {
  title: "TRACE - Website for reporting abuse crisis and escape",
  description: "TRACE is a safe, stealthy, browser-based web application designed to help survivors of abuse detect coercive control, document tamper-proof evidence, stay safe under device surveillance, trigger urgent SOS assistance, and recover independence.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌿</text></svg>" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{__html: `
          (function() {
            var theme = localStorage.getItem('trace_theme') || 'light';
            document.documentElement.setAttribute('data-theme', theme);
          })();
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
