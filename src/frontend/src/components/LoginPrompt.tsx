import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, PieChart, Shield } from 'lucide-react';

export default function LoginPrompt() {
  const { login, loginStatus } = useInternetIdentity();

  const features = [
    {
      icon: Wallet,
      title: 'Track Holdings',
      description: 'Manually add and manage your crypto holdings with purchase prices and dates',
    },
    {
      icon: TrendingUp,
      title: 'Monitor Performance',
      description: 'View real-time portfolio value and track gains/losses over time',
    },
    {
      icon: PieChart,
      title: 'Interactive Charts',
      description: 'Visualize your portfolio evolution with beautiful, interactive charts',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is stored securely on the Internet Computer blockchain',
    },
  ];

  return (
    <div className="container py-12 md:py-24">
      <div className="mx-auto max-w-4xl text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Track Your Crypto Portfolio
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Monitor your cryptocurrency investments, track staking rewards, and visualize your portfolio performance
            over time.
          </p>
        </div>

        <div className="flex justify-center">
          <Button size="lg" onClick={login} disabled={loginStatus === 'logging-in'} className="text-lg px-8 py-6">
            {loginStatus === 'logging-in' ? 'Logging in...' : 'Get Started'}
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 pt-12">
          {features.map((feature) => (
            <Card key={feature.title} className="border-2">
              <CardHeader>
                <feature.icon className="h-10 w-10 text-primary mb-2" />
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
