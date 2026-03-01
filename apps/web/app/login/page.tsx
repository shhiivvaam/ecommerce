"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { isAxiosError } from "axios";
import { ArrowRight, ChevronLeft, Mail, Lock } from "lucide-react";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const features = [
  "Early access to new drops & limited releases",
  "Saved wishlist & one-tap reorder",
  "Real-time order tracking",
  "Members-only pricing & perks",
];

export default function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const { data } = await api.post("/auth/login", values);
      login(data.user, data.access_token);
      toast.success("Welcome back.");
      router.push("/");
    } catch (error) {
      const message = isAxiosError(error) ? error.response?.data?.message : undefined;
      toast.error(message || "Incorrect email or password.");
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap');
        :root { --ink:#0a0a0a; --paper:#f5f3ef; --accent:#c8ff00; --mid:#8a8a8a; --border:rgba(10,10,10,0.1); }

        .lp-wrap {
          min-height: 100svh; background: var(--paper);
          display: flex; align-items: stretch;
          font-family: 'DM Sans', sans-serif; color: var(--ink);
        }

        /* ── LEFT PANEL ── */
        .lp-left {
          display: none; flex-direction: column; justify-content: space-between;
          background: var(--ink); color: #fff;
          padding: 56px 64px; position: relative; overflow: hidden;
          flex: 0 0 480px;
        }
        @media (min-width: 1024px) { .lp-left { display: flex; } }

        .lp-noise {
          position: absolute; inset: 0; opacity: .03; pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 200px;
        }
        .lp-glow {
          position: absolute; top: -100px; left: -100px;
          width: 360px; height: 360px; border-radius: 50%;
          background: var(--accent); opacity: .06; filter: blur(80px); pointer-events: none;
        }

        .lp-logo {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 32px; font-weight: 900; letter-spacing: .04em; text-transform: uppercase;
          color: #fff; text-decoration: none; position: relative; z-index: 1;
          transition: opacity .2s;
        }
        .lp-logo:hover { opacity: .7; }

        .lp-body { position: relative; z-index: 1; }
        .lp-tag {
          font-size: 11px; font-weight: 500; letter-spacing: .16em; text-transform: uppercase;
          color: var(--accent); display: block; margin-bottom: 16px;
        }
        .lp-headline {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 60px; font-weight: 900; text-transform: uppercase;
          line-height: 1; letter-spacing: -.01em; color: #fff; margin-bottom: 44px;
        }
        .lp-feature {
          display: flex; align-items: flex-start; gap: 14px; margin-bottom: 20px;
        }
        .lp-feature-dot {
          width: 6px; height: 6px; border-radius: 50%; background: var(--accent);
          flex-shrink: 0; margin-top: 6px;
        }
        .lp-feature-text { font-size: 14px; font-weight: 300; color: rgba(255,255,255,.55); line-height: 1.5; }

        .lp-quote {
          position: relative; z-index: 1;
          padding: 20px 24px; border-left: 2px solid rgba(200,255,0,.35);
        }
        .lp-quote p { font-size: 14px; font-weight: 300; color: rgba(255,255,255,.45); line-height: 1.6; font-style: italic; margin-bottom: 10px; }
        .lp-quote footer { font-size: 10px; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; color: rgba(200,255,0,.55); }

        /* ── RIGHT PANEL ── */
        .lp-right {
          flex: 1; display: flex; flex-direction: column;
          justify-content: center; align-items: center;
          padding: 48px 32px; background: var(--paper);
        }
        .lp-right-inner { width: 100%; max-width: 400px; }

        /* Mobile logo */
        .lp-mobile-logo {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 28px; font-weight: 900; letter-spacing: .04em; text-transform: uppercase;
          color: var(--ink); text-decoration: none; display: block; margin-bottom: 40px;
        }
        @media (min-width: 1024px) { .lp-mobile-logo { display: none; } }

        .lp-head { margin-bottom: 36px; }
        .lp-head-tag {
          font-size: 11px; font-weight: 500; letter-spacing: .16em; text-transform: uppercase;
          color: var(--mid); display: block; margin-bottom: 12px;
        }
        .lp-head-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 48px; font-weight: 900; text-transform: uppercase;
          line-height: 1; letter-spacing: -.01em; margin-bottom: 10px;
        }
        .lp-head-sub { font-size: 14px; font-weight: 300; color: var(--mid); line-height: 1.5; }

        /* Fields */
        .lp-field { margin-bottom: 20px; }
        .lp-label {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 8px;
        }
        .lp-label-text {
          display: flex; align-items: center; gap: 6px;
          font-size: 10px; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; color: var(--mid);
        }
        .lp-forgot {
          font-size: 11px; font-weight: 500; color: var(--ink);
          text-decoration: none; border-bottom: 1px solid var(--border);
          transition: border-color .2s;
        }
        .lp-forgot:hover { border-color: var(--ink); }

        .lp-input-wrap { position: relative; }
        .lp-input-icon {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          color: rgba(10,10,10,.3); pointer-events: none;
        }
        .lp-input {
          width: 100%; height: 48px; padding: 0 16px 0 42px;
          border: 1.5px solid var(--border); border-radius: 6px;
          background: #fff; color: var(--ink);
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 400;
          outline: none; transition: border-color .2s;
        }
        .lp-input:focus { border-color: var(--ink); }
        .lp-input::placeholder { color: rgba(10,10,10,.25); }
        .lp-input.error { border-color: #e11d48; }
        .lp-error { font-size: 11px; color: #e11d48; margin-top: 5px; display: block; }

        /* Submit */
        .lp-submit {
          width: 100%; height: 52px; border-radius: 6px; border: none;
          background: var(--ink); color: #fff; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
          letter-spacing: .1em; text-transform: uppercase;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: background .2s, transform .15s; margin-top: 8px;
          position: relative; overflow: hidden;
        }
        .lp-submit:hover:not(:disabled) { background: #222; transform: translateY(-1px); }
        .lp-submit:disabled { opacity: .5; cursor: not-allowed; }
        .lp-shimmer {
          position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,.08) 50%, transparent 100%);
          animation: lp-sh 1.6s ease-in-out infinite;
        }
        @keyframes lp-sh { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }

        /* Footer */
        .lp-divider { height: 1px; background: var(--border); margin: 28px 0; }
        .lp-footer { display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .lp-register-text { font-size: 13px; font-weight: 300; color: var(--mid); }
        .lp-register-text a { color: var(--ink); font-weight: 500; text-decoration: none; border-bottom: 1px solid var(--border); transition: border-color .2s; }
        .lp-register-text a:hover { border-color: var(--ink); }
        .lp-back {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase;
          color: var(--mid); text-decoration: none; transition: color .2s;
        }
        .lp-back:hover { color: var(--ink); }
      `}</style>

      <div className="lp-wrap">

        {/* ── LEFT ─────────────────────────────────────────────── */}
        <aside className="lp-left">
          <div className="lp-noise" />
          <div className="lp-glow" />

          {/* <Link href="/" className="lp-logo">Reyva</Link> */}

          <div className="lp-body">
            <span className="lp-tag">Welcome back</span>
            <h2 className="lp-headline">Good to<br />See You.</h2>
            {features.map((f) => (
              <div key={f} className="lp-feature">
                <span className="lp-feature-dot" />
                <p className="lp-feature-text">{f}</p>
              </div>
            ))}
          </div>

          <div className="lp-quote">
            <p>&quot;Checking out is fast, simple, and secure — my details are saved and I can reorder in a few clicks.&quot;</p>
            <footer>— Reyva Customer</footer>
          </div>
        </aside>

        {/* ── RIGHT ────────────────────────────────────────────── */}
        <main className="lp-right">
          <div className="lp-right-inner">

            <Link href="/" className="lp-mobile-logo">Reyva</Link>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: .5, ease: [.16, 1, .3, 1] }}
            >
              <div className="lp-head">
                <span className="lp-head-tag">Member Sign In</span>
                <h1 className="lp-head-title">Welcome<br />Back.</h1>
                <p className="lp-head-sub">Enter your details to access your account and continue shopping.</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                {/* Email */}
                <div className="lp-field">
                  <div className="lp-label">
                    <span className="lp-label-text"><Mail size={11} /> Email Address</span>
                  </div>
                  <div className="lp-input-wrap">
                    <span className="lp-input-icon"><Mail size={15} /></span>
                    <input {...register("email")} type="email" placeholder="you@example.com" className={`lp-input${errors.email ? " error" : ""}`} />
                  </div>
                  {errors.email && <span className="lp-error">{errors.email.message}</span>}
                </div>

                {/* Password */}
                <div className="lp-field">
                  <div className="lp-label">
                    <span className="lp-label-text"><Lock size={11} /> Password</span>
                    <Link href="/forgot-password" className="lp-forgot">Forgot password?</Link>
                  </div>
                  <div className="lp-input-wrap">
                    <span className="lp-input-icon"><Lock size={15} /></span>
                    <input {...register("password")} type="password" placeholder="Min. 6 characters" className={`lp-input${errors.password ? " error" : ""}`} />
                  </div>
                  {errors.password && <span className="lp-error">{errors.password.message}</span>}
                </div>

                <button type="submit" className="lp-submit" disabled={isSubmitting}>
                  {isSubmitting && <span className="lp-shimmer" />}
                  <span style={{ position: "relative", zIndex: 1 }}>
                    {isSubmitting ? "Signing In…" : "Sign In"}
                  </span>
                  {!isSubmitting && <ArrowRight size={16} style={{ position: "relative", zIndex: 1 }} />}
                </button>
              </form>

              <div className="lp-divider" />

              <div className="lp-footer">
                <p className="lp-register-text">New to Reyva? <Link href="/register">Create an account</Link></p>
                <Link href="/" className="lp-back"><ChevronLeft size={13} /> Back to home</Link>
              </div>

            </motion.div>
          </div>
        </main>

      </div>
    </>
  );
}
