import './globals.css';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Radhu Industries ERP — Advanced Stock & Business Management System',
  description: 'Radhu Industries ERP — A full-stack, enterprise-grade ERP system for Auto Tyre, Cycle Tube, Cycle Tyre stock management, Tally sync, HRMS, Orders, and AI analytics. Developed by Rishabh Tyagi and the Radhu Tech Team.',
  keywords: 'Radhu Industries, ERP, Stock Management, Auto Tyre, Cycle Tube, Tally Sync, HRMS, Order Management, Rishabh Tyagi, Inventory Management, GST, Manufacturing ERP',
  authors: [{ name: 'Rishabh Tyagi', url: 'https://radhuerp.site' }],
  creator: 'Rishabh Tyagi — Radhu Tech Team',
  publisher: 'Radhu Industries',
  robots: 'noindex, nofollow',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://radhuerp.site',
    siteName: 'Radhu Industries ERP',
    title: 'Radhu Industries ERP — Stock & Business Management',
    description: 'Enterprise-grade ERP for Radhu Industries. Tally Sync, HRMS, Orders, AI Analytics — all in one platform.',
    images: [{ url: 'https://radhuerp.site/og-image.png', width: 1200, height: 630, alt: 'Radhu Industries ERP' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Radhu Industries ERP',
    description: 'Full-stack ERP System — Developed by Rishabh Tyagi',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#0f172a" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" />
        <script src="https://cdn.jsdelivr.net/npm/chart.js" async></script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Radhu Industries ERP",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web Browser",
              "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR" },
              "author": {
                "@type": "Person",
                "name": "Rishabh Tyagi",
                "jobTitle": "Software Engineer & Full Stack Developer",
                "worksFor": { "@type": "Organization", "name": "Radhu Industries" }
              },
              "description": "Enterprise ERP system for Radhu Industries — Stock, Tally Sync, HRMS, Orders, and AI Analytics.",
              "url": "https://radhuerp.site"
            })
          }}
        />
      </head>
      <body>
        {children}
        {/* <Footer /> */}
      </body>
    </html>
  );
}
