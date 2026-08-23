import { useState } from "react";
import { useAuth } from "../lib/auth";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("analyst@draxelyra.local");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background p-4 noise">
      <div className="w-full max-w-sm border border-border bg-card p-6">
        <div className="mb-8">
          <div className="font-display text-2xl tracking-[.08em] text-foreground">DRAXELYRA</div>
          <div className="mt-1 font-mono-ui text-[9px] uppercase tracking-[.18em] text-muted-foreground">Authentication required</div>
        </div>
        
        {error && <div className="mb-4 bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" required />
          </div>
          <button type="submit" className="w-full bg-primary text-primary-foreground py-2 text-sm font-semibold hover:brightness-110 transition-all">Sign In</button>
        </form>

        <div className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
          <p className="mb-2"><strong>Demo Accounts:</strong></p>
          <ul className="space-y-1">
            <li>analyst@draxelyra.local / demo123</li>
            <li>admin@draxelyra.local / demo123</li>
            <li>field@draxelyra.local / demo123</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
