"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { ArrowRight, ChevronLeft, Mail, Lock, User as UserIcon } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const perks = [
  { title: "Early Access", desc: "Be first to know about new drops and limited releases." },
  { title: "Saved Wishlist", desc: "Bookmark favorites and pick up right where you left off." },
  { title: "Faster Checkout", desc: "Your details saved. One tap and you're done." },
  { title: "Order Tracking", desc: "Full history and real-time updates in one place." },
];

export default function RegisterPage() {
  const login = useAuthStore((s) => s.login);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        const message =
          (data && (data.message || data.error)) ||
          "This email may already be in use.";
        throw new Error(message);
      }

      login(data.user, data.access_token);
      toast.success("Account created. Welcome.");
      router.push("/");
    } catch (error) {
      const message = error instanceof Error ? error.message : undefined;
      toast.error(message || "This email may already be in use.");
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap');
        :root { --ink:#0a0a0a; --paper:#f5f3ef; --accent:#c8ff00; --mid:#8a8a8a; --border:rgba(10,10,10,0.1); }

        .rp-wrap {
          min-height: 100svh; background: var(--paper);
          display: flex; align-items: stretch;
          font-family: 'DM Sans', sans-serif; color: var(--ink);
        }

        /* ── LEFT PANEL ── */
        .rp-left {
          display: none;
          flex-direction: column; justify-content: space-between;
          background: var(--ink); color: #fff;
          padding: 56px 64px; position: relative; overflow: hidden;
          flex: 0 0 480px;
        }
        @media (min-width: 1024px) { .rp-left { display: flex; } }

        .rp-left-noise {
          position: absolute; inset: 0; opacity: .03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 200px; pointer-events: none;
        }
        .rp-left-glow {
          position: absolute; bottom: -120px; right: -120px;
          width: 400px; height: 400px; border-radius: 50%;
          background: var(--accent); opacity: .07; filter: blur(80px); pointer-events: none;
        }

        .rp-logo {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 32px; font-weight: 900; letter-spacing: .04em;
          text-transform: uppercase; color: #fff; text-decoration: none;
          position: relative; z-index: 1;
        }
        .rp-logo:hover { opacity: .7; }

        .rp-left-body { position: relative; z-index: 1; }
        .rp-left-tag {
          font-size: 11px; font-weight: 500; letter-spacing: .16em; text-transform: uppercase;
          color: var(--accent); display: block; margin-bottom: 16px;
        }
        .rp-left-headline {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 56px; font-weight: 900; text-transform: uppercase;
          line-height: 1; letter-spacing: -.01em; color: #fff;
          margin-bottom: 48px;
        }

        .rp-perk { display: flex; gap: 16px; margin-bottom: 28px; }
        .rp-perk-dot {
          width: 6px; height: 6px; border-radius: 50%; background: var(--accent);
          flex-shrink: 0; margin-top: 7px;
        }
        .rp-perk-title { font-size: 14px; font-weight: 500; margin-bottom: 3px; }
        .rp-perk-desc { font-size: 13px; font-weight: 300; color: rgba(255,255,255,.45); line-height: 1.5; }

        .rp-quote {
          position: relative; z-index: 1;
          padding: 20px 24px; border-left: 2px solid rgba(200,255,0,.4);
          margin-top: 8px;
        }
        .rp-quote p { font-size: 14px; font-weight: 300; color: rgba(255,255,255,.5); line-height: 1.6; font-style: italic; margin-bottom: 10px; }
        .rp-quote footer { font-size: 10px; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; color: rgba(200,255,0,.6); }

        /* ── RIGHT PANEL ── */
        .rp-right {
          flex: 1; display: flex; flex-direction: column;
          justify-content: center; align-items: center;
          padding: 48px 32px; background: var(--paper);
        }
        .rp-right-inner { width: 100%; max-width: 420px; }

        .rp-right-head { margin-bottom: 36px; }
        .rp-right-tag {
          font-size: 11px; font-weight: 500; letter-spacing: .16em; text-transform: uppercase;
          color: var(--mid); display: block; margin-bottom: 12px;
        }
        .rp-right-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 44px; font-weight: 900; text-transform: uppercase;
          line-height: 1; letter-spacing: -.01em; margin-bottom: 10px;
        }
        .rp-right-sub { font-size: 14px; font-weight: 300; color: var(--mid); line-height: 1.5; }

        /* ── FORM ── */
        .rp-field { margin-bottom: 20px; }
        .rp-label {
          display: flex; align-items: center; gap: 6px;
          font-size: 10px; font-weight: 500; letter-spacing: .14em; text-transform: uppercase;
          color: var(--mid); margin-bottom: 8px;
        }
        .rp-input-wrap { position: relative; }
        .rp-input-icon {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          color: rgba(10,10,10,.3); pointer-events: none;
        }
        .rp-input {
          width: 100%; height: 48px; padding: 0 16px 0 42px;
          border: 1.5px solid var(--border); border-radius: 6px;
          background: #fff; color: var(--ink);
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 400;
          outline: none; transition: border-color .2s;
        }
        .rp-input:focus { border-color: var(--ink); }
        .rp-input::placeholder { color: rgba(10,10,10,.25); }
        .rp-input.error { border-color: #e11d48; }
        .rp-error { font-size: 11px; color: #e11d48; margin-top: 5px; display: block; }

        /* Submit */
        .rp-submit {
          width: 100%; height: 52px; border-radius: 6px; border: none;
          background: var(--ink); color: #fff; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
          letter-spacing: .1em; text-transform: uppercase;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: background .2s, transform .15s; margin-top: 8px;
          position: relative; overflow: hidden;
        }
        .rp-submit:hover:not(:disabled) { background: #222; transform: translateY(-1px); }
        .rp-submit:disabled { opacity: .5; cursor: not-allowed; }
        .rp-submit-shimmer {
          position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,.08) 50%, transparent 100%);
          animation: rp-shimmer 1.6s ease-in-out infinite;
        }
        @keyframes rp-shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }

        /* Divider + links */
        .rp-divider { height: 1px; background: var(--border); margin: 28px 0; }
        .rp-footer-links { display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .rp-signin-link {
          font-size: 13px; font-weight: 300; color: var(--mid);
        }
        .rp-signin-link a { color: var(--ink); font-weight: 500; text-decoration: none; border-bottom: 1px solid var(--border); transition: border-color .2s; }
        .rp-signin-link a:hover { border-color: var(--ink); }
        .rp-back-link {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase;
          color: var(--mid); text-decoration: none; transition: color .2s;
        }
        .rp-back-link:hover { color: var(--ink); }

        /* Mobile logo */
        .rp-mobile-logo {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 28px; font-weight: 900; letter-spacing: .04em; text-transform: uppercase;
          color: var(--ink); text-decoration: none; display: block;
          margin-bottom: 40px;
        }
        @media (min-width: 1024px) { .rp-mobile-logo { display: none; } }
      `}</style>

      <div className="rp-wrap">

        {/* ── LEFT – Brand panel ──────────────────────────────── */}
        <aside className="rp-left">
          <div className="rp-left-noise" />
          <div className="rp-left-glow" />

          {/* <Link href="/" className="rp-logo">Reyva</Link> */}

          <div className="rp-left-body">
            {/* <span className="rp-left-tag">Create your account</span> */}
            <h2 className="rp-left-headline">Join the<br />Movement.</h2>
            {perks.map((p) => (
              <div key={p.title} className="rp-perk">
                <span className="rp-perk-dot" />
                <div>
                  <p className="rp-perk-title">{p.title}</p>
                  <p className="rp-perk-desc">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rp-quote">
            <p>&quot;Wishlists, faster checkout, and order history make shopping here feel effortless.&quot;</p>
            <footer>— Reyva Member</footer>
          </div>
        </aside>

        {/* ── RIGHT – Form panel ───────────────────────────────── */}
        <main className="rp-right">
          <div className="rp-right-inner">

            {/* Mobile logo */}
            <Link href="/" className="rp-mobile-logo">Reyva</Link>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5, ease: [.16, 1, .3, 1] }}>

              <div className="rp-right-head">
                <span className="rp-right-tag">Step 1 of 1</span>
                <h1 className="rp-right-title">Create<br />Account</h1>
                <p className="rp-right-sub">Save your details for faster checkout and easy order tracking.</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                {/* Name */}
                <div className="rp-field">
                  <label className="rp-label"><UserIcon size={11} /> Full Name</label>
                  <div className="rp-input-wrap">
                    <span className="rp-input-icon"><UserIcon size={15} /></span>
                    <input {...register("name")} type="text" placeholder="Jamie Park" className={`rp-input${errors.name ? " error" : ""}`} />
                  </div>
                  {errors.name && <span className="rp-error">{errors.name.message}</span>}
                </div>

                {/* Email */}
                <div className="rp-field">
                  <label className="rp-label"><Mail size={11} /> Email Address</label>
                  <div className="rp-input-wrap">
                    <span className="rp-input-icon"><Mail size={15} /></span>
                    <input {...register("email")} type="email" placeholder="you@example.com" className={`rp-input${errors.email ? " error" : ""}`} />
                  </div>
                  {errors.email && <span className="rp-error">{errors.email.message}</span>}
                </div>

                {/* Password */}
                <div className="rp-field">
                  <label className="rp-label"><Lock size={11} /> Password</label>
                  <div className="rp-input-wrap">
                    <span className="rp-input-icon"><Lock size={15} /></span>
                    <input {...register("password")} type="password" placeholder="Min. 6 characters" className={`rp-input${errors.password ? " error" : ""}`} />
                  </div>
                  {errors.password && <span className="rp-error">{errors.password.message}</span>}
                </div>

                <button type="submit" className="rp-submit" disabled={isSubmitting}>
                  {isSubmitting && <span className="rp-submit-shimmer" />}
                  <span style={{ position: "relative", zIndex: 1 }}>
                    {isSubmitting ? "Creating Account…" : "Create Account"}
                  </span>
                  {!isSubmitting && <ArrowRight size={16} style={{ position: "relative", zIndex: 1 }} />}
                </button>
              </form>

              <div className="rp-divider" />

              <div className="rp-footer-links">
                <p className="rp-signin-link">Already have an account? <Link href="/login">Sign in</Link></p>
                <Link href="/" className="rp-back-link"><ChevronLeft size={13} /> Back to home</Link>
              </div>

            </motion.div>
          </div>
        </main>

      </div>
    </>
  );
}