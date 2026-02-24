import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, Shield, Zap } from 'lucide-react';

export default function LoginPrompt() {
  const { login, loginStatus } = useInternetIdentity();

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
    }
  };

  const disabled = loginStatus === 'logging-in';

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/80 via-secondary/70 to-accent/80 shadow-glow-lg">
              <Wallet className="h-16 w-16 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent leading-tight">
            CryptoTracker
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
            Track your cryptocurrency portfolio with real-time prices and comprehensive analytics
          </p>
          <Button 
            onClick={handleLogin} 
            disabled={disabled}
            size="lg"
            className="rounded-2xl px-8 py-6 text-lg font-bold shadow-glow-lg hover:shadow-glow transition-all hover:scale-105"
          >
            {disabled ? 'Logging in...' : 'Get Started'}
          </Button>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="group relative overflow-hidden bg-card border border-border/50 rounded-2xl p-6 hover:shadow-card-hover hover:border-primary/30 transition-all duration-300 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 space-y-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 border border-primary/20 w-fit">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Live Prices</h3>
              <p className="text-muted-foreground">
                Real-time cryptocurrency prices updated every 3 seconds for accurate portfolio tracking
              </p>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-card border border-border/50 rounded-2xl p-6 hover:shadow-card-hover hover:border-primary/30 transition-all duration-300 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 space-y-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 border border-primary/20 w-fit">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Secure & Private</h3>
              <p className="text-muted-foreground">
                Your portfolio data is securely stored on the Internet Computer blockchain
              </p>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-card border border-border/50 rounded-2xl p-6 hover:shadow-card-hover hover:border-primary/30 transition-all duration-300 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 space-y-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 border border-primary/20 w-fit">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Easy Management</h3>
              <p className="text-muted-foreground">
                Add, edit, and track your holdings and staking rewards with an intuitive interface
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
