import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, Loader2, Shield, User } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleQuickAuth = async (email: string, pass: string, name: string) => {
    setIsLoading(true);
    try {
      // Try login first
      try {
        await login(email, pass);
        toast.success(`Logged in as ${name}`);
        navigate("/");
        return;
      } catch (loginError: any) {
        // If login fails (user likely doesn't exist), try register
        try {
          await register(email, name, pass);
          toast.success(`Registered and logged in as ${name}`);
          navigate("/");
        } catch (regError: any) {
          // If register also fails, show error
          toast.error(regError.message || `Failed to authenticate as ${name}`);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in email and password");
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      toast.success("Logged in successfully");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-primary-foreground font-bold text-xl">
                Ai
              </span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
          <CardDescription>
            Login is for existing accounts only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                className="bg-background border-border"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 gap-2 mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground font-medium">
                Quick Access
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              variant="outline"
              type="button"
              className="w-full h-11 gap-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5 group transition-all duration-300"
              onClick={() => handleQuickAuth("admin@example.com", "adminadmin1", "Admin")}
              disabled={isLoading}
            >
              <Shield className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
              <span className="font-medium">Войти как Admin</span>
            </Button>
            <Button
              variant="outline"
              type="button"
              className="w-full h-11 gap-2 border-border hover:bg-muted group transition-all duration-300"
              onClick={() => handleQuickAuth("user@example.com", "useruser1", "User")}
              disabled={isLoading}
            >
              <User className="h-4 w-4 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Войти как User</span>
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            Need an account?{" "}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Register
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
