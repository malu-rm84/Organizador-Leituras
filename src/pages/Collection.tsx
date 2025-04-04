
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { fetchBooksByUserId, Book, deleteBook, updateBook } from '@/services/bookService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import StarRating from '@/components/StarRating';
import BookStatus from '@/components/BookStatus';
import { toast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';
import { Book as BookIcon, Eye, Trash2, Loader2, PlusCircle, Search } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Collection = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [bookToEdit, setBookToEdit] = useState<Book | null>(null);
  const [updatedStatus, setUpdatedStatus] = useState<'Lido' | 'Não Lido' | 'Lendo'>('Não Lido');
  const [updatedRating, setUpdatedRating] = useState(0);
  const [updatedNotes, setUpdatedNotes] = useState('');

  useEffect(() => {
    if (currentUser) {
      loadBooks();
    }
  }, [currentUser]);

  useEffect(() => {
    if (books.length > 0) {
      filterBooks();
    }
  }, [books, searchTerm, statusFilter]);

  const loadBooks = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const userBooks = await fetchBooksByUserId(currentUser.uid);
      setBooks(userBooks);
      setFilteredBooks(userBooks);
    } catch (error) {
      console.error("Error loading books:", error);
      toast({
        title: "Erro ao carregar livros",
        description: "Não foi possível carregar sua coleção de livros. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterBooks = () => {
    let filtered = [...books];
    
    // Filter by search term
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        book => 
          book.title.toLowerCase().includes(term) || 
          book.author.toLowerCase().includes(term)
      );
    }
    
    // Filter by status
    if (statusFilter !== 'Todos') {
      filtered = filtered.filter(book => book.status === statusFilter);
    }
    
    setFilteredBooks(filtered);
  };

  const handleDeleteClick = (book: Book) => {
    setBookToDelete(book);
  };

  const handleConfirmDelete = async () => {
    if (!bookToDelete || !bookToDelete.id) return;
    
    try {
      await deleteBook(bookToDelete.id);
      setBooks(books.filter(book => book.id !== bookToDelete.id));
      toast({
        title: "Livro removido",
        description: `${bookToDelete.title} foi removido da sua coleção.`,
      });
    } catch (error) {
      console.error("Error deleting book:", error);
      toast({
        title: "Erro ao remover livro",
        description: "Não foi possível remover o livro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setBookToDelete(null);
    }
  };

  const handleViewClick = (book: Book) => {
    setBookToEdit(book);
    setUpdatedStatus(book.status);
    setUpdatedRating(book.rating || 0);
    setUpdatedNotes(book.notes || '');
  };

  const handleSaveChanges = async () => {
    if (!bookToEdit || !bookToEdit.id) return;
    
    try {
      await updateBook(bookToEdit.id, {
        status: updatedStatus,
        rating: updatedRating,
        notes: updatedNotes
      });
      
      // Update local state
      setBooks(books.map(book => 
        book.id === bookToEdit.id 
          ? { 
              ...book, 
              status: updatedStatus, 
              rating: updatedRating, 
              notes: updatedNotes 
            } 
          : book
      ));
      
      toast({
        title: "Livro atualizado",
        description: `As informações de ${bookToEdit.title} foram atualizadas.`,
      });
      
      setBookToEdit(null);
    } catch (error) {
      console.error("Error updating book:", error);
      toast({
        title: "Erro ao atualizar livro",
        description: "Não foi possível atualizar as informações do livro. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse text-purple-500">Carregando...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Minha Coleção</h1>
          <p className="text-muted-foreground">
            Gerencie todos os seus livros em um só lugar
          </p>
        </div>
        
        <Button onClick={() => navigate("/addbook")}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Livro
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="w-full md:w-64">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar livros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos</SelectItem>
            <SelectItem value="Lido">Lido</SelectItem>
            <SelectItem value="Não Lido">Não Lido</SelectItem>
            <SelectItem value="Lendo">Lendo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="text-center py-20">
          <BookIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-medium mb-2">Nenhum livro encontrado</h2>
          <p className="text-muted-foreground mb-6">
            {books.length === 0 
              ? "Sua coleção está vazia. Adicione seu primeiro livro!" 
              : "Nenhum livro corresponde aos filtros selecionados."}
          </p>
          {books.length === 0 && (
            <Button onClick={() => navigate("/addbook")}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Livro
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Capa</TableHead>
                <TableHead>Título</TableHead>
                <TableHead className="hidden md:table-cell">Autor</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">Nota</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBooks.map((book) => (
                <TableRow key={book.id}>
                  <TableCell>
                    <div className="h-16 w-12 overflow-hidden rounded-sm">
                      <img
                        src={book.coverUrl || "/placeholder.svg"}
                        alt={book.title}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.svg";
                        }}
                      />
                    </div>
                  </TableCell>
                  
                  <TableCell className="font-medium">
                    <div>
                      <p className="line-clamp-1">{book.title}</p>
                      <p className="text-xs text-muted-foreground md:hidden">
                        {book.author}
                      </p>
                    </div>
                  </TableCell>
                  
                  <TableCell className="hidden md:table-cell">
                    {book.author}
                  </TableCell>
                  
                  <TableCell className="hidden md:table-cell">
                    <BookStatus status={book.status} />
                  </TableCell>
                  
                  <TableCell className="hidden md:table-cell">
                    {book.rating ? (
                      <StarRating rating={book.rating} size={16} />
                    ) : (
                      <span className="text-muted-foreground text-sm">Sem avaliação</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleViewClick(book)}
                        className="h-8 w-8"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteClick(book)}
                        className="h-8 w-8 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* View/Edit Book Dialog */}
      <Dialog open={!!bookToEdit} onOpenChange={(open) => !open && setBookToEdit(null)}>
        {bookToEdit && (
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{bookToEdit.title}</DialogTitle>
              <DialogDescription>Detalhes do livro</DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
              <div className="md:col-span-1">
                <div className="flex flex-col items-center">
                  <div className="h-60 w-40 overflow-hidden rounded-md border mb-4">
                    <img
                      src={bookToEdit.coverUrl || "/placeholder.svg"}
                      alt={bookToEdit.title}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                  </div>
                  <p className="text-center font-medium">{bookToEdit.author}</p>
                  {bookToEdit.pageCount && (
                    <p className="text-center text-sm text-muted-foreground">
                      {bookToEdit.pageCount} páginas
                    </p>
                  )}
                </div>
              </div>
              
              <div className="md:col-span-2">
                <Tabs defaultValue="info" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="info">Informações</TabsTrigger>
                    <TabsTrigger value="edit">Editar</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="info" className="space-y-4">
                    {bookToEdit.genres && bookToEdit.genres.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Gêneros</h3>
                        <div className="flex flex-wrap gap-2">
                          {bookToEdit.genres.map((genre, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-secondary rounded-md text-xs"
                            >
                              {genre}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {bookToEdit.synopsis && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Sinopse</h3>
                        <p className="text-sm leading-relaxed max-h-40 overflow-y-auto">
                          {bookToEdit.synopsis}
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                      <BookStatus status={bookToEdit.status} />
                    </div>
                    
                    {bookToEdit.rating !== undefined && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Avaliação</h3>
                        <div className="flex items-center">
                          <StarRating rating={bookToEdit.rating} size={20} />
                          <span className="ml-2">{bookToEdit.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    )}
                    
                    {bookToEdit.notes && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Anotações</h3>
                        <div className="bg-muted p-3 rounded-md text-sm">
                          <p className="whitespace-pre-wrap">{bookToEdit.notes}</p>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="edit" className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Status de Leitura</h3>
                      <Select 
                        value={updatedStatus} 
                        onValueChange={(val) => setUpdatedStatus(val as 'Lido' | 'Não Lido' | 'Lendo')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Lido">Lido</SelectItem>
                          <SelectItem value="Não Lido">Não Lido</SelectItem>
                          <SelectItem value="Lendo">Lendo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Avaliação</h3>
                      <div className="flex items-center">
                        <StarRating 
                          rating={updatedRating} 
                          editable={true}
                          onChange={setUpdatedRating}
                        />
                        <span className="ml-2">{updatedRating} / 5</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Notas e Anotações</h3>
                      <Textarea
                        value={updatedNotes}
                        onChange={(e) => setUpdatedNotes(e.target.value)}
                        placeholder="Adicione suas anotações sobre este livro..."
                        className="min-h-32"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setBookToEdit(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveChanges}>Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!bookToDelete} onOpenChange={(open) => !open && setBookToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O livro 
              <span className="font-medium mx-1">
                {bookToDelete?.title}
              </span>
              será removido permanentemente da sua coleção.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Collection;
