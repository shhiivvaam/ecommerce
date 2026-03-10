"use client";

import Link from "next/link";
import { Twitter, Instagram, Youtube, Facebook, ArrowUpRight } from "lucide-react";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  const cols = [
    {
      heading: "Shop",
      links: [
        { label: "All Products", href: "/products" },
        { label: "New Arrivals", href: "/new-arrivals" },
        { label: "Men", href: "/men" },
        { label: "Women", href: "/women" },
        { label: "Kids", href: "/kids" },
        { label: "Sale", href: "/sale" },
      ],
    },
    {
      heading: "Help",
      links: [
        { label: "Order Status", href: "#" },
        { label: "Shipping & Delivery", href: "#" },
        { label: "Returns", href: "#" },
        { label: "Contact Us", href: "#" },
        { label: "Help Center", href: "#" },
      ],
    },
    {
      heading: "Company",
      links: [
        { label: "About", href: "#" },
        { label: "Careers", href: "#" },
        { label: "News", href: "#" },
        { label: "Sustainability", href: "#" },
      ],
    },
    {
      heading: "Legal",
      links: [
        { label: "Privacy Policy", href: "#" },
        { label: "Terms of Use", href: "#" },
        { label: "Cookie Settings", href: "#" },
        { label: "Accessibility", href: "#" },
      ],
    },
  ];

  const socials = [
    { Icon: Instagram, href: "#", label: "Instagram" },
    { Icon: Twitter, href: "#", label: "X / Twitter" },
    { Icon: Youtube, href: "#", label: "YouTube" },
    { Icon: Facebook, href: "#", label: "Facebook" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap');

        .footer-root {
          background: #0a0a0a;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          border-top: 1px solid rgba(255,255,255,.06);
        }

        /* Top strip */
        .footer-top {
          border-bottom: 1px solid rgba(255,255,255,.06);
          padding: 48px 32px;
          max-width: 1400px; margin: 0 auto;
          display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 32px;
        }
        .footer-wordmark {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 48px; font-weight: 900;
          text-transform: uppercase; letter-spacing: .02em;
          color: #fff; text-decoration: none;
          transition: opacity .2s;
          line-height: 1;
        }
        .footer-wordmark:hover { opacity: .6; }
        .footer-tagline {
          font-size: 14px; font-weight: 300;
          color: rgba(255,255,255,.35);
          max-width: 340px; line-height: 1.6;
        }

        /* Social icons */
        .footer-socials { display: flex; gap: 4px; }
        .footer-social-btn {
          width: 42px; height: 42px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: transparent; border: 1px solid rgba(255,255,255,.12);
          color: rgba(255,255,255,.4); cursor: pointer; text-decoration: none;
          transition: background .2s, border-color .2s, color .2s;
        }
        .footer-social-btn:hover {
          background: rgba(200,255,0,.1);
          border-color: #c8ff00;
          color: #c8ff00;
        }

        /* Nav columns */
        .footer-nav {
          max-width: 1400px; margin: 0 auto;
          padding: 56px 32px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 40px 24px;
        }
        @media (min-width: 640px)  { .footer-nav { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .footer-nav { grid-template-columns: repeat(4, 1fr); gap: 0 48px; } }

        .footer-col-head {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px; font-weight: 700;
          letter-spacing: .16em; text-transform: uppercase;
          color: rgba(255,255,255,.25);
          margin-bottom: 20px;
        }
        .footer-link {
          display: flex; align-items: center; gap: 4px;
          font-size: 14px; font-weight: 300;
          color: rgba(255,255,255,.5);
          text-decoration: none;
          transition: color .2s;
          margin-bottom: 12px;
        }
        .footer-link:hover { color: #fff; }
        .footer-link svg { opacity: 0; transition: opacity .2s; flex-shrink: 0; }
        .footer-link:hover svg { opacity: .5; }

        /* Bottom bar */
        .footer-bottom {
          border-top: 1px solid rgba(255,255,255,.06);
          max-width: 1400px; margin: 0 auto;
          padding: 28px 32px;
          display: flex; flex-wrap: wrap;
          align-items: center; justify-content: space-between; gap: 16px;
        }
        .footer-copy {
          font-size: 12px; font-weight: 300;
          color: rgba(255,255,255,.25);
          letter-spacing: .04em;
        }
        .footer-trust {
          display: flex; flex-wrap: wrap; gap: 24px;
        }
        .footer-trust-item {
          display: flex; align-items: center; gap: 8px;
          font-size: 11px; font-weight: 500;
          letter-spacing: .1em; text-transform: uppercase;
          color: rgba(255,255,255,.25);
        }
        .footer-trust-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #c8ff00; flex-shrink: 0;
        }

        /* Accent rule */
        .footer-accent-rule {
          height: 3px;
          background: linear-gradient(90deg, #c8ff00 0%, transparent 60%);
        }
      `}</style>

      <footer className="footer-root">
        <div className="footer-accent-rule" />

        {/* ── TOP: Wordmark + tagline + socials ── */}
        <div className="footer-top">
          <div>
            <Link href="/" className="footer-wordmark">Reyva</Link>
            <p className="footer-tagline" style={{ marginTop: 16 }}>
              Performance meets style. Built for movement, designed for everyday life.
            </p>
          </div>
          <div className="footer-socials">
            {socials.map(({ Icon, href, label }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="footer-social-btn" aria-label={label}>
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        {/* ── NAV COLUMNS ── */}
        <div className="footer-nav">
          {cols.map((col) => (
            <div key={col.heading}>
              <p className="footer-col-head">{col.heading}</p>
              {col.links.map((link) => (
                <Link key={link.label} href={link.href} className="footer-link">
                  {link.label}
                  <ArrowUpRight size={11} />
                </Link>
              ))}
            </div>
          ))}
        </div>

        {/* ── BOTTOM BAR ── */}
        <div className="footer-bottom">
          <p className="footer-copy">© {new Date().getFullYear()} Reyva. All rights reserved.</p>
          <div className="footer-trust">
            {["Secure Payments", "Free Returns", "Global Delivery"].map((label) => (
              <div key={label} className="footer-trust-item">
                <span className="footer-trust-dot" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </footer>
    </>
  );
}
