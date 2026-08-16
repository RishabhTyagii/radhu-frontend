import './globals.css';

export const metadata = {
  title: 'Radhu Industries - Stock Management',
  description: 'Stock Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />
        <script src="https://cdn.jsdelivr.net/npm/chart.js" async></script>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
