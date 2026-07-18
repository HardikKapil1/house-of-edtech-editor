// src/app/register/page.tsx
'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { toast } from 'sonner';

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        password: form.password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      toast.error(data.error ?? "Registration failed");
      return;
    }

    toast.success("Registration successful!");
    window.location.href = "/login";
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #eef6ff 0%, #f8f5ff 100%)',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 12px 40px rgba(15, 23, 42, 0.12)',
          padding: '32px',
        }}
      >
        <h1 style={{ margin: '0 0 8px', fontSize: '28px', color: '#0f172a' }}>Create account</h1>
        <p style={{ margin: '0 0 24px', color: '#475569' }}>
          Join House of EdTech and start your learning journey.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
          <label style={{ display: 'grid', gap: '6px', color: '#334155', fontWeight: 600 }}>
            Full name
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Enter your full name"
              required
              style={inputStyle}
            />
          </label>

          <label style={{ display: 'grid', gap: '6px', color: '#334155', fontWeight: 600 }}>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="name@example.com"
              required
              style={inputStyle}
            />
          </label>

          <label style={{ display: 'grid', gap: '6px', color: '#334155', fontWeight: 600 }}>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="Create a password"
              required
              style={inputStyle}
            />
          </label>

          <label style={{ display: 'grid', gap: '6px', color: '#334155', fontWeight: 600 }}>
            Confirm password
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
              placeholder="Re-enter your password"
              required
              style={inputStyle}
            />
          </label>

          <button
            type="submit"
            style={{
              marginTop: '8px',
              border: 'none',
              borderRadius: '999px',
              padding: '12px 18px',
              background: '#4f46e5',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Register
          </button>
        </form>

        <p style={{ marginTop: '20px', color: '#64748b' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#4f46e5', fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: '10px',
  padding: '12px 14px',
  fontSize: '15px',
  outline: 'none',
};