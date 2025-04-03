
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigate } from 'react-router-dom';
import { Book } from 'lucide-react';

const Login = () => {
  const { currentUser, signInWithGoogle, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse text-purple-500">Carregando...</div>
      </div>
    );
  }

  if (currentUser) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 to-purple-800">
      <Card className="w-full max-w-md border-purple-300/20 bg-card/95 backdrop-blur">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-600">
            <Book size={30} className="text-white" />
          </div>
          <CardTitle className="text-2xl">Bem-vindo ao Organizador de Leituras</CardTitle>
          <CardDescription>
            Faça login para acessar sua biblioteca e organizar seus livros.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mt-4 flex flex-col gap-4">
            <Button 
              onClick={signInWithGoogle} 
              className="w-full"
              variant="outline"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2" aria-hidden="true">
                <path
                  d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                  fill="#EA4335"
                />
                <path
                  d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                  fill="#4285F4"
                />
                <path
                  d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                  fill="#FBBC05"
                />
                <path
                  d="M12.0004 24C15.2404 24 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.2754 17.385C3.2504 21.31 7.3104 24 12.0004 24Z"
                  fill="#34A853"
                />
              </svg>
              Continuar com Google
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col text-center text-sm text-muted-foreground">
          <p>Ao fazer login, você concorda com os termos de uso.</p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
