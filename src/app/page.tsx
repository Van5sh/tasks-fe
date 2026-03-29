"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "../components/Modal";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

type Task = {
  id: string;
  title: string;
  description?: string | null;
  completed: boolean;
  created_at?: string;
  updated_at?: string;
};

type User = {
  id: string;
  role: string;
};

const defaultRegister = {
  username: "",
  email: "",
  password: "",
  dob: "",
  gender: "Male",
};

const defaultLogin = {
  email: "",
  password: "",
};

const defaultTask = {
  title: "",
  description: "",
};

export default function Home() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [registerForm, setRegisterForm] = useState(defaultRegister);
  const [loginForm, setLoginForm] = useState(defaultLogin);
  const [taskForm, setTaskForm] = useState(defaultTask);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState(defaultTask);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  if (!API_BASE) {
    return (
      <div className="min-h-screen bg-[linear-gradient(135deg,_#f8fafc_0%,_#fdf2e9_45%,_#eef2ff_100%)]">
        <div className="bg-grid min-h-screen">
          <div className="mx-auto flex min-h-screen w-full max-w-xl items-center justify-center px-6 py-12">
            <section className="glass w-full rounded-3xl border border-white/60 p-8">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                Setup Required
              </p>
              <h1 className="mt-2 font-[var(--font-display)] text-3xl text-[var(--ink)]">
                Missing API base URL
              </h1>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Define the backend URL in your environment before starting the
                frontend.
              </p>
              <div className="mt-4 rounded-2xl border border-zinc-100 bg-white/70 p-4 text-sm text-zinc-700">
                <p className="font-semibold text-[var(--ink)]">
                  Required env var
                </p>
                <p className="mt-1 font-mono">
                  NEXT_PUBLIC_API_BASE=http://localhost:8000
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const saved = localStorage.getItem("token");
    if (saved) setToken(saved);
  }, []);

  useEffect(() => {
    if (!token) return;
    localStorage.setItem("token", token);
    void fetchMe();
    void fetchTasks();
  }, [token]);

  const headers = useMemo(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  const setStatus = (msg: string | null, err: string | null = null) => {
    setMessage(msg);
    setError(err);
  };

  const apiFetch = async <T,>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> => {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers ?? {}) },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail = data?.detail ?? "Request failed";
      throw new Error(detail);
    }
    return data as T;
  };

  const handleRegister = async () => {
    setLoading(true);
    setStatus(null, null);
    try {
      await apiFetch("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify(registerForm),
      });
      setStatus("Registered successfully. You can log in now.");
      setMode("login");
      setRegisterForm(defaultRegister);
    } catch (err) {
      setStatus(null, (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setStatus(null, null);
    try {
      const data = await apiFetch<{ access_token: string }>(
        "/api/v1/auth/login",
        {
          method: "POST",
          body: JSON.stringify(loginForm),
        }
      );
      setToken(data.access_token);
      setStatus("Logged in.");
      setLoginForm(defaultLogin);
    } catch (err) {
      setStatus(null, (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setTasks([]);
    localStorage.removeItem("token");
    setStatus("Logged out.");
  };

  const fetchMe = async () => {
    try {
      const data = await apiFetch<User>("/api/v1/users/me");
      setUser(data);
    } catch (err) {
      setStatus(null, (err as Error).message);
    }
  };

  const fetchTasks = async () => {
    try {
      const data = await apiFetch<Task[]>("/api/v1/tasks");
      setTasks(data);
    } catch (err) {
      setStatus(null, (err as Error).message);
    }
  };

  const handleCreateTask = async () => {
    setLoading(true);
    setStatus(null, null);
    try {
      const created = await apiFetch<Task>("/api/v1/tasks", {
        method: "POST",
        body: JSON.stringify(taskForm),
      });
      setTasks((prev) => [created, ...prev]);
      setTaskForm(defaultTask);
      setStatus("Task created.");
    } catch (err) {
      setStatus(null, (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async (taskId: string) => {
    setLoading(true);
    setStatus(null, null);
    try {
      const updated = await apiFetch<Task>(`/api/v1/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify(editingForm),
      });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      setEditingId(null);
      setEditingForm(defaultTask);
      setStatus("Task updated.");
    } catch (err) {
      setStatus(null, (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setLoading(true);
    setStatus(null, null);
    try {
      await apiFetch(`/api/v1/tasks/${taskId}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setStatus("Task deleted.");
    } catch (err) {
      setStatus(null, (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    setLoading(true);
    setStatus(null, null);
    try {
      const updated = await apiFetch<Task>(`/api/v1/tasks/${task.id}`, {
        method: "PUT",
        body: JSON.stringify({ completed: !task.completed }),
      });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (err) {
      setStatus(null, (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f8fafc_0%,_#fdf2e9_45%,_#eef2ff_100%)]">
      <div className="bg-grid min-h-screen">
        {!token ? (
          <div className="mx-auto flex min-h-screen w-full max-w-xl items-center justify-center px-6 py-12">
            <section className="glass w-full rounded-3xl border border-white/60 p-8">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                Internship Task
              </p>
              <h1 className="mt-2 font-[var(--font-display)] text-3xl text-[var(--ink)]">
                {mode === "login" ? "Welcome back" : "Create your account"}
              </h1>
              <p className="mt-2 text-sm text-[var(--muted)]">
                JWT authentication required to access tasks.
              </p>

              <div className="mt-6 flex rounded-full border border-zinc-200 bg-white p-1 text-xs">
                <button
                  onClick={() => setMode("login")}
                  className={`rounded-full px-3 py-1 font-semibold transition ${
                    mode === "login"
                      ? "bg-black text-white"
                      : "text-zinc-600"
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => setMode("register")}
                  className={`rounded-full px-3 py-1 font-semibold transition ${
                    mode === "register"
                      ? "bg-black text-white"
                      : "text-zinc-600"
                  }`}
                >
                  Register
                </button>
              </div>

              <div className="mt-6">
                {mode === "register" ? (
                  <div className="flex flex-col gap-4">
                    <Input
                      label="Username"
                      value={registerForm.username}
                      onChange={(value) =>
                        setRegisterForm({ ...registerForm, username: value })
                      }
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={registerForm.email}
                      onChange={(value) =>
                        setRegisterForm({ ...registerForm, email: value })
                      }
                    />
                    <Input
                      label="Password"
                      type="password"
                      value={registerForm.password}
                      onChange={(value) =>
                        setRegisterForm({ ...registerForm, password: value })
                      }
                    />
                    <div className="grid gap-4 md:grid-cols-2">
                      <Input
                        label="Date of Birth"
                        type="date"
                        value={registerForm.dob}
                        onChange={(value) =>
                          setRegisterForm({ ...registerForm, dob: value })
                        }
                      />
                      <Select
                        label="Gender"
                        value={registerForm.gender}
                        onChange={(value) =>
                          setRegisterForm({ ...registerForm, gender: value })
                        }
                        options={["Male", "Female", "Other"]}
                      />
                    </div>
                    <button
                      onClick={handleRegister}
                      disabled={loading}
                      className="rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                    >
                      Create account
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <Input
                      label="Email"
                      type="email"
                      value={loginForm.email}
                      onChange={(value) =>
                        setLoginForm({ ...loginForm, email: value })
                      }
                    />
                    <Input
                      label="Password"
                      type="password"
                      value={loginForm.password}
                      onChange={(value) =>
                        setLoginForm({ ...loginForm, password: value })
                      }
                    />
                    <button
                      onClick={handleLogin}
                      disabled={loading}
                      className="rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
                    >
                      Log in
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-6 rounded-2xl border border-zinc-100 bg-white/70 p-4 text-sm text-zinc-700">
                <p className="font-semibold text-[var(--ink)]">Status</p>
                {message ? (
                  <p className="mt-1 text-emerald-700">{message}</p>
                ) : null}
                {error ? <p className="mt-1 text-rose-600">{error}</p> : null}
                {!message && !error ? (
                  <p className="mt-1 text-zinc-500">
                    Login or register to continue.
                  </p>
                ) : null}
              </div>
            </section>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
            <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                  Internship Task
                </p>
                <h1 className="font-[var(--font-display)] text-4xl leading-tight text-[var(--ink)] md:text-5xl">
                  Clean Tasks Console
                </h1>
                <p className="mt-2 max-w-2xl text-base text-[var(--muted)]">
                  Authenticate, manage tasks, and inspect JWT-secured APIs in
                  one focused workspace.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleLogout}
                  className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
                >
                  Logout
                </button>
              </div>
            </header>

            <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
              <section className="glass rounded-3xl border border-white/60 p-6">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--ink)]">
                      Task Dashboard
                    </h2>
                    <p className="text-sm text-[var(--muted)]">
                      {user
                        ? `Signed in as ${user.id} (${user.role})`
                        : "Loading profile..."}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setShowTaskModal(true)}
                      className="rounded-full bg-[var(--accent-2)] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                    >
                      New task
                    </button>
                    <button
                      onClick={fetchTasks}
                      className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:border-zinc-400"
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {tasks.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-zinc-200 bg-white/80 p-6 text-sm text-zinc-500">
                      No tasks yet. Create your first task.
                    </div>
                  ) : (
                    tasks.map((task) => (
                      <div
                        key={task.id}
                        className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="flex-1">
                            {editingId === task.id ? (
                              <div className="space-y-2">
                                <Input
                                  label="Title"
                                  value={editingForm.title}
                                  onChange={(value) =>
                                    setEditingForm({
                                      ...editingForm,
                                      title: value,
                                    })
                                  }
                                />
                                <Input
                                  label="Description"
                                  value={editingForm.description}
                                  onChange={(value) =>
                                    setEditingForm({
                                      ...editingForm,
                                      description: value,
                                    })
                                  }
                                />
                              </div>
                            ) : (
                              <>
                                <h3 className="text-lg font-semibold text-[var(--ink)]">
                                  {task.title}
                                </h3>
                                <p className="text-sm text-zinc-600">
                                  {task.description || "No description"}
                                </p>
                              </>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                task.completed
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {task.completed ? "Completed" : "Pending"}
                            </span>
                            {editingId === task.id ? (
                              <>
                                <button
                                  onClick={() => handleUpdateTask(task.id)}
                                  className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingId(null);
                                    setEditingForm(defaultTask);
                                  }}
                                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleToggleComplete(task)}
                                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600"
                                >
                                  Toggle
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingId(task.id);
                                    setEditingForm({
                                      title: task.title,
                                      description: task.description ?? "",
                                    });
                                  }}
                                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="glass rounded-3xl border border-white/60 p-6">
                <h2 className="text-lg font-semibold text-[var(--ink)]">
                  Access Summary
                </h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  JWT-authenticated session with role data and API base URL.
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                    Logged in. Your token is stored locally for this session.
                  </div>
                  <div className="rounded-2xl border border-zinc-100 bg-white/70 p-4 text-sm text-zinc-700">
                    <p className="font-semibold text-[var(--ink)]">Status</p>
                    {message ? (
                      <p className="mt-1 text-emerald-700">{message}</p>
                    ) : null}
                    {error ? (
                      <p className="mt-1 text-rose-600">{error}</p>
                    ) : null}
                    {!message && !error ? (
                      <p className="mt-1 text-zinc-500">
                        Task updates will appear here.
                      </p>
                    ) : null}
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={showTaskModal}
        title="New task"
        onClose={() => setShowTaskModal(false)}
        footer={
          <>
            <button
              onClick={async () => {
                await handleCreateTask();
                setShowTaskModal(false);
              }}
              disabled={!token || loading}
              className="rounded-full bg-[var(--accent-2)] px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              Create task
            </button>
            <button
              onClick={() => setShowTaskModal(false)}
              className="rounded-full border border-zinc-200 bg-white px-5 py-2 text-sm font-semibold text-zinc-600"
            >
              Cancel
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Task title"
            value={taskForm.title}
            onChange={(value) => setTaskForm({ ...taskForm, title: value })}
          />
          <Input
            label="Description"
            value={taskForm.description}
            onChange={(value) =>
              setTaskForm({ ...taskForm, description: value })
            }
          />
        </div>
      </Modal>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-black"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-black"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
