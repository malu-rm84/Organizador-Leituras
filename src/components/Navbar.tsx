import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Book, BookOpen, PlusCircle, UserCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/components/ui/use-toast';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      toast({
        title: "Erro ao fazer logout",
        description: "Ocorreu um erro ao tentar sair.",
        variant: "destructive",
      });
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-secondary text-white' : '';
  };

  return (
    <header className="bg-card border-b border-border">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary">
          <Book size={28} />
          <span>Organizador de Leituras</span>
        </Link>

        {currentUser ? (
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-2">
              <Link 
                to="/" 
                className={`px-3 py-2 rounded-md hover:bg-secondary transition-colors ${isActive('/')}`}
              >
                <div className="flex items-center gap-2">
                  <BookOpen size={18} />
                  <span>Início</span>
                </div>
              </Link>
              <Link 
                to="/AddBook" 
                className={`px-3 py-2 rounded-md hover:bg-secondary transition-colors ${isActive('/AddBook')}`}
              >
                <div className="flex items-center gap-2">
                  <PlusCircle size={18} />
                  <span>Adicionar Livro</span>
                </div>
              </Link>
              <Link 
                to="/collection" 
                className={`px-3 py-2 rounded-md hover:bg-secondary transition-colors ${isActive('/collection')}`}
              >
                <div className="flex items-center gap-2">
                  <Book size={18} />
                  <span>Minha Coleção</span>
                </div>
              </Link>
            </nav>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="rounded-full p-0 h-10 w-10">
                  <Avatar>
                    <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || "Usuário"} />
                    <AvatarFallback>{(currentUser.displayName?.charAt(0) || "U").toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 mr-4" align="end">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium">{currentUser.displayName || "Usuário"}</p>
                    <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
                  </div>
                  <Link to="/profile">
                    <Button variant="outline" className="w-full justify-start">
                      <UserCircle className="mr-2 h-4 w-4" />
                      <span>Perfil</span>
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
                    <span>Sair</span>
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        ) : (
          <Button variant="default" asChild>
            <Link to="/login">Entrar</Link>
          </Button>
        )}
      </div>
    </header>
  );
};

export default Navbar;
