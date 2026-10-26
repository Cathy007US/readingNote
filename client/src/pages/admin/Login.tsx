import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../../api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    try {
      const { token } = await adminApi.login({ username, password });
      localStorage.setItem("token", token);
      nav("/admin/notes");
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-sm mx-auto mt-24 grid gap-3">
      <h1 className="text-xl font-bold">后台登录</h1>
      <input className="border p-2" placeholder="用户名" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input className="border p-2" type="password" placeholder="密码" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button className="bg-blue-600 text-white p-2">登录</button>
      {err && <p className="text-red-600">{err}</p>}
    </form>
  );
}