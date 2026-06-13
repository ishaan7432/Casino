"use client";

import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import styles from "./AuthModal.module.css";

export default function AuthModal() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login, signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await login(email, password);
      } else {
        if (!name.trim()) {
          setError("Name is required");
          setIsLoading(false);
          return;
        }
        result = await signup(email, password, name);
      }

      if (!result.success) {
        setError(result.error || "Authentication failed");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.glowOrb1} />
      <div className={styles.glowOrb2} />
      <div className={styles.glowOrb3} />
      
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.logoIcon}>
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className={styles.title}>
            {isLogin ? "Admin Login" : "Create Admin Account"}
          </h2>
          <span className={styles.subtitle}>
            OfferStakes Secure Administrator Panel
          </span>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {!isLogin && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Name</label>
              <input
                type="text"
                className={styles.input}
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              className={styles.input}
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              className={styles.input}
              placeholder={isLogin ? "Password" : "Minimum 8 characters"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={isLogin ? undefined : 8}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? "Please wait..." : isLogin ? "Login" : "Create Account"}
          </button>

          <div className={styles.switchMode}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              type="button"
              className={styles.switchBtn}
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
            >
              {isLogin ? "Sign Up" : "Login"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
