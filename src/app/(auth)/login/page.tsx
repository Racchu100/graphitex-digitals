"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import Card from "@/components/ui/Card";
import PhoneInput from "@/components/auth/PhoneInput";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import OTPInput from "@/components/auth/OTPInput";
import { createClient } from "@/lib/supabase/client";
import { checkMobileRegistered } from "./actions";
import NavBar from "@/components/layout/NavBar";

type AuthFlow = "signin" | "signup" | "forgot_mobile" | "forgot_otp" | "forgot_reset";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [flow, setFlow] = useState<AuthFlow>("signin");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendTimer, setResendTimer] = useState(30);

  const isSignUp = flow === "signup";
  const [showPhoneFlow, setShowPhoneFlow] = useState(false);

  // Parse error query param on mount if returning from a failed OAuth callback
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlError = params.get("error");
      if (urlError) {
        setError(urlError);
      }
    }
  }, []);

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError("");
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/google./callback`,
        },
      });
      if (authError) throw authError;
    } catch (err: any) {
      setError(err.message || "Failed to start Google sign in.");
      setLoading(false);
    }
  };

  const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: '10px', display: 'inline-block', verticalAlign: 'middle' }}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );

  // Supabase phone+password auth uses phone as the "email" field in format +91XXXXXXXXXX
  const getEmail = () => `+91${phone}@graphitex.app`;

  // Countdown timer for OTP resend code
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (flow === "forgot_otp" && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [flow, resendTimer]);

  const handleResendOTP = () => {
    setResendTimer(30);
    setOtp("");
    setError("");
    setSuccess("OTP resent successfully! Enter 123456.");
  };

  const handleMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Check if user profile exists in database using Server Action to bypass RLS limits for guest
      const isRegistered = await checkMobileRegistered(phone);

      if (!isRegistered) {
        setError("No account registered with this mobile number. Try signing up.");
        setLoading(false);
        return;
      }

      // Transition to OTP verification step
      setFlow("forgot_otp");
      setSuccess("Verification code sent! Enter 123456 to verify.");
    } catch (err: any) {
      setError(err.message || "Failed to check account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (otp.length < 6) {
      setError("Please enter the full 6-digit OTP.");
      return;
    }

    if (otp !== "123456") {
      setError("Invalid verification code. Use '123456' for verification.");
      return;
    }

    setFlow("forgot_reset");
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, newPassword }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to reset password.");

      // Password updated successfully! Now programmatically sign in the user
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: getEmail(),
        password: newPassword,
      });

      if (signInError) throw signInError;

      // Check if user profile exists to route accordingly
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("id", data.user?.id)
        .maybeSingle();

      if (!userData) {
        router.push("/onboarding");
        router.refresh();
      } else {
        const { data: userRoles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user?.id);

        const isAdmin = userRoles?.some((r: any) => r.role === 'admin');

        if (isAdmin) {
          router.push("/admin");
        } else {
          router.push("/services");
        }
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) { setError("Enter a valid 10-digit mobile number."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setLoading(true);
    setError("");

    try {
      if (isSignUp) {
        // Sign Up
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: getEmail(),
          password,
          options: {
            data: { phone: `+91${phone}` },
          },
        });

        if (signUpError) throw signUpError;

        // Check if user profile exists
        const { data: userData } = await supabase
          .from("users")
          .select("id")
          .eq("id", data.user?.id)
          .maybeSingle();

        if (!userData) {
          router.push("/onboarding");
          router.refresh();
        } else {
          const { data: userRoles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", data.user?.id);

          const isAdmin = userRoles?.some((r: any) => r.role === 'admin');

          if (isAdmin) {
            router.push("/admin");
          } else {
            router.push("/services");
          }
          router.refresh();
        }
      } else {
        // Sign In
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: getEmail(),
          password,
        });

        if (signInError) throw signInError;

        // Check if user profile exists
        const { data: userData } = await supabase
          .from("users")
          .select("id")
          .eq("id", data.user?.id)
          .maybeSingle();

        if (!userData) {
          router.push("/onboarding");
          router.refresh();
        } else {
          const { data: userRoles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", data.user?.id);

          const isAdmin = userRoles?.some((r: any) => r.role === 'admin');

          if (isAdmin) {
            router.push("/admin");
          } else {
            router.push("/services");
          }
          router.refresh();
        }
      }
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("Invalid login credentials")) {
        setError("Incorrect password. Try again or create an account.");
      } else if (msg.includes("User already registered")) {
        setError("Account exists. Please sign in instead.");
        setFlow("signin");
      } else {
        setError(msg || "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Rendering conditional sub-flows inside the premium Auth Card container
  if (flow === "forgot_mobile") {
    return (
      <>
        <NavBar />
        <div className={styles.container}>
          <div className={styles.backgroundGlow} />
          <Card className={styles.card} padding="lg">
            <div className={styles.header}>
              <h1 className={styles.title}>Reset Password</h1>
              <p className={styles.subtitle}>Enter your registered mobile number.</p>
            </div>

            <form onSubmit={handleMobileSubmit} className={styles.form}>
              <PhoneInput
                label="Mobile Number"
                value={phone}
                onChange={setPhone}
                required
                autoFocus
              />

              {error && <p className={styles.error}>{error}</p>}

              <Button type="submit" fullWidth loading={loading}>
                Send Verification Code
              </Button>
            </form>

            <div className={styles.switchMode}>
              <button 
                className={styles.switchBtn} 
                onClick={() => { setFlow("signin"); setError(""); }}
              >
                Back to Sign In
              </button>
            </div>
          </Card>
        </div>
      </>
    );
  }

  if (flow === "forgot_otp") {
    return (
      <>
        <NavBar />
        <div className={styles.container}>
          <div className={styles.backgroundGlow} />
          <Card className={styles.card} padding="lg">
            <div className={styles.header}>
              <h1 className={styles.title}>Verify Mobile</h1>
              <p className={styles.subtitle}>Enter the 6-digit code sent to +91 {phone}</p>
            </div>

            <form onSubmit={handleOtpSubmit} className={styles.form}>
              <OTPInput
                value={otp}
                onChange={(val) => { setOtp(val); setError(""); }}
                error={error}
              />

              {success && <p style={{ color: "green", fontSize: "13px", textAlign: "center" }}>{success}</p>}

              <Button type="submit" fullWidth loading={loading}>
                Verify Code
              </Button>
            </form>

            <div className={styles.resend} style={{ marginTop: "20px" }}>
              {resendTimer > 0 ? (
                <span className={styles.timerText}>Resend code in {resendTimer}s</span>
              ) : (
                <button className={styles.resendButton} onClick={handleResendOTP}>
                  Resend Code
                </button>
              )}
            </div>

            <div className={styles.switchMode}>
              <button 
                className={styles.switchBtn} 
                onClick={() => { setFlow("forgot_mobile"); setError(""); setSuccess(""); }}
              >
                Back
              </button>
            </div>
          </Card>
        </div>
      </>
    );
  }

  if (flow === "forgot_reset") {
    return (
      <>
        <NavBar />
        <div className={styles.container}>
          <div className={styles.backgroundGlow} />
          <Card className={styles.card} padding="lg">
            <div className={styles.header}>
              <h1 className={styles.title}>New Password</h1>
              <p className={styles.subtitle}>Create a new secure password for your account.</p>
            </div>

            <form onSubmit={handleResetSubmit} className={styles.form}>
              <Input
                label="New Password"
                type="password"
                showPasswordToggle
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                placeholder="Min. 6 characters"
                required
                autoFocus
              />

              <Input
                label="Confirm New Password"
                type="password"
                showPasswordToggle
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                placeholder="Re-enter password"
                required
              />

              {error && <p className={styles.error}>{error}</p>}

              <Button type="submit" fullWidth loading={loading}>
                Save & Sign In
              </Button>
            </form>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <div className={styles.container}>
        <div className={styles.backgroundGlow} />

        <Card className={styles.card} padding="lg">
          <div className={styles.header}>
            <h1 className={styles.title}>{isSignUp ? "Create Account" : "Welcome back"}</h1>
            <p className={styles.subtitle}>
              {showPhoneFlow
                ? (isSignUp ? "Sign up with your mobile number." : "Sign in to your account.")
                : (isSignUp ? "Sign up with your Google account." : "Sign in to your account.")}
            </p>
          </div>

          {!showPhoneFlow ? (
            <div className={styles.oauthContainer}>
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={handleGoogleAuth}
                loading={loading}
                icon={<GoogleIcon />}
              >
                {isSignUp ? "Sign up with Google" : "Sign in with Google"}
              </Button>

              {error && <p className={styles.error} style={{ marginTop: "15px" }}>{error}</p>}

              <div className={styles.toggleFlow}>
                <button
                  type="button"
                  className={styles.toggleFlowBtn}
                  onClick={() => {
                    setShowPhoneFlow(true);
                    setError("");
                  }}
                >
                  {isSignUp ? "Sign up with mobile number instead" : "Sign in with mobile number instead"}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form}>
              <PhoneInput
                label="Mobile Number"
                value={phone}
                onChange={setPhone}
                required
                autoFocus
              />

              <div>
                <Input
                  label="Password"
                  type="password"
                  showPasswordToggle
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Min. 6 characters"
                  required
                />
                {!isSignUp && (
                  <div className={styles.forgotBtnWrapper}>
                    <button 
                      type="button" 
                      className={styles.forgotLink}
                      onClick={() => { setFlow("forgot_mobile"); setError(""); }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <Button type="submit" fullWidth loading={loading}>
                {isSignUp ? "Create Account" : "Sign In"}
              </Button>

              <div className={styles.toggleFlow} style={{ textAlign: "center", marginTop: "10px" }}>
                <button
                  type="button"
                  className={styles.toggleFlowBtn}
                  onClick={() => {
                    setShowPhoneFlow(false);
                    setError("");
                  }}
                >
                  ← Continue with Google
                </button>
              </div>
            </form>
          )}

          <div className={styles.switchMode}>
            {isSignUp ? (
              <>Already have an account?{" "}
                <button className={styles.switchBtn} onClick={() => { setFlow("signin"); setError(""); }}>
                  Sign In
                </button>
              </>
            ) : (
              <>New here?{" "}
                <button className={styles.switchBtn} onClick={() => { setFlow("signup"); setError(""); }}>
                  Create Account
                </button>
              </>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
