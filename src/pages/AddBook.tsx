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
import { Book as BookIcon, Eye, Trash2, Loader2, PlusCircle, Search, Heart, SortAsc } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const Collection = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [sortOption, setSortOption] = useState('status');
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [bookToEdit, setBookToEdit] = useState<Book | null>(null);
  const [updatedStatus, setUpdatedStatus] = useState<'Lido' | 'Não Lido' | 'Lendo'>('Não Lido');
  const [updatedRating, setUpdatedRating] = useState(0);
  const [updatedNotes, setUpdatedNotes] = useState('');
  const [updatedFavorite, setUpdatedFavorite] = useState(false);
  
  // New state for additional editable fields
  const [editableData, setEditableData] = useState({
    title: '',
    author: '',
    pageCount: '',
    synopsis: '',
    genres: [] as string[],
    newGenre: '',
    language: ''
  });

  useEffect(() => {
    if (currentUser) {
      loadBooks();
    }
  }, [currentUser]);

  useEffect(() => {
    if (books.length > 0) {
      filterAndSortBooks();
    }
  }, [books, searchTerm, statusFilter, sortOption]);

  useEffect(() => {
    if (bookToEdit) {
      setEditableData({
        title: bookToEdit.title || '',
        author: bookToEdit.author || '',
        pageCount: bookToEdit.pageCount ? String(bookToEdit.pageCount) : '',
        synopsis: bookToEdit.synopsis || '',
        genres: bookToEdit.genres || [],
        newGenre: '',
        language: bookToEdit.language || ''
      });
      setUpdatedFavorite(bookToEdit.favorite || false);
    }
  }, [bookToEdit]);

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

  const filterAndSortBooks = () => {
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
    
    // Sort books based on selected option
    filtered = sortBooks(filtered, sortOption);
    
    setFilteredBooks(filtered);
  };

  const sortBooks = (booksToSort: Book[], option: string): Book[] => {
    const sortedBooks = [...booksToSort];
    
    switch (option) {
      case 'status':
        // First sort by status: Lendo, Não Lido, Lido
        return sortedBooks.sort((a, b) => {
          const statusOrder = { 'Lendo': 1, 'Não Lido': 2, 'Lido': 3 };
          const statusA = statusOrder[a.status] || 999;
          const statusB = statusOrder[b.status] || 999;
          
          // If same status, sort by title
          if (statusA === statusB) {
            return a.title.localeCompare(b.title);
          }
          
          return statusA - statusB;
        });
      
      case 'rating':
        // Sort by rating (highest first), then by title
        return sortedBooks.sort((a, b) => {
          const ratingA = a.rating || 0;
          const ratingB = b.rating || 0;
          
          // If same rating, sort by title
          if (ratingA === ratingB) {
            return a.title.localeCompare(b.title);
          }
          
          return ratingB - ratingA; // Descending order for ratings
        });
        
      case 'title':
        // Sort alphabetically by title
        return sortedBooks.sort((a, b) => a.title.localeCompare(b.title));
        
      case 'favorite':
        // Sort by favorite status (favorites first), then by title
        return sortedBooks.sort((a, b) => {
          const favoriteA = a.favorite ? 1 : 0;
          const favoriteB = b.favorite ? 1 : 0;
          
          // If both are favorites or both are not, sort by title
          if (favoriteA === favoriteB) {
            return a.title.localeCompare(b.title);
          }
          
          return favoriteB - favoriteA; // Descending order for favorites
        });
        
      default:
        return sortedBooks;
    }
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
    setUpdatedFavorite(book.favorite || false);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      // Trigger search filter
      filterAndSortBooks();
    }
  };

  const handleToggleFavorite = async (book: Book) => {
    if (!book.id) return;
    
    try {
      const updatedFavoriteStatus = !book.favorite;
      await updateBook(book.id, { favorite: updatedFavoriteStatus });
      
      // Update local state
      setBooks(books.map(b => 
        b.id === book.id 
          ? { ...b, favorite: updatedFavoriteStatus } 
          : b
      ));
      
      toast({
        title: updatedFavoriteStatus ? "Adicionado aos favoritos" : "Removido dos favoritos",
        description: `${book.title} foi ${updatedFavoriteStatus ? 'adicionado aos' : 'removido dos'} favoritos.`,
      });
    } catch (error) {
      console.error("Error updating favorite status:", error);
      toast({
        title: "Erro ao atualizar status de favorito",
        description: "Não foi possível atualizar o status de favorito. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleSaveChanges = async () => {
    if (!bookToEdit || !bookToEdit.id) return;
    
    try {
      // Convert pageCount to number if provided
      const pageCountValue = editableData.pageCount ? parseInt(editableData.pageCount, 10) : undefined;
      
      // Prepare update data including all editable fields
      const updateData = {
        status: updatedStatus,
        rating: updatedRating,
        notes: updatedNotes,
        title: editableData.title || bookToEdit.title,
        author: editableData.author || bookToEdit.author,
        synopsis: editableData.synopsis,
        pageCount: pageCountValue,
        genres: editableData.genres,
        language: editableData.language,
        favorite: updatedFavorite
      };
      
      await updateBook(bookToEdit.id, updateData);
      
      // Update local state
      setBooks(books.map(book => 
        book.id === bookToEdit.id 
          ? { 
              ...book, 
              ...updateData
            } 
          : book
      ));
      
      toast({
        title: "Livro atualizado",
        description: `As informações de ${editableData.title || bookToEdit.title} foram atualizadas.`,
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

  const handleInputChange = (field: string, value: string | number | string[]) => {
    setEditableData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddGenre = () => {
    if (editableData.newGenre.trim() === '') return;
    
    // Only add if not already in the list
    if (!editableData.genres.includes(editableData.newGenre.trim())) {
      setEditableData(prev => ({
        ...prev,
        genres: [...prev.genres, prev.newGenre.trim()],
        newGenre: ''
      }));
    } else {
      toast({
        title: "Gênero já existe",
        description: "Este gênero já foi adicionado ao livro.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveGenre = (genreToRemove: string) => {
    setEditableData(prev => ({
      ...prev,
      genres: prev.genres.filter(genre => genre !== genreToRemove)
    }));
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
        
        <Button onClick={() => navigate("/add-book")}>
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
              onKeyPress={handleKeyPress}
              className="pl-8"
            />
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
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

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10">
                <SortAsc className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Ordenar por</h4>
                <div className="grid gap-1.5">
                  <Button 
                    variant={sortOption === 'status' ? "default" : "ghost"} 
                    className="justify-start" 
                    size="sm"
                    onClick={() => setSortOption('status')}
                  >
                    Status
                  </Button>
                  <Button 
                    variant={sortOption === 'rating' ? "default" : "ghost"} 
                    className="justify-start" 
                    size="sm"
                    onClick={() => setSortOption('rating')}
                  >
                    Nota
                  </Button>
                  <Button 
                    variant={sortOption === 'title' ? "default" : "ghost"} 
                    className="justify-start" 
                    size="sm"
                    onClick={() => setSortOption('title')}
                  >
                    Título
                  </Button>
                  <Button 
                    variant={sortOption === 'favorite' ? "default" : "ghost"} 
                    className="justify-start" 
                    size="sm"
                    onClick={() => setSortOption('favorite')}
                  >
                    Favoritos
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
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
            <Button onClick={() => navigate("/add-book")}>
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
                <TableRow key={book.id} className={book.favorite ? "bg-secondary/30" : ""}>
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
                    <div className="flex items-center gap-2">
                      {book.favorite && (
                        <Heart className="h-3.5 w-3.5 fill-current text-red-500" />
                      )}
                      <div>
                        <p className="line-clamp-1">{book.title}</p>
                        <p className="text-xs text-muted-foreground md:hidden">
                          {book.author}
                        </p>
                      </div>
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
                        onClick={() => handleToggleFavorite(book)}
                        className="h-8 w-8"
                        title={book.favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                      >
                        <Heart className={`h-4 w-4 ${book.favorite ? "fill-current text-red-500" : ""}`} />
                      </Button>

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
              <DialogTitle className="flex items-center gap-2">
                {updatedFavorite && <Heart className="h-4 w-4 fill-current text-red-500" />}
                {bookToEdit.title}
              </DialogTitle>
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
                  {bookToEdit.language && (
                    <p className="text-center text-sm text-muted-foreground mt-1">
                      Idioma: {bookToEdit.language}
                    </p>
                  )}
                  <Button
                    variant={updatedFavorite ? "default" : "outline"}
                    size="sm"
                    className="mt-3 gap-2"
                    onClick={() => setUpdatedFavorite(!updatedFavorite)}
                  >
                    <Heart className={`h-4 w-4 ${updatedFavorite ? "fill-current" : ""}`} />
                    {updatedFavorite ? "Favorito" : "Adicionar aos Favoritos"}
                  </Button>
                </div>
              </div>
              
              <div className="md:col-span-2">
                <Tabs defaultValue="info" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="info">Informações</TabsTrigger>
                    <TabsTrigger value="edit">Editar</TabsTrigger>
                    <TabsTrigger value="details">Informações Detalhadas</TabsTrigger>
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
                      <h3 className="text-sm font-medium">Idioma</h3>
                      <Input
                        value={editableData.language}
                        onChange={(e) => handleInputChange('language', e.target.value)}
                        placeholder="Português, Inglês, Espanhol, etc."
                      />
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
                  
                  <TabsContent value="details" className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <FormLabel>Título</FormLabel>
                        <Input 
                          value={editableData.title} 
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          placeholder="Título do livro"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <FormLabel>Autor</FormLabel>
                        <Input 
                          value={editableData.author} 
                          onChange={(e) => handleInputChange('author', e.target.value)}
                          placeholder="Autor do livro"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <FormLabel>Número de Páginas</FormLabel>
                        <Input 
                          type="number"
                          value={editableData.pageCount} 
                          onChange={(e) => handleInputChange('pageCount', e.target.value)}
                          placeholder="Exemplo: 320"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <FormLabel>Sinopse</FormLabel>
                        <Textarea 
                          value={editableData.synopsis} 
                          onChange={(e) => handleInputChange('synopsis', e.target.value)}
                          placeholder="Sinopse do livro"
                          className="min-h-[100px]"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <FormLabel>Gêneros</FormLabel>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {editableData.genres.map((genre, index) => (
                            <div key={index} className="flex items-center bg-secondary rounded-md px-2 py-1">
                              <span className="text-xs">{genre}</span>
                              <button 
                                type="button"
                                onClick={() => handleRemoveGenre(genre)}
                                className="ml-1 text-muted-foreground hover:text-destructive"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input 
                            value={editableData.newGenre} 
                            onChange={(e) => handleInputChange('newGenre', e.target.value)}
                            placeholder="Adicionar gênero"
                            className="flex-1"
                          />
                          <Button 
                            type="button" 
                            onClick={handleAddGenre}
                            size="sm"
                          >
                            Adicionar
                          </Button>
                        </div>
                      </div>
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